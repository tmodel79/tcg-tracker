/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { numParse, todayISO } from '@/lib/utils'
import { uploadCardImage } from '@/lib/supabase'
import { GAMES, FX_DEFAULT } from '@/types/card'
import { useI18n } from '@/lib/i18n'
import { CameraModal } from './CameraModal'
import { CardVariantPicker } from './CardVariantPicker'
import type { CardVariant } from './CardVariantPicker'
import type { OcrResult } from './CameraModal'
import type { Card, Currency, Game, Language } from '@/types/card'

export interface CardPrefill {
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
}

interface CardModalProps {
  open: boolean
  card: Card | null
  prefill?: CardPrefill
  onClose: () => void
  onSave: (data: Partial<Card>, isNew: boolean) => void
  onDelete: (id: string) => void
}

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: 'JP', label: '일판', flag: '🇯🇵' },
  { value: 'EN', label: '영판', flag: '🇺🇸' },
  { value: 'FR', label: '프판', flag: '🇫🇷' },
  { value: 'KR', label: '한판', flag: '🇰🇷' },
]

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'KRW', label: '₩ KRW' },
  { value: 'USD', label: '$ USD' },
  { value: 'JPY', label: '¥ JPY' },
  { value: 'EUR', label: '€ EUR' },
]

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--panel-2)',
  border: '1px solid var(--border)',
  borderRadius: 9,
  padding: '9px 11px',
  color: 'var(--text)',
  fontSize: 13.5,
  fontFamily: 'inherit',
  fontVariantNumeric: 'tabular-nums',
  outline: 'none',
}

