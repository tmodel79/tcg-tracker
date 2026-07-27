'use client'

import type { Card, SortMode } from '@/types/card'
import { GAMES_WITH_ALL, ALL_GAMES, GAME_LABEL_KEYS } from '@/types/card'
import { useI18n } from '@/lib/i18n'

interface ControlsProps {
  cards: Card[]
  filterGame: string
  sortMode: SortMode
  onFilterChange: (game: string) => void
  onSearchChange: (text: string) => void
  onSortChange: (mode: SortMode) => void
}

const inputStyle: React.CSSProperties = {
  background: 'var(--panel-2)',
  border: '1px solid var(--border)',
  borderRadius: 9,
  padding: '8px 12px',
  color: 'var(--text)',
  fontSize: 13,
  fontFamily: 'inherit',
}

export function Controls({
  cards,
  filterGame,
  sortMode,
  onFilterChange,
  onSearchChange,
  onSortChange,
}: ControlsProps) {
  const { t } = useI18n()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        marginBottom: 12,
      }}
    >
      {/* 게임 필터 칩 */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {GAMES_WITH_ALL.map((g) => {
          const cnt =
            g === ALL_GAMES
              ? cards.length
              : cards.filter((c) => c.game === g).length
          if (g !== ALL_GAMES && cnt === 0) return null
          const active = filterGame === g
          // 내부 값(한국어/ALL)은 유지하고 표시만 번역
          const displayLabel = g === ALL_GAMES ? t('filter_all') : t(GAME_LABEL_KEYS[g] ?? 'game_other')
          return (
            <button
              key={g}
              onClick={() => onFilterChange(g)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                background: active ? 'var(--accent)' : 'var(--panel-2)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                color: active ? 'var(--accent-ink)' : 'var(--muted)',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {displayLabel}
              {g !== ALL_GAMES && (
                <span style={{ opacity: 0.6 }}> {cnt}</span>
              )}
            </button>
          )
        })}
      </div>

      <span style={{ flex: 1 }} />

      {/* 검색 */}
      <input
        style={{ ...inputStyle, width: 180 }}
        placeholder={t('search_placeholder')}
        autoComplete="off"
        onChange={(e) => onSearchChange(e.target.value)}
      />

      {/* 정렬 */}
      <select
        style={inputStyle}
        value={sortMode}
        onChange={(e) => onSortChange(e.target.value as SortMode)}
      >
        <option value="pct">{t('sort_pct_desc')}</option>
        <option value="pctAsc">{t('sort_pct_asc')}</option>
        <option value="pnl">{t('sort_pnl')}</option>
        <option value="cost">{t('sort_cost')}</option>
        <option value="date">{t('sort_date')}</option>
        <option value="name">{t('sort_name')}</option>
      </select>
    </div>
  )
}
