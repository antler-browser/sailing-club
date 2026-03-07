interface StatusBadgeProps {
  status: 'available' | 'in_use' | 'reserved' | 'maintenance'
}

const config = {
  available: { label: 'Available', bg: 'bg-green/20', text: 'text-green', dot: 'bg-green' },
  in_use: { label: 'In Use', bg: 'bg-brass/20', text: 'text-brass', dot: 'bg-brass' },
  reserved: { label: 'Reserved', bg: 'bg-blue-400/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  maintenance: { label: 'Maintenance', bg: 'bg-red/20', text: 'text-red', dot: 'bg-red' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}
