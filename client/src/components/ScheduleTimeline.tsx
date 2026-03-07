import { Link } from 'react-router-dom'
import { BOOKING_START_SLOT, BOOKING_END_SLOT, slotToTime24 } from '../utils/slots'
import { getMemberColor } from '../utils/memberColors'
import type { BookingWithUser } from '../hooks/useBookings'
import type { Equipment } from '../hooks/useEquipment'

interface ScheduleTimelineProps {
  equipment: Equipment[]
  bookings: BookingWithUser[]
  currentUserDid: string | undefined
  date: string
}

export function ScheduleTimeline({ equipment, bookings, currentUserDid, date }: ScheduleTimelineProps) {
  const dayBookings = bookings.filter(b => b.date === date)
  const totalSlots = BOOKING_END_SLOT - BOOKING_START_SLOT + 1

  // Time labels (every 2 hours)
  const timeLabels: { slot: number; label: string }[] = []
  for (let s = BOOKING_START_SLOT; s <= BOOKING_END_SLOT; s += 4) {
    timeLabels.push({ slot: s, label: slotToTime24(s) })
  }

  // Unique members in today's bookings for legend
  const members = new Map<string, { did: string; name: string | null }>()
  dayBookings.forEach(b => {
    if (!members.has(b.userDid)) {
      members.set(b.userDid, { did: b.userDid, name: b.userName })
    }
  })

  if (equipment.length === 0) return null

  return (
    <div className="card p-4 overflow-x-auto">
      {/* Time header */}
      <div className="flex mb-1" style={{ paddingLeft: '80px' }}>
        {timeLabels.map(t => (
          <div
            key={t.slot}
            className="text-text-dim text-[10px]"
            style={{
              position: 'relative',
              left: `${((t.slot - BOOKING_START_SLOT) / totalSlots) * 100}%`,
              width: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* Equipment rows */}
      <div className="space-y-1">
        {equipment.map(eq => {
          const eqBookings = dayBookings.filter(b => b.equipmentId === eq.id)

          return (
            <div key={eq.id} className="flex items-center gap-2">
              <Link to={`/equipment/${eq.id}?date=${date}`} className="w-[72px] shrink-0 text-text-secondary text-sm truncate hover:text-cream" title={eq.name}>
                {eq.name}
              </Link>
              <div className="flex-1 h-6 bg-navy-light/50 rounded relative overflow-hidden">
                {eqBookings.map(b => {
                  const left = ((b.startSlot - BOOKING_START_SLOT) / totalSlots) * 100
                  const width = ((b.endSlot - b.startSlot + 1) / totalSlots) * 100
                  const color = getMemberColor(b.userDid, b.userDid === currentUserDid)

                  return (
                    <div
                      key={b.id}
                      className="absolute top-0.5 bottom-0.5 rounded-sm"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: color,
                        minWidth: '4px',
                      }}
                      title={`${b.userName || 'Unknown'}`}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      {members.size > 0 && (
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-navy-light/50">
          {Array.from(members.values()).map(m => (
            <div key={m.did} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getMemberColor(m.did, m.did === currentUserDid) }}
              />
              <span className="text-text-dim text-xs">{m.did === currentUserDid ? 'You' : m.name || 'Unknown'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
