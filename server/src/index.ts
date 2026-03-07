/**
 * Cloudflare Worker with WebSocket for real-time user updates
 *
 * This is the main API entry point for the Local First Auth starter.
 * Endpoints handle user profile management via JWT-verified requests.
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Context } from 'hono'
import type { Env } from './types'
import { Broadcaster } from './durable-object'
import { createDb } from './db/client'
import * as UserModel from './db/models/users'
import * as EquipmentModel from './db/models/equipment'
import * as BookingModel from './db/models/bookings'
import { decodeAndVerifyJWT, BOOKING_START_SLOT, BOOKING_END_SLOT, isPastSlot } from '@starter/shared'

const app = new Hono<{ Bindings: Env }>()

// Enable CORS for all requests
app.use('/*', cors({
  origin: '*',
  credentials: true,
}))

/**
 * POST /api/add-user - Add or update user profile (without avatar)
 * Preserves existing avatar if user already exists
 */
app.post('/api/add-user', async (c) => {
  try {
    const body = await c.req.json()
    const { profileJwt } = body

    if (!profileJwt) {
      return c.json({ error: 'Missing profileJwt' }, 400)
    }

    // Verify and decode the profile JWT
    const profilePayload = await decodeAndVerifyJWT(profileJwt)

    // Extract profile data
    const { did, name, socials } = profilePayload.data as {
      did: string
      name: string
      socials?: Array<{ platform: string; handle: string }>
    }

    // Create database instance and upsert user
    const db = createDb(c.env.DB)
    const user = await UserModel.addOrUpdateUser(
      db,
      did,
      name,
      socials ?? []
    )

    // Broadcast to all WebSocket clients via Durable Object
    await notifyDO(c, 'user-joined', user)

    return c.json(user)
  } catch (error) {
    console.error('Add user error:', error)
    return c.json(
      { error: 'Failed to add user', message: (error as Error).message },
      500
    )
  }
})

/**
 * POST /api/add-avatar - Add or update user avatar
 * Creates user with avatar only if doesn't exist yet
 */
app.post('/api/add-avatar', async (c) => {
  try {
    const body = await c.req.json()
    const { avatarJwt } = body

    if (!avatarJwt) {
      return c.json({ error: 'Missing avatarJwt' }, 400)
    }

    // Verify and decode the avatar JWT
    const avatarPayload = await decodeAndVerifyJWT(avatarJwt)

    // Extract DID from issuer and avatar from data
    const did = avatarPayload.iss
    const { avatar } = avatarPayload.data as { avatar: string }

    if (!avatar) {
      return c.json({ error: 'No avatar data in JWT' }, 400)
    }

    // Create database instance and upsert avatar
    const db = createDb(c.env.DB)
    const user = await UserModel.addOrUpdateUserAvatar(db, did, avatar)

    // Broadcast to all WebSocket clients via Durable Object
    await notifyDO(c, 'user-joined', user)

    return c.json(user)
  } catch (error) {
    console.error('Add avatar error:', error)
    return c.json(
      { error: 'Failed to add avatar', message: (error as Error).message },
      500
    )
  }
})

/**
 * DELETE /api/remove-user - Remove user
 * Requires JWT verification to ensure user is removing themselves
 */
app.delete('/api/remove-user', async (c) => {
  try {
    const body = await c.req.json()
    const { profileJwt } = body

    if (!profileJwt) {
      return c.json({ error: 'Missing profileJwt' }, 400)
    }

    // Verify and decode the JWT to get the user's DID
    const payload = await decodeAndVerifyJWT(profileJwt)
    const did = payload.iss

    // Create database instance and delete user
    const db = createDb(c.env.DB)
    await UserModel.deleteUserByDID(db, did)

    // Broadcast to all WebSocket clients via Durable Object
    await notifyDO(c, 'user-left', { did })

    return c.json({ success: true, did })
  } catch (error) {
    console.error('Remove user error:', error)
    return c.json(
      { error: 'Failed to remove user', message: (error as Error).message },
      500
    )
  }
})

/**
 * GET /api/users - Get all users
 */
