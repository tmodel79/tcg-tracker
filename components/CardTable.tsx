'use client'

import { calcCard } from '@/lib/calc'
import { pctFmt, pctCompact } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import type { Card, SortMode } from '@/types/card'

interface CardTableProps {
  cards: Card[]
  filterGame: string
  searchText: string
  sortMode: SortMode
  onRowClick: (id: string) => void
  onAddClick: () => void
}

export function CardTable({
  cards,
  filterGame,
  searchText,
  sortMode,
  onRowClick,
  onAddClick,
}: CardTableProps) {
  const { t } = useI18n()

  // 필터 → 검색 → 정렬
  let list = cards.slice()
  if (filterGame !== '전체') list = list.filter((c) => c.game === filterGame)
  if (searchText) {
    list = list.filter((c) =>
      (c.name || '').toLowerCase().includes(searchText.toLowerCase())
    )
  }
  list.sort((a, b) => {
    const ka = calcCard(a)
    const kb = calcCard(b)
    switch (sortMode) {
      case 'pct':    return kb.pct - ka.pct
      case 'pctAsc': return ka.pct - kb.pct
      case 'pnl':    return kb.pnl - ka.pnl
      case 'cost':   return kb.totalCost - ka.totalCost
      case 'date':   return (b.buy_date || '').localeCompare(a.buy_date || '')
      case 'name':   return (a.name || '').localeCompare(b.name || '', 'ko')
      default:       return 0
    }
  })

  // 빈 상태
  if (cards.length === 0) {
    return (
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '56px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.7 }}>🃏</div>
          <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>{t('table_empty_title')}</h3>
          <p style={{ color: 'var(--muted)', margin: '0 0 18px', fontSize: 13.5 }}>
            {t('table_empty_desc')}
          </p>
          <button
            onClick={onAddClick}
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              border: '1px solid var(--accent)',
              borderRadius: 9,
              padding: '9px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('table_empty_btn')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <Th left>{t('col_card')}</Th>
            <Th className="hide-m">{t('col_date')}</Th>
            <Th className="hide-s">{t('col_cost')}</Th>
            <Th>{t('col_price')}</Th>
            <Th className="hide-s">{t('col_pnl')}</Th>
            <Th>{t('col_pct')}</Th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <CardRow key={c.id} card={c} onClick={() => onRowClick(c.id)} />
          ))}
        </tbody>
      </table>
      <style>{`
        /* 기본: 압축 숨김, 전체 표시 */
        .num-compact, .pct-compact { display: none; }
        .num-full, .pct-full { display: inline; }

        .hide-m { }
        @media (max-width: 760px) { .hide-m { display: none; } }
        .hide-s { }

        @media (max-width: 520px) {
          .hide-s { display: none; }
          .mobile-sub { display: block !important; }
          .card-td { padding: 10px 10px !important; }
          .data-td { padding: 10px 10px !important; font-size: 13px; }

          /* 압축 숫자 사용 */
          .num-full, .pct-full { display: none !important; }
          .num-compact, .pct-compact { display: inline !important; }
        }

        tbody tr:last-child td { border-bottom: none !important; }
      `}</style>
    </div>
  )
}

