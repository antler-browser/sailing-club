import { eq, and, lte, gte, sql } from 'drizzle-orm'
import type { Database } from '../client.js'
import { bookings, users, type Booking } from '../schema.js'

export type { Booking }

export interface BookingWithUser extends Booking {
  userName: string | null
  userAvatar: string | null
}

export async function getBookingsByDate(db: Database, date: string): Promise<BookingWithUser[]> {
  const rows = await db
    .select({
      id: bookings.id,
      equipmentId: bookings.equipmentId,
      userDid: bookings.userDid,
      date: bookings.date,
      startSlot: bookings.startSlot,
      endSlot: bookings.endSlot,
      createdAt: bookings.createdAt,
      userName: users.name,
      userAvatar: users.avatar,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userDid, users.did))
    .where(eq(bookings.date, date))
  return rows
}

export async function getBookingsByWeek(db: Database, startDate: string, endDate: string): Promise<BookingWithUser[]> {
  const rows = await db
    .select({
      id: bookings.id,
      equipmentId: bookings.equipmentId,
      userDid: bookings.userDid,
      date: bookings.date,
      startSlot: bookings.startSlot,
      endSlot: bookings.endSlot,
      createdAt: bookings.createdAt,
      userName: users.name,
      userAvatar: users.avatar,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userDid, users.did))
    .where(and(gte(bookings.date, startDate), lte(bookings.date, endDate)))
  return rows
}

export async function getBookingsByUser(db: Database, userDid: string): Promise<BookingWithUser[]> {
  const rows = await db
    .select({
      id: bookings.id,
      equipmentId: bookings.equipmentId,
      userDid: bookings.userDid,
      date: bookings.date,
      startSlot: bookings.startSlot,
      endSlot: bookings.endSlot,
      createdAt: bookings.createdAt,
      userName: users.name,
      userAvatar: users.avatar,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userDid, users.did))
    .where(eq(bookings.userDid, userDid))
    .orderBy(bookings.date, bookings.startSlot)
  return rows
}

export async function checkOverlap(
  db: Database,
  equipmentId: string,
  date: string,
  startSlot: number,
  endSlot: number
): Promise<boolean> {
  const overlapping = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.equipmentId, equipmentId),
        eq(bookings.date, date),
        lte(bookings.startSlot, endSlot),
        gte(bookings.endSlot, startSlot)
      )
    )
    .limit(1)
  return overlapping.length > 0
}

export async function createBooking(
  db: Database,
  equipmentId: string,
  userDid: string,
  date: string,
  startSlot: number,
  endSlot: number
): Promise<Booking> {
  const [booking] = await db
    .insert(bookings)
    .values({ equipmentId, userDid, date, startSlot, endSlot })
    .returning()
  return booking
}

export async function getBookingById(db: Database, id: number): Promise<Booking | undefined> {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1)
  return booking
}

export async function deleteBooking(db: Database, id: number): Promise<void> {
  await db.delete(bookings).where(eq(bookings.id, id))
}
