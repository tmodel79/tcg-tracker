'use client'

import { useEffect, useState } from 'react'
import { won, numParse, todayISO } from '@/lib/utils'
import { GAMES, FX_DEFAULT } from '@/types/card'
import type { Card, Currency, Game } from '@/types/card'

interface CardModalProps {
  open: boolean
  card: Card | null        // null = 신규 추가
  onClose: () => void
  onSave: (data: Partial<Card>, isNew: boolean) => void
  onDelete: (id: string) => void
}

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'KRW', label: '원 (KRW)' },
  { value: 'USD', label: '달러 (USD)' },
  { value: 'JPY', label: '엔 (JPY)' },
  { value: 'EUR', label: '유로 (EUR)' },
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

export function CardModal({ open, card, onClose, onSave, onDelete }: CardModalProps) {
  const [name, setName] = useState('')
  const [game, setGame] = useState<Game>('원피스')
  const [grade, setGrade] = useState('')
  const [buyDate, setBuyDate] = useState(todayISO())
  const [buyPrice, setBuyPrice] = useState('')
  const [currency, setCurrency] = useState<Currency>('KRW')
  const [fxRate, setFxRate] = useState('1')
  const [customs, setCustoms] = useState('')
  const [shipping, setShipping] = useState('')
  const [etcCost, setEtcCost] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')
  const [err, setErr] = useState('')

  // 카드 데이터로 폼 초기화
  useEffect(() => {
    if (!open) return
    if (card) {
      setName(card.name)
      setGame(card.game)
      setGrade(card.grade || '')
      setBuyDate(card.buy_date || todayISO())
      setBuyPrice(card.buy_price ? String(card.buy_price) : '')
      setCurrency(card.currency)
      setFxRate(String(card.fx_rate))
      setCustoms(card.customs ? String(card.customs) : '')
      setShipping(card.shipping ? String(card.shipping) : '')
      setEtcCost(card.etc_cost ? String(card.etc_cost) : '')
      setCurrentPrice(card.current_price != null ? String(card.current_price) : '')
    } else {
      setName('')
      setGame('원피스')
      setGrade('')
      setBuyDate(todayISO())
      setBuyPrice('')
      setCurrency('KRW')
      setFxRate('1')
      setCustoms('')
      setShipping('')
      setEtcCost('')
      setCurrentPrice('')
    }
    setErr('')
  }, [open, card])

  // 통화 변경 시 환율 자동 세팅
  const handleCurrencyChange = (cur: Currency) => {
    setCurrency(cur)
    if (cur === 'KRW') {
      setFxRate('1')
    } else {
      setFxRate(String(FX_DEFAULT[cur]))
    }
  }

  // 총원가 실시간 계산
  const totalCost =
    numParse(buyPrice) * (numParse(fxRate) || 1) +
    numParse(customs) +
    numParse(shipping) +
    numParse(etcCost)

  const handleSave = () => {
    if (!name.trim()) {
      setErr('카드명을 입력해 주세요.')
      return
    }
    const hasNow = currentPrice !== ''
    const data: Partial<Card> = {
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
    }

    // 시세가 바뀌면 직전 시세 보관
    if (card && hasNow && card.current_price != null) {
      const newNow = numParse(currentPrice)
      if (Number(card.current_price) !== newNow) {
        data.prev_price = Number(card.current_price)
      } else {
        data.prev_price = card.prev_price
      }
    }

    onSave(data, !card)
  }

  const handleDelete = () => {
    if (!card) return
    if (!confirm('이 카드를 삭제할까요? 되돌릴 수 없어요.')) return
    onDelete(card.id)
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
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal-pop"
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 540,
          padding: '22px 22px 20px',
        }}
        role="dialog"
        aria-modal="true"
      >
        <h2 style={{ margin: '0 0 2px', fontSize: 17, fontWeight: 800 }}>
          {card ? '카드 수정' : '카드 추가'}
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 12.5, margin: '0 0 18px' }}>
          노란 골드 숫자(총원가)는 자동으로 계산돼요. 시세만 나중에 바꿔주면 됩니다.
        </p>

        {/* 기본 정보 */}
        <Section title="기본 정보">
          <Field label="카드명 *">
            <input
              style={fieldStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: Luffy P-033 / Heihachi Yui RP-001"
              autoFocus
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
            <Field label="게임">
              <select
                style={fieldStyle}
                value={game}
                onChange={(e) => setGame(e.target.value as Game)}
              >
                {GAMES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </Field>
            <Field label="버전 · 등급">
              <input
                style={fieldStyle}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="예: PSA 10"
              />
            </Field>
            <Field label="구매일">
              <input
                type="date"
                style={fieldStyle}
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* 구매 금액 */}
        <Section title="구매 금액">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
            <Field label="구매가">
              <input
                style={fieldStyle}
                inputMode="decimal"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="통화">
              <select
                style={fieldStyle}
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={currency === 'KRW' ? '환율' : `환율 (1 ${currency} = ? 원)`}>
              <input
                style={fieldStyle}
                inputMode="decimal"
                value={fxRate}
                onChange={(e) => setFxRate(e.target.value)}
                disabled={currency === 'KRW'}
                placeholder="1"
              />
            </Field>
          </div>
          <p style={{ color: 'var(--muted-2)', fontSize: 11.5, marginTop: 6, lineHeight: 1.4 }}>
            {currency === 'KRW'
              ? '원화 구매는 환율이 1로 고정됩니다.'
              : `기본값은 참고용이에요. 실제 결제 시점 환율로 직접 수정하세요. (예: 1 ${currency} ≈ ${FX_DEFAULT[currency]}원)`}
          </p>
        </Section>

        {/* 부대 비용 */}
        <Section title="부대 비용 (원화)">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
            <Field label="관세">
              <input style={fieldStyle} inputMode="decimal" value={customs} onChange={(e) => setCustoms(e.target.value)} placeholder="0" />
            </Field>
            <Field label="배송대행비">
              <input style={fieldStyle} inputMode="decimal" value={shipping} onChange={(e) => setShipping(e.target.value)} placeholder="0" />
            </Field>
            <Field label="기타비용">
              <input style={fieldStyle} inputMode="decimal" value={etcCost} onChange={(e) => setEtcCost(e.target.value)} placeholder="0" />
            </Field>
          </div>
        </Section>

        {/* 현재 시세 */}
        <Section title="현재 시세 (원화)">
          <Field label="현재가 — 지금 시세 (비워두면 손익 계산 제외)">
            <input
              style={fieldStyle}
              inputMode="decimal"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              placeholder="예: 1,030,000"
            />
          </Field>
        </Section>

        {/* 총원가 미리보기 */}
        <div
          style={{
            background: 'var(--panel-2)',
            border: '1px dashed var(--border)',
            borderRadius: 10,
            padding: '11px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 2,
          }}
        >
          <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 600 }}>
            총원가 (자동 계산)
          </span>
          <span className="num" style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>
            {won(totalCost)}
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
                background: 'transparent',
                border: '1px solid #4a2730',
                color: 'var(--gain)',
                borderRadius: 9,
                padding: '9px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              삭제
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button
            onClick={onClose}
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
            onClick={handleSave}
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              border: '1px solid var(--accent)',
              borderRadius: 9,
              padding: '9px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 9,
        }}
      >
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
