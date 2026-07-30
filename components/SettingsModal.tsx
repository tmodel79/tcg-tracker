'use client'

// ========================================
// SettingsModal — 언어·통화·테마 통합 설정 창
// 사이드바 알약 버튼 3개(LangSelector·CurrencySelector·ThemeSelector)를 대체.
// 화면 중앙 고정 모달이라 사이드바 overflow에 잘리지 않는다.
// ========================================

import { useEffect, useState } from 'react'
import { useI18n, LOCALE_NAMES } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { CURRENCIES, CurrencyCode } from '@/lib/currency'
import { getSession, signOut } from '@/lib/supabase'
import { IconX } from './Icons'

const LOCALES = Object.keys(LOCALE_NAMES) as Locale[]
const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[]

type Theme = 'dark' | 'gray'

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try { localStorage.setItem('cl_theme', theme) } catch { /* ignore */ }
}

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { locale, setLocale, currency, setCurrency, t } = useI18n()
  const [theme, setTheme] = useState<Theme>('dark')
  const [email, setEmail] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  // 마운트 시 저장된 테마 불러오기 (data-theme은 layout inline script가 이미 설정)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cl_theme') as Theme | null
      if (stored === 'dark' || stored === 'gray') setTheme(stored)
    } catch { /* ignore */ }
  }, [])

  // 열릴 때마다 로그인된 이메일 표시
  useEffect(() => {
    if (!open) return
    getSession()
      .then((session) => setEmail(session?.user?.email ?? null))
      .catch(() => setEmail(null))
  }, [open])

  const handleLogout = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  // Escape로 닫기
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const pickTheme = (next: Theme) => {
    setTheme(next)
    applyTheme(next)
  }

  const optionStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '9px 8px', borderRadius: 9,
    fontSize: 12.5, fontWeight: active ? 800 : 600,
    cursor: 'pointer', fontFamily: 'inherit',
    background: active ? 'rgba(232,177,58,.15)' : 'var(--panel-2)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    transition: 'all 0.12s',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  })

  const sectionTitle: React.CSSProperties = {
    fontSize: 10.5, fontWeight: 700, color: 'var(--muted-2)',
    textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(4,7,11,.72)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 16px', zIndex: 120, overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="modal-pop"
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          width: '100%', maxWidth: 420,
          padding: '20px 20px 22px',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={t('settings_title')}
      >
        {/* ── 헤더 ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {t('settings_title')}
          </h2>
          <button
            onClick={onClose}
            aria-label="close"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 8,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--muted)', cursor: 'pointer',
            }}
          >
            <IconX size={14} />
          </button>
        </div>

        {/* ── 언어 ── */}
        <div style={{ marginBottom: 18 }}>
          <p style={sectionTitle}>{t('settings_lang')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {LOCALES.map((loc) => (
              <button key={loc} style={optionStyle(loc === locale)} onClick={() => setLocale(loc)}>
                {LOCALE_NAMES[loc]}
              </button>
            ))}
          </div>
        </div>

        {/* ── 통화 ── */}
        <div style={{ marginBottom: 18 }}>
          <p style={sectionTitle}>{t('settings_currency')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {CURRENCY_CODES.map((code) => (
              <button
                key={code}
                style={optionStyle(code === currency.code)}
                onClick={() => setCurrency(code)}
              >
                {CURRENCIES[code].symbol} {code}
              </button>
            ))}
          </div>
        </div>

        {/* ── 테마 ── */}
        <div style={{ marginBottom: email ? 18 : 0 }}>
          <p style={sectionTitle}>{t('settings_theme')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button style={optionStyle(theme === 'dark')} onClick={() => pickTheme('dark')}>
              {t('theme_dark')}
            </button>
            <button style={optionStyle(theme === 'gray')} onClick={() => pickTheme('gray')}>
              {t('theme_gray')}
            </button>
          </div>
        </div>

        {/* ── 계정 (로그인 이메일 · 로그아웃) ── */}
        {email && (
          <div style={{ paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
            <p style={sectionTitle}>{t('settings_account')}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 12.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {email}
              </span>
              <button
                onClick={handleLogout}
                disabled={signingOut}
                style={{
                  flexShrink: 0,
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: signingOut ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  background: 'var(--panel-2)',
                  color: 'var(--muted)',
                  border: '1px solid var(--border)',
                }}
              >
                {t('auth_logout_btn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
