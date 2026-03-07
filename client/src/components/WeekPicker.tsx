import { getCurrentWeekDays, getWeekReferenceDate, toLocalDateString } from '../utils/slots'

interface WeekPickerProps {
  selectedDay: string
  onSelectDay: (date: string) => void
  weekOffset: number
  onWeekChange: (offset: number) => void
}

export function WeekPicker({ selectedDay, onSelectDay, weekOffset, onWeekChange }: WeekPickerProps) {
  const ref = getWeekReferenceDate(weekOffset)
  const weekDays = getCurrentWeekDays(ref)
  const todayIso = toLocalDateString(new Date())

  return (
    <div>
      {/* Arrows + Day buttons on same row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onWeekChange(weekOffset - 1)}
          className="w-8 h-8 rounded-lg bg-navy-mid border border-navy-light/50 flex items-center justify-center text-text-secondary hover:text-cream transition shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex gap-1 overflow-x-auto flex-1">
          {weekDays.map(d => {
            const isPast = d.date < todayIso
            return (
              <button
                key={d.date}
                onClick={() => onSelectDay(d.date)}
                className={`flex flex-col items-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 flex-1
                  ${d.date === selectedDay
                    ? 'bg-brass text-navy'
                    : isPast
                      ? 'bg-navy-mid/50 text-text-dim'
                      : 'bg-navy-mid text-text-secondary hover:bg-navy-light'
                  }
                `}
              >
                <span className="text-[10px]">{d.dayName}</span>
                <span className="text-sm">{d.label}</span>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => onWeekChange(weekOffset + 1)}
          className="w-8 h-8 rounded-lg bg-navy-mid border border-navy-light/50 flex items-center justify-center text-text-secondary hover:text-cream transition shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
