'use client'

// ========================================
// CollectionDashboard — 📊 대시보드 탭
// 포트폴리오 요약 + 가치 차트 + 탑 퍼포머 (요약 정보는 여기에만 표시)
// ========================================

import { calcCard } from '@/lib/calc'
import { useI18n } from '@/lib/i18n'
import { pctCompact } from '@/lib/utils'
import type { Card, PortfolioSummary } from '@/types/card'
import { GAMES, GAME_LABEL_KEYS } from '@/types/card'
import { PortfolioChart } from './PortfolioChart'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { IconDashboard, IconCards, IconSearch, IconTrendUp, IconTrendDown, IconGlobe } from './Icons'

const GAME_COLORS: Record<string, string> = {
  '원피스': '#e84040',
  '포켓몬': '#f5c518',
  '드래곤볼': '#ff7b00',
  '건담': '#4d9dff',
  '유희왕': '#9b59b6',
  '기타': '#8b98a5',
}

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
  const { fmtC, locale, t } = useI18n()
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
          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center', color: 'var(--accent)' }}>
            <IconCards size={40} strokeWidth={1.6} />
          </div>
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
            {t('hero_sub')}
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
              {t('table_empty_btn')}
            </button>
            <button
              onClick={onSearchTab}
              style={{
                padding: '11px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                background: 'transparent', color: 'var(--text)',
                border: '1px solid var(--border)',
                display: 'inline-flex', alignItems: 'center', gap: 7,
              }}
            >
              <IconSearch size={14} /> {t('try_price_search')}
            </button>
          </div>

          <div className="cdb-feature-grid">
            {[
              { Icon: IconSearch,  title: t('feat_price_title'),    desc: t('feat_price_desc') },
              { Icon: IconTrendUp, title: t('feat_chart_title'),    desc: t('feat_chart_desc') },
              { Icon: IconGlobe,   title: t('feat_currency_title'), desc: t('feat_currency_desc') },
            ].map(f => (
              <div key={f.title} className="cdb-feature">
                <div style={{ marginBottom: 10, color: 'var(--accent)' }}><f.Icon size={20} strokeWidth={1.8} /></div>
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
        .cdb-top {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
          align-items: stretch;
        }
        @media (max-width: 900px) {
          .cdb-top { grid-template-columns: 1fr; }
        }
        .cdb-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        @media (max-width: 500px) {
          .cdb-stats { gap: 7px; }
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
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--accent)', display: 'inline-flex' }}><IconDashboard size={19} strokeWidth={2.4} /></span>
            {t('tab_dashboard')}
          </h2>
          <div style={{ fontSize: 11.5, color: 'var(--muted-2)', marginTop: 2 }}>
            {t('dash_sub', { total: totalCards, priced: pricedCards })}
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
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <IconSearch size={13} /> {t('tab_search')}
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
            {t('btn_add_card')}
          </button>
        </div>
      </div>

      {/* 상단 2분할 — 좌: 통계 2×2 / 우: 총 투자 구성 도넛 차트 */}
      <div className="cdb-top">
      <div className="cdb-stats">
        <MiniStatCard
          label={t('stat_invest')}
          value={fmtC(invest)}
          sub={t('n_cards_short', { n: totalCards })}
        />
        <MiniStatCard
          label={t('stat_value')}
          value={fmtC(value)}
          sub={pricedCards > 0 ? t('n_priced_short', { n: pricedCards }) : t('no_price_yet')}
          accent
        />
        <MiniStatCard
          label={t('summary_pnl')}
          value={
            <span style={{ color: pnlColor }}>
              {pnl >= 0 ? '+' : '−'}{fmtC(Math.abs(pnl))}
            </span>
          }
          sub={pricedCards > 0 ? t('based_on_priced') : undefined}
        />
        <MiniStatCard
          label={t('col_pct')}
          value={
            <span style={{ color: pnlColor, fontSize: 22 }}>
              {pctCompact(pct, locale)}
            </span>
          }
          sub={pricedCards > 0 ? t('overall_avg') : undefined}
        />
      </div>

      {/* 총 투자 구성 차트 */}
      <InvestDonut cards={cards} invest={invest} fmtC={fmtC} title={t('invest_chart_title')} />
      </div>

      {/* 포트폴리오 가치 차트 (사이드바에서 이동) */}
      <PortfolioChart cards={cards} />

      {/* 탑 퍼포머 / 워스트 퍼포머 */}
      {pricedList.length >= 2 && topCard && worstCard && (
        <div className="cdb-bottom">
          <PerformerCard
            label={t('best_performer')}
            card={topCard.card}
            calc={topCard.calc}
            isGain
            fmtC={fmtC}
            locale={locale}
          />
          <PerformerCard
            label={t('needs_attention')}
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
            label={t('priced_card_label')}
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
            {t('performer_hint_1')}<br />{t('performer_hint_2')}
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
          <span>{t('pnl_hint_1')}<strong style={{ color: 'var(--text)' }}>{t('pnl_hint_price')}</strong>{t('pnl_hint_2')}<strong style={{ color: 'var(--text)' }}>{t('pnl_hint_search')}</strong>{t('pnl_hint_3')}</span>
        </div>
      )}
    </div>
  )
}

// ── 총 투자 구성 도넛 차트 (게임별 투자 금액 비중) ──
function InvestDonut({
  cards, invest, fmtC, title,
}: {
  cards: Card[]
  invest: number
  fmtC: (v: number) => string
  title: string
}) {
  const { t } = useI18n()
  const data = GAMES
    .map(g => ({
      name: g,
      label: t(GAME_LABEL_KEYS[g] ?? 'game_other'),
      value: cards.filter(c => c.game === g).reduce((s, c) => s + calcCard(c).totalCost, 0),
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)

  return (
    <div style={{
      background: 'var(--panel-2)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minHeight: 150 }}>
        {/* 도넛 */}
        <div style={{ width: '52%', height: 156, position: 'relative', minWidth: 0, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius="62%"
                outerRadius="92%"
                paddingAngle={data.length > 1 ? 2 : 0}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map(d => (
                  <Cell key={d.name} fill={GAME_COLORS[d.name] || '#8b98a5'} />
                ))}
              </Pie>
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((v: any) => fmtC(Number(v))) as any}
                contentStyle={{
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* 중앙 총 투자액 */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <span className="num" style={{ fontSize: 15, fontWeight: 800 }}>{fmtC(invest)}</span>
          </div>
        </div>
        {/* 범례 */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map(d => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: GAME_COLORS[d.name] || '#8b98a5',
              }} />
              <span style={{ fontSize: 11.5, color: 'var(--muted)', flexShrink: 0 }}>{d.label}</span>
              <span className="num" style={{
                fontSize: 11.5, fontWeight: 700, marginLeft: 'auto',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {fmtC(d.value)}
              </span>
              <span className="num" style={{ fontSize: 10.5, color: 'var(--muted-2)', flexShrink: 0, width: 34, textAlign: 'right' }}>
                {invest > 0 ? Math.round((d.value / invest) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
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
        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color, display: 'inline-flex' }}>
            {isGain ? <IconTrendUp size={11} strokeWidth={2.4} /> : <IconTrendDown size={11} strokeWidth={2.4} />}
          </span>
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
