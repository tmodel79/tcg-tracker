'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { locales, Locale, LOCALE_NAMES, defaultLocale } from './locales'
import { extraLocales } from './localesExtra'
import {
  CurrencyCode,
  CurrencyInfo,
  CURRENCIES,
  LOCALE_DEFAULT_CURRENCY,
  fmtFull,
  fmtCompact,
} from './currency'

const LS_KEY = 'cl_lang'
const LS_CURR = 'cl_currency'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  currency: CurrencyInfo
  setCurrency: (code: CurrencyCode) => void
  fmt: (krw: number) => string      // full: "₩1,234,567"
  fmtC: (krw: number) => string     // compact: "1.2억" / "$1.2M"
}

const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key) => key,
  currency: CURRENCIES['KRW'],
  setCurrency: () => {},
  fmt: (krw) => fmtFull(krw, CURRENCIES['KRW']),
  fmtC: (krw) => fmtCompact(krw, CURRENCIES['KRW']),
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
  const [currencyCode, setCurrencyState] = useState<CurrencyCode>('KRW')

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedLang = localStorage.getItem(LS_KEY) as Locale | null
      if (storedLang && storedLang in locales) {
        setLocaleState(storedLang)
      }
      const storedCurr = localStorage.getItem(LS_CURR) as CurrencyCode | null
      if (storedCurr && storedCurr in CURRENCIES) {
        setCurrencyState(storedCurr)
      } else if (storedLang && storedLang in locales) {
        // Derive currency from stored language if no currency saved
        const defaultCurr = LOCALE_DEFAULT_CURRENCY[storedLang] ?? 'KRW'
        setCurrencyState(defaultCurr)
      }
    } catch {
      // localStorage not available (SSR/private mode)
    }
  }, [])

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    // Auto-switch currency to this locale's default
    const defaultCurr = LOCALE_DEFAULT_CURRENCY[next] ?? 'KRW'
    setCurrencyState(defaultCurr)
    try {
      localStorage.setItem(LS_KEY, next)
      localStorage.setItem(LS_CURR, defaultCurr)
    } catch {
      // ignore
    }
  }

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code)
    try { localStorage.setItem(LS_CURR, code) } catch { /* ignore */ }
  }

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const dict = locales[locale]
    const extra = extraLocales[locale]
    const template =
      dict[key] ??
      extra?.[key] ??
      locales[defaultLocale][key] ??
      extraLocales[defaultLocale]?.[key] ??
      key
    return interpolate(template, vars)
  }

  const currency = CURRENCIES[currencyCode]
  const fmt = (krw: number) => fmtFull(krw, currency)
  const fmtC = (krw: number) => fmtCompact(krw, currency)

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, currency, setCurrency, fmt, fmtC }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export { LOCALE_NAMES }
export type { Locale }
