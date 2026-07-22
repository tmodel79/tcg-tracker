'use client'

import { calcCard } from '@/lib/calc'
import { pctCompact } from '@/lib/utils'
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
          padding: '56px 24px',
          textAlign: 'center',
        }}
      >
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
    )
  }

  return (
    <>
      <div className="card-grid">
        {list.map((c) => (
          <CardItem key={c.id} card={c} onClick={() => onRowClick(c.id)} />
        ))}
      </div>
      <style>{`
        .card-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 7px;
        }
        @media (min-width: 560px) {
          .card-grid { grid-template-columns: repeat(4, 1fr); gap: 7px; }
        }
        @media (min-width: 760px) {
          .card-grid { grid-template-columns: repeat(5, 1fr); gap: 8px; }
        }
        @media (min-width: 1000px) {
          .card-grid { grid-template-columns: repeat(6, 1fr); gap: 8px; }
        }
        @media (min-width: 1300px) {
          .card-grid { grid-template-columns: repeat(7, 1fr); gap: 8px; }
        }

        .card-item {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          transition: transform 0.13s, box-shadow 0.13s, border-color 0.13s;
        }
        .card-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.28);
          border-color: var(--accent);
        }
        [data-theme="gray"] .card-item:hover {
          box-shadow: 0 5px 14px rgba(0,0,0,0.12);
        }
      `}</style>
    </>
  )
}

function CardItem({ card, onClick }: { card: Card; onClick: () => void }) {
  const { t, fmtC, locale } = useI18n()
  const k = calcCard(card)

  const isGain = k.hasNow && k.pnl > 0
  const isLoss = k.hasNow && k.pnl < 0

  const pctColor = isGain ? 'var(--gain)' : isLoss ? 'var(--loss)' : 'var(--flat)'
  const badgeBg  = isGain ? 'rgba(255,80,101,0.22)' : isLoss ? 'rgba(77,157,255,0.22)' : 'rgba(139,152,165,0.18)'

  return (
    <div className="card-item" onClick={onClick}>
      {/* ── 이미지 영역 ── */}
      <div style={{ position: 'relative', paddingTop: '72%', background: 'var(--panel-2)', overflow: 'hidden' }}>
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.name}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 22, opacity: 0.2 }}>🃏</span>
            <span style={{ fontSize: 9, color: 'var(--muted-2)', opacity: 0.5 }}>No Image</span>
          </div>
        )}

        {/* 수익률 배지 — 우상단 */}
        <div style={{
          position: 'absolute', top: 5, right: 5,
          background: k.hasNow ? badgeBg : 'rgba(139,152,165,0.15)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: `1px solid ${k.hasNow ? pctColor : 'var(--border)'}`,
          borderRadius: 6,
          padding: '2px 5px',
          fontSize: 10,
          fontWeight: 800,
          color: k.hasNow ? pctColor : 'var(--muted)',
          lineHeight: 1.3,
        }}>
          {k.hasNow ? pctCompact(k.pct, locale) : '—'}
        </div>
      </div>

      {/* ── 정보 영역 ── */}
      <div style={{ padding: '6px 7px 7px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* 카드명 */}
        <div style={{
          fontWeight: 700, fontSize: 11.5, lineHeight: 1.3,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const,
          letterSpacing: '-0.01em', color: 'var(--text)',
        }}>
          {card.name}
        </div>

        {/* 번호 + 게임 한 줄 */}
        <div style={{ display: 'flex', gap: 3, flexWrap: 'nowrap', overflow: 'hidden' }}>
          {card.card_number && (
            <span style={{
              padding: '1px 5px', borderRadius: 5, fontSize: 9.5, fontWeight: 700,
              background: 'rgba(77,157,255,.13)', color: 'var(--loss)', whiteSpace: 'nowrap',
            }}>
              {card.card_number}
            </span>
          )}
          <span style={{
            padding: '1px 5px', borderRadius: 5, fontSize: 9.5, fontWeight: 700,
            background: 'var(--panel-3)', color: 'var(--muted)', whiteSpace: 'nowrap',
          }}>
            {card.game || t('game_other')}
          </span>
          {card.grade && (
            <span style={{
              padding: '1px 5px', borderRadius: 5, fontSize: 9.5, fontWeight: 700,
              background: 'rgba(232,177,58,.15)', color: 'var(--accent)', whiteSpace: 'nowrap',
            }}>
              {card.grade}
            </span>
          )}
        </div>

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid var(--border-soft)', margin: '1px 0' }} />

        {/* 원가 / 현재가 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <div>
            <div style={{ fontSize: 8.5, color: 'var(--muted-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 1 }}>
              {t('col_cost')}
            </div>
            <div className="num" style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
              {fmtC(k.totalCost)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {k.hasNow ? (
              <>
                <div style={{ fontSize: 8.5, color: 'var(--muted-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 1 }}>
                  {t('col_price')}
                </div>
                <div className="num" style={{ fontSize: 12, fontWeight: 800, color: pctColor }}>
                  {fmtC(k.now!)}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 9.5, color: 'var(--muted-2)', fontStyle: 'italic' }}>
                {t('price_input')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
