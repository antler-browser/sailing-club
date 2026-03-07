import { sql } from 'drizzle-orm'
import { text, index, sqliteTable, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  did: text('did').notNull().primaryKey(),
  name: text('name'),
  avatar: text('avatar'),
  socials: text('socials'), // JSON array of strings: ["platform:handle", "platform:handle"]
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  createdAt : integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('idx_users_created_at').on(table.createdAt),
])

export const equipment = sqliteTable('equipment', {
  id: text('id').notNull().primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  category: text('category').notNull(), // "sail", "kayak", or "wind"
  status: text('status').notNull().default('available'), // "available" or "maintenance"
  sortOrder: integer('sort_order').default(0),
})

export const bookings = sqliteTable('bookings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  equipmentId: text('equipment_id').notNull(),
  userDid: text('user_did').notNull(),
  date: text('date').notNull(), // ISO date "YYYY-MM-DD"
  startSlot: integer('start_slot').notNull(), // 0-47
  endSlot: integer('end_slot').notNull(), // 0-47
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('idx_bookings_equipment_date').on(table.equipmentId, table.date),
  index('idx_bookings_user').on(table.userDid),
])

// Type inference for TypeScript
export type User = typeof users.$inferSelect
export type UserInsert = typeof users.$inferInsert
export type Equipment = typeof equipment.$inferSelect
export type EquipmentInsert = typeof equipment.$inferInsert
export type Booking = typeof bookings.$inferSelect
export type BookingInsert = typeof bookings.$inferInsert
