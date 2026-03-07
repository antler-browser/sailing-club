import { useState, useEffect, useCallback } from 'react'

export interface BookingWithUser {
  id: number
  equipmentId: string
  userDid: string
  date: string
  startSlot: number
  endSlot: number
  createdAt: string | number | null
  userName: string | null
  userAvatar: string | null
}

export function useBookings(date: string) {
  const [bookings, setBookings] = useState<BookingWithUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBookings = useCallback(() => {
    fetch(`/api/bookings?date=${date}`)
      .then(res => res.json())
      .then(data => {
        setBookings(data.bookings)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load bookings:', err)
        setLoading(false)
      })
  }, [date])

  useEffect(() => {
    setLoading(true)
    fetchBookings()
  }, [fetchBookings])

  const handleBookingCreated = useCallback((data: BookingWithUser) => {
    setBookings(prev => [...prev, data])
  }, [])

  const handleBookingDeleted = useCallback((data: { bookingId: number }) => {
    setBookings(prev => prev.filter(b => b.id !== data.bookingId))
  }, [])

  return { bookings, loading, refetch: fetchBookings, handleBookingCreated, handleBookingDeleted }
}

export function useMyBookings(profileJwt: string | undefined) {
  const [bookings, setBookings] = useState<BookingWithUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMyBookings = useCallback(() => {
    if (!profileJwt) {
      setLoading(false)
      return
    }
    fetch('/api/bookings/mine', {
      headers: { Authorization: `Bearer ${profileJwt}` },
    })
      .then(res => res.json())
      .then(data => {
        setBookings(data.bookings)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load my bookings:', err)
        setLoading(false)
      })
  }, [profileJwt])

  useEffect(() => {
    fetchMyBookings()
  }, [fetchMyBookings])

  const handleBookingCreated = useCallback((data: BookingWithUser) => {
    setBookings(prev => [...prev, data])
  }, [])

  const handleBookingDeleted = useCallback((data: { bookingId: number }) => {
    setBookings(prev => prev.filter(b => b.id !== data.bookingId))
  }, [])

  return { bookings, loading, refetch: fetchMyBookings, handleBookingCreated, handleBookingDeleted }
}
