'use client'

import { wonPlain, pctFmt } from '@/lib/utils'
import type { PortfolioSummary } from '@/types/card'

interface SummaryBarProps {
  summary: PortfolioSummary
}

export function SummaryBar({ summary }: SummaryBarProps) {
  const { invest, value, pnl, pct, totalCards, pricedCards } = summary
  const dir = pnl > 0 ? 'up' : pnl < 0 ? 'down' : 'flat'
  const bgClass = pnl > 0 ? 'bg-up' : pnl < 0 ? 'bg-down' : ''

  return (
    <>
      {/* 히어로 숫자 4개 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 8,
        }}
      >
        {/* 총 투자금 */}
        <StatCard>
          <div className="lbl">총 투자금 (들어간 돈)</div>
          <div className="val num">{wonPlain(invest)}</div>
          <div className="sub">보유 {totalCards}장</div>
        </StatCard>

        {/* 총 평가액 */}
        <StatCard>
          <div className="lbl">총 평가액 (현재 가치)</div>
          <div className="val num">{wonPlain(value)}</div>
          <div className="sub">
            시세 입력 {pricedCards} / {totalCards}장
          </div>
        </StatCard>

        {/* 총 손익 */}
        <StatCard className={bgClass}>
          <span className="streak" />
          <div className="lbl">총 손익</div>
          <div className={`val num ${dir}`}>
            {pnl >= 0 ? '+' : ''}
            {wonPlain(pnl)}
          </div>
          <div className="sub">평가액 − 투자금</div>
        </StatCard>

        {/* 전체 수익률 */}
        <StatCard className={bgClass}>
          <span className="streak" />
          <div className="lbl">전체 수익률</div>
          <div className={`val num ${dir}`}>{pctFmt(pct)}</div>
          <div className="sub">
            {dir === 'up' ? '이익 구간' : dir === 'down' ? '손실 구간' : '손익 없음'}
          </div>
        </StatCard>
      </div>

      {/* 색상 범례 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          color: 'var(--muted-2)',
          fontSize: 12,
          margin: '14px 2px 16px',
        }}
      >
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 9,
              height: 9,
              borderRadius: 2,
              background: 'var(--gain)',
              marginRight: 5,
              verticalAlign: 'middle',
            }}
          />
          <b>상승 · 이익</b>
        </span>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 9,
              height: 9,
              borderRadius: 2,
              background: 'var(--loss)',
              marginRight: 5,
              verticalAlign: 'middle',
            }}
          />
          <b>하락 · 손실</b>
        </span>
        <span>· 한국 주식창과 같은 색 (오르면 빨강 / 내리면 파랑)</span>
      </div>
    </>
  )
}

function StatCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(180deg, var(--panel) 0%, var(--panel-2) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px 18px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .lbl { color: var(--muted); font-size: 12px; font-weight: 600; margin-bottom: 8px; letter-spacing: 0.01em; }
        .val { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
        .sub { font-size: 12px; color: var(--muted-2); margin-top: 4px; }
        .streak { position: absolute; right: 0; top: 0; bottom: 0; width: 4px; }
      `}</style>
      {children}
    </div>
  )
}
