export { TOTAL_SLOTS, BOOKING_START_SLOT, BOOKING_END_SLOT, isPastSlot } from '@starter/shared'

export function toLocalDateString(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function slotToTime(slot: number): string {
  const hours = Math.floor(slot / 2)
  const minutes = slot % 2 === 0 ? '00' : '30'
  const h = hours % 12 || 12
  const ampm = hours < 12 ? 'AM' : 'PM'
  return `${h}:${minutes} ${ampm}`
}

export function slotToTime24(slot: number): string {
  const hours = Math.floor(slot / 2)
  const minutes = slot % 2 === 0 ? '00' : '30'
  return `${String(hours).padStart(2, '0')}:${minutes}`
}

export function getCurrentWeekDays(referenceDate?: Date): { date: string; label: string; dayName: string; isToday: boolean }[] {
  const today = new Date()
  const ref = referenceDate || today
  const day = ref.getDay()
  // Monday = start of week
  const monday = new Date(ref)
  monday.setDate(ref.getDate() - ((day + 6) % 7))

  const days: { date: string; label: string; dayName: string; isToday: boolean }[] = []
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = toLocalDateString(d)
    const todayIso = toLocalDateString(today)
    days.push({
      date: iso,
      label: `${d.getDate()}`,
      dayName: dayNames[i],
      isToday: iso === todayIso,
    })
  }

  return days
}

export function getWeekReferenceDate(offset: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + offset * 7)
  return d
}

export function formatDuration(slotCount: number): string {
  const totalMinutes = slotCount * 30
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}min`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}min`
}
