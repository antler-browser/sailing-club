import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalFirstAuth } from '../hooks/useLocalFirstAuth'
import { useEquipment } from '../hooks/useEquipment'
import { useBookings, useMyBookings, type BookingWithUser } from '../hooks/useBookings'
import { getCurrentWeekDays, getWeekReferenceDate } from '../utils/slots'
import { WeekPicker } from '../components/WeekPicker'
import { CategoryCard } from '../components/CategoryCard'
import { BookingCard } from '../components/BookingCard'
import { ScheduleTimeline } from '../components/ScheduleTimeline'

export function Home() {
  const navigate = useNavigate()
  const { user, getProfileJwt, setIsOnboardingModalOpen, setBookingCallbacks } = useLocalFirstAuth()
  const { equipment, byCategory, loading: eqLoading } = useEquipment()
  const [profileJwt, setProfileJwt] = useState<string | undefined>()

  const [weekOffset, setWeekOffset] = useState(0)
  const weekDays = getCurrentWeekDays(getWeekReferenceDate(weekOffset))
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = weekDays.find(d => d.isToday)
    return today?.date || weekDays[0].date
  })

  const { bookings, handleBookingCreated, handleBookingDeleted } = useBookings(selectedDay)
  const { bookings: myBookings, handleBookingCreated: myCreated, handleBookingDeleted: myDeleted } = useMyBookings(profileJwt)

  // Load profile JWT
  useEffect(() => {
    getProfileJwt().then(setProfileJwt)
  }, [getProfileJwt])

  // Register WS callbacks
  const onCreated = useCallback((data: BookingWithUser) => {
    handleBookingCreated(data)
    myCreated(data)
  }, [handleBookingCreated, myCreated])

  const onDeleted = useCallback((data: { bookingId: number }) => {
    handleBookingDeleted(data)
    myDeleted(data)
  }, [handleBookingDeleted, myDeleted])

  useEffect(() => {
    setBookingCallbacks({ onCreated, onDeleted })
  }, [setBookingCallbacks, onCreated, onDeleted])

  const equipmentMap = new Map(equipment.map(e => [e.id, e]))

  // Filter my bookings to today and future
  const todayStr = new Date().toISOString().split('T')[0]
  const activeBookings = myBookings.filter(b => b.date >= todayStr)

  const categories = [
    { id: 'sail', label: 'Sailboats', icon: '\u26F5', items: byCategory.sail },
    { id: 'kayak', label: 'Kayaks & SUPs', icon: '\uD83D\uDEF6', items: byCategory.kayak },
    { id: 'wind', label: 'Windsurf', icon: '\uD83C\uDFC4', items: byCategory.wind },
  ]

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-display text-cream">
          Hey, {user ? user.name : ''}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {user ? 'Ready to hit the water?' : 'Sign in to book equipment'}
        </p>
      </div>

      {/* Your Bookings */}
      {user && activeBookings.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Your Bookings</h2>
          <div className="space-y-3">
            {activeBookings.slice(0, 3).map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                equipment={equipmentMap.get(b.equipmentId)}
                onClick={() => navigate(`/equipment/${b.equipmentId}?date=${b.date}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Schedule */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Schedule</h2>

        {/* Day picker */}
        <div className="mb-3">
          <WeekPicker
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            weekOffset={weekOffset}
            onWeekChange={setWeekOffset}
          />
        </div>

        <ScheduleTimeline
          equipment={equipment}
          bookings={bookings}
          currentUserDid={user?.did}
          date={selectedDay}
        />


        {/* Categories */}
        {!eqLoading && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Equipment</h2>
            <div className="space-y-2">
              {categories.map(cat => (
                <CategoryCard
                  key={cat.id}
                  categoryId={cat.id}
                  label={cat.label}
                  icon={cat.icon}
                  items={cat.items}
                  onClick={() => navigate(`/category/${cat.id}`)}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Sign in prompt for logged out */}
      {!user && (
        <button
          onClick={() => setIsOnboardingModalOpen(true)}
          className="w-full btn-primary py-4 text-lg"
        >
          Join the Club
        </button>
      )}
    </div>
  )
}
