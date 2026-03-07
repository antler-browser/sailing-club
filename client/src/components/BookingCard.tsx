import { slotToTime, formatDuration } from '../utils/slots'
import type { Equipment } from '../hooks/useEquipment'
import type { BookingWithUser } from '../hooks/useBookings'

interface BookingCardProps {
  booking: BookingWithUser
  equipment: Equipment | undefined
  onClick: () => void
}

export function BookingCard({ booking, equipment, onClick }: BookingCardProps) {
  const slotCount = booking.endSlot - booking.startSlot + 1

  return (
    <button onClick={onClick} className="card p-4 py-5 flex items-center gap-4 w-full text-left hover:bg-navy-light/30 transition cursor-pointer">
      <div className="w-12 h-12 rounded-lg bg-navy-light flex items-center justify-center text-2xl shrink-0">
        {equipment?.category === 'sail' ? '\u26F5' : equipment?.category === 'wind' ? '\uD83C\uDFC4' : '\uD83D\uDEF6'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-cream font-medium text-base truncate">{equipment?.name || booking.equipmentId}</p>
        <p className="text-text-secondary text-sm">
          {slotToTime(booking.startSlot)}–{slotToTime(booking.endSlot + 1)} · {formatDuration(slotCount)}
        </p>
        <p className="text-text-dim text-xs">
          {booking.date}{booking.date === new Date().toISOString().split('T')[0] ? ' (Today)' : booking.date === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? ' (Tomorrow)' : ''}
        </p>
      </div>
      <svg className="w-4 h-4 text-text-dim shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
