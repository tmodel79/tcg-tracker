'use client'

// ========================================
// 시세 검색 탭 — 카드 검색 → 마켓별 가격 비교
// ========================================

import { useState } from 'react'
import { GAMES } from '@/types/card'
import type { Game, Language } from '@/types/card'

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: 'JP', label: '일판', flag: '🇯🇵' },
  { value: 'EN', label: '영판', flag: '🇺🇸' },
  { value: 'FR', label: '프판', flag: '🇫🇷' },
  { value: 'KR', label: '한판', flag: '🇰🇷' },
]

interface PriceResult {
  source: string
  label: string
  price: number | null
  rawPrice: number | null
  currency: string
  url: string
  soldCount?: number
  avgPrice?: number | null
  error?: string
}

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

export function PriceSearch() {
  const [cardName, setCardName]     = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [game, setGame]             = useState<Game>('원피스')
  const [language, setLanguage]     = useState<Language>('JP')
  const [results, setResults]       = useState<PriceResult[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [searched, setSearched]     = useState(false)

  const handleSearch = async () => {
    if (!cardName.trim()) { setError('카드명을 입력해주세요'); return }
    setLoading(true)
    setError('')
    setSearched(false)
    try {
      const params = new URLSearchParams({
        name: cardName.trim(),
        game,
        lang: language,
        ...(cardNumber.trim() ? { cardNumber: cardNumber.trim() } : {}),
      })
      const res = await fetch(`/api/price?${params}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setResults(json.results || [])
      setSearched(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '검색 실패')
    } finally {
      setLoading(false)
    }
  }

  // 최저가 계산
  const pricedResults = results.filter(r => r.price != null)
  const cheapestPrice = pricedResults.length > 0
    ? Math.min(...pricedResults.map(r => r.price!))
    : null

  return (
    <div>
      {/* 제목 */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>🔍 시세 검색</h2>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
          카드명을 검색하면 eBay·TCGPlayer·130point·KREAM·번개장터 가격을 한눈에 비교합니다
        </p>
      </div>

      {/* 검색 폼 */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '18px 18px 16px',
        marginBottom: 20,
      }}>
        {/* 카드명 + 번호 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginBottom: 5, fontWeight: 600 }}>
              카드명 *
            </label>
            <input
              style={fieldStyle}
              value={cardName}
              onChange={e => setCardName(e.target.value)}
              placeholder="예: Monkey D. Luffy"
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              autoFocus
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginBottom: 5, fontWeight: 600 }}>
              카드번호 (선택)
            </label>
            <input
              style={fieldStyle}
              value={cardNumber}
              onChange={e => setCardNumber(e.target.value)}
              placeholder="예: OP01-001"
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>

        {/* 게임 + 언어판 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginBottom: 5, fontWeight: 600 }}>
              게임
            </label>
            <select style={fieldStyle} value={game} onChange={e => setGame(e.target.value as Game)}>
              {GAMES.filter(g => g !== '기타').map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginBottom: 5, fontWeight: 600 }}>
              언어판
            </label>
            <div style={{ display: 'flex', gap: 5 }}>
              {LANGUAGES.map(l => (
                <button
                  key={l.value}
                  onClick={() => setLanguage(l.value)}
                  style={{
                    flex: 1, padding: '7px 2px', borderRadius: 8,
                    border: `1px solid ${language === l.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: language === l.value ? 'rgba(232,177,58,.15)' : 'var(--panel-2)',
                    color: language === l.value ? 'var(--accent)' : 'var(--muted)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                    transition: 'all 0.12s',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 검색 버튼 */}
        <button
          onClick={handleSearch}
          disabled={loading || !cardName.trim()}
          style={{
            width: '100%', padding: '11px', borderRadius: 9, fontSize: 14, fontWeight: 700,
            border: 'none', cursor: loading || !cardName.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            background: loading || !cardName.trim() ? 'var(--panel-3)' : 'var(--accent)',
            color: loading || !cardName.trim() ? 'var(--muted)' : 'var(--accent-ink)',
            transition: 'all 0.15s',
          }}
        >
          {loading ? '⏳ 검색 중…' : '🔍 시세 검색'}
        </button>

        {error && (
          <p style={{ color: 'var(--gain)', fontSize: 12, marginTop: 8, marginBottom: 0 }}>{error}</p>
        )}
      </div>

      {/* 결과 */}
      {searched && (
        <div>
          {/* 최저가 배너 */}
          {cheapestPrice != null && (
            <div style={{
              background: 'rgba(232,177,58,.12)',
              border: '1px solid var(--accent)',
              borderRadius: 12,
              padding: '10px 14px',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 18 }}>🏆</span>
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 700 }}>최저가</div>
                <div className="num" style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>
                  {cheapestPrice.toLocaleString('ko-KR')}원
                </div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
                {language === 'KR' ? '직접 확인 필요' : `${pricedResults.find(r => r.price === cheapestPrice)?.label}`}
              </div>
            </div>
          )}

          {/* 마켓별 결과 카드 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map((r) => {
              const isCheapest = r.price != null && r.price === cheapestPrice
              return (
                <div
                  key={r.source}
                  style={{
                    background: 'var(--panel)',
                    border: `1px solid ${isCheapest ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 12,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    position: 'relative',
                  }}
                >
                  {isCheapest && (
                    <span style={{
                      position: 'absolute', top: -10, left: 12,
                      background: 'var(--accent)', color: 'var(--accent-ink)',
                      fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6,
                    }}>
                      최저가
                    </span>
                  )}

                  {/* 마켓 정보 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>
                      {r.label}
                      {r.soldCount != null && r.soldCount > 0 && (
                        <span style={{ color: 'var(--muted-2)', fontWeight: 400, marginLeft: 6, fontSize: 11 }}>
                          최근 {r.soldCount}건 평균
                        </span>
                      )}
                    </div>
                    {r.price != null ? (
                      <div>
                        <span className="num" style={{ fontSize: 20, fontWeight: 800 }}>
                          {r.price.toLocaleString('ko-KR')}원
                        </span>
                        {r.rawPrice != null && r.currency !== 'KRW' && (
                          <span style={{ color: 'var(--muted-2)', fontSize: 12, marginLeft: 6 }}>
                            ({r.currency === 'USD' ? '$' : r.currency === 'JPY' ? '¥' : '€'}
                            {r.rawPrice.toLocaleString()})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12.5, color: 'var(--muted-2)', fontStyle: 'italic' }}>
                        {r.source === 'kream' || r.source === 'bunjang'
                          ? '사이트에서 직접 확인'
                          : '가격 정보 없음 — 링크에서 확인'}
                      </span>
                    )}
                  </div>

                  {/* 링크 버튼 */}
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flexShrink: 0,
                      padding: '7px 13px',
                      background: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text)',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    사이트 열기 →
                  </a>
                </div>
              )
            })}
          </div>

          <p style={{ fontSize: 11, color: 'var(--muted-2)', textAlign: 'center', marginTop: 14 }}>
            * 환율 참고값: USD≈1,380 / JPY≈9.1 / EUR≈1,500 · 실제 시세와 다를 수 있습니다
          </p>
        </div>
      )}

      {searched && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔎</div>
          <div style={{ fontWeight: 600 }}>검색 결과가 없습니다</div>
          <div style={{ fontSize: 12.5, marginTop: 6 }}>카드명을 영어로 입력하거나 카드번호를 추가해보세요</div>
        </div>
      )}
    </div>
  )
}
