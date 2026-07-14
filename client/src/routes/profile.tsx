import { useNavigate } from 'react-router-dom'
import { ImportExport } from 'local-first-auth-import-export/react'
import { useLocalFirstAuth } from '../hooks/useLocalFirstAuth'
import { authCustomStyles } from '../lib/authStyles'

export function Profile() {
  const navigate = useNavigate()
  const { user, setIsOnboardingModalOpen, handleProfileImported } = useLocalFirstAuth()

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
          <span className="text-2xl">&#9875;</span>
          <h1 className="text-xl font-display text-cream">Your Profile</h1>
        </div>
      </div>

      <div className="rope-divider" />

      {user ? (
        <>
          <p className="text-text-secondary text-sm">
            Back up your membership so you can restore it on another device, or bring
            an existing profile into the club.
          </p>
          <ImportExport
            defaultTab="export"
            customStyles={authCustomStyles}
            onComplete={() => {
              handleProfileImported()
              navigate('/')
            }}
          />
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            Join the club to back up your membership — or restore one you already have.
          </p>
          <button
            onClick={() => setIsOnboardingModalOpen(true)}
            className="btn-primary px-6 py-3 font-semibold"
          >
            Join the Club
          </button>
          <ImportExport
            defaultTab="import"
            skipExport
            customStyles={authCustomStyles}
            onComplete={() => {
              handleProfileImported()
              navigate('/')
            }}
          />
        </div>
      )}
    </div>
  )
}
