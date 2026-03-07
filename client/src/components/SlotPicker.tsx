import { BOOKING_START_SLOT, BOOKING_END_SLOT, slotToTime, isPastSlot } from '../utils/slots'
import type { BookingWithUser } from '../hooks/useBookings'

interface SlotPickerProps {
  equipmentId: string
  date: string
  bookings: BookingWithUser[]
  selectedStart: number | null
  selectedEnd: number | null
  onSelect: (start: number, end: number) => void
}

export function SlotPicker({ equipmentId, date, bookings, selectedStart, selectedEnd, onSelect }: SlotPickerProps) {
  const equipmentBookings = bookings.filter(
    b => b.equipmentId === equipmentId && b.date === date
  )

  function isBooked(slot: number): boolean {
    return equipmentBookings.some(b => slot >= b.startSlot && slot <= b.endSlot)
  }

  function isSelected(slot: number): boolean {
    if (selectedStart === null || selectedEnd === null) return false
    return slot >= selectedStart && slot <= selectedEnd
  }

  function isSlotPast(slot: number): boolean {
    return isPastSlot(date, slot)
  }

  function handleSlotClick(slot: number) {
    if (isBooked(slot) || isSlotPast(slot)) return

    if (selectedStart === null) {
      onSelect(slot, slot)
      return
    }

    // Tap same slot to deselect
    if (selectedStart === slot && selectedEnd === slot) {
      onSelect(-1, -1) // signal clear
      return
    }

    // Extend or shrink selection
    if (slot >= selectedStart && slot <= selectedEnd!) {
      // Tap inside selection - shrink from the end closest to the tap
      if (slot === selectedStart) {
        onSelect(selectedStart + 1, selectedEnd!)
      } else if (slot === selectedEnd) {
        onSelect(selectedStart, selectedEnd! - 1)
      }
      return
    }

    // Check adjacency and no overlap with bookings
    const newStart = Math.min(selectedStart, slot)
    const newEnd = Math.max(selectedEnd!, slot)

    // Ensure no booked slots in range
    for (let s = newStart; s <= newEnd; s++) {
      if (isBooked(s)) {
        // Restart selection at clicked slot
        onSelect(slot, slot)
        return
      }
    }

    onSelect(newStart, newEnd)
  }

  const slots = []
  for (let s = BOOKING_START_SLOT; s <= BOOKING_END_SLOT; s++) {
    const booked = isBooked(s)
    const past = isSlotPast(s)
    const disabled = booked || past
    const selected = isSelected(s)

    slots.push(
      <button
        key={s}
        onClick={() => handleSlotClick(s)}
        disabled={disabled}
        className={`
          py-2.5 px-1 text-xs font-medium rounded-lg transition-all
          ${disabled
            ? 'bg-navy-light/50 text-text-dim cursor-not-allowed' + (booked ? ' line-through' : '')
            : selected
              ? 'bg-brass text-navy'
              : 'bg-navy-light text-text-secondary hover:bg-navy-light/80 hover:text-cream'
          }
        `}
      >
        {slotToTime(s)}
      </button>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {slots}
    </div>
  )
}