app.get('/api/users', async (c) => {
  try {
    const db = createDb(c.env.DB)
    const users = await UserModel.getAllUsers(db)
    return c.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return c.json(
      { error: 'Failed to fetch users', message: (error as Error).message },
      500
    )
  }
})

/**
 * POST /api/reset - Reset event (admin only)
 * Broadcasts reset message and clears all non-admin users
 */
app.post('/api/reset', async (c) => {
  try {
    const body = await c.req.json()
    const { profileJwt, message } = body

    if (!profileJwt) {
      return c.json({ error: 'Missing profileJwt' }, 400)
    }

    if (!message || typeof message !== 'string') {
      return c.json({ error: 'Missing or invalid message' }, 400)
    }

    // Verify and decode the JWT to get the user's DID
    const payload = await decodeAndVerifyJWT(profileJwt)
    const did = payload.iss

    // Check if user is admin
    const db = createDb(c.env.DB)
    const isAdmin = await UserModel.isUserAdmin(db, did)

    if (!isAdmin) {
      return c.json({ error: 'Unauthorized: Admin access required' }, 403)
    }

    // Broadcast reset message to all connected clients
    await notifyDO(c, 'reset', { message })

    // Clear all non-admin users from database
    await UserModel.deleteNonAdminUsers(db)

    return c.json({ success: true })
  } catch (error) {
    console.error('Reset error:', error)
    return c.json(
      { error: 'Failed to reset', message: (error as Error).message },
      500
    )
  }
})

/**
 * Helper function to notify Durable Object about user changes
 */
async function notifyDO(c: Context<{ Bindings: Env }>, event: string, data: any): Promise<void> {
  try {
    const id = c.env.DURABLE_OBJECT.idFromName('default')
    const stub = c.env.DURABLE_OBJECT.get(id)
    await stub.fetch(new Request('http://do/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data }),
    }))
  } catch (err) {
    console.error('Error notifying Durable Object:', err)
  }
}

/**
 * GET /api/ws - WebSocket endpoint for real-time updates
 * Forwards to Durable Object for connection management
 */
app.get('/api/ws', async (c) => {
  const upgradeHeader = c.req.header('Upgrade')

  if (upgradeHeader !== 'websocket') {
    return c.text('Expected WebSocket upgrade', 426)
  }

  // Forward WebSocket upgrade to Durable Object
  const id = c.env.DURABLE_OBJECT.idFromName('default')
  const stub = c.env.DURABLE_OBJECT.get(id)

  return stub.fetch(new Request('http://do/ws', {
    headers: c.req.raw.headers,
  }))
})
// ============================================================================
// Equipment & Booking Endpoints
// ============================================================================

/**
 * GET /api/equipment - Get all equipment
 */
app.get('/api/equipment', async (c) => {
  try {
    const db = createDb(c.env.DB)
    const items = await EquipmentModel.getAllEquipment(db)
    return c.json({ equipment: items })
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return c.json({ error: 'Failed to fetch equipment' }, 500)
  }
})

/**
 * GET /api/bookings - Get bookings for a date
 */
app.get('/api/bookings', async (c) => {
  try {
    const date = c.req.query('date')
    if (!date) {
      return c.json({ error: 'Missing date parameter' }, 400)
    }
    const db = createDb(c.env.DB)
    const items = await BookingModel.getBookingsByDate(db, date)
    return c.json({ bookings: items })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return c.json({ error: 'Failed to fetch bookings' }, 500)
  }
})

/**
 * GET /api/bookings/week - Get bookings for a 7-day range
 */
app.get('/api/bookings/week', async (c) => {
  try {
    const start = c.req.query('start')
    if (!start) {
      return c.json({ error: 'Missing start parameter' }, 400)
    }
    // Calculate end date (6 days after start)
    const startDate = new Date(start)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
    const endStr = endDate.toISOString().split('T')[0]

    const db = createDb(c.env.DB)
    const items = await BookingModel.getBookingsByWeek(db, start, endStr)
    return c.json({ bookings: items })
  } catch (error) {
    console.error('Error fetching week bookings:', error)
    return c.json({ error: 'Failed to fetch bookings' }, 500)
  }
})

/**
 * GET /api/bookings/mine - Get current user's bookings
 */
