// All amounts stored in KRW. Conversion is display-only.

export type CurrencyCode = 'KRW' | 'USD' | 'JPY' | 'CNY' | 'TWD' | 'HKD' | 'THB' | 'INR' | 'EUR'

export interface CurrencyInfo {
  code: CurrencyCode
  symbol: string        // e.g. '$', '¥', '₩'
  flag: string          // emoji flag
  name: string          // English name
  rateFromKRW: number  // 1 KRW = ? this currency
  decimals: number     // decimal places to show
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  KRW: { code: 'KRW', symbol: '₩',   flag: '🇰🇷', name: '원 (KRW)',        rateFromKRW: 1,          decimals: 0 },
  USD: { code: 'USD', symbol: '$',   flag: '🇺🇸', name: 'Dollar (USD)',    rateFromKRW: 0.000725,   decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥',   flag: '🇯🇵', name: '円 (JPY)',        rateFromKRW: 0.1099,     decimals: 0 },
  CNY: { code: 'CNY', symbol: '¥',   flag: '🇨🇳', name: '人民币 (CNY)',    rateFromKRW: 0.00526,    decimals: 2 },
  TWD: { code: 'TWD', symbol: 'NT$', flag: '🇹🇼', name: '台幣 (TWD)',      rateFromKRW: 0.02326,    decimals: 0 },
  HKD: { code: 'HKD', symbol: 'HK$', flag: '🇭🇰', name: '港幣 (HKD)',     rateFromKRW: 0.00565,    decimals: 2 },
  THB: { code: 'THB', symbol: '฿',   flag: '🇹🇭', name: 'บาท (THB)',      rateFromKRW: 0.02632,    decimals: 0 },
  INR: { code: 'INR', symbol: '₹',   flag: '🇮🇳', name: 'Rupee (INR)',    rateFromKRW: 0.0606,     decimals: 0 },
  EUR: { code: 'EUR', symbol: '€',   flag: '🇪🇺', name: 'Euro (EUR)',      rateFromKRW: 0.000667,   decimals: 2 },
}

// Default currency when a locale is selected
export const LOCALE_DEFAULT_CURRENCY: Record<string, CurrencyCode> = {
  ko:      'KRW',
  en:      'USD',
  ja:      'JPY',
  'zh-CN': 'CNY',
  'zh-TW': 'TWD',
  'zh-HK': 'HKD',
  th:      'THB',
  hi:      'INR',
  es:      'EUR',
  it:      'EUR',
  fr:      'EUR',
}

/** Convert KRW amount to target currency */
export function convertFromKRW(krw: number, info: CurrencyInfo): number {
  return (krw || 0) * info.rateFromKRW
}

/** Full display: "₩1,234,567" / "$1,234.56" / "¥135,000" */
export function fmtFull(krw: number, info: CurrencyInfo): string {
  const v = convertFromKRW(krw, info)
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  })
  return sign + info.symbol + formatted
}

/** Compact display with units: "1.5억" (KRW) / "$1.5M" / "¥150K" */
export function fmtCompact(krw: number, info: CurrencyInfo): string {
  const v = convertFromKRW(krw, info)
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  const s = info.symbol

  if (info.code === 'KRW') {
    if (abs >= 100_000_000) {
      const uk = abs / 100_000_000
      return sign + s + (uk >= 10 ? uk.toFixed(0) : uk.toFixed(1)) + '억'
    }
    if (abs >= 10_000) {
      const man = abs / 10_000
      return sign + s + (man >= 100 ? man.toFixed(0) : man.toFixed(1)) + '만'
    }
    return sign + s + Math.round(abs).toLocaleString('ko-KR')
  }

  if (info.code === 'JPY' || info.code === 'TWD' || info.code === 'THB' || info.code === 'INR') {
    // These have many units relative to KRW
    if (abs >= 100_000_000) return sign + s + (abs / 100_000_000).toFixed(1) + '億'
    if (abs >= 10_000)      return sign + s + (abs / 10_000).toFixed(0) + '万'
    return sign + s + Math.round(abs).toLocaleString('en-US')
  }

  // USD, EUR, CNY, HKD etc.
  if (abs >= 1_000_000_000) return sign + s + (abs / 1_000_000_000).toFixed(1) + 'B'
  if (abs >= 1_000_000)     return sign + s + (abs / 1_000_000).toFixed(1) + 'M'
  if (abs >= 1_000)         return sign + s + (abs / 1_000).toFixed(1) + 'K'
  return sign + s + abs.toFixed(info.decimals)
}
