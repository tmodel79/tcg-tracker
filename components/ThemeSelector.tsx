'use client'

import { useState, useEffect } from 'react'

type Theme = 'dark' | 'gray'

const THEMES: Theme[] = ['dark', 'gray']

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try { localStorage.setItem('cl_theme', theme) } catch { /* ignore */ }
}

export function ThemeSelector() {
  const [theme, setTheme] = useState<Theme>('dark')

  // 마운트 시 저장된 테마 불러오기
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cl_theme') as Theme | null
      if (stored && THEMES.includes(stored)) {
        setTheme(stored)
        // data-theme은 이미 layout의 inline script가 설정했으므로 DOM은 건드리지 않음
      }
    } catch { /* ignore */ }
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'gray' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to Gray' : 'Switch to Dark'}
      style={{
        background: 'var(--panel-2)',
        border: '1px solid var(--border)',
        borderRadius: 9,
        padding: '5px 9px',
        fontSize: 15,
        lineHeight: 1,
        cursor: 'pointer',
        color: 'var(--text)',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        transition: 'background 0.15s',
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
