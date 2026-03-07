import { useParams, useNavigate } from 'react-router-dom'
import { useEquipment } from '../hooks/useEquipment'
import { useBookings } from '../hooks/useBookings'
import { EquipmentListItem } from '../components/EquipmentListItem'

const categoryLabels: Record<string, string> = {
  sail: 'Sailboats',
  kayak: 'Kayaks & SUPs',
  wind: 'Windsurf',
}

const categoryIcons: Record<string, string> = {
  sail: '\u26F5',
  kayak: '\uD83D\uDEF6',
  wind: '\uD83C\uDFC4',
}

export function Category() {
  const { categoryId = '' } = useParams()
  const navigate = useNavigate()
  const { byCategory } = useEquipment()
  const todayStr = new Date().toISOString().split('T')[0]
  const { bookings } = useBookings(todayStr)

  const items = byCategory[categoryId as keyof typeof byCategory] || []

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-lg bg-navy-mid border border-navy-light/50 flex items-center justify-center text-text-secondary hover:text-cream transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryIcons[categoryId]}</span>
          <h1 className="text-xl font-display text-cream">{categoryLabels[categoryId]}</h1>
        </div>
      </div>

      <div className="rope-divider" />

      {/* Equipment list */}
      <div className="space-y-2">
        {items.map(eq => (
          <EquipmentListItem
            key={eq.id}
            equipment={eq}
            bookings={bookings}
            onClick={() => navigate(`/equipment/${eq.id}`)}
          />
        ))}
      </div>
    </div>
  )
}
