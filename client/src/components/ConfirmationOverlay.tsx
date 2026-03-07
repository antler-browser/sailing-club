import { slotToTime, formatDuration } from '../utils/slots'
import type { Equipment } from '../hooks/useEquipment'

interface ConfirmationOverlayProps {
  equipment: Equipment
  date: string
  startSlot: number
  endSlot: number
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}

export function ConfirmationOverlay({ equipment, date, startSlot, endSlot, onConfirm, onCancel, isLoading }: ConfirmationOverlayProps) {
  const slotCount = endSlot - startSlot + 1

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md mx-4 mb-4 sm:mb-0 card p-6 animate-fade-up">
        <h3 className="text-lg font-display text-cream mb-4">Confirm Booking</h3>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Equipment</span>
            <span className="text-cream font-medium">{equipment.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Type</span>
            <span className="text-cream">{equipment.type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Date</span>
            <span className="text-cream">{date}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Time</span>
            <span className="text-cream">{slotToTime(startSlot)} – {slotToTime(endSlot + 1)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Duration</span>
            <span className="text-cream">{formatDuration(slotCount)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-navy-light text-text-secondary font-medium hover:bg-navy-light/80 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-brass text-navy font-semibold hover:bg-brass-light transition disabled:opacity-50"
          >
            {isLoading ? 'Booking...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
