'use client'

import { useCallback, useState } from 'react'
import { useCards } from '@/lib/useCards'
import { calcPortfolio } from '@/lib/calc'
import { buildCsvBlob, downloadBlob, stamp } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { SummaryBar } from '@/components/SummaryBar'
import { Controls } from '@/components/Controls'
import { CardTable } from '@/components/CardTable'
import { CardModal } from '@/components/CardModal'
import { ImportModal } from '@/components/ImportModal'
import { LangSelector } from '@/components/LangSelector'
import { CurrencySelector } from '@/components/CurrencySelector'
import { Toast } from '@/components/Toast'
import type { Card, SortMode } from '@/types/card'

export default function HomePage() {
  const { cards, loading, error, saveCard, deleteCard, importJson } = useCards()
  const { t } = useI18n()

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
        toast(isNew ? t('toast_added') : t('toast_edited'))
      } catch (e) {
        toast(t('toast_save_fail', { msg: (e as Error).message }))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saveCard, t]
  )

  // 삭제
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteCard(id)
        setCardModalOpen(false)
        toast(t('toast_deleted'))
      } catch (e) {
        toast(t('toast_delete_fail', { msg: (e as Error).message }))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteCard, t]
  )

  // JSON import
  const handleImport = useCallback(
    async (imported: Card[]) => {
      try {
        await importJson(imported)
        toast(t('toast_imported', { n: imported.length }))
      } catch (e) {
        toast(t('toast_import_fail', { msg: (e as Error).message }))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [importJson, t]
  )

  // CSV 내보내기
  const handleCsvExport = () => {
    if (cards.length === 0) { toast(t('toast_no_export')); return }
    const blob = buildCsvBlob(cards)
    downloadBlob(blob, `CardLedger_${stamp()}.csv`)
    toast(t('toast_csv_done'))
  }

  // JSON 백업
  const handleJsonBackup = () => {
    if (cards.length === 0) { toast(t('toast_no_backup')); return }
    const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `CardLedger_backup_${stamp()}.json`)
    toast(t('toast_backup_done'))
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
        {t('loading')}
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12, color: 'var(--gain)', padding: 32 }}>
        <div style={{ fontSize: 28 }}>⚠️</div>
        <div style={{ fontWeight: 700 }}>{t('error_title')}</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, maxWidth: 400, textAlign: 'center' }}>{error}</div>
        <div style={{ color: 'var(--muted-2)', fontSize: 12 }}>{t('error_hint')}</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '22px 20px 60px' }}>
      {/* 헤더 */}
      <div className="header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <div className="header-title-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 12px var(--accent)', display: 'inline-block' }} />
            CardLedger
          </h1>
          <small className="header-sub" style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 500 }}>
            {t('app_subtitle')}
          </small>
          <LangSelector />
          <CurrencySelector />
        </div>
        <div className="header-btns" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-secondary" style={{ ...btnStyle, background: 'transparent', color: 'var(--muted)' }} onClick={() => setImportModalOpen(true)}>
            {t('btn_import_json')}
          </button>
          <button className="btn-secondary" style={{ ...btnStyle, background: 'transparent', color: 'var(--muted)' }} onClick={handleJsonBackup}>
            {t('btn_backup_json')}
          </button>
          <button className="btn-secondary" style={btnStyle} onClick={handleCsvExport}>
            {t('btn_export_csv')}
          </button>
          <button
            className="btn-primary"
            style={{ ...btnStyle, background: 'var(--accent)', color: 'var(--accent-ink)', border: '1px solid var(--accent)' }}
            onClick={handleAddClick}
          >
            {t('btn_add_card')}
          </button>
        </div>
      </div>
      <style>{`
        @media (max-width: 560px) {
          .header-row { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .header-title-row { justify-content: space-between; }
          .header-sub { display: none; }
          .header-btns { display: grid !important; grid-template-columns: 1fr 1fr 1fr !important; gap: 6px !important; }
          .header-btns .btn-secondary { font-size: 11px !important; padding: 8px 4px !important; }
          .header-btns .btn-primary { grid-column: 1 / -1; font-size: 14px !important; padding: 12px !important; }
        }
      `}</style>

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
        {t('footer_note')}<br />
        {t('footer_tip')}
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
