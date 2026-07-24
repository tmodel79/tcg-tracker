/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

// ========================================
// 구매 가져오기 탭
// ① URL 붙여넣기 → 자동 추출
// ② 영수증 스크린샷 → AI OCR → 자동 추출
// ③ 직접 수동 입력 (카드 추가 버튼)
// ========================================

import { useRef, useState } from 'react'
import type { Currency, Game, Language } from '@/types/card'
import { IconLink, IconCamera, IconEdit, IconFolder, IconDownload } from './Icons'

export interface ImportedData {
  name: string | null
  card_number: string | null
  game: string | null
  buy_price: number | null
  currency: 'KRW' | 'USD' | 'JPY' | 'EUR' | null
  fee: number | null
  shipping: number | null
  image_url: string | null
  platform: string | null
  language?: Language | null
}

interface PurchaseImportProps {
  /** 추가하기 탭 안에 내장될 때 true — 자체 제목·수동입력 안내를 숨김 */
  embedded?: boolean
  onAddCard: (prefill: {
    name?: string
    cardNumber?: string
    game?: Game
    buyPrice?: string
    currency?: Currency
    fxRate?: string
    customs?: string
    shipping?: string
    imageUrl?: string
    language?: Language | null
  }) => void
}

type Mode = 'url' | 'screenshot'

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--panel-2)',
  border: '1px solid var(--border)',
  borderRadius: 9,
  padding: '9px 11px',
  color: 'var(--text)',
  fontSize: 13.5,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

const FX_DEFAULT: Record<string, number> = { KRW: 1, USD: 1380, JPY: 9.1, EUR: 1500 }

