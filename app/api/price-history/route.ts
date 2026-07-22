// ========================================
// 가격 히스토리 API — /api/price-history
// POST: 현재가 스냅샷 저장 (카드별 + 포트폴리오 전체)
// GET:  카드별 히스토리 조회 또는 포트폴리오 전체 스냅샷 조회
// ========================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ── GET ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const cardId   = sp.get('cardId')
  const portfolio = sp.get('portfolio')
  const db = getSupabase()

  if (portfolio) {
    const { data, error } = await db
      .from('portfolio_snapshots')
      .select('total_value_krw, total_cost_krw, card_count, recorded_at')
      .order('recorded_at', { ascending: true })
      .limit(365)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ snapshots: data })
  }

  if (cardId) {
    const { data, error } = await db
      .from('price_history')
      .select('price_krw, source, recorded_at')
      .eq('card_id', cardId)
      .order('recorded_at', { ascending: true })
      .limit(200)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ history: data })
  }

  return NextResponse.json({ error: 'cardId 또는 portfolio=1 파라미터 필요' }, { status: 400 })
}

// ── POST ──────────────────────────────────────────
// body: { cardSnapshots: [{cardId, priceKrw, source}], portfolioValue, portfolioCost, cardCount }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cardSnapshots, portfolioValue, portfolioCost, cardCount } = body
    const db = getSupabase()
    const errors: string[] = []

    // 1) 카드별 히스토리 저장
    if (Array.isArray(cardSnapshots) && cardSnapshots.length > 0) {
      const rows = cardSnapshots.map((s: { cardId: string; priceKrw: number; source?: string }) => ({
        card_id: s.cardId,
        price_krw: s.priceKrw,
        source: s.source || 'manual',
      }))
      const { error } = await db.from('price_history').insert(rows)
      if (error) errors.push(error.message)
    }

    // 2) 포트폴리오 전체 스냅샷 저장
    if (portfolioValue != null && portfolioCost != null) {
      const { error } = await db.from('portfolio_snapshots').insert({
        total_value_krw: portfolioValue,
        total_cost_krw: portfolioCost,
        card_count: cardCount || 0,
      })
      if (error) errors.push(error.message)
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
