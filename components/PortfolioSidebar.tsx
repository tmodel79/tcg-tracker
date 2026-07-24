'use client'

import { useState } from 'react'
import { calcCard } from '@/lib/calc'
import { useI18n } from '@/lib/i18n'
import { SettingsModal } from './SettingsModal'
import type { Card } from '@/types/card'
import { GAMES } from '@/types/card'
import { IconDashboard, IconCards, IconPlus, IconSearch, IconSave, IconTable, IconSettings } from './Icons'

const GAME_COLORS: Record<string, string> = {
  '원피스': '#e84040',
  '포켓몬': '#f5c518',
  '드래곤볼': '#ff7b00',
  '건담': '#4d9dff',
  '유희왕': '#9b59b6',
  '기타': '#8b98a5',
}

export const TABS = [
  { id: 'dashboard',  labelKey: 'tab_dashboard',  Icon: IconDashboard },
  { id: 'collection', labelKey: 'tab_collection', Icon: IconCards },
  { id: 'add',        labelKey: 'tab_add',        Icon: IconPlus },
  { id: 'search',     labelKey: 'tab_search',     Icon: IconSearch },
] as const

export type TabId = typeof TABS[number]['id']

interface PortfolioSidebarProps {
  cards: Card[]
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onCsvExport: () => void
  onJsonBackup: () => void
}

export function PortfolioSidebar({
  cards, activeTab, onTabChange,
  onCsvExport, onJsonBackup,
}: PortfolioSidebarProps) {
  const { t } = useI18n()
  const [settingsOpen, setSettingsOpen] = useState(false)

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
        .ps-tab .tab-icon { width: 18px; display: inline-flex; align-items: center; justify-content: center; }
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
        /* ── 설정 버튼 ── */
        .ps-settings-btn:hover { color: var(--text) !important; border-color: var(--muted) !important; }
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

          {/* ── 로고 + 설정 버튼 (언어·통화·테마는 설정 모달로 통합) ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h1
              onClick={() => onTabChange('dashboard')}
              style={{
                margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em',
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', userSelect: 'none',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)',
                display: 'inline-block',
              }} />
              CardLedger
            </h1>
            <button
              onClick={() => setSettingsOpen(true)}
              title={t('settings_title')}
              aria-label={t('settings_title')}
              className="ps-settings-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)', cursor: 'pointer', transition: 'all 0.12s',
              }}
            >
              <IconSettings size={15} strokeWidth={1.9} />
            </button>
          </div>

          {/* ── 메뉴 탭 (데스크탑) ── */}
          <div className="ps-desktop-only" style={{ marginBottom: 14 }}>
            <p className="ps-section-title">{t('sidebar_menu')}</p>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`ps-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                <span className="tab-icon"><tab.Icon size={15} strokeWidth={2.2} /></span>
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          {/* ── 게임별 투자 ── */}
          {gameData.length > 0 && (
            <div className="ps-desktop-only" style={{ marginBottom: 14 }}>
              <p className="ps-section-title">{t('sidebar_games')}</p>
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

          {/* ── 모바일 탭 (하단 배너) ── */}
          <div className="ps-mobile-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`ps-mobile-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => onTabChange(tab.id)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
              >
                <tab.Icon size={13} strokeWidth={2.2} /> {t(tab.labelKey)}
              </button>
            ))}
          </div>

          {/* ── 여백 ── */}
          <div style={{ flex: 1 }} className="ps-desktop-only" />

          {/* ── 데이터 내보내기 ── */}
          <div className="ps-desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p className="ps-section-title" style={{ margin: '0 0 2px' }}>{t('sidebar_data')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <button className="ps-action" onClick={onJsonBackup}><IconSave size={13} /> {t('sidebar_backup')}</button>
              <button className="ps-action" onClick={onCsvExport}><IconTable size={13} /> CSV</button>
            </div>
          </div>

        </div>
      </aside>

      {/* ── 설정 모달 (언어·통화·테마) ── */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
