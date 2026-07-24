'use client'

import { useCallback, useState } from 'react'
import { useCards } from '@/lib/useCards'
import { calcPortfolio } from '@/lib/calc'
import { buildCsvBlob, downloadBlob, stamp } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { PortfolioSidebar } from '@/components/PortfolioSidebar'
import { CollectionDashboard } from '@/components/CollectionDashboard'
import { Controls } from '@/components/Controls'
import { CardTable } from '@/components/CardTable'
import { CardModal } from '@/components/CardModal'
import { ImportModal } from '@/components/ImportModal'
import { PriceSearch } from '@/components/PriceSearch'
import { AddHub } from '@/components/AddHub'
import { Toast } from '@/components/Toast'
import type { Card, SortMode } from '@/types/card'
import type { TabId } from '@/components/PortfolioSidebar'
import type { CardPrefill } from '@/components/CardModal'

export default function HomePage() {
  const { cards, loading, error, saveCard, deleteCard, importJson } = useCards()
  const { t } = useI18n()

  // ── 탭 상태 ──
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')

  // ── 컬렉션 탭 UI 상태 ──
  const [filterGame, setFilterGame]   = useState('전체')
  const [searchText, setSearchText]   = useState('')
  const [sortMode, setSortMode]       = useState<SortMode>('pct')

  // ── 모달 상태 ──
  const [cardModalOpen, setCardModalOpen]   = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [editingCard, setEditingCard]       = useState<Card | null>(null)
  const [cardPrefill, setCardPrefill]       = useState<CardPrefill | undefined>(undefined)

  // ── 토스트 ──
  const [toastMsg, setToastMsg] = useState('')
  const toast = (msg: string) => setToastMsg(msg)

  const summary = calcPortfolio(cards)

  // ── 카드 추가 (빈 폼) ──
  const handleAddClick = () => {
    setEditingCard(null)
    setCardPrefill(undefined)
    setCardModalOpen(true)
  }

  // ── 카드 클릭 → 수정 ──
  const handleRowClick = (id: string) => {
    const c = cards.find((x) => x.id === id)
    if (c) {
      setEditingCard(c)
      setCardPrefill(undefined)
      setCardModalOpen(true)
    }
  }

  // ── 추가하기 탭에서 카드 추가 (URL/OCR 추출 결과 → 모달 프리필) ──
  const handleImportAddCard = (prefill: CardPrefill) => {
    setEditingCard(null)
    setCardPrefill(prefill)
    setCardModalOpen(true)
    // 모달이 열리면 컬렉션 탭으로 이동
    setActiveTab('collection')
  }

  // ── 저장 ──
  const handleSave = useCallback(
    async (data: Partial<Card>, isNew: boolean) => {
      try {
        await saveCard(data, isNew)
        setCardModalOpen(false)
        setCardPrefill(undefined)
        toast(isNew ? t('toast_added') : t('toast_edited'))
      } catch (e) {
        toast(t('toast_save_fail', { msg: (e as Error).message }))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saveCard, t]
  )

  // ── 삭제 ──
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

  // ── JSON 가져오기 ──
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

  // ── CSV 내보내기 ──
  const handleCsvExport = () => {
    if (cards.length === 0) { toast(t('toast_no_export')); return }
    const blob = buildCsvBlob(cards)
    downloadBlob(blob, `CardLedger_${stamp()}.csv`)
    toast(t('toast_csv_done'))
  }

  // ── JSON 백업 ──
  const handleJsonBackup = () => {
    if (cards.length === 0) { toast(t('toast_no_backup')); return }
    const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `CardLedger_backup_${stamp()}.json`)
    toast(t('toast_backup_done'))
  }

  // ── 로딩 ──
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--muted)', fontSize: 14 }}>
        {t('loading')}
      </div>
    )
  }

  // ── 에러 ──
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
    <>
      <style>{`
        /* ── 전체 레이아웃 ── */
        .app-shell {
          display: flex;
          min-height: 100vh;
          align-items: flex-start;
        }
        /* ── 메인 컨텐츠 ── */
        .app-main {
          flex: 1;
          min-width: 0;
          padding: 28px 28px 64px;
          overflow-x: hidden;
        }
        @media (max-width: 860px) {
          .app-shell { flex-direction: column; }
          .app-main { padding: 18px 16px 60px; }
        }
        /* ── 컬렉션 탭: 헤더 (모바일) ── */
        @media (max-width: 860px) {
          .app-main { padding: 16px 14px 60px; }
        }
      `}</style>

      <div className="app-shell">
        {/* ── 좌측 사이드바 (내비게이션 + 설정 + 데이터 내보내기) ── */}
        <PortfolioSidebar
          cards={cards}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCsvExport={handleCsvExport}
          onJsonBackup={handleJsonBackup}
        />

        {/* ── 메인 컨텐츠 ── */}
        <main className="app-main">

          {/* ── 탭: 📊 대시보드 (요약·차트·탑퍼포머는 여기에만) ── */}
          {activeTab === 'dashboard' && (
            <CollectionDashboard
              cards={cards}
              summary={summary}
              onAddClick={handleAddClick}
              onSearchTab={() => setActiveTab('search')}
            />
          )}

          {/* ── 탭: 🃏 내 컬렉션 (카드 그리드 + 필터만) ── */}
          {activeTab === 'collection' && (
            cards.length > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em' }}>
                      🃏 {t('tab_collection')}
                    </h2>
                    <div style={{ fontSize: 11.5, color: 'var(--muted-2)', marginTop: 2 }}>
                      {t('dash_sub', { total: summary.totalCards, priced: summary.pricedCards })}
                    </div>
                  </div>
                  <button
                    onClick={handleAddClick}
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
                <Controls
                  cards={cards}
                  filterGame={filterGame}
                  sortMode={sortMode}
                  onFilterChange={setFilterGame}
                  onSearchChange={setSearchText}
                  onSortChange={setSortMode}
                />
                <CardTable
                  cards={cards}
                  filterGame={filterGame}
                  searchText={searchText}
                  sortMode={sortMode}
                  onRowClick={handleRowClick}
                  onAddClick={handleAddClick}
                />
                <div style={{ color: 'var(--muted-2)', fontSize: 11.5, textAlign: 'center', marginTop: 22, lineHeight: 1.6 }}>
                  {t('footer_note')}<br />{t('footer_tip')}
                </div>
              </>
            ) : (
              /* 카드가 없으면 대시보드의 히어로 안내 재사용 */
              <CollectionDashboard
                cards={cards}
                summary={summary}
                onAddClick={handleAddClick}
                onSearchTab={() => setActiveTab('search')}
              />
            )
          )}

          {/* ── 탭: ➕ 추가하기 (직접입력 + URL/OCR + JSON 복원 통합) ── */}
          {activeTab === 'add' && (
            <AddHub
              onManualAdd={handleAddClick}
              onAddCard={handleImportAddCard}
              onOpenJsonImport={() => setImportModalOpen(true)}
            />
          )}

          {/* ── 탭: 🔍 시세 검색 ── */}
          {activeTab === 'search' && <PriceSearch />}
        </main>
      </div>

      {/* ── 모달들 ── */}
      <CardModal
        open={cardModalOpen}
        card={editingCard}
        prefill={cardPrefill}
        onClose={() => { setCardModalOpen(false); setCardPrefill(undefined) }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
      />

      {/* ── 토스트 ── */}
      <Toast message={toastMsg} onClear={() => setToastMsg('')} />
    </>
  )
}
