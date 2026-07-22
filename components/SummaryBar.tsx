'use client'

import { wonCompact, pctCompact } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import type { PortfolioSummary } from '@/types/card'

interface SummaryBarProps {
  summary: PortfolioSummary
}

export function SummaryBar({ summary }: SummaryBarProps) {
  const { t } = useI18n()
  const { invest, value, pnl, pct, totalCards, pricedCards } = summary
  const dir = pnl > 0 ? 'up' : pnl < 0 ? 'down' : 'flat'
  const bgClass = pnl > 0 ? 'bg-up' : pnl < 0 ? 'bg-down' : ''

  return (
    <>
      {/* 히어로 숫자 4개 */}
      <div
        className="summary-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 8,
        }}
      >
        {/* 총 투자금 */}
        <StatCard>
          <div className="lbl">{t('summary_invest')}</div>
          <div className="val num">{wonCompact(invest)}</div>
          <div className="sub">{t('summary_cards', { n: totalCards })}</div>
        </StatCard>

        {/* 총 평가액 */}
        <StatCard>
          <div className="lbl">{t('summary_value')}</div>
          <div className="val num">{wonCompact(value)}</div>
          <div className="sub">
            {t('summary_priced', { n: pricedCards, total: totalCards })}
          </div>
        </StatCard>

        {/* 총 손익 */}
        <StatCard className={bgClass}>
          <span className="streak" />
          <div className="lbl">{t('summary_pnl')}</div>
          <div className={`val num ${dir}`}>
            {pnl >= 0 ? '+' : ''}
            {wonCompact(pnl)}
          </div>
          <div className="sub">{t('summary_pnl_desc')}</div>
        </StatCard>

        {/* 전체 수익률 */}
        <StatCard className={bgClass}>
          <span className="streak" />
          <div className="lbl">{t('summary_pct')}</div>
          <div className={`val num ${dir}`}>{pctCompact(pct)}</div>
          <div className="sub">
            {dir === 'up'
              ? t('summary_profit')
              : dir === 'down'
              ? t('summary_loss')
              : t('summary_flat')}
          </div>
        </StatCard>
      </div>

      {/* 색상 범례 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px 14px',
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
          <b>{t('legend_up')}</b>
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
          <b>{t('legend_down')}</b>
        </span>
        <span style={{ color: 'var(--muted-2)' }}>{t('legend_note')}</span>
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
      className={`stat-card ${className}`}
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
        @media (max-width: 640px) {
          .summary-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .val { font-size: 19px !important; }
          .lbl { font-size: 11px !important; margin-bottom: 5px !important; }
          .sub { font-size: 11px !important; }
          .stat-card { padding: 12px 14px !important; }
        }
      `}</style>
      {children}
    </div>
  )
}
