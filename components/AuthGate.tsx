'use client'

// ========================================
// AuthGate — Supabase Auth 이메일 매직링크 로그인 게이트
// 세션이 없으면 로그인 화면을 보여주고, 있으면 children을 그대로 렌더링한다.
// 기존 앱의 다크 테마 CSS 변수를 그대로 사용해 톤을 통일한다.
// ========================================

import { useEffect, useState, FormEvent, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { getSession, onAuthStateChange, signInWithMagicLink } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'

type AuthPhase = 'checking' | 'signed-out' | 'sent' | 'signed-in'

// 로그인 게이트를 타지 않고 항상 공개되어야 하는 경로 (약관·개인정보처리방침)
const PUBLIC_PATHS = ['/terms', '/privacy']

export function AuthGate({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const pathname = usePathname()
  const [phase, setPhase] = useState<AuthPhase>('checking')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const isPublicPath = PUBLIC_PATHS.includes(pathname ?? '')

  useEffect(() => {
    let mounted = true

    getSession()
      .then((session) => {
        if (!mounted) return
        setPhase(session ? 'signed-in' : 'signed-out')
      })
      .catch(() => {
        if (!mounted) return
        setPhase('signed-out')
      })

    const unsubscribe = onAuthStateChange((session: Session | null) => {
      if (!mounted) return
      setPhase(session ? 'signed-in' : 'signed-out')
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || sending) return
    setErrorMsg('')
    setSending(true)
    try {
      await signInWithMagicLink(email.trim())
      setPhase('sent')
    } catch (err) {
      setErrorMsg(t('auth_error', { msg: err instanceof Error ? err.message : String(err) }))
    } finally {
      setSending(false)
    }
  }

  // /terms · /privacy는 로그인 여부와 무관하게 항상 그대로 노출
  if (isPublicPath) {
    return <>{children}</>
  }

  if (phase === 'signed-in') {
    return <>{children}</>
  }

  if (phase === 'checking') {
    return (
      <div style={screenStyle}>
        <div className="sk" style={{ width: 48, height: 48, borderRadius: '50%' }} />
      </div>
    )
  }

  return (
    <div style={screenStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, justifyContent: 'center' }}>
          <span
            style={{
              width: 9, height: 9, borderRadius: '50%',
              background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>CardLedger</span>
        </div>

        {phase === 'sent' ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 6px', color: 'var(--text)' }}>
              {t('auth_check_email', { email })}
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>
              {t('auth_subtitle')}
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', textAlign: 'center' }}>
              {t('auth_title')}
            </h1>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 20px', textAlign: 'center' }}>
              {t('auth_subtitle')}
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth_email_placeholder')}
                style={inputStyle}
              />
              <button type="submit" disabled={sending || !email.trim()} style={buttonStyle(sending)}>
                {sending ? t('auth_sending') : t('auth_send_link')}
              </button>
            </form>

            {errorMsg && (
              <p style={{ fontSize: 12.5, color: 'var(--gain)', marginTop: 12, textAlign: 'center' }}>
                {errorMsg}
              </p>
            )}
          </>
        )}

        <p style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 24, textAlign: 'center', lineHeight: 1.6 }}>
          {t('auth_terms_notice')}{' '}
          <a href="/terms" style={linkStyle}>{t('auth_terms_link')}</a>
          {' · '}
          <a href="/privacy" style={linkStyle}>{t('auth_privacy_link')}</a>
        </p>
      </div>
    </div>
  )
}

const screenStyle: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg)',
  padding: 20,
}

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 380,
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '28px 26px 22px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 9,
  background: 'var(--panel-2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  fontSize: 13.5,
  fontFamily: 'inherit',
  outline: 'none',
}

function buttonStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 9,
    background: disabled ? 'var(--panel-3)' : 'var(--accent)',
    color: disabled ? 'var(--muted)' : 'var(--accent-ink)',
    border: 'none',
    fontSize: 13.5,
    fontWeight: 800,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
  }
}

const linkStyle: React.CSSProperties = {
  color: 'var(--muted)',
  textDecoration: 'underline',
}
