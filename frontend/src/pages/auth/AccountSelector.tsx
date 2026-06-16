/**
 * AccountSelector.tsx — Multi-profile account selector (AUT-05)
 *
 * After login, shows a list of profiles with a skeleton loader while
 * profiles are loading. Selecting a profile proceeds to /robos.
 * For single-profile users, auto-skips to /robos after profiles load.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

interface Profile {
  id: string
  name: string
  email: string
  avatar_initials: string
  role: string
}

/** Skeleton loader block — animated placeholder for a profile card */
function SkeletonCard() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
      }}
    >
      {/* Avatar skeleton */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '99px',
          background: 'var(--border2, #424B73)',
          animation: 'skeletonPulse 1.5s ease-in-out infinite',
          flexShrink: 0,
        }}
      />
      {/* Text skeleton */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
          style={{
            height: '12px',
            width: '60%',
            borderRadius: '6px',
            background: 'var(--border2, #424B73)',
            animation: 'skeletonPulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            height: '10px',
            width: '40%',
            borderRadius: '6px',
            background: 'var(--border2, #424B73)',
            animation: 'skeletonPulse 1.5s ease-in-out 0.2s infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.4 }
        }
      `}</style>
    </div>
  )
}

export default function AccountSelector() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const session = useAuthStore((s) => s.session)

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!session) {
      navigate('/auth/login', { replace: true })
    }
  }, [session, navigate])

  // Load profiles — in production this queries /account/profiles.
  // For now, build a single profile from the authenticated user (AUT-05).
  useEffect(() => {
    if (!user) return

    // Simulate async profile load (real: fetch from Supabase profiles table)
    const timer = setTimeout(() => {
      const email = user.email ?? ''
      const name =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        email.split('@')[0]

      const singleProfile: Profile = {
        id: user.id,
        name: String(name),
        email,
        avatar_initials: String(name).slice(0, 2).toUpperCase(),
        role: 'Trader',
      }

      const loadedProfiles = [singleProfile]
      setProfiles(loadedProfiles)
      setProfilesLoading(false)

      // Single-profile: auto-skip to /robos (AUT-05)
      if (loadedProfiles.length === 1) {
        navigate('/robos', { replace: true })
      }
    }, 600) // Simulate network latency so skeleton is visible

    return () => clearTimeout(timer)
  }, [user, navigate])

  function handleSelectProfile(_profile: Profile) {
    navigate('/robos', { replace: true })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background gradient */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(900px 420px at 70% -10%, var(--glow1), transparent 60%),' +
            'radial-gradient(700px 420px at 8% 112%, var(--glow2), transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '440px',
          padding: '0 16px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '32px',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '9px',
              background: 'var(--color-primary, #8F7BFF)',
              fontFamily: 'Sora, sans-serif',
              fontWeight: 800,
              fontSize: '15px',
              color: 'var(--seg-on-tx, #14182B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            V
          </div>
          <span
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '0.14em',
              color: 'var(--text)',
            }}
          >
            VETOR
          </span>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <h1
            style={{
              fontFamily: 'Sora, sans-serif',
              fontWeight: 700,
              fontSize: '18px',
              color: 'var(--text)',
              margin: '0 0 6px',
            }}
          >
            Selecionar conta
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 24px' }}>
            Escolha a conta com a qual deseja continuar.
          </p>

          {/* Profile list with skeleton loader */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {profilesLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => handleSelectProfile(profile)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s, background 0.15s',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--surface3)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '99px',
                      background: 'var(--color-primary, #8F7BFF)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Sora, sans-serif',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: 'var(--seg-on-tx, #14182B)',
                      flexShrink: 0,
                    }}
                  >
                    {profile.avatar_initials}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: 'var(--text)',
                        marginBottom: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {profile.name}
                    </div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--muted2)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {profile.email}
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.8" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
