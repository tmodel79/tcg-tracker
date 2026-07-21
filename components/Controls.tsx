'use client'

import type { Card, SortMode } from '@/types/card'
import { GAMES_WITH_ALL } from '@/types/card'

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
            g === '전체'
              ? cards.length
              : cards.filter((c) => c.game === g).length
          if (g !== '전체' && cnt === 0) return null
          const active = filterGame === g
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
              {g}
              {g !== '전체' && (
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
        placeholder="카드명 검색…"
        autoComplete="off"
        onChange={(e) => onSearchChange(e.target.value)}
      />

      {/* 정렬 */}
      <select
        style={inputStyle}
        value={sortMode}
        onChange={(e) => onSortChange(e.target.value as SortMode)}
      >
        <option value="pct">수익률 높은 순</option>
        <option value="pctAsc">수익률 낮은 순</option>
        <option value="pnl">손익 큰 순</option>
        <option value="cost">총원가 큰 순</option>
        <option value="date">최근 구매 순</option>
        <option value="name">카드명 순</option>
      </select>
    </div>
  )
}
