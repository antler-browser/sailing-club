import { asc } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import type { Database } from '../client.js'
import { equipment, type Equipment } from '../schema.js'

export type { Equipment }

export async function getAllEquipment(db: Database): Promise<Equipment[]> {
  return await db
    .select()
    .from(equipment)
    .orderBy(asc(equipment.sortOrder))
}

export async function getEquipmentById(db: Database, id: string): Promise<Equipment | undefined> {
  const [item] = await db
    .select()
    .from(equipment)
    .where(eq(equipment.id, id))
    .limit(1)
  return item
}
