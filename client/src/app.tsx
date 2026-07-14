import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Onboarding } from 'local-first-auth/react'
import { ImportProfile } from 'local-first-auth-import-export/react'
import { AuthProvider, useLocalFirstAuth } from './hooks/useLocalFirstAuth'
import { QRCodePanel } from './components/QRCodePanel'
import { Footer } from './components/Footer'
import { authCustomStyles } from './lib/authStyles'

function Layout() {
  const {
    loading,
    error,
    isOnboardingModalOpen,
    setIsOnboardingModalOpen,
    handleOnboardingComplete,
    handleProfileImported,
  } = useLocalFirstAuth()

  const [authMode, setAuthMode] = useState<'create' | 'import'>('create')

  const closeOnboardingModal = () => {
    setIsOnboardingModalOpen(false)
    setAuthMode('create')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy">
        <div className="grid md:grid-cols-2 min-h-screen">
          <QRCodePanel />
          <div className="flex items-center justify-center px-4">
            <div className="text-text-secondary">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy">
        <div className="grid md:grid-cols-2 min-h-screen">
          <QRCodePanel />
          <div className="flex items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-6">&#9875;</div>
              <h1 className="text-3xl font-display text-cream mb-4">Error</h1>
              <p className="text-text-secondary">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy">
      <div className="grid md:grid-cols-2 min-h-screen">
        <QRCodePanel />
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>

      {isOnboardingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeOnboardingModal}
          />
          <div className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-auto rounded-2xl shadow-2xl">
            {authMode === 'create' ? (
              <>
                <Onboarding
                  skipSocialStep={true}
                  customStyles={authCustomStyles}
                  onComplete={handleOnboardingComplete}
                />
                <div className="bg-navy-mid border-t border-navy-light/50 px-6 py-4 text-center">
                  <button
                    onClick={() => setAuthMode('import')}
                    className="text-sm text-text-secondary hover:text-cream transition"
                  >
                    Already have a profile? <span className="text-brass font-semibold">Import it</span>
                  </button>
                </div>
              </>
            ) : (
              <ImportProfile
                customStyles={authCustomStyles}
                onComplete={handleProfileImported}
                onBack={() => setAuthMode('create')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  )
}
