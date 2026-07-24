'use client'

// ========================================
// AddHub — ➕ 추가하기 탭
// 카드를 컬렉션에 넣는 모든 입구를 한 곳에 통합:
//   ① 직접 입력 (CardModal)
//   ② URL 붙여넣기 / 영수증 OCR (PurchaseImport embedded)
//   ③ JSON 백업 복원 (ImportModal)
// ========================================

import { useI18n } from '@/lib/i18n'
import { PurchaseImport } from './PurchaseImport'
import type { CardPrefill } from './CardModal'

interface AddHubProps {
  onManualAdd: () => void
  onAddCard: (prefill: CardPrefill) => void
  onOpenJsonImport: () => void
}

export function AddHub({ onManualAdd, onAddCard, onOpenJsonImport }: AddHubProps) {
  const { t } = useI18n()

  return (
    <div>
      {/* 제목 */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>➕ {t('tab_add')}</h2>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
          {t('add_hub_subtitle')}
        </p>
      </div>

      {/* ① 직접 입력 */}
      <div style={{
        background: 'var(--panel)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ minWidth: 200, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 3 }}>✏️ {t('add_manual_title')}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {t('add_manual_desc')}
          </div>
        </div>
        <button
          onClick={onManualAdd}
          style={{
            padding: '10px 20px', borderRadius: 9, fontSize: 13.5, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            border: '1px solid var(--accent)', background: 'var(--accent)',
            color: 'var(--accent-ink)',
          }}
        >
          {t('btn_add_card')}
        </button>
      </div>

      {/* ② 자동 가져오기 — URL / 영수증 OCR */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 8 }}>🔗 {t('add_auto_title')}</div>
        <PurchaseImport embedded onAddCard={onAddCard} />
      </div>

      {/* ③ JSON 백업 복원 */}
      <div style={{
        background: 'var(--panel-2)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ minWidth: 200, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>📂 {t('add_json_title')}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {t('add_json_desc')}
          </div>
        </div>
        <button
          onClick={onOpenJsonImport}
          style={{
            padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            border: '1px solid var(--border)', background: 'var(--panel)',
            color: 'var(--text)',
          }}
        >
          📥 {t('add_json_btn')}
        </button>
      </div>
    </div>
  )
}