export function PurchaseImport({ onAddCard, embedded = false }: PurchaseImportProps) {
  const [mode, setMode]           = useState<Mode>('url')
  const [url, setUrl]             = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [result, setResult]       = useState<ImportedData | null>(null)
  const [ocrPreview, setOcrPreview] = useState<string | null>(null)
  const fileInputRef              = useRef<HTMLInputElement>(null)

  // ── URL 가져오기 ──
  const handleUrlFetch = async () => {
    if (!url.trim()) { setError('URL을 입력해주세요'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/url-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setResult(json)
    } catch (e: any) {
      setError(e.message || '가져오기 실패')
    } finally {
      setLoading(false)
    }
  }

  // ── 스크린샷 OCR ──
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('이미지 파일만 가능합니다'); return }
    setLoading(true); setError(''); setResult(null)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setOcrPreview(dataUrl)
      const base64 = dataUrl.split(',')[1]
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp'

      try {
        const res = await fetch('/api/receipt-ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType }),
        })
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setResult(json)
      } catch (e: any) {
        setError(e.message || 'OCR 실패')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // ── 카드로 추가 ──
  const handleAddCard = () => {
    if (!result) return
    const currency = (result.currency || 'KRW') as Currency
    const fx = FX_DEFAULT[currency] || 1
    // fee → customs 필드에 매핑 (플랫폼 수수료)
    const feeKrw = result.fee ? Math.round(result.fee * fx) : undefined
    const shipKrw = result.shipping ? Math.round(result.shipping * fx) : undefined

    onAddCard({
      name:       result.name ?? undefined,
      cardNumber: result.card_number ?? undefined,
      game:       (result.game as Game) ?? undefined,
      buyPrice:   result.buy_price != null ? String(result.buy_price) : undefined,
      currency,
      fxRate:     String(fx),
      customs:    feeKrw != null ? String(feeKrw) : undefined,
      shipping:   shipKrw != null ? String(shipKrw) : undefined,
      imageUrl:   result.image_url ?? undefined,
    })
  }

  return (
    <div>
      {/* 제목 (단독 사용 시에만) */}
      {!embedded && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--accent)', display: 'inline-flex' }}><IconLink size={16} /></span>
            구매 가져오기
          </h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
            구매한 상품 URL을 붙여넣거나, 영수증 스크린샷을 올리면 자동으로 정보를 추출합니다
          </p>
        </div>
      )}

      {/* 모드 전환 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--panel-2)', borderRadius: 10, padding: 4 }}>
        {[
          { id: 'url' as Mode,        label: 'URL 붙여넣기', Icon: IconLink },
          { id: 'screenshot' as Mode, label: '영수증 스캔',  Icon: IconCamera },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setResult(null); setError(''); setOcrPreview(null) }}
            style={{
              flex: 1, padding: '8px', borderRadius: 7, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all 0.12s',
              background: mode === m.id ? 'var(--panel)' : 'transparent',
              color: mode === m.id ? 'var(--text)' : 'var(--muted)',
              boxShadow: mode === m.id ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <m.Icon size={13} /> {m.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── URL 모드 ── */}
      {mode === 'url' && (
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '18px', marginBottom: 16,
        }}>
          <label style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>
            상품 URL (eBay · 야후옥션 · 메르카리 지원)
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...fieldStyle, flex: 1 }}
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.ebay.com/itm/..."
              onKeyDown={e => e.key === 'Enter' && handleUrlFetch()}
            />
            <button
              onClick={handleUrlFetch}
              disabled={loading || !url.trim()}
              style={{
                padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', flexShrink: 0,
                background: loading || !url.trim() ? 'var(--panel-3)' : 'var(--accent)',
                color: loading || !url.trim() ? 'var(--muted)' : 'var(--accent-ink)',
              }}
            >
              {loading ? '…' : '가져오기'}
            </button>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--muted-2)', marginTop: 8, marginBottom: 0 }}>
            상품 상세 페이지 URL을 복사해서 붙여넣으면 카드명·가격·수수료·배송비를 자동으로 읽어옵니다
          </p>
        </div>
      )}

      {/* ── 스크린샷 모드 ── */}
      {mode === 'screenshot' && (
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '18px', marginBottom: 16,
        }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleFileSelect(f)
              e.target.value = ''
            }}
          />

          {ocrPreview ? (
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <img
                src={ocrPreview}
                alt="영수증 미리보기"
                style={{ width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)' }}
              />
              {loading && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 8, gap: 8,
                }}>
                  <div style={{ width: 28, height: 28, border: '3px solid rgba(232,177,58,0.3)', borderTop: '3px solid #e8b13a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ color: '#e8b13a', fontSize: 13, fontWeight: 600 }}>AI 분석 중…</span>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 12, padding: '36px 20px',
                textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.15s', marginBottom: 12,
              }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) handleFileSelect(f)
              }}
            >
              <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center', color: 'var(--muted)' }}><IconCamera size={30} strokeWidth={1.6} /></div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>스크린샷을 여기에 드래그하거나 클릭하세요</div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>
                eBay 주문확인 · 야후옥션 낙찰통보 · 메르카리 구매완료 등
              </div>
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            style={{
              width: '100%', padding: '9px', borderRadius: 9, fontSize: 13, fontWeight: 700,
              border: '1px solid var(--border)', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              background: loading ? 'var(--panel-3)' : 'var(--panel-2)',
              color: loading ? 'var(--muted)' : 'var(--text)',
            }}
          >
            {ocrPreview ? '다른 이미지 선택' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center', width: '100%' }}><IconFolder size={13} /> 이미지 파일 선택</span>}
          </button>

          <p style={{ fontSize: 11.5, color: 'var(--muted-2)', marginTop: 8, marginBottom: 0 }}>
            구매 확인서 스크린샷을 올리면 AI가 카드명·구매가·수수료·배송비를 자동으로 읽어옵니다
          </p>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div style={{
          background: 'rgba(232,80,101,.1)', border: '1px solid var(--gain)',
          borderRadius: 9, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--gain)',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── 추출 결과 ── */}
      {result && (
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--accent)',
          borderRadius: 14, padding: '18px', marginBottom: 14,
        }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
            ✅ 추출 결과 {result.platform && `— ${result.platform}`}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px', marginBottom: 16 }}>
            <ResultRow label="카드명" value={result.name} />
            <ResultRow label="카드번호" value={result.card_number} />
            <ResultRow label="게임" value={result.game} />
            <ResultRow label="통화" value={result.currency} />
            <ResultRow
              label="구매가"
              value={result.buy_price != null
                ? `${result.currency === 'USD' ? '$' : result.currency === 'JPY' ? '¥' : result.currency === 'EUR' ? '€' : '₩'}${result.buy_price.toLocaleString()}`
                : null}
            />
            <ResultRow
              label="수수료"
              value={result.fee != null
                ? `${result.currency === 'USD' ? '$' : result.currency === 'JPY' ? '¥' : result.currency === 'EUR' ? '€' : '₩'}${result.fee.toLocaleString()}`
                : null}
            />
            <ResultRow
              label="배송비"
              value={result.shipping != null
                ? `${result.currency === 'USD' ? '$' : result.currency === 'JPY' ? '¥' : result.currency === 'EUR' ? '€' : '₩'}${result.shipping.toLocaleString()}`
                : null}
            />
          </div>

          <div style={{
            background: 'var(--panel-2)', borderRadius: 8, padding: '9px 12px',
            fontSize: 12, color: 'var(--muted)', marginBottom: 14,
          }}>
            💡 배대지(배송대행) 비용은 카드 추가 후 모달에서 직접 입력하실 수 있습니다
          </div>

          <button
            onClick={handleAddCard}
            style={{
              width: '100%', padding: '11px', borderRadius: 9, fontSize: 14, fontWeight: 700,
              border: '1px solid var(--accent)', background: 'var(--accent)',
              color: 'var(--accent-ink)', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, justifyContent: 'center', width: '100%' }}>
              <IconDownload size={14} /> 이 카드 추가하기
            </span>
          </button>
        </div>
      )}

      {/* ── 수동 입력 안내 (단독 사용 시에만 — 추가하기 탭에는 별도 섹션 존재) ── */}
      {!embedded && (
      <div style={{
        background: 'var(--panel-2)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 16px',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><IconEdit size={13} /> 직접 수동 입력</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>
          지원하지 않는 사이트거나 직접 입력하고 싶으시면 카드 추가 버튼을 사용하세요.
          수수료·배대지·배송비도 모두 직접 입력 가능합니다.
        </div>
        <button
          onClick={() => onAddCard({})}
          style={{
            padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700,
            border: '1px solid var(--border)', background: 'var(--panel)',
            color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          + 카드 직접 추가
        </button>
      </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ResultRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: 'var(--muted-2)', fontWeight: 700, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: value ? 'var(--text)' : 'var(--muted-2)', fontStyle: value ? 'normal' : 'italic' }}>
        {value ?? '인식 안 됨'}
      </div>
    </div>
  )
}
