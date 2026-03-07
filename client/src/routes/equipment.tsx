import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useLocalFirstAuth } from '../hooks/useLocalFirstAuth'
import { useEquipment } from '../hooks/useEquipment'
import { useBookings } from '../hooks/useBookings'
import { getCurrentWeekDays, getWeekReferenceDate, slotToTime, formatDuration } from '../utils/slots'
import { WeekPicker } from '../components/WeekPicker'
import { SlotPicker } from '../components/SlotPicker'
import { ConfirmationOverlay } from '../components/ConfirmationOverlay'
import { StatusBadge } from '../components/StatusBadge'

export function EquipmentDetail() {
  const { equipmentId = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { equipmentById, loading: eqLoading } = useEquipment()
  const equipment = equipmentById.get(equipmentId)
  const { user, getProfileJwt, setIsOnboardingModalOpen, setBookingCallbacks } = useLocalFirstAuth()

  const [weekOffset, setWeekOffset] = useState(() => {
    const dateParam = searchParams.get('date')
    if (dateParam) {
      const paramDate = new Date(dateParam + 'T12:00:00')
      const today = new Date()
      const diffDays = Math.floor((paramDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return Math.round(diffDays / 7)
    }
    return 0
  })
  const weekDays = getCurrentWeekDays(getWeekReferenceDate(weekOffset))
  const [selectedDay, setSelectedDay] = useState(() => {
    const dateParam = searchParams.get('date')
    if (dateParam && weekDays.some(d => d.date === dateParam)) return dateParam
    const today = weekDays.find(d => d.isToday)
    return today?.date || weekDays[0].date
  })

  const { bookings, handleBookingCreated, handleBookingDeleted } = useBookings(selectedDay)

  const [selectedStart, setSelectedStart] = useState<number | null>(null)
  const [selectedEnd, setSelectedEnd] = useState<number | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [isCancelling, setIsCancelling] = useState<number | null>(null)

  // Register WS callbacks
  useEffect(() => {
    setBookingCallbacks({
      onCreated: handleBookingCreated,
      onDeleted: handleBookingDeleted,
    })
  }, [setBookingCallbacks, handleBookingCreated, handleBookingDeleted])

  // Reset selection on day change
  useEffect(() => {
    setSelectedStart(null)
    setSelectedEnd(null)
  }, [selectedDay])

  const handleSelect = (start: number, end: number) => {
    if (start === -1) {
      setSelectedStart(null)
      setSelectedEnd(null)
    } else {
      setSelectedStart(start)
      setSelectedEnd(end)
    }
  }

  const handleBook = async () => {
    const jwt = await getProfileJwt()
    if (!jwt) {
      setIsOnboardingModalOpen(true)
      return
    }
    if (selectedStart === null || selectedEnd === null || !equipment) return

    setIsBooking(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileJwt: jwt,
          equipmentId: equipment.id,
          date: selectedDay,
          startSlot: selectedStart,
          endSlot: selectedEnd,
        }),
      })

      if (res.ok) {
        await res.json()
        setSelectedStart(null)
        setSelectedEnd(null)
        setShowConfirm(false)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to book')
      }
    } catch (err) {
      console.error('Booking failed:', err)
    } finally {
      setIsBooking(false)
    }
  }

  const handleCancel = async (bookingId: number) => {
    const jwt = await getProfileJwt()
    if (!jwt) {
      setIsOnboardingModalOpen(true)
      return
    }
    setIsCancelling(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileJwt: jwt }),
      })
      if (res.ok) {
        handleBookingDeleted({ bookingId })
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err)
    } finally {
      setIsCancelling(null)
    }
  }

  const myBookingForDay = user
    ? bookings.find(b => b.equipmentId === equipment?.id && b.userDid === user.did)
    : null

  if (eqLoading) {
    return <div className="text-center text-text-secondary py-12">Loading...</div>
  }

  if (!equipment) {
    return <div className="text-center text-text-secondary py-12">Equipment not found</div>
  }

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
        <div className="flex-1">
          <h1 className="text-xl font-display text-cream">{equipment.name}</h1>
          <p className="text-text-dim text-sm">{equipment.type}</p>
        </div>
        <StatusBadge status={equipment.status === 'maintenance' ? 'maintenance' : 'available'} />
      </div>

      <div className="rope-divider" />

      {/* Day picker */}
      <WeekPicker
        selectedDay={selectedDay}
        onSelectDay={(date) => {
          setSelectedDay(date)
          setSearchParams({ date })
        }}
        weekOffset={weekOffset}
        onWeekChange={setWeekOffset}
      />

      {/* Slot picker */}
      {equipment.status !== 'maintenance' ? (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Select Time</h2>
          <SlotPicker
            equipmentId={equipment.id}
            date={selectedDay}
            bookings={bookings}
            selectedStart={selectedStart}
            selectedEnd={selectedEnd}
            onSelect={handleSelect}
          />
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-text-secondary">This equipment is currently under maintenance.</p>
        </div>
      )}

      {/* Selection summary + book button */}
      {selectedStart !== null && selectedEnd !== null && (
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-cream text-sm font-medium">
              {slotToTime(selectedStart)} – {slotToTime(selectedEnd + 1)}
            </p>
            <p className="text-text-dim text-xs">{formatDuration(selectedEnd - selectedStart + 1)}</p>
          </div>
          <button
            onClick={() => {
              if (!user) {
                setIsOnboardingModalOpen(true)
                return
              }
              setShowConfirm(true)
            }}
            className="btn-primary px-6 py-2.5 text-sm"
          >
            Book
          </button>
        </div>
      )}

      {/* Existing bookings for this day */}
      {bookings.filter(b => b.equipmentId === equipment.id && !(user && b.userDid === user.did)).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Today's Bookings</h2>
          <div className="space-y-1.5">
            {bookings
              .filter(b => b.equipmentId === equipment.id && !(user && b.userDid === user.did))
              .sort((a, b) => a.startSlot - b.startSlot)
              .map(b => (
                <div key={b.id} className="card px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-cream text-sm">{b.userName || 'Unknown'}</p>
                    <p className="text-text-dim text-xs">
                      {slotToTime(b.startSlot)} – {slotToTime(b.endSlot + 1)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Cancel own booking */}
      {myBookingForDay && (
        <div className="card p-4 flex items-center justify-between border border-red/20">
          <div>
            <p className="text-cream text-sm font-medium">Your booking</p>
            <p className="text-text-dim text-xs">
              {slotToTime(myBookingForDay.startSlot)} – {slotToTime(myBookingForDay.endSlot + 1)} &middot; {formatDuration(myBookingForDay.endSlot - myBookingForDay.startSlot + 1)}
            </p>
          </div>
          <button
            onClick={() => handleCancel(myBookingForDay.id)}
            disabled={isCancelling === myBookingForDay.id}
            className="text-red text-sm font-medium hover:text-red/80 transition disabled:opacity-50"
          >
            {isCancelling === myBookingForDay.id ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        </div>
      )}

      {/* Confirmation overlay */}
      {showConfirm && selectedStart !== null && selectedEnd !== null && (
        <ConfirmationOverlay
          equipment={equipment}
          date={selectedDay}
          startSlot={selectedStart}
          endSlot={selectedEnd}
          onConfirm={handleBook}
          onCancel={() => setShowConfirm(false)}
          isLoading={isBooking}
        />
      )}
    </div>
  )
}
