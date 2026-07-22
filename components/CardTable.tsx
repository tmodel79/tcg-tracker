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
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) {
          .card-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
        }
        @media (min-width: 960px) {
          .card-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
        }

        /* 압축/전체 숫자 토글 */
        .cg-num-compact { display: none; }
        .cg-num-full    { display: inline; }
        @media (max-width: 400px) {
          .cg-num-full    { display: none; }
          .cg-num-compact { display: inline; }
        }

        .card-item {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
        }
        .card-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.28);
          border-color: var(--accent);
        }
        [data-theme="gray"] .card-item:hover {
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }
      `}</style>
    </>
  )
}

function CardItem({ card, onClick }: { card: Card; onClick: () => void }) {
  const { t, fmt, fmtC, locale } = useI18n()
  const k = calcCard(card)

  const isGain = k.hasNow && k.pnl > 0
  const isLoss = k.hasNow && k.pnl < 0
  const dir = !k.hasNow ? 'flat' : isGain ? 'up' : isLoss ? 'down' : 'flat'

  // 수익/손실 색상
  const pctColor = isGain ? 'var(--gain)' : isLoss ? 'var(--loss)' : 'var(--flat)'
  const pnlBg   = isGain ? 'var(--gain-soft)' : isLoss ? 'var(--loss-soft)' : 'var(--panel-2)'

  // 배지 오버레이 배경 (블러 효과용)
  const badgeBg = isGain
    ? 'rgba(255, 80, 101, 0.2)'
    : isLoss
    ? 'rgba(77, 157, 255, 0.2)'
    : 'rgba(139, 152, 165, 0.2)'

  return (
    <div className="card-item" onClick={onClick}>
      {/* ── 이미지 영역 ── */}
      <div
        style={{
          position: 'relative',
          paddingTop: '138%', /* 세로형 카드 비율 (약 5:7) */
          background: 'var(--panel-2)',
          overflow: 'hidden',
        }}
      >
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.name}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.2s',
            }}
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement
              img.style.display = 'none'
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 36, opacity: 0.25 }}>🃏</span>
            <span style={{ fontSize: 11, color: 'var(--muted-2)', opacity: 0.6 }}>No Image</span>
          </div>
        )}

        {/* 수익률 배지 — 우상단 오버레이 */}
        {k.hasNow && (
          <div
            style={{
              position: 'absolute',
              top: 8, right: 8,
              background: badgeBg,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: `1px solid ${pctColor}`,
              borderRadius: 8,
              padding: '3px 8px',
              fontSize: 12,
              fontWeight: 800,
              color: pctColor,
              letterSpacing: '-0.01em',
            }}
          >
            {pctCompact(k.pct, locale)}
          </div>
        )}

        {/* 시세 미입력 배지 */}
        {!k.hasNow && (
          <div
            style={{
              position: 'absolute',
              top: 8, right: 8,
              background: 'rgba(139,152,165,0.18)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--muted)',
            }}
          >
            —
          </div>
        )}

        {/* 구매일 — 좌하단 오버레이 */}
        {card.buy_date && (
          <div
            style={{
              position: 'absolute',
              bottom: 8, left: 8,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              borderRadius: 6,
              padding: '2px 7px',
              fontSize: 10.5,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: '0.01em',
            }}
          >
            {card.buy_date}
          </div>
        )}
      </div>

      {/* ── 정보 영역 ── */}
      <div
        style={{
          padding: '10px 12px 12px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
        }}
      >
        {/* 카드명 */}
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1.35,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            minHeight: '2.7em',
            letterSpacing: '-0.01em',
          }}
        >
          {card.name}
        </div>

        {/* 게임·등급·번호 배지 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <span
            style={{
              padding: '2px 7px',
              borderRadius: 6,
              fontSize: 10.5,
              fontWeight: 700,
              background: 'var(--panel-3)',
              color: 'var(--muted)',
            }}
          >
            {card.game || t('game_other')}
          </span>
          {card.grade && (
            <span
              style={{
                padding: '2px 7px',
                borderRadius: 6,
                fontSize: 10.5,
                fontWeight: 700,
                background: 'rgba(232,177,58,.15)',
                color: 'var(--accent)',
              }}
            >
              {card.grade}
            </span>
          )}
          {card.card_number && (
            <span
              style={{
                padding: '2px 7px',
                borderRadius: 6,
                fontSize: 10.5,
                fontWeight: 700,
                background: 'rgba(77,157,255,.13)',
                color: 'var(--loss)',
              }}
            >
              {card.card_number}
            </span>
          )}
        </div>

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid var(--border-soft)' }} />

        {/* 원가 / 현재가 행 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 4 }}>
          {/* 원가 */}
          <div>
            <div
              style={{
                fontSize: 9.5,
                color: 'var(--muted-2)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 2,
              }}
            >
              {t('col_cost')}
            </div>
            <div
              className="num"
              style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)' }}
            >
              <span className="cg-num-full">{fmt(k.totalCost)}</span>
              <span className="cg-num-compact">{fmtC(k.totalCost)}</span>
            </div>
          </div>

          {/* 현재가 */}
          <div style={{ textAlign: 'right' }}>
            {k.hasNow ? (
              <>
                <div
                  style={{
                    fontSize: 9.5,
                    color: 'var(--muted-2)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 2,
                  }}
                >
                  {t('col_price')}
                </div>
                <div
                  className="num"
                  style={{ fontSize: 14, fontWeight: 800, color: pctColor }}
                >
                  <span className="cg-num-full">{fmt(k.now!)}</span>
                  <span className="cg-num-compact">{fmtC(k.now!)}</span>
                </div>
              </>
            ) : (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--muted-2)',
                  fontStyle: 'italic',
                }}
              >
                {t('price_input')}
              </div>
            )}
          </div>
        </div>

        {/* 손익 행 (시세 있을 때만) */}
        {k.hasNow && (
          <div
            style={{
              background: pnlBg,
              borderRadius: 8,
              padding: '6px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                color: 'var(--muted)',
                fontWeight: 600,
                letterSpacing: '0.01em',
              }}
            >
              {t('col_pnl')}
            </span>
            <span
              className={`num ${dir}`}
              style={{ fontSize: 13, fontWeight: 800 }}
            >
              {k.pnl >= 0 ? '+' : '−'}
              <span className="cg-num-full">{fmt(Math.abs(k.pnl))}</span>
              <span className="cg-num-compact">{fmtC(Math.abs(k.pnl))}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
