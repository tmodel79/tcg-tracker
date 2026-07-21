// ========================================
// TCG 트래커 — 유틸리티 함수
// HTML 견본의 유틸 함수를 그대로 이식
// ========================================

import { calcCard } from '@/lib/calc'
import type { Card } from '@/types/card'

/** 숫자 → "1,234,567원" */
export const won = (n: number) =>
  Math.round(n || 0).toLocaleString('ko-KR') + '원'

/** 숫자 → "1,234,567" (단위 없음) */
export const wonPlain = (n: number) =>
  Math.round(n || 0).toLocaleString('ko-KR')

/** 수익률 포맷: "+21.2%" / "-5.3%" */
export const pctFmt = (n: number) =>
  (n >= 0 ? '+' : '') + n.toFixed(1) + '%'

/** 문자열에서 숫자만 파싱 (쉼표·공백 제거) */
export const numParse = (s: string | number | null | undefined): number => {
  const v = parseFloat(String(s ?? '').replace(/[^0-9.\-]/g, ''))
  return isNaN(v) ? 0 : v
}

/** UUID 생성 */
export const uid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/** 오늘 날짜 YYYY-MM-DD */
export const todayISO = (): string =>
  new Date().toISOString().slice(0, 10)

/** 날짜 스탬프 YYYYMMDD (파일명용) */
export const stamp = (): string =>
  new Date().toISOString().slice(0, 10).replace(/-/g, '')

/**
 * CSV Blob 생성 (BOM 포함 — 엑셀 한글 깨짐 방지)
 * totalCost·pnl·pct는 화면에서 계산 (DB 저장값 아님)
 */
export function buildCsvBlob(cards: Card[]): Blob {
  const head = [
    '카드명','게임','등급','구매일',
    '구매가','통화','환율','구매가(원)',
    '관세','배송대행비','기타비용','총원가(원)',
    '현재가(원)','손익(원)','수익률(%)',
  ]
  const lines = cards.map((c) => {
    const k = calcCard(c)
    return [
      c.name, c.game, c.grade ?? '', c.buy_date ?? '',
      c.buy_price, c.currency, c.fx_rate, Math.round(k.buyKRW),
      c.customs, c.shipping, c.etc_cost, Math.round(k.totalCost),
      k.hasNow ? Math.round(k.now!) : '',
      k.hasNow ? Math.round(k.pnl) : '',
      k.hasNow ? k.pct.toFixed(1) : '',
    ]
      .map((v) => {
        const s = String(v ?? '')
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      })
      .join(',')
  })

  const csv = '﻿' + head.join(',') + '\n' + lines.join('\n')
  return new Blob([csv], { type: 'text/csv;charset=utf-8' })
}

/** 파일 다운로드 트리거 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
