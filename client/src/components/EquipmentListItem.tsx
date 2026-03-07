import type { Equipment } from '../hooks/useEquipment'
import type { BookingWithUser } from '../hooks/useBookings'
import { StatusBadge } from './StatusBadge'

interface EquipmentListItemProps {
  equipment: Equipment
  bookings: BookingWithUser[]
  onClick: () => void
}

function deriveStatus(equipment: Equipment, bookings: BookingWithUser[]): 'available' | 'in_use' | 'reserved' | 'maintenance' {
  if (equipment.status === 'maintenance') return 'maintenance'

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const currentSlot = now.getHours() * 2 + (now.getMinutes() >= 30 ? 1 : 0)

  const todayBookings = bookings.filter(b => b.date === todayStr && b.equipmentId === equipment.id)

  for (const b of todayBookings) {
    if (currentSlot >= b.startSlot && currentSlot <= b.endSlot) return 'in_use'
  }

  if (todayBookings.some(b => b.startSlot > currentSlot)) return 'reserved'

  return 'available'
}

export function EquipmentListItem({ equipment, bookings, onClick }: EquipmentListItemProps) {
  const status = deriveStatus(equipment, bookings)

  return (
    <button
      onClick={onClick}
      disabled={equipment.status === 'maintenance'}
      className="card p-4 flex items-center gap-4 w-full text-left hover:border-brass/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex-1 min-w-0">
        <p className="text-cream font-medium">{equipment.name}</p>
        <p className="text-text-dim text-sm">{equipment.type}</p>
      </div>
      <StatusBadge status={status} />
    </button>
  )
}
