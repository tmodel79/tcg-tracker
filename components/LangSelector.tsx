'use client'

import { useEffect, useRef, useState } from 'react'
import { useI18n, LOCALE_NAMES } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

const LOCALES = Object.keys(LOCALE_NAMES) as Locale[]

// Short display label for the button (flag + uppercase code)
const SHORT_LABELS: Record<Locale, string> = {
  ko: '🇰🇷 KO',
  en: '🇺🇸 EN',
  ja: '🇯🇵 JA',
  'zh-CN': '🇨🇳 ZH',
  'zh-TW': '🇹🇼 TW',
  'zh-HK': '🇭🇰 HK',
  th: '🇹🇭 TH',
  hi: '🇮🇳 HI',
  es: '🇪🇸 ES',
  it: '🇮🇹 IT',
  fr: '🇫🇷 FR',
}

export function LangSelector() {
  const { locale, setLocale } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '6px 10px',
          borderRadius: 9,
          background: 'var(--panel-2)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          fontSize: 12.5,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {SHORT_LABELS[locale]}
        <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 2 }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            minWidth: 160,
            zIndex: 200,
            overflow: 'hidden',
            padding: '4px 0',
          }}
        >
          {LOCALES.map((loc) => {
            const active = loc === locale
            return (
              <button
                key={loc}
                role="option"
                aria-selected={active}
                onClick={() => {
                  setLocale(loc)
                  setOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 14px',
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--accent-ink)' : 'var(--text)',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      'var(--panel-2)'
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      'transparent'
                }}
              >
                {LOCALE_NAMES[loc]}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