export function CardModal({ open, card, prefill, onClose, onSave, onDelete }: CardModalProps) {
  const { t, fmt } = useI18n()
  const ex = t('ex')

  // 기본 필드
  const [name, setName] = useState('')
  const [game, setGame] = useState<Game>('원피스')
  const [grade, setGrade] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [buyDate, setBuyDate] = useState(todayISO())
  const [buyPrice, setBuyPrice] = useState('')
  const [currency, setCurrency] = useState<Currency>('KRW')
  const [fxRate, setFxRate] = useState('1')
  const [customs, setCustoms] = useState('')
  const [shipping, setShipping] = useState('')
  const [etcCost, setEtcCost] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')
  const [language, setLanguage] = useState<Language | null>(null)
  const [err, setErr] = useState('')

  // 시세 조회 상태
  const [priceResults, setPriceResults] = useState<any[]>([])
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError, setPriceError] = useState('')
  const [priceChecked, setPriceChecked] = useState(false)

  // 이미지
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 카메라
  const [cameraOpen, setCameraOpen] = useState(false)

  // 카드 ID (이미지 업로드 경로 결정용)
  const [pendingCardId, setPendingCardId] = useState<string>('')

  // 폼 초기화
  useEffect(() => {
    if (!open) return
    const newId = card?.id ?? crypto.randomUUID()
    setPendingCardId(newId)

    if (card) {
      setName(card.name)
      setGame(card.game)
      setGrade(card.grade || '')
      setCardNumber(card.card_number || '')
      setBuyDate(card.buy_date || todayISO())
      setBuyPrice(card.buy_price ? String(card.buy_price) : '')
      setCurrency(card.currency)
      setFxRate(String(card.fx_rate))
      setCustoms(card.customs ? String(card.customs) : '')
      setShipping(card.shipping ? String(card.shipping) : '')
      setEtcCost(card.etc_cost ? String(card.etc_cost) : '')
      setCurrentPrice(card.current_price != null ? String(card.current_price) : '')
      setImageUrl(card.image_url || '')
      setLanguage(card.language || null)
    } else if (prefill) {
      // URL / 영수증 OCR 자동 채우기
      setName(prefill.name || '')
      setGame(prefill.game && GAMES.includes(prefill.game) ? prefill.game : '원피스')
      setGrade('')
      setCardNumber(prefill.cardNumber || '')
      setBuyDate(todayISO())
      setBuyPrice(prefill.buyPrice || '')
      setCurrency(prefill.currency || 'KRW')
      setFxRate(prefill.fxRate || (prefill.currency && prefill.currency !== 'KRW' ? String(FX_DEFAULT[prefill.currency]) : '1'))
      setCustoms(prefill.customs || '')
      setShipping(prefill.shipping || '')
      setEtcCost('')
      setCurrentPrice('')
      setImageUrl(prefill.imageUrl || '')
      setLanguage(prefill.language ?? null)
    } else {
      setName('')
      setGame('원피스')
      setGrade('')
      setCardNumber('')
      setBuyDate(todayISO())
      setBuyPrice('')
      setCurrency('KRW')
      setFxRate('1')
      setCustoms('')
      setShipping('')
      setEtcCost('')
      setCurrentPrice('')
      setImageUrl('')
      setLanguage(null)
    }
    setErr('')
    setPriceResults([])
    setPriceChecked(false)
    setPriceError('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, card])

  // 시세 조회
  const handlePriceLookup = useCallback(async () => {
    if (!name.trim()) { setPriceError('카드명을 먼저 입력해주세요'); return }
    if (!language) { setPriceError('언어판을 선택해주세요'); return }
    setPriceLoading(true)
    setPriceError('')
    setPriceChecked(false)
    try {
      const params = new URLSearchParams({
        name: name.trim(),
        game,
        lang: language,
        ...(cardNumber ? { cardNumber } : {}),
      })
      const res = await fetch(`/api/price?${params}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setPriceResults(json.results || [])
      setPriceChecked(true)
    } catch (e: any) {
      setPriceError(e.message || '시세 조회 실패')
    } finally {
      setPriceLoading(false)
    }
  }, [name, game, language, cardNumber])

  const handleCurrencyChange = (cur: Currency) => {
    setCurrency(cur)
    setFxRate(cur === 'KRW' ? '1' : String(FX_DEFAULT[cur]))
  }

  const totalCost =
    numParse(buyPrice) * (numParse(fxRate) || 1) +
    numParse(customs) +
    numParse(shipping) +
    numParse(etcCost)

  // 파일 업로드
  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true)
      const url = await uploadCardImage(file, pendingCardId)
      setImageUrl(url)
    } catch (e: any) {
      setErr(t('img_upload_fail', { msg: e.message }))
    } finally {
      setUploading(false)
    }
  }

  // 카메라 캡처 완료
  const handleCameraCapture = async (dataUrl: string, ocrResult?: OcrResult) => {
    setCameraOpen(false)

    // dataUrl → File 변환 후 Supabase Storage 업로드
    try {
      setUploading(true)
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `${pendingCardId}.jpg`, { type: 'image/jpeg' })
      const url = await uploadCardImage(file, pendingCardId)
      setImageUrl(url)
    } catch {
      // 업로드 실패 시 dataUrl 직접 사용 (임시)
      setImageUrl(dataUrl)
    } finally {
      setUploading(false)
    }

    // OCR 결과 자동 채우기
    if (ocrResult) {
      if (ocrResult.name && !name) setName(ocrResult.name)
      if (ocrResult.card_number && !cardNumber) setCardNumber(ocrResult.card_number)
      if (ocrResult.game && GAMES.includes(ocrResult.game as Game)) setGame(ocrResult.game as Game)
      if (ocrResult.grade && !grade) setGrade(ocrResult.grade)
    }
  }

  // 카드 변형 선택
  const handleVariantSelect = (variant: CardVariant) => {
    setImageUrl(variant.image_url)
    if (!name) setName(variant.name)
  }

  const handleSave = () => {
    if (!name.trim()) { setErr(t('err_name_required')); return }

    const hasNow = currentPrice !== ''
    const data: Partial<Card> = {
      ...(card ? {} : { id: pendingCardId }),
      name: name.trim(),
      game,
      grade: grade || null,
      buy_date: buyDate || null,
      buy_price: numParse(buyPrice),
      currency,
      fx_rate: numParse(fxRate) || 1,
      customs: numParse(customs),
      shipping: numParse(shipping),
      etc_cost: numParse(etcCost),
      current_price: hasNow ? numParse(currentPrice) : null,
      card_number: cardNumber.trim() || null,
      image_url: imageUrl || null,
      language: language || null,
    }

    if (card && hasNow && card.current_price != null) {
      const newNow = numParse(currentPrice)
      data.prev_price = Number(card.current_price) !== newNow ? Number(card.current_price) : card.prev_price
    }

    onSave(data, !card)
  }

  const handleDelete = () => {
    if (!card) return
    if (!confirm(t('confirm_delete'))) return
    onDelete(card.id)
  }

  if (!open) return null

  return (
    <>
      {/* 카메라 모달 */}
      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* 카드 등록/수정 모달 */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(4,7,11,.72)',
          backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '40px 16px', zIndex: 50, overflowY: 'auto',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div
          className="modal-pop"
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            width: '100%', maxWidth: 560,
            padding: '22px 22px 20px',
          }}
          role="dialog"
          aria-modal="true"
        >
          <h2 style={{ margin: '0 0 2px', fontSize: 17, fontWeight: 800 }}>
            {card ? t('modal_edit_title') : t('modal_add_title')}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 12.5, margin: '0 0 18px' }}>
            {t('modal_subtitle')}
          </p>

          {/* ── 카드 이미지 섹션 ── */}
          <Section title={t('sec_image')}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {/* 미리보기 */}
              <div
                style={{
                  flexShrink: 0,
                  width: 90, height: 126,
                  borderRadius: 8,
                  border: '1px dashed var(--border)',
                  background: 'var(--panel-2)',
                  overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt="card"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={() => setImageUrl('')}
                    />
                    <button
                      onClick={() => setImageUrl('')}
                      style={{
                        position: 'absolute', top: 3, right: 3,
                        background: 'rgba(0,0,0,0.65)', color: '#fff',
                        border: 'none', borderRadius: '50%',
                        width: 20, height: 20, fontSize: 12,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >×</button>
                  </>
                ) : uploading ? (
                  <span style={{ color: 'var(--muted)', fontSize: 11 }}>{t('uploading')}</span>
                ) : (
                  <span style={{ color: 'var(--muted-2)', fontSize: 22 }}>🃏</span>
                )}
              </div>

              {/* 버튼들 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* 파일 업로드 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                    e.target.value = ''
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    ...btnSecondary,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {t('btn_file_upload')}
                </button>

                {/* 카메라 스캔 */}
                <button
                  onClick={() => setCameraOpen(true)}
                  disabled={uploading}
                  style={{
                    ...btnSecondary,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {t('btn_camera')}
                </button>

                {/* URL 직접 입력 */}
                <input
                  style={{ ...fieldStyle, fontSize: 12 }}
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder={t('img_url_placeholder')}
                />
              </div>
            </div>

            {/* 카드번호 입력 → 변형 선택 */}
            <div style={{ marginTop: 12 }}>
              <Field label={t('field_card_number')}>
                <input
                  style={fieldStyle}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder={`${ex}: OP01-001, P-033, sv1-001`}
                />
              </Field>
              <CardVariantPicker
                game={game}
                cardNumber={cardNumber}
                selectedUrl={imageUrl}
                onSelect={handleVariantSelect}
              />
            </div>
          </Section>

          {/* ── 기본 정보 ── */}
          <Section title={t('sec_info')}>
            <Field label={t('field_card_name')}>
              <input
                style={fieldStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${ex}: Luffy P-033 / Heihachi Yui RP-001`}
                autoFocus
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
              <Field label={t('field_game')}>
                <select style={fieldStyle} value={game} onChange={(e) => setGame(e.target.value as Game)}>
                  {GAMES.map((g) => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field label={t('field_grade')}>
                <input
                  style={fieldStyle}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder={`${ex}: PSA 10`}
                />
              </Field>
              <Field label={t('field_buy_date')}>
                <input
                  type="date"
                  style={fieldStyle}
                  value={buyDate}
                  onChange={(e) => setBuyDate(e.target.value)}
                />
              </Field>
            </div>
            {/* 언어판 선택 */}
            <Field label="언어판 (시세 조회용)">
              <div style={{ display: 'flex', gap: 6 }}>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLanguage(language === l.value ? null : l.value)}
                    style={{
                      flex: 1,
                      padding: '7px 4px',
                      borderRadius: 8,
                      border: `1px solid ${language === l.value ? 'var(--accent)' : 'var(--border)'}`,
                      background: language === l.value ? 'rgba(232,177,58,.15)' : 'var(--panel-2)',
                      color: language === l.value ? 'var(--accent)' : 'var(--muted)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      transition: 'all 0.12s',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            </Field>
          </Section>

          {/* ── 구매 금액 ── */}
          <Section title={t('sec_purchase')}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
              <Field label={t('field_buy_price')}>
                <input style={fieldStyle} inputMode="decimal" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} placeholder="0" />
              </Field>
              <Field label={t('field_currency')}>
                <select style={fieldStyle} value={currency} onChange={(e) => handleCurrencyChange(e.target.value as Currency)}>
                  {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              <Field label={currency === 'KRW' ? t('field_fx_rate') : t('field_fx_rate_detail', { cur: currency })}>
                <input
                  style={fieldStyle} inputMode="decimal" value={fxRate}
                  onChange={(e) => setFxRate(e.target.value)}
                  disabled={currency === 'KRW'} placeholder="1"
                />
              </Field>
            </div>
            <p style={{ color: 'var(--muted-2)', fontSize: 11.5, marginTop: 6, lineHeight: 1.4 }}>
              {currency === 'KRW'
                ? t('krw_fx_note')
                : t('fx_note', { cur: currency, rate: FX_DEFAULT[currency] })}
            </p>
          </Section>

          {/* ── 부대 비용 ── */}
          <Section title={t('sec_extra')}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
              <Field label={t('field_customs')}>
                <input style={fieldStyle} inputMode="decimal" value={customs} onChange={(e) => setCustoms(e.target.value)} placeholder="0" />
              </Field>
              <Field label={t('field_shipping')}>
                <input style={fieldStyle} inputMode="decimal" value={shipping} onChange={(e) => setShipping(e.target.value)} placeholder="0" />
              </Field>
              <Field label={t('field_etc_cost')}>
                <input style={fieldStyle} inputMode="decimal" value={etcCost} onChange={(e) => setEtcCost(e.target.value)} placeholder="0" />
              </Field>
            </div>
          </Section>

          {/* ── 현재 시세 ── */}
          <Section title={t('sec_current')}>
            <Field label={t('field_current_price')}>
              <input
                style={fieldStyle} inputMode="decimal" value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                placeholder={`${ex}: 1,030,000`}
              />
            </Field>
          </Section>

          {/* ── 마켓 시세 조회 ── */}
          <Section title="마켓 시세 조회">
            <div style={{ marginBottom: 10 }}>
              <button
                onClick={handlePriceLookup}
                disabled={priceLoading || !name.trim() || !language}
                style={{
                  width: '100%',
                  background: (priceLoading || !name.trim() || !language)
                    ? 'var(--panel-3)'
                    : 'var(--accent)',
                  color: (priceLoading || !name.trim() || !language)
                    ? 'var(--muted)'
                    : 'var(--accent-ink)',
                  border: 'none',
                  borderRadius: 9,
                  padding: '10px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: (priceLoading || !name.trim() || !language) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {priceLoading ? '⏳ 조회 중...' : '🔍 시세 조회하기'}
              </button>
              {!language && name.trim() && (
                <p style={{ color: 'var(--muted)', fontSize: 11.5, marginTop: 5, textAlign: 'center' }}>
                  위에서 언어판을 선택하면 해당 마켓 시세를 조회합니다
                </p>
              )}
            </div>

            {priceError && (
              <p style={{ color: 'var(--gain)', fontSize: 12, marginBottom: 8 }}>{priceError}</p>
            )}

            {priceChecked && priceResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {priceResults.map((r) => {
                  const hasPrice = r.price != null
                  // 현재 입력된 totalCost 대비
                  const pctVsCost = hasPrice && totalCost > 0
                    ? ((r.price - totalCost) / totalCost * 100)
                    : null

                  return (
                    <div
                      key={r.source}
                      style={{
                        background: 'var(--panel-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '10px 12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                            {r.label}
                            {r.soldCount != null && r.soldCount > 0 && (
                              <span style={{ color: 'var(--muted-2)', fontWeight: 400, marginLeft: 6, fontSize: 11 }}>
                                최근 {r.soldCount}건
                              </span>
                            )}
                          </div>
                          {hasPrice ? (
                            <div>
                              <span className="num" style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                                {r.price.toLocaleString('ko-KR')}원
                              </span>
                              {r.rawPrice && r.currency !== 'KRW' && (
                                <span style={{ color: 'var(--muted-2)', fontSize: 11, marginLeft: 6 }}>
                                  ({r.currency === 'USD' ? '$' : r.currency === 'JPY' ? '¥' : '€'}{r.rawPrice.toLocaleString()})
                                </span>
                              )}
                              {pctVsCost != null && (
                                <span
                                  style={{
                                    marginLeft: 8,
                                    fontSize: 13,
                                    fontWeight: 800,
                                    color: pctVsCost >= 0 ? 'var(--gain)' : 'var(--loss)',
                                  }}
                                >
                                  {pctVsCost >= 0 ? '+' : ''}{pctVsCost.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>
                              {r.source === 'kream' || r.source === 'bunjang'
                                ? '직접 확인 필요'
                                : '가격 정보 없음'}
                            </span>
                          )}
                        </div>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flexShrink: 0,
                            padding: '6px 12px',
                            background: 'var(--panel-3)',
                            border: '1px solid var(--border)',
                            borderRadius: 7,
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: 'var(--text)',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          사이트 열기 →
                        </a>
                      </div>
                    </div>
                  )
                })}

                <p style={{ fontSize: 11, color: 'var(--muted-2)', textAlign: 'center', marginTop: 2 }}>
                  * 원가 대비 수익률 기준 · 환율은 참고값 (USD≈1,380 / JPY≈9.1 / EUR≈1,500)
                </p>
              </div>
            )}
          </Section>

          {/* ── 총원가 미리보기 ── */}
          <div
            style={{
              background: 'var(--panel-2)', border: '1px dashed var(--border)',
              borderRadius: 10, padding: '11px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2,
            }}
          >
            <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 600 }}>{t('total_cost_label')}</span>
            <span className="num" style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>
              {fmt(totalCost)}
            </span>
          </div>

          {/* 에러 */}
          <p style={{ color: 'var(--gain)', fontSize: 12, marginTop: 8, minHeight: 16 }}>{err}</p>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            {card && (
              <button
                onClick={handleDelete}
                style={{
                  background: 'transparent', border: '1px solid #4a2730',
                  color: 'var(--gain)', borderRadius: 9, padding: '9px 14px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {t('btn_delete')}
              </button>
            )}
            <span style={{ flex: 1 }} />
            <button
              onClick={onClose}
              style={{
                background: 'var(--panel-2)', color: 'var(--text)',
                border: '1px solid var(--border)', borderRadius: 9, padding: '9px 14px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t('btn_cancel')}
            </button>
            <button
              onClick={handleSave}
              style={{
                background: 'var(--accent)', color: 'var(--accent-ink)',
                border: '1px solid var(--accent)', borderRadius: 9, padding: '9px 14px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t('btn_save')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const btnSecondary: React.CSSProperties = {
  background: 'var(--panel-2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 9,
  padding: '8px 12px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  width: '100%',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 11.5, fontWeight: 700, color: 'var(--accent)',
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 9,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5, fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  )
}
