import type { Equipment } from '../hooks/useEquipment'

interface CategoryCardProps {
  categoryId: string
  label: string
  icon: string
  items: Equipment[]
  onClick: () => void
}

export function CategoryCard({ label, icon, items, onClick }: CategoryCardProps) {
  const available = items.filter(e => e.status === 'available').length

  return (
    <button
      onClick={onClick}
      className="card p-4 flex items-center gap-4 w-full text-left hover:border-brass/30 transition-colors"
    >
      <div className="w-12 h-12 rounded-xl bg-navy-light flex items-center justify-center text-2xl shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-cream font-semibold">{label}</p>
        <p className="text-text-dim text-sm">{available} of {items.length} available</p>
      </div>
      <svg className="w-5 h-5 text-text-dim shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
