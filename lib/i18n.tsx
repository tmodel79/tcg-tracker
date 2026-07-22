'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { locales, Locale, LOCALE_NAMES, defaultLocale } from './locales'

const LS_KEY = 'cl_lang'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key) => key,
})

function interpolate(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`
  )
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY) as Locale | null
      if (stored && stored in locales) {
        setLocaleState(stored)
      }
    } catch {
      // localStorage not available (SSR/private mode)
    }
  }, [])

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(LS_KEY, next)
    } catch {
      // ignore
    }
  }

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const dict = locales[locale]
    const template = dict[key] ?? locales[defaultLocale][key] ?? key
    return interpolate(template, vars)
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export { LOCALE_NAMES }
export type { Locale }
