'use client'

import { calcCard } from '@/lib/calc'
import { wonPlain, pctFmt } from '@/lib/utils'
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
          <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>아직 등록한 카드가 없어요</h3>
          <p style={{ color: 'var(--muted)', margin: '0 0 18px', fontSize: 13.5 }}>
            첫 카드를 추가하면 총원가·손익·수익률이 여기에 주식창처럼 나옵니다.
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
            + 첫 카드 추가하기
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
            <Th left>카드</Th>
            <Th className="hide-m">구매일</Th>
            <Th>총원가</Th>
            <Th>현재가</Th>
            <Th>손익</Th>
            <Th>수익률</Th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <CardRow key={c.id} card={c} onClick={() => onRowClick(c.id)} />
          ))}
        </tbody>
      </table>
      <style>{`
        .hide-m { }
        @media (max-width: 760px) { .hide-m { display: none; } }
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
      {/* 카드명 + 배지 */}
      <td className="cardname-cell" style={{ ...tdStyle, textAlign: 'left' }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{card.name}</div>
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
      <td className="num" style={tdStyle}>
        {wonPlain(k.totalCost)}
      </td>

      {/* 현재가 + 직전대비 */}
      <td style={tdStyle}>
        {k.hasNow ? (
          <>
            <span className="num">{wonPlain(k.now!)}</span>
            {k.delta != null && k.delta !== 0 && (
              <div
                className={`num ${k.delta > 0 ? 'up' : 'down'}`}
                style={{ fontSize: 11, marginTop: 2 }}
              >
                <span style={{ fontSize: 10 }}>{k.delta > 0 ? '▲' : '▼'}</span>{' '}
                {wonPlain(Math.abs(k.delta))}
              </div>
            )}
          </>
        ) : (
          <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>시세 입력</span>
        )}
      </td>

      {/* 손익 */}
      <td style={{ ...tdStyle, fontWeight: 700 }}>
        {k.hasNow ? (
          <span className={`num ${dir}`}>
            {k.pnl >= 0 ? '+' : ''}
            {wonPlain(k.pnl)}
          </span>
        ) : (
          <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>—</span>
        )}
      </td>

      {/* 수익률 */}
      <td style={{ ...tdStyle, fontWeight: 800 }}>
        {k.hasNow ? (
          <span className={`num ${dir}`}>{pctFmt(k.pct)}</span>
        ) : (
          <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>—</span>
        )}
      </td>
    </tr>
  )
}
