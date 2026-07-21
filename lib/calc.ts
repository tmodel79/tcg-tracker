// ========================================
// TCG 트래커 — 계산 로직
// HTML 견본의 calc() 함수를 그대로 이식
// 검증: 구매가 850,000원 / 현재가 1,030,000원 → 손익 +180,000원, 수익률 +21.2%
// DB에 저장하지 않고 항상 화면에서 계산한다
// ========================================

import type { Card, CardCalc, PortfolioSummary } from '@/types/card'

/**
 * 카드 한 장의 계산값 반환 (HTML의 calc() 함수와 동일)
 */
export function calcCard(c: Card): CardCalc {
  const buyKRW = (c.buy_price || 0) * (c.fx_rate || 1)
  const totalCost = buyKRW + (c.customs || 0) + (c.shipping || 0) + (c.etc_cost || 0)

  const hasNow =
    c.current_price != null &&
    !isNaN(c.current_price)

  const now = hasNow ? Number(c.current_price) : null
  const pnl = hasNow ? now! - totalCost : 0
  const pct = hasNow && totalCost > 0 ? (pnl / totalCost) * 100 : 0

  const prev =
    c.prev_price != null && !isNaN(c.prev_price)
      ? Number(c.prev_price)
      : null
  const delta = hasNow && prev != null ? now! - prev : null

  return { buyKRW, totalCost, hasNow, now, pnl, pct, delta }
}

/**
 * 포트폴리오 전체 합계 계산
 * 총 평가액: 시세 미입력 카드는 원가로 계산 → 손실 왜곡 방지
 */
export function calcPortfolio(cards: Card[]): PortfolioSummary {
  let invest = 0
  let value = 0
  let pricedCards = 0

  for (const c of cards) {
    const k = calcCard(c)
    invest += k.totalCost
    value += k.hasNow ? k.now! : k.totalCost
    if (k.hasNow) pricedCards++
  }

  const pnl = value - invest
  const pct = invest > 0 ? (pnl / invest) * 100 : 0

  return {
    invest,
    value,
    pnl,
    pct,
    totalCards: cards.length,
    pricedCards,
  }
}
