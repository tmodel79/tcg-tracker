'use client'

import { calcCard } from '@/lib/calc'
import { pctCompact } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { LangSelector } from './LangSelector'
import { CurrencySelector } from './CurrencySelector'
import { ThemeSelector } from './ThemeSelector'
import type { Card, PortfolioSummary } from '@/types/card'
import { GAMES } from '@/types/card'

const GAME_COLORS: Record<string, string> = {
  '원피스': '#e84040',
  '포켓몬': '#f5c518',
  '드래곤볼': '#ff7b00',
  '건담': '#4d9dff',
  '유희왕': '#9b59b6',
  '기타': '#8b98a5',
}

export const TABS = [
  { id: 'collection', label: '내 컬렉션', icon: '🃏' },
  { id: 'search',     label: '시세 검색',  icon: '🔍' },
  { id: 'import',     label: '구매 가져오기', icon: '🔗' },
] as const

export type TabId = typeof TABS[number]['id']

interface PortfolioSidebarProps {
  summary: PortfolioSummary
  cards: Card[]
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onAddClick: () => void
  onCsvExport: () => void
  onJsonBackup: () => void
  onImportJson: () => void
}

export function PortfolioSidebar({
  summary, cards, activeTab, onTabChange,
  onAddClick, onCsvExport, onJsonBackup, onImportJson,
}: PortfolioSidebarProps) {
  const { fmtC, locale } = useI18n()
  const { invest, value, pnl, pct, totalCards, pricedCards } = summary
  const isGain = pnl > 0
  const isLoss = pnl < 0
  const pctColor = isGain ? 'var(--gain)' : isLoss ? 'var(--loss)' : 'var(--flat)'

  // 게임별 투자 비중
  const gameData = GAMES
    .map(game => {
      const gc = cards.filter(c => c.game === game)
      const inv = gc.reduce((s, c) => s + calcCard(c).totalCost, 0)
      return { game, count: gc.length, invest: inv }
    })
    .filter(g => g.count > 0)
    .sort((a, b) => b.invest - a.invest)
  const maxInvest = Math.max(...gameData.map(g => g.invest), 1)

  return (
    <>
      <style>{`
        /* ── 사이드바 공통 ── */
        .ps-root {
          width: 256px;
          min-width: 256px;
          min-height: 100vh;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
          border-right: 1px solid var(--border);
          background: var(--panel);
          display: flex;
          flex-direction: column;
          padding: 0;
          flex-shrink: 0;
          scrollbar-width: thin;
        }
        .ps-inner {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 18px 14px 28px;
          flex: 1;
        }
        /* ── 탭 버튼 ── */
        .ps-tab {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 10px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          width: 100%;
          text-align: left;
          font-family: inherit;
          transition: all 0.12s;
          color: var(--muted);
          background: transparent;
          margin-bottom: 2px;
        }
        .ps-tab.active {
          background: rgba(232,177,58,.15);
          color: var(--accent);
        }
        .ps-tab:hover:not(.active) {
          background: var(--panel-2);
          color: var(--text);
        }
        .ps-tab .tab-icon { font-size: 14px; width: 18px; text-align: center; }
        /* ── 액션 버튼 ── */
        .ps-action {
          width: 100%;
          padding: 7px 10px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          border: 1px solid var(--border);
          background: var(--panel-2);
          color: var(--muted);
          text-align: left;
          transition: all 0.12s;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .ps-action:hover { color: var(--text); border-color: var(--muted); }
        /* ── 게임 바 ── */
        .ps-game-row { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; }
        .ps-game-label { font-size: 11px; color: var(--muted); width: 36px; flex-shrink: 0; }
        .ps-game-track { flex: 1; background: var(--panel-3); border-radius: 3px; height: 5px; overflow: hidden; }
        .ps-game-fill { height: 100%; border-radius: 3px; transition: width 0.5s cubic-bezier(.4,0,.2,1); }
        .ps-game-cnt { font-size: 10px; color: var(--muted-2); width: 20px; text-align: right; flex-shrink: 0; }
        /* ── 섹션 제목 ── */
        .ps-section-title {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--muted-2);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0 0 8px;
        }
        /* ── 구분선 ── */
        .ps-divider { border: none; border-top: 1px solid var(--border-soft); margin: 14px 0; }
        /* ── 모바일: 사이드바 숨김, 상단 배너 표시 ── */
        @media (max-width: 860px) {
          .ps-root {
            width: 100%;
            min-width: 0;
            height: auto;
            min-height: auto;
            position: relative;
            border-right: none;
            border-bottom: 1px solid var(--border);
            overflow: visible;
          }
          .ps-inner { padding: 12px 14px 14px; }
          .ps-desktop-only { display: none !important; }
          .ps-mobile-tabs {
            display: flex !important;
            gap: 4px;
            margin-top: 10px;
          }
        }
        @media (min-width: 861px) {
          .ps-mobile-tabs { display: none; }
          .ps-mobile-toggle { display: none !important; }
        }
        .ps-mobile-tabs {
          display: none;
        }
        .ps-mobile-tab {
          flex: 1;
          padding: 8px 4px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid var(--border);
          background: var(--panel-2);
          color: var(--muted);
          font-family: inherit;
          text-align: center;
          transition: all 0.12s;
        }
        .ps-mobile-tab.active {
          background: rgba(232,177,58,.15);
          color: var(--accent);
          border-color: var(--accent);
        }
      `}</style>

      <aside className="ps-root">
        <div className="ps-inner">

          {/* ── 로고 + 설정 ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h1 style={{
              margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)',
                display: 'inline-block',
              }} />
              CardLedger
            </h1>
            <div style={{ display: 'flex', gap: 4 }}>
              <LangSelector />
              <CurrencySelector />
              <ThemeSelector />
            </div>
          </div>

          {/* ── 포트폴리오 요약 ── */}
          <div style={{
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '13px 13px 12px',
            marginBottom: 14,
          }}>
            <p className="ps-section-title" style={{ color: 'var(--accent)' }}>포트폴리오</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 8px' }}>
              <StatItem label="총 투자" sub={`${totalCards}개`}>
                <span className="num" style={{ fontSize: 17, fontWeight: 800 }}>{fmtC(invest)}</span>
              </StatItem>
              <StatItem label="현재 가치" sub={`${pricedCards}개 평가`}>
                <span className="num" style={{ fontSize: 17, fontWeight: 800 }}>{fmtC(value)}</span>
              </StatItem>
              <StatItem label="총 손익">
                <span className="num" style={{ fontSize: 17, fontWeight: 800, color: pctColor }}>
                  {pnl >= 0 ? '+' : '−'}{fmtC(Math.abs(pnl))}
                </span>
              </StatItem>
              <StatItem label="수익률">
                <span className="num" style={{ fontSize: 21, fontWeight: 800, color: pctColor }}>
                  {pctCompact(pct, locale)}
                </span>
              </StatItem>
            </div>
          </div>

          {/* ── 게임별 투자 ── */}
          {gameData.length > 0 && (
            <div className="ps-desktop-only" style={{ marginBottom: 14 }}>
              <p className="ps-section-title">게임별 투자</p>
              {gameData.map(g => (
                <div key={g.game} className="ps-game-row">
                  <span className="ps-game-label">{g.game.slice(0, 3)}</span>
                  <div className="ps-game-track">
                    <div
                      className="ps-game-fill"
                      style={{
                        width: `${(g.invest / maxInvest) * 100}%`,
                        background: GAME_COLORS[g.game] || '#8b98a5',
                      }}
                    />
                  </div>
                  <span className="ps-game-cnt">{g.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── 메뉴 탭 (데스크탑) ── */}
          <div className="ps-desktop-only" style={{ marginBottom: 14 }}>
            <p className="ps-section-title">메뉴</p>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`ps-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── 모바일 탭 (하단 배너) ── */}
          <div className="ps-mobile-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`ps-mobile-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ── 여백 ── */}
          <div style={{ flex: 1 }} className="ps-desktop-only" />

          {/* ── 액션 버튼 ── */}
          <div className="ps-desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={onAddClick}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 9,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                border: '1px solid var(--accent)', background: 'var(--accent)',
                color: 'var(--accent-ink)', textAlign: 'center',
              }}
            >
              + 카드 추가
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <button className="ps-action" onClick={onImportJson}>📥 JSON 가져오기</button>
              <button className="ps-action" onClick={onJsonBackup}>💾 백업</button>
            </div>
            <button className="ps-action" onClick={onCsvExport}>📊 CSV 내보내기</button>
          </div>

        </div>
      </aside>
    </>
  )
}

function StatItem({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
        {label}
      </div>
      {children}
      {sub && <div style={{ fontSize: 10, color: 'var(--muted-2)', marginTop: 1 }}>{sub}</div>}
    </div>
  )
}