function Th({
  children,
  left,
  className,
}: {
  children: React.ReactNode
  left?: boolean
  className?: string
}) {
  return (
    <th
      className={className}
      style={{
        background: 'var(--panel-2)',
        color: 'var(--muted)',
        fontSize: 11.5,
        fontWeight: 700,
        textAlign: left ? 'left' : 'right',
        padding: '11px 14px',
        borderBottom: '1px solid var(--border)',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  )
}

function CardRow({ card, onClick }: { card: Card; onClick: () => void }) {
  const { t, fmt, fmtC } = useI18n()
  const k = calcCard(card)
  const dir = !k.hasNow ? 'flat' : k.pnl > 0 ? 'up' : k.pnl < 0 ? 'down' : 'flat'
  const rowCls = !k.hasNow ? 'r-flat' : k.pnl > 0 ? 'r-up' : k.pnl < 0 ? 'r-down' : 'r-flat'

  const tdStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderBottom: '1px solid var(--border-soft)',
    textAlign: 'right',
    whiteSpace: 'nowrap',
  }

  return (
    <tr
      className={rowCls}
      onClick={onClick}
      style={{ cursor: 'pointer', transition: 'background 0.12s' }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = 'var(--panel-2)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      {/* 카드 썸네일 + 이름 + 배지 */}
      <td className="cardname-cell card-td" style={{ ...tdStyle, textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* 썸네일 */}
          <div
            style={{
              flexShrink: 0,
              width: 38, height: 53,
              borderRadius: 5,
              overflow: 'hidden',
              background: 'var(--panel-2)',
              border: '1px solid var(--border-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <span style={{ fontSize: 18, opacity: 0.4 }}>🃏</span>
            )}
          </div>

          {/* 이름 + 배지 */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</div>
            <div style={{ color: 'var(--muted-2)', fontSize: 11.5, marginTop: 2 }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'var(--panel-3)',
                  color: 'var(--muted)',
                }}
              >
                {card.game || '기타'}
              </span>
              {card.grade && (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'rgba(232,177,58,.14)',
                    color: 'var(--accent)',
                    marginLeft: 4,
                  }}
                >
                  {card.grade}
                </span>
              )}
              {card.card_number && (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'rgba(77,157,255,.12)',
                    color: 'var(--loss)',
                    marginLeft: 4,
                  }}
                >
                  {card.card_number}
                </span>
              )}
            </div>
            {/* 모바일 전용: 투자금 · 손익 인라인 압축 표시 */}
            <div className="mobile-sub" style={{ display: 'none', marginTop: 5, fontSize: 11.5, color: 'var(--muted)' }}>
              <span>{t('mobile_invest')} {fmtC(k.totalCost)}</span>
              {k.hasNow && (
                <span className={`num ${dir}`} style={{ marginLeft: 8, fontWeight: 700 }}>
                  {k.pnl >= 0 ? '+' : ''}{fmtC(Math.abs(k.pnl))}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* 구매일 */}
      <td
        className="hide-m num"
        style={{ ...tdStyle, color: 'var(--muted)' }}
      >
        {card.buy_date || '—'}
      </td>

      {/* 총원가 */}
      <td className="num hide-s data-td" style={tdStyle}>
        <span className="num-full">{fmt(k.totalCost)}</span>
        <span className="num-compact">{fmtC(k.totalCost)}</span>
      </td>

      {/* 현재가 + 직전대비 */}
      <td className="data-td" style={tdStyle}>
        {k.hasNow ? (
          <>
            <span className="num num-full">{fmt(k.now!)}</span>
            <span className="num num-compact">{fmtC(k.now!)}</span>
            {k.delta != null && k.delta !== 0 && (
              <div
                className={`num ${k.delta > 0 ? 'up' : 'down'}`}
                style={{ fontSize: 11, marginTop: 2 }}
              >
                <span style={{ fontSize: 10 }}>{k.delta > 0 ? '▲' : '▼'}</span>{' '}
                <span className="num-full">{fmt(Math.abs(k.delta))}</span>
                <span className="num-compact">{fmtC(Math.abs(k.delta))}</span>
              </div>
            )}
          </>
        ) : (
          <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>{t('price_input')}</span>
        )}
      </td>

      {/* 손익 */}
      <td className="hide-s data-td" style={{ ...tdStyle, fontWeight: 700 }}>
        {k.hasNow ? (
          <span className={`num ${dir}`}>
            {k.pnl >= 0 ? '+' : ''}
            <span className="num-full">{fmt(Math.abs(k.pnl))}</span>
            <span className="num-compact">{fmtC(Math.abs(k.pnl))}</span>
          </span>
        ) : (
          <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>—</span>
        )}
      </td>

      {/* 수익률 */}
      <td className="data-td" style={{ ...tdStyle, fontWeight: 800 }}>
        {k.hasNow ? (
          <span className={`num ${dir}`}>
            <span className="pct-full">{pctFmt(k.pct)}</span>
            <span className="pct-compact">{pctCompact(k.pct)}</span>
          </span>
        ) : (
          <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>—</span>
        )}
      </td>
    </tr>
  )
}
