'use client'

// ========================================
// 카드별 시세 변화 미니 차트 (CardModal 내부용)
// ========================================

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, ReferenceLine,
} from 'recharts'

interface PricePoint {
  price_krw: number
  source: string
  recorded_at: string
}

interface CardPriceChartProps {
  cardId: string
  totalCostKrw: number  // 매입 원가 (KRW 환산)
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function fmtKrw(v: number) {
  if (v >= 1_000_000) return `₩${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000)    return `₩${(v / 1_000).toFixed(0)}K`
  return `₩${v.toLocaleString()}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MiniTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '7px 11px',
      fontSize: 11.5,
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      <div style={{ color: 'var(--muted-2)', marginBottom: 4, fontWeight: 700 }}>{label}</div>
      <div className="num" style={{ fontWeight: 800 }}>{fmtKrw(payload[0].value)}</div>
    </div>
  )
}

export function CardPriceChart({ cardId, totalCostKrw }: CardPriceChartProps) {
  const [history, setHistory] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!cardId) return
    fetch(`/api/price-history?cardId=${cardId}`)
      .then(r => r.json())
      .then(d => setHistory(d.history || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [cardId])

  if (loading) return (
    <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>불러오는 중…</span>
    </div>
  )

  if (history.length < 2) return (
    <div style={{
      background: 'var(--panel-2)',
      borderRadius: 10,
      padding: '12px 14px',
      fontSize: 12,
      color: 'var(--muted-2)',
      textAlign: 'center',
      lineHeight: 1.6,
    }}>
      시세 기록이 없습니다.<br />
      <span style={{ fontSize: 11 }}>현재가 저장 후 메인화면의 기록 버튼을 누르면 차트가 생성됩니다.</span>
    </div>
  )

  const chartData = history.map(h => ({
    date: fmtDate(h.recorded_at),
    price: h.price_krw,
  }))

  const prices = history.map(h => h.price_krw)
  const latest = prices[prices.length - 1]
  const earliest = prices[0]
  const change = latest - earliest
  const changePct = earliest > 0 ? ((change / earliest) * 100).toFixed(1) : '0.0'
  const isGain = change >= 0

  return (
    <div>
      {/* 미니 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          시세 히스토리
        </span>
        <span className="num" style={{ fontSize: 12, fontWeight: 800, color: isGain ? 'var(--gain)' : 'var(--loss)' }}>
          {isGain ? '+' : '−'}{fmtKrw(Math.abs(change))} ({isGain ? '+' : ''}{changePct}%)
        </span>
      </div>

      {/* 차트 */}
      <div style={{ height: 100 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9.5, fill: 'var(--muted-2)' }} axisLine={false} tickLine={false} />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<MiniTooltip />} />
            {/* 매입 원가 기준선 */}
            {totalCostKrw > 0 && (
              <ReferenceLine
                y={totalCostKrw}
                stroke="var(--muted-2)"
                strokeDasharray="4 3"
                strokeWidth={1}
                label={{ value: '원가', position: 'right', fontSize: 9, fill: 'var(--muted-2)' }}
              />
            )}
            <Line
              type="monotone"
              dataKey="price"
              stroke={isGain ? 'var(--gain)' : 'var(--loss)'}
              strokeWidth={2}
              dot={{ r: 3, fill: isGain ? 'var(--gain)' : 'var(--loss)', strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ fontSize: 10, color: 'var(--muted-2)', textAlign: 'right', marginTop: 4 }}>
        {history.length}개 기록 · 최근 {fmtDate(history[history.length - 1].recorded_at)}
      </div>
    </div>
  )
}
