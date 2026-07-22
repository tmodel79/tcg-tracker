'use client'

// ========================================
// 포트폴리오 가치 변화 차트 (Recharts)
// ========================================

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { useI18n } from '@/lib/i18n'
import { calcPortfolio } from '@/lib/calc'
import type { Card } from '@/types/card'

interface Snapshot {
  total_value_krw: number
  total_cost_krw: number
  card_count: number
  recorded_at: string
}

interface PortfolioChartProps {
  cards: Card[]
  onSaveSnapshot?: () => void
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function fmtKrw(v: number) {
  if (v >= 1_000_000) return `₩${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)    return `₩${(v / 1_000).toFixed(0)}K`
  return `₩${v.toLocaleString()}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value
  const cost  = payload[1]?.value
  const pnl   = value - cost
  const pct   = cost > 0 ? ((pnl / cost) * 100).toFixed(1) : '0.0'
  const isGain = pnl >= 0
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
      minWidth: 160,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{ color: 'var(--muted-2)', marginBottom: 6, fontWeight: 700 }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
        <span style={{ color: 'var(--muted)' }}>가치</span>
        <span className="num" style={{ fontWeight: 800 }}>{fmtKrw(value)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
        <span style={{ color: 'var(--muted)' }}>투자</span>
        <span className="num" style={{ fontWeight: 700, color: 'var(--muted)' }}>{fmtKrw(cost)}</span>
      </div>
      <div style={{ borderTop: '1px solid var(--border-soft)', marginTop: 6, paddingTop: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: 'var(--muted)' }}>손익</span>
          <span className="num" style={{ fontWeight: 800, color: isGain ? 'var(--gain)' : 'var(--loss)' }}>
            {isGain ? '+' : '−'}{fmtKrw(Math.abs(pnl))} ({isGain ? '+' : '-'}{pct}%)
          </span>
        </div>
      </div>
    </div>
  )
}

export function PortfolioChart({ cards, onSaveSnapshot }: PortfolioChartProps) {
  const { fmtC } = useI18n()
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [saving, setSaving] = useState(false)
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    fetch('/api/price-history?portfolio=1')
      .then(r => r.json())
      .then(d => setSnapshots(d.snapshots || []))
      .catch(() => {})
  }, [])

  // 현재 포트폴리오 가치 계산
  const summary = calcPortfolio(cards)

  // 스냅샷 저장
  const handleSave = async () => {
    setSaving(true)
    try {
      const pricedCards = cards.filter(c => c.current_price)
      const cardSnapshots = pricedCards.map(c => {
        const price = Number(c.current_price) || 0
        const fxRate = Number(c.fx_rate) || 1
        return { cardId: c.id, priceKrw: Math.round(price * fxRate), source: 'manual' }
      })
      await fetch('/api/price-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardSnapshots,
          portfolioValue: summary.value,
          portfolioCost: summary.invest,
          cardCount: cards.length,
        }),
      })
      // 새 스냅샷 다시 로드
      const res = await fetch('/api/price-history?portfolio=1')
      const d = await res.json()
      setSnapshots(d.snapshots || [])
      onSaveSnapshot?.()
    } finally {
      setSaving(false)
    }
  }

  // 날짜 범위 필터
  const now = Date.now()
  const rangeDays = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 99999
  const filtered = snapshots.filter(s => {
    const diff = (now - new Date(s.recorded_at).getTime()) / (1000 * 60 * 60 * 24)
    return diff <= rangeDays
  })

  // 현재 값을 맨 끝에 추가 (live dot)
  const chartData = [
    ...filtered.map(s => ({
      date: fmtDate(s.recorded_at),
      value: s.total_value_krw,
      cost: s.total_cost_krw,
    })),
    ...(summary.pricedCards > 0 ? [{
      date: '지금',
      value: summary.value,
      cost: summary.invest,
    }] : []),
  ]

  const hasData = chartData.length >= 2
  const totalPnl = summary.pnl
  const isGain = totalPnl >= 0

  return (
    <div style={{
      background: 'var(--panel-2)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '16px 16px 12px',
      marginBottom: 16,
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
            포트폴리오 가치
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="num" style={{ fontSize: 20, fontWeight: 800 }}>
              {fmtC(summary.value)}
            </span>
            {summary.pricedCards > 0 && (
              <span className="num" style={{ fontSize: 12, fontWeight: 700, color: isGain ? 'var(--gain)' : 'var(--loss)' }}>
                {isGain ? '+' : '−'}{fmtC(Math.abs(totalPnl))} ({isGain ? '+' : ''}{summary.pct.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>

        {/* 스냅샷 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving || summary.pricedCards === 0}
          title="현재 시세를 기록합니다"
          style={{
            padding: '5px 10px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            cursor: saving || summary.pricedCards === 0 ? 'not-allowed' : 'pointer',
            border: '1px solid var(--border)',
            background: 'var(--panel-3)',
            color: saving || summary.pricedCards === 0 ? 'var(--muted-2)' : 'var(--muted)',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          {saving ? '저장 중…' : '📌 기록'}
        </button>
      </div>

      {/* 범위 선택 */}
      {hasData && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {(['7d', '30d', '90d', 'all'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                border: `1px solid ${range === r ? 'var(--accent)' : 'var(--border)'}`,
                background: range === r ? 'rgba(232,177,58,.15)' : 'transparent',
                color: range === r ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {r === 'all' ? '전체' : r}
            </button>
          ))}
        </div>
      )}

      {/* 차트 */}
      {hasData ? (
        <div style={{ height: 130 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b98a5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b98a5" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9.5, fill: 'var(--muted-2)' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cost"  stroke="#8b98a5" strokeWidth={1.5} fill="url(#gradCost)"  dot={false} strokeDasharray="4 2" />
              <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} fill="url(#gradValue)" dot={false}
                activeDot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{
          height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>
            {summary.pricedCards === 0
              ? '카드에 현재가를 입력한 뒤 📌 기록 버튼을 누르세요'
              : '📌 기록 버튼을 눌러 첫 데이터를 저장하세요'}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--muted-2)', opacity: 0.6 }}>
            기록이 쌓이면 시세 변화 차트가 표시됩니다
          </div>
        </div>
      )}
    </div>
  )
}