app.get('/api/bookings/mine', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing authorization' }, 401)
    }
    const jwt = authHeader.slice(7)
    const payload = await decodeAndVerifyJWT(jwt)
    const did = payload.iss

    const db = createDb(c.env.DB)
    const items = await BookingModel.getBookingsByUser(db, did)
    return c.json({ bookings: items })
  } catch (error) {
    console.error('Error fetching user bookings:', error)
    return c.json({ error: 'Failed to fetch bookings' }, 500)
  }
})

/**
 * POST /api/bookings - Create a booking
 */
app.post('/api/bookings', async (c) => {
  try {
    const body = await c.req.json()
    const { profileJwt, equipmentId, date, startSlot, endSlot } = body

    if (!profileJwt) {
      return c.json({ error: 'Missing profileJwt' }, 400)
    }

    const payload = await decodeAndVerifyJWT(profileJwt)
    const did = payload.iss

    // Validate slots
    if (
      typeof startSlot !== 'number' || typeof endSlot !== 'number' ||
      startSlot < BOOKING_START_SLOT || endSlot > BOOKING_END_SLOT ||
      startSlot > endSlot
    ) {
      return c.json({ error: 'Invalid slot range' }, 400)
    }

    if (!equipmentId || !date) {
      return c.json({ error: 'Missing equipmentId or date' }, 400)
    }

    if (isPastSlot(date, startSlot)) {
      return c.json({ error: 'Cannot book a time in the past' }, 400)
    }

    const db = createDb(c.env.DB)

    // Check equipment exists and is available
    const equipment = await EquipmentModel.getEquipmentById(db, equipmentId)
    if (!equipment) {
      return c.json({ error: 'Equipment not found' }, 404)
    }
    if (equipment.status === 'maintenance') {
      return c.json({ error: 'Equipment is under maintenance' }, 400)
    }

    // Check overlap
    const hasOverlap = await BookingModel.checkOverlap(db, equipmentId, date, startSlot, endSlot)
    if (hasOverlap) {
      return c.json({ error: 'Time slot already booked' }, 409)
    }

    const booking = await BookingModel.createBooking(db, equipmentId, did, date, startSlot, endSlot)

    // Get user info for broadcast
    const user = await UserModel.getUserByDID(db, did)

    const bookingWithUser = {
      ...booking,
      userName: user?.name ?? null,
      userAvatar: user?.avatar ?? null,
    }

    await notifyDO(c, 'booking-created', bookingWithUser)

    return c.json(bookingWithUser)
  } catch (error) {
    console.error('Create booking error:', error)
    return c.json({ error: 'Failed to create booking', message: (error as Error).message }, 500)
  }
})

/**
 * DELETE /api/bookings/:id - Cancel a booking
 */
app.delete('/api/bookings/:id', async (c) => {
  try {
    const body = await c.req.json()
    const { profileJwt } = body

    if (!profileJwt) {
      return c.json({ error: 'Missing profileJwt' }, 400)
    }

    const payload = await decodeAndVerifyJWT(profileJwt)
    const did = payload.iss

    const bookingId = parseInt(c.req.param('id'))
    if (isNaN(bookingId)) {
      return c.json({ error: 'Invalid booking ID' }, 400)
    }

    const db = createDb(c.env.DB)
    const booking = await BookingModel.getBookingById(db, bookingId)

    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404)
    }

    // Only the owner or admin can cancel
    if (booking.userDid !== did) {
      const isAdmin = await UserModel.isUserAdmin(db, did)
      if (!isAdmin) {
        return c.json({ error: 'Unauthorized' }, 403)
      }
    }

    await BookingModel.deleteBooking(db, bookingId)

    await notifyDO(c, 'booking-deleted', {
      bookingId,
      equipmentId: booking.equipmentId,
      date: booking.date,
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Delete booking error:', error)
    return c.json({ error: 'Failed to delete booking', message: (error as Error).message }, 500)
  }
})

/**
 * GET /api - Root api endpoint - Used for health check
 */
app.get('/api', (c) => {
  return c.text('😁')
})

// Export Durable Object
export { Broadcaster }

// Export Worker fetch handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx)
  },
}
