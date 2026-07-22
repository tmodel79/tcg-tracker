'use client'

// ========================================
// CollectionDashboard
// 컬렉션 탭 상단 대시보드 — 포트폴리오 요약 + 탑 퍼포머 + 빠른 액션
// ========================================

import { calcCard } from '@/lib/calc'
import { useI18n } from '@/lib/i18n'
import { pctCompact } from '@/lib/utils'
import type { Card, PortfolioSummary } from '@/types/card'

interface CollectionDashboardProps {
  cards: Card[]
  summary: PortfolioSummary
  onAddClick: () => void
  onSearchTab: () => void
}

function MiniStatCard({
  label, value, sub, accent,
}: { label: string; value: React.ReactNode; sub?: string; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? 'rgba(232,177,58,0.07)' : 'var(--panel-2)',
      border: `1px solid ${accent ? 'rgba(232,177,58,0.25)' : 'var(--border)'}`,
      borderRadius: 12,
      padding: '12px 14px',
      minWidth: 0,
      flex: 1,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
        {label}
      </div>
      <div className="num" style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1, color: accent ? 'var(--accent)' : 'var(--text)' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 10.5, color: 'var(--muted-2)', marginTop: 3 }}>{sub}</div>
      )}
    </div>
  )
}

export function CollectionDashboard({
  cards, summary, onAddClick, onSearchTab,
}: CollectionDashboardProps) {
  const { fmtC, locale } = useI18n()
  const { invest, value, pnl, pct, totalCards, pricedCards } = summary

  const isGain = pnl > 0
  const isLoss = pnl < 0
  const pnlColor = isGain ? 'var(--gain)' : isLoss ? 'var(--loss)' : 'var(--flat)'

  // 탑 퍼포머 / 워스트 퍼포머
  const pricedList = cards
    .map(c => ({ card: c, calc: calcCard(c) }))
    .filter(x => x.calc.hasNow && x.calc.totalCost > 0)
    .sort((a, b) => b.calc.pct - a.calc.pct)

  const topCard = pricedList[0]
  const worstCard = pricedList[pricedList.length - 1]

  // 빈 상태 — 카드 없을 때
  if (totalCards === 0) {
    return (
      <div style={{ marginBottom: 28 }}>
        <style>{`
          .cdb-hero {
            background: linear-gradient(135deg, var(--panel-2) 0%, var(--panel-3) 100%);
            border: 1px solid var(--border);
            border-radius: 18px;
            padding: 48px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .cdb-hero::before {
            content: '';
            position: absolute;
            top: -60px; right: -60px;
            width: 220px; height: 220px;
            background: radial-gradient(circle, rgba(232,177,58,0.12) 0%, transparent 70%);
            pointer-events: none;
          }
          .cdb-hero::after {
            content: '';
            position: absolute;
            bottom: -40px; left: -40px;
            width: 160px; height: 160px;
            background: radial-gradient(circle, rgba(77,157,255,0.08) 0%, transparent 70%);
            pointer-events: none;
          }
          .cdb-feature-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-top: 32px;
          }
          @media (max-width: 720px) {
            .cdb-hero { padding: 36px 20px; }
            .cdb-feature-grid { grid-template-columns: 1fr; }
          }
          .cdb-feature {
            background: var(--panel);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px 14px;
            text-align: left;
          }
          .cdb-cta-row {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 28px;
          }
        `}</style>
        <div className="cdb-hero">
          <div style={{ fontSize: 44, marginBottom: 12 }}>🃏</div>
          <h2 style={{
            margin: '0 0 8px', fontSize: 26, fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.2,
          }}>
            Your TCG Portfolio, <span style={{ color: 'var(--accent)' }}>Tracked.</span>
          </h2>
          <p style={{
            color: 'var(--muted)', fontSize: 14, margin: '0 auto', maxWidth: 440,
            lineHeight: 1.6,
          }}>
            실시간 시세 조회, 포트폴리오 손익 추적, 시세 히스토리 차트까지 — 프로 트레이더처럼 관리하세요.
          </p>

          <div className="cdb-cta-row">
            <button
              onClick={onAddClick}
              style={{
                padding: '11px 24px', borderRadius: 10, fontSize: 14, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
                background: 'var(--accent)', color: 'var(--accent-ink)',
                border: '1px solid var(--accent)',
                boxShadow: '0 4px 20px rgba(232,177,58,0.35)',
              }}
            >
              + 첫 카드 추가하기
            </button>
            <button
              onClick={onSearchTab}
              style={{
                padding: '11px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                background: 'transparent', color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              🔍 시세 검색해보기
            </button>
          </div>

          <div className="cdb-feature-grid">
            {[
              { icon: '📊', title: '실시간 시세 조회', desc: 'eBay · TCGPlayer · Cardmarket · 130point · Yahoo JP · Mercari 동시 검색' },
              { icon: '📈', title: '포트폴리오 차트', desc: '내 컬렉션의 가치 변화를 날짜별로 기록하고 시각화합니다' },
              { icon: '🌍', title: '글로벌 멀티 통화', desc: '한국·미국·일본·유럽 — 원하는 통화로 자동 환산' },
            ].map(f => (
              <div key={f.title} className="cdb-feature">
                <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4, color: 'var(--text)' }}>{f.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.55 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 카드 있을 때 — 대시보드 뷰
  return (
    <div style={{ marginBottom: 20 }}>
      <style>{`
        .cdb-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }
        @media (max-width: 900px) {
          .cdb-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 500px) {
          .cdb-stats { grid-template-columns: repeat(2, 1fr); gap: 7px; }
        }
        .cdb-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 700px) {
          .cdb-bottom { grid-template-columns: 1fr; }
        }
        .cdb-performer {
          background: var(--panel-2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          overflow: hidden;
        }
        .cdb-performer-img {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
          background: var(--panel-3);
          flex-shrink: 0;
        }
        .cdb-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
      `}</style>

      {/* 헤더 액션 바 */}
      <div className="cdb-action-bar">
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em' }}>
            내 컬렉션
          </h2>
          <div style={{ fontSize: 11.5, color: 'var(--muted-2)', marginTop: 2 }}>
            총 {totalCards}장 · 평가된 카드 {pricedCards}장
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          <button
            onClick={onSearchTab}
            style={{
              padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              background: 'var(--panel-2)', color: 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            🔍 시세 검색
          </button>
          <button
            onClick={onAddClick}
            style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
              background: 'var(--accent)', color: 'var(--accent-ink)',
              border: '1px solid var(--accent)',
            }}
          >
            + 카드 추가
          </button>
        </div>
      </div>

      {/* 통계 카드 4개 */}
      <div className="cdb-stats">
        <MiniStatCard
          label="총 투자"
          value={fmtC(invest)}
          sub={`${totalCards}장`}
        />
        <MiniStatCard
          label="현재 가치"
          value={fmtC(value)}
          sub={pricedCards > 0 ? `${pricedCards}장 평가됨` : '시세 미입력'}
          accent
        />
        <MiniStatCard
          label="총 손익"
          value={
            <span style={{ color: pnlColor }}>
              {pnl >= 0 ? '+' : '−'}{fmtC(Math.abs(pnl))}
            </span>
          }
          sub={pricedCards > 0 ? '평가 기준' : undefined}
        />
        <MiniStatCard
          label="수익률"
          value={
            <span style={{ color: pnlColor, fontSize: 22 }}>
              {pctCompact(pct, locale)}
            </span>
          }
          sub={pricedCards > 0 ? '전체 평균' : undefined}
        />
      </div>

      {/* 탑 퍼포머 / 워스트 퍼포머 */}
      {pricedList.length >= 2 && topCard && worstCard && (
        <div className="cdb-bottom">
          <PerformerCard
            label="🏆 Best Performer"
            card={topCard.card}
            calc={topCard.calc}
            isGain
            fmtC={fmtC}
            locale={locale}
          />
          <PerformerCard
            label="📉 Needs Attention"
            card={worstCard.card}
            calc={worstCard.calc}
            isGain={false}
            fmtC={fmtC}
            locale={locale}
          />
        </div>
      )}
      {pricedList.length === 1 && topCard && (
        <div className="cdb-bottom">
          <PerformerCard
            label="📌 평가된 카드"
            card={topCard.card}
            calc={topCard.calc}
            isGain={topCard.calc.pnl >= 0}
            fmtC={fmtC}
            locale={locale}
          />
          <div style={{
            background: 'var(--panel-2)',
            border: '1px dashed var(--border)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            color: 'var(--muted-2)',
            fontSize: 12,
          }}>
            시세가 입력된 카드가 늘어나면<br />성과 비교가 표시됩니다
          </div>
        </div>
      )}
      {pricedList.length === 0 && (
        <div style={{
          background: 'var(--panel-2)',
          border: '1px dashed var(--border)',
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: 'var(--muted-2)',
          fontSize: 12.5,
        }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <span>카드 편집에서 <strong style={{ color: 'var(--text)' }}>현재가</strong>를 입력하거나 <strong style={{ color: 'var(--text)' }}>🔍 시세 검색</strong>으로 현재 시세를 가져오면 손익이 계산됩니다.</span>
        </div>
      )}
    </div>
  )
}

function PerformerCard({
  label, card, calc, isGain, fmtC, locale,
}: {
  label: string
  card: Card
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calc: any
  isGain: boolean
  fmtC: (v: number) => string
  locale: string
}) {
  const color = isGain ? 'var(--gain)' : 'var(--loss)'
  return (
    <div className="cdb-performer">
      {card.image_url ? (
        <img
          src={card.image_url}
          alt={card.name}
          className="cdb-performer-img"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div className="cdb-performer-img" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, opacity: 0.3,
        }}>🃏</div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
          {label}
        </div>
        <div style={{
          fontSize: 12.5, fontWeight: 800, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 4,
        }}>
          {card.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="num" style={{ fontSize: 14, fontWeight: 900, color }}>
            {calc.pnl >= 0 ? '+' : '−'}{fmtC(Math.abs(calc.pnl))}
          </span>
          <span className="num" style={{
            fontSize: 11, fontWeight: 800, color,
            background: isGain ? 'rgba(255,80,101,0.15)' : 'rgba(77,157,255,0.15)',
            padding: '1px 6px', borderRadius: 5,
          }}>
            {pctCompact(calc.pct, locale)}
          </span>
        </div>
      </div>
    </div>
  )
}
