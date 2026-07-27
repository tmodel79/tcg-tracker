'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'

export interface CardVariant {
  id: string
  name: string
  image_url: string
  variant_name?: string
  set_name?: string
}

interface CardVariantPickerProps {
  game: string
  cardNumber: string      // 입력된 카드번호
  selectedUrl: string     // 현재 선택된 image_url
  onSelect: (variant: CardVariant) => void
}

export function CardVariantPicker({ game, cardNumber, selectedUrl, onSelect }: CardVariantPickerProps) {
  const { t } = useI18n()
  const [variants, setVariants] = useState<CardVariant[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState('')
  const [error, setError] = useState('')

  const SUPPORTED = ['원피스', '포켓몬', '드래곤볼', '유희왕']

  useEffect(() => {
    const num = cardNumber.trim()
    if (!num || num.length < 3 || !SUPPORTED.includes(game)) {
      setVariants([])
      setSearched('')
      return
    }
    if (num === searched) return

    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(
          `/api/card-variants?game=${encodeURIComponent(game)}&number=${encodeURIComponent(num)}`
        )
        const data = await res.json()
        setVariants(data.variants ?? [])
        setSearched(num)
        if ((data.variants ?? []).length === 0) {
          setError(t('variant_none'))
        }
      } catch {
        setError(t('variant_error'))
      } finally {
        setLoading(false)
      }
    }, 700) // 700ms 디바운스

    return () => clearTimeout(timer)
  }, [cardNumber, game]) // eslint-disable-line

  if (!SUPPORTED.includes(game)) {
    return (
      <p style={{ color: 'var(--muted-2)', fontSize: 12, marginTop: 6 }}>
        {t('variant_unsupported')}
      </p>
    )
  }

  if (cardNumber.trim().length < 3) return null

  return (
    <div style={{ marginTop: 10 }}>
      {loading && (
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>🔍 {t('variant_searching')}</p>
      )}

      {!loading && error && (
        <p style={{ color: 'var(--muted-2)', fontSize: 12 }}>{error}</p>
      )}

      {!loading && variants.length > 0 && (
        <>
          <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 8 }}>
            {t('variant_found', { n: variants.length })}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
              gap: 8,
              maxHeight: 280,
              overflowY: 'auto',
              padding: 2,
            }}
          >
            {variants.map((v) => {
              const isSelected = v.image_url === selectedUrl
              return (
                <div
                  key={v.id}
                  onClick={() => onSelect(v)}
                  title={[v.name, v.variant_name, v.set_name].filter(Boolean).join(' · ')}
                  style={{
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: isSelected
                      ? '2.5px solid var(--accent)'
                      : '2px solid transparent',
                    cursor: 'pointer',
                    background: 'var(--panel-2)',
                    transition: 'border 0.12s, transform 0.12s',
                    transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                    position: 'relative',
                  }}
                >
                  <img
                    src={v.image_url}
                    alt={v.name}
                    style={{ width: '100%', aspectRatio: '63/88', objectFit: 'cover', display: 'block' }}
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  {v.variant_name && (
                    <div
                      style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#ddd', fontSize: 9, fontWeight: 700,
                        padding: '3px 4px', textAlign: 'center',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}
                    >
                      {v.variant_name}
                    </div>
                  )}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        background: 'var(--accent)',
                        color: '#111', fontSize: 10, fontWeight: 800,
                        width: 18, height: 18, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
