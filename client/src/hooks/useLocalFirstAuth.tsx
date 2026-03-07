import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { decodeAndVerifyJWT } from '@starter/shared'
import { useWebSockets } from './useWebSockets'

declare global {
  interface Window {
    localFirstAuth?: {
      getProfileDetails(): Promise<string>;
      getAvatar(): Promise<string | null>;
      getAppDetails(): {
        name: string;
        version: string;
        platform: 'ios' | 'android' | 'browser';
        supportedPermissions: string[];
      };
      requestPermission(permission: string): Promise<boolean>;
      close(): void;
    };
  }
}

export interface User {
  did: string
  name: string
  avatar?: string
  socials?: Array<{ platform: string; handle: string }>
  isAdmin: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  isOnboardingModalOpen: boolean
  setIsOnboardingModalOpen: (open: boolean) => void
  handleOnboardingComplete: () => void
  getProfileJwt: () => Promise<string | undefined>
  onBookingCreated: ((data: any) => void) | undefined
  onBookingDeleted: ((data: any) => void) | undefined
  setBookingCallbacks: (cbs: { onCreated?: (data: any) => void; onDeleted?: (data: any) => void }) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false)
  const [bookingCreatedCb, setBookingCreatedCb] = useState<((data: any) => void) | undefined>()
  const [bookingDeletedCb, setBookingDeletedCb] = useState<((data: any) => void) | undefined>()

  const handleReset = useCallback(() => setUser(null), [])

  const handleBookingCreated = useCallback((data: any) => {
    bookingCreatedCb?.(data)
  }, [bookingCreatedCb])

  const handleBookingDeleted = useCallback((data: any) => {
    bookingDeletedCb?.(data)
  }, [bookingDeletedCb])

  useWebSockets({
    userId: user?.did,
    isAdmin: user?.isAdmin ?? false,
    onReset: handleReset,
    onBookingCreated: handleBookingCreated,
    onBookingDeleted: handleBookingDeleted,
  })

  const setBookingCallbacks = useCallback((cbs: { onCreated?: (data: any) => void; onDeleted?: (data: any) => void }) => {
    setBookingCreatedCb(() => cbs.onCreated)
    setBookingDeletedCb(() => cbs.onDeleted)
  }, [])

  const getProfileJwt = async (): Promise<string | undefined> => {
    if (!window.localFirstAuth) return undefined
    return await window.localFirstAuth.getProfileDetails()
  }

  const addUserToDatabase = async (profileJwt: string): Promise<User> => {
    const response = await fetch('/api/add-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileJwt }),
    })
    if (!response.ok) {
      throw new Error('Failed to add user')
    }
    return response.json()
  }

  const addAvatarToDatabase = async (avatarJwt: string) => {
    try {
      const response = await fetch('/api/add-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarJwt }),
      })
      if (!response.ok) {
        throw new Error('Failed to add avatar')
      }
    } catch (err) {
      console.error('Error adding avatar to database:', err)
    }
  }

  const loadUser = useCallback(async () => {
    try {
      if (!window.localFirstAuth) {
        setLoading(false)
        return
      }

      const profileJwt = await window.localFirstAuth.getProfileDetails()
      const user = await addUserToDatabase(profileJwt)
      setUser(prev => prev ? { ...prev, ...user } : user)
      setLoading(false)
    } catch (err) {
      console.error('Error loading profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
      setLoading(false)
    }
  }, [])

  const loadAvatar = useCallback(async () => {
    try {
      if (!window.localFirstAuth) return

      const avatarJWT = await window.localFirstAuth.getAvatar()
      if (!avatarJWT) return

      await addAvatarToDatabase(avatarJWT)

      const avatarPayload = await decodeAndVerifyJWT(avatarJWT)
      if (avatarPayload?.data) {
        const { avatar } = avatarPayload.data as { avatar: string }
        setUser(prev => prev ? { ...prev, avatar } : null)
      }
    } catch (err) {
      console.error('Error loading avatar:', err)
    }
  }, [])

  const handleOnboardingComplete = useCallback(() => {
    setIsOnboardingModalOpen(false)
    loadUser()
    loadAvatar()
  }, [loadUser, loadAvatar])

  useEffect(() => {
    if (window.localFirstAuth) {
      loadUser()
      loadAvatar()
    } else {
      setLoading(false)
    }
  }, [loadUser, loadAvatar])

  const value: AuthContextType = {
    user,
    loading,
    error,
    isOnboardingModalOpen,
    setIsOnboardingModalOpen,
    handleOnboardingComplete,
    getProfileJwt,
    onBookingCreated: bookingCreatedCb,
    onBookingDeleted: bookingDeletedCb,
    setBookingCallbacks,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useLocalFirstAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useLocalFirstAuth must be used within an AuthProvider')
  }
  return context
}
