'use client'

import { useRef, useState } from 'react'
import type { Card } from '@/types/card'

interface ImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (cards: Card[]) => void
}

export function ImportModal({ open, onClose, onImport }: ImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<Card[] | null>(null)
  const [err, setErr] = useState('')

  const handleFile = (file: File) => {
    const r = new FileReader()
    r.onload = () => {
      try {
        const arr = JSON.parse(r.result as string)
        if (!Array.isArray(arr)) throw new Error('배열이 아닙니다')
        setPreview(arr as Card[])
        setErr('')
      } catch {
        setErr('백업 파일을 읽지 못했어요. JSON 형식이 맞는지 확인하세요.')
        setPreview(null)
      }
    }
    r.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleConfirm = () => {
    if (!preview) return
    onImport(preview)
    setPreview(null)
    onClose()
  }

  const handleClose = () => {
    setPreview(null)
    setErr('')
    onClose()
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4,7,11,.72)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
        zIndex: 50,
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        className="modal-pop"
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          padding: '22px 22px 20px',
        }}
        role="dialog"
        aria-modal="true"
      >
        <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800 }}>
          JSON 백업 불러오기
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 12.5, margin: '0 0 20px' }}>
          기존 HTML 앱에서 내려받은 <b>TCG_백업_*.json</b> 파일을 그대로 올릴 수 있어요.
        </p>

        {/* 드래그 앤 드롭 존 */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 12,
            padding: '32px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            color: 'var(--muted)',
            fontSize: 13.5,
            transition: 'border-color 0.15s',
            marginBottom: 16,
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
          <div>
            <b style={{ color: 'var(--text)' }}>파일을 여기에 끌어다 놓거나</b>
            <br />
            클릭해서 선택하세요
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 8 }}>
            JSON 파일만 지원 (TCG_백업_*.json)
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />

        {/* 미리보기 */}
        {preview && (
          <div
            style={{
              background: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              ✅ {preview.length}장 확인됨
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.8 }}>
              {preview.slice(0, 5).map((c, i) => (
                <div key={i}>
                  · {c.name} ({c.game})
                </div>
              ))}
              {preview.length > 5 && (
                <div style={{ color: 'var(--muted-2)' }}>… 외 {preview.length - 5}장</div>
              )}
            </div>
            <p style={{ color: 'var(--muted-2)', fontSize: 11.5, margin: '10px 0 0' }}>
              ⚠️ 불러오면 현재 DB의 카드가 이 백업으로 <b>추가/병합</b>됩니다. (같은 id는 덮어씀)
            </p>
          </div>
        )}

        {err && (
          <p style={{ color: 'var(--gain)', fontSize: 12, marginBottom: 12 }}>{err}</p>
        )}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <span style={{ flex: 1 }} />
          <button
            onClick={handleClose}
            style={{
              background: 'var(--panel-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 9,
              padding: '9px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!preview}
            style={{
              background: preview ? 'var(--accent)' : 'var(--panel-3)',
              color: preview ? 'var(--accent-ink)' : 'var(--muted)',
              border: `1px solid ${preview ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 9,
              padding: '9px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: preview ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
            }}
          >
            {preview ? `${preview.length}장 불러오기` : '파일을 먼저 선택하세요'}
          </button>
        </div>
      </div>
    </div>
  )
}
