'use client'

import { useCallback, useState } from 'react'
import { useCards } from '@/lib/useCards'
import { calcPortfolio } from '@/lib/calc'
import { buildCsvBlob, downloadBlob, stamp } from '@/lib/utils'
import { SummaryBar } from '@/components/SummaryBar'
import { Controls } from '@/components/Controls'
import { CardTable } from '@/components/CardTable'
import { CardModal } from '@/components/CardModal'
import { ImportModal } from '@/components/ImportModal'
import { Toast } from '@/components/Toast'
import type { Card, SortMode } from '@/types/card'

export default function HomePage() {
  const { cards, loading, error, saveCard, deleteCard, importJson } = useCards()

  // UI 상태
  const [filterGame, setFilterGame] = useState('전체')
  const [searchText, setSearchText] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('pct')

  // 모달 상태
  const [cardModalOpen, setCardModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)

  // 토스트
  const [toastMsg, setToastMsg] = useState('')
  const toast = (msg: string) => setToastMsg(msg)

  // 포트폴리오 합계 (화면 계산 — DB 저장 안 함)
  const summary = calcPortfolio(cards)

  // 카드 추가 버튼
  const handleAddClick = () => {
    setEditingCard(null)
    setCardModalOpen(true)
  }

  // 행 클릭 → 수정 모달
  const handleRowClick = (id: string) => {
    const c = cards.find((x) => x.id === id)
    if (c) {
      setEditingCard(c)
      setCardModalOpen(true)
    }
  }

  // 저장
  const handleSave = useCallback(
    async (data: Partial<Card>, isNew: boolean) => {
      try {
        await saveCard(data, isNew)
        setCardModalOpen(false)
        toast(isNew ? '카드를 추가했어요' : '수정했어요')
      } catch (e) {
        toast('저장에 실패했어요: ' + (e as Error).message)
      }
    },
    [saveCard]
  )

  // 삭제
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteCard(id)
        setCardModalOpen(false)
        toast('삭제했어요')
      } catch (e) {
        toast('삭제에 실패했어요: ' + (e as Error).message)
      }
    },
    [deleteCard]
  )

  // JSON import
  const handleImport = useCallback(
    async (imported: Card[]) => {
      try {
        await importJson(imported)
        toast(`${imported.length}장을 불러왔어요`)
      } catch (e) {
        toast('불러오기에 실패했어요: ' + (e as Error).message)
      }
    },
    [importJson]
  )

  // CSV 내보내기
  const handleCsvExport = () => {
    if (cards.length === 0) { toast('내보낼 카드가 없어요'); return }
    const blob = buildCsvBlob(cards)
    downloadBlob(blob, `TCG_트래커_${stamp()}.csv`)
    toast('CSV를 내려받았어요')
  }

  // JSON 백업
  const handleJsonBackup = () => {
    if (cards.length === 0) { toast('백업할 카드가 없어요'); return }
    const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `TCG_백업_${stamp()}.json`)
    toast('백업 파일을 내려받았어요')
  }

  const btnStyle: React.CSSProperties = {
    padding: '9px 14px',
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    border: '1px solid var(--border)',
    background: 'var(--panel-2)',
    color: 'var(--text)',
    transition: 'background 0.15s',
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--muted)', fontSize: 14 }}>
        불러오는 중…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12, color: 'var(--gain)', padding: 32 }}>
        <div style={{ fontSize: 28 }}>⚠️</div>
        <div style={{ fontWeight: 700 }}>Supabase 연결 오류</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, maxWidth: 400, textAlign: 'center' }}>{error}</div>
        <div style={{ color: 'var(--muted-2)', fontSize: 12 }}>.env.local 파일의 NEXT_PUBLIC_SUPABASE_URL·ANON_KEY를 확인해 주세요.</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '22px 20px 60px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h1 style={{ fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 12px var(--accent)', display: 'inline-block' }} />
            TCG 트래커
          </h1>
          <small style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 500 }}>
            카드 포트폴리오 · 주식창 스타일
          </small>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={{ ...btnStyle, background: 'transparent', color: 'var(--muted)' }} onClick={() => setImportModalOpen(true)}>
            JSON 불러오기
          </button>
          <button style={{ ...btnStyle, background: 'transparent', color: 'var(--muted)' }} onClick={handleJsonBackup}>
            JSON 백업
          </button>
          <button style={btnStyle} onClick={handleCsvExport}>
            CSV 내보내기
          </button>
          <button
            style={{ ...btnStyle, background: 'var(--accent)', color: 'var(--accent-ink)', border: '1px solid var(--accent)' }}
            onClick={handleAddClick}
          >
            + 카드 추가
          </button>
        </div>
      </div>

      {/* 포트폴리오 요약 */}
      <SummaryBar summary={summary} />

      {/* 컨트롤 */}
      <Controls
        cards={cards}
        filterGame={filterGame}
        sortMode={sortMode}
        onFilterChange={setFilterGame}
        onSearchChange={setSearchText}
        onSortChange={setSortMode}
      />

      {/* 카드 표 */}
      <CardTable
        cards={cards}
        filterGame={filterGame}
        searchText={searchText}
        sortMode={sortMode}
        onRowClick={handleRowClick}
        onAddClick={handleAddClick}
      />

      {/* 하단 안내 */}
      <div style={{ color: 'var(--muted-2)', fontSize: 11.5, textAlign: 'center', marginTop: 22, lineHeight: 1.6 }}>
        현재 시세는 직접 입력하는 방식입니다 (자동 조회 미지원).<br />
        중요한 자료는 <b>JSON 백업</b>으로 파일을 따로 보관하세요.
      </div>

      {/* 모달들 */}
      <CardModal
        open={cardModalOpen}
        card={editingCard}
        onClose={() => setCardModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
      />

      {/* 토스트 */}
      <Toast message={toastMsg} onClear={() => setToastMsg('')} />
    </div>
  )
}
