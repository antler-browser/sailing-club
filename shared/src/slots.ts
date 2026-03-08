export const TOTAL_SLOTS = 48           // 00:00–23:30
export const BOOKING_START_SLOT = 18    // 09:00
export const BOOKING_END_SLOT = 34      // 17:00 (last bookable slot is 16:30 = slot 33)

/** Returns true if the given date+slot is in the past */
export function isPastSlot(date: string, slot: number, timezoneOffsetMinutes?: number): boolean {
  const now = new Date()
  if (timezoneOffsetMinutes !== undefined) {
    now.setMinutes(now.getMinutes() - timezoneOffsetMinutes)
  }
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (date < todayIso) return true
  if (date > todayIso) return false
  // Today: check if the slot's time has already passed
  const slotHour = Math.floor(slot / 2)
  const slotMin = slot % 2 === 0 ? 0 : 30
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  return slotHour * 60 + slotMin <= currentMinutes
}
