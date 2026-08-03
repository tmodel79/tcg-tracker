'use client'

// ========================================
// 시세 검색 탭 — 카드 검색 → 마켓별 가격 비교
// ========================================

import { useEffect, useState } from 'react'
import { GAMES, GAME_LABEL_KEYS } from '@/types/card'
import { useI18n } from '@/lib/i18n'
import type { Game, Language } from '@/types/card'
import { IconSearch, IconStar } from './Icons'
import {
  loadWatchlist,
  upsertWatchlistItem,
  removeWatchlistItem,
  toggleWatchlistAlert,
  logSearch,
  loadRecentSearches,
  type WatchlistItem,
} from '@/lib/supabase'

const LANGUAGES: { value: Language; labelKey: string; flag: string }[] = [
  { value: 'JP', labelKey: 'lang_jp', flag: '🇯🇵' },
  { value: 'EN', labelKey: 'lang_en', flag: '🇺🇸' },
  { value: 'FR', labelKey: 'lang_fr', flag: '🇫🇷' },
  { value: 'KR', labelKey: 'lang_kr', flag: '🇰🇷' },
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
  const { t } = useI18n()
  const [cardName, setCardName]     = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [game, setGame]             = useState<Game>('원피스')
  const [language, setLanguage]     = useState<Language>('JP')
  const [results, setResults]       = useState<PriceResult[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [searched, setSearched]     = useState(false)

  // 실제로 검색이 실행된 카드 정보 (입력 폼 값이 바뀌어도 결과 화면과 매칭이 어긋나지 않도록 별도 보관)
  const [searchedCardName, setSearchedCardName]     = useState('')
  const [searchedCardNumber, setSearchedCardNumber] = useState('')
  const [searchedGame, setSearchedGame]             = useState<Game>('원피스')

  // 관심목록(찜) + 알림
  const [watchlist, setWatchlist]   = useState<WatchlistItem[]>([])
  const [watchBusy, setWatchBusy]   = useState(false)
  const [toast, setToast]           = useState('')

  // 최근 검색어
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [nameFocused, setNameFocused]       = useState(false)

  // 마운트 시 관심목록 + 최근 검색어 로드 (비로그인 상태면 조용히 무시)
  useEffect(() => {
    let mounted = true
    loadWatchlist()
      .then(list => { if (mounted) setWatchlist(list) })
      .catch(() => { /* 비로그인 또는 조회 실패 — 관심목록 기능만 비활성 상태로 둔다 */ })
    loadRecentSearches()
      .then(list => { if (mounted) setRecentSearches(list) })
      .catch(() => { /* 비로그인 또는 조회 실패 — 최근 검색어 없이 진행 */ })
    return () => { mounted = false }
  }, [])

  // 토스트 자동 소멸
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const handleSearch = async (queryOverride?: string) => {
    const name = (queryOverride ?? cardName).trim()
    if (!name) { setError(t('err_name_required')); return }
    if (queryOverride !== undefined) setCardName(queryOverride)
    logSearch(name, game) // best-effort — 실패해도 검색 흐름을 막지 않음
    setLoading(true)
    setError('')
    setSearched(false)
    try {
      const params = new URLSearchParams({
        name,
        game,
        lang: language,
        ...(cardNumber.trim() ? { cardNumber: cardNumber.trim() } : {}),
      })
      const res = await fetch(`/api/price?${params}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setResults(json.results || [])
      setSearchedCardName(name)
      setSearchedCardNumber(cardNumber.trim())
      setSearchedGame(game)
      setSearched(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('search_fail'))
    } finally {
      setLoading(false)
    }
  }

  // 최저가 계산
  const pricedResults = results.filter(r => r.price != null)
  const cheapestPrice = pricedResults.length > 0
    ? Math.min(...pricedResults.map(r => r.price!))
    : null

  // 현재 검색된 카드가 관심목록에 있는지 매칭
  const currentWatchItem = watchlist.find(w =>
    w.card_name.trim().toLowerCase() === searchedCardName.trim().toLowerCase() &&
    (w.game ?? '') === searchedGame &&
    (w.card_number ?? '').trim().toLowerCase() === searchedCardNumber.trim().toLowerCase()
  )
  const alertCount = watchlist.filter(w => w.alert_enabled).length

  const handleAuthErr = (e: unknown) => {
    const msg = e instanceof Error ? e.message : ''
    setToast(msg === 'Login required' ? t('login_required') : t('watchlist_action_fail'))
  }

  const handleToggleWatch = async () => {
    if (watchBusy) return
    setWatchBusy(true)
    try {
      if (currentWatchItem) {
        await removeWatchlistItem(currentWatchItem.id)
        setWatchlist(prev => prev.filter(w => w.id !== currentWatchItem.id))
        setToast(t('watchlist_removed'))
      } else {
        const created = await upsertWatchlistItem({
          card_name: searchedCardName,
          game: searchedGame,
          card_number: searchedCardNumber || null,
          target_price: cheapestPrice,
          alert_enabled: false,
        })
        setWatchlist(prev => [created, ...prev])
        setToast(t('watchlist_added'))
      }
    } catch (e) {
      handleAuthErr(e)
    } finally {
      setWatchBusy(false)
    }
  }

  const handleToggleAlert = async () => {
    if (!currentWatchItem || watchBusy) return
    const next = !currentWatchItem.alert_enabled
    setWatchBusy(true)
    try {
      await toggleWatchlistAlert(currentWatchItem.id, next)
      setWatchlist(prev => prev.map(w => w.id === currentWatchItem.id ? { ...w, alert_enabled: next } : w))
      setToast(next ? t('alert_turned_on') : t('alert_turned_off'))
    } catch (e) {
      handleAuthErr(e)
    } finally {
      setWatchBusy(false)
    }
  }

  const showRecentChips = (nameFocused || cardName.trim() === '') && recentSearches.length > 0

  return (
    <div>
      {/* 제목 */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--accent)', display: 'inline-flex' }}><IconSearch size={17} strokeWidth={2.2} /></span>
            {t('tab_search')}
          </h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
            {t('price_search_sub')}
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 10,
          padding: '7px 12px', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', whiteSpace: 'nowrap',
        }}>
          <span>🔔</span>
          <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{t('alert_chip_label', { n: alertCount })}</span>
        </div>
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
              {t('field_card_name')}
            </label>
            <input
              style={fieldStyle}
              value={cardName}
              onChange={e => setCardName(e.target.value)}
              placeholder={`${t('ex')}: Monkey D. Luffy`}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              autoFocus
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginBottom: 5, fontWeight: 600 }}>
              {t('field_card_number_opt')}
            </label>
            <input
              style={fieldStyle}
              value={cardNumber}
              onChange={e => setCardNumber(e.target.value)}
              placeholder={`${t('ex')}: OP01-001`}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>

        {/* 최근 검색어 칩 */}
        {showRecentChips && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: -4, marginBottom: 12 }}>
            <span style={{ fontSize: 10.5, color: 'var(--muted-2)', alignSelf: 'center', marginRight: 2 }}>
              {t('recent_searches_label')}
            </span>
            {recentSearches.map(q => (
              <button
                key={q}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleSearch(q)}
                style={{
                  fontSize: 11, color: 'var(--muted)', background: 'var(--panel-2)',
                  border: '1px solid var(--border-soft)', borderRadius: 999, padding: '5px 11px',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* 게임 + 언어판 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginBottom: 5, fontWeight: 600 }}>
              {t('field_game')}
            </label>
            <select style={fieldStyle} value={game} onChange={e => setGame(e.target.value as Game)}>
              {GAMES.filter(g => g !== '기타').map(g => <option key={g} value={g}>{t(GAME_LABEL_KEYS[g] ?? 'game_other')}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', marginBottom: 5, fontWeight: 600 }}>
              {t('field_language')}
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
                  <span>{t(l.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 검색 버튼 */}
        <button
          onClick={() => handleSearch()}
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
          {loading ? t('searching') : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, justifyContent: 'center', width: '100%' }}><IconSearch size={14} /> {t('tab_search')}</span>}
        </button>

        {error && (
          <p style={{ color: 'var(--gain)', fontSize: 12, marginTop: 8, marginBottom: 0 }}>{error}</p>
        )}
      </div>

      {/* 결과 */}
      {searched && (
        <div>
          {/* 관심목록(찜) + 알림 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--panel)', border: '1px solid var(--border-soft)',
            borderRadius: 11, padding: '9px 12px', marginBottom: 12,
          }}>
            <button
              type="button"
              onClick={handleToggleWatch}
              disabled={watchBusy}
              aria-label={currentWatchItem ? t('aria_remove_watchlist') : t('aria_add_watchlist')}
              style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                border: `1px solid ${currentWatchItem ? 'rgba(255,80,101,.4)' : 'var(--border)'}`,
                background: currentWatchItem ? 'var(--gain-soft)' : 'var(--panel-2)',
                color: currentWatchItem ? 'var(--gain)' : 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, cursor: watchBusy ? 'default' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {currentWatchItem ? '♥' : '♡'}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {searchedCardName}{searchedCardNumber ? ` · ${searchedCardNumber}` : ''}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--muted-2)' }}>
                {t(GAME_LABEL_KEYS[searchedGame] ?? 'game_other')}
              </div>
            </div>
            {currentWatchItem && (
              <button
                type="button"
                onClick={handleToggleAlert}
                disabled={watchBusy}
                aria-label={currentWatchItem.alert_enabled ? t('aria_alert_off') : t('aria_alert_on')}
                style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  border: `1px solid ${currentWatchItem.alert_enabled ? 'rgba(232,177,58,.4)' : 'var(--border)'}`,
                  background: currentWatchItem.alert_enabled ? 'rgba(232,177,58,.14)' : 'var(--panel-2)',
                  color: currentWatchItem.alert_enabled ? 'var(--accent)' : 'var(--muted-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, cursor: watchBusy ? 'default' : 'pointer', fontFamily: 'inherit',
                }}
              >
                🔔
              </button>
            )}
          </div>

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
              <span style={{ color: 'var(--accent)', display: 'inline-flex' }}><IconStar size={17} /></span>
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 700 }}>{t('lowest_price')}</div>
                <div className="num" style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>
                  ₩{cheapestPrice.toLocaleString('ko-KR')}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
                {language === 'KR' ? t('check_directly') : `${pricedResults.find(r => r.price === cheapestPrice)?.label}`}
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
                      {t('lowest_price')}
                    </span>
                  )}

                  {/* 마켓 정보 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>
                      {r.label}
                      {r.soldCount != null && r.soldCount > 0 && (
                        <span style={{ color: 'var(--muted-2)', fontWeight: 400, marginLeft: 6, fontSize: 11 }}>
                          {t('recent_n_avg', { n: r.soldCount })}
                        </span>
                      )}
                    </div>
                    {r.price != null ? (
                      <div>
                        <span className="num" style={{ fontSize: 20, fontWeight: 800 }}>
                          ₩{r.price.toLocaleString('ko-KR')}
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
                          ? t('check_on_site')
                          : t('no_price_check_link')}
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
                    {t('open_site')}
                  </a>
                </div>
              )
            })}
          </div>

          <p style={{ fontSize: 11, color: 'var(--muted-2)', textAlign: 'center', marginTop: 14 }}>
            {t('fx_disclaimer')}
          </p>
        </div>
      )}

      {searched && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔎</div>
          <div style={{ fontWeight: 600 }}>{t('no_results')}</div>
          <div style={{ fontSize: 12.5, marginTop: 6 }}>{t('no_results_hint')}</div>
        </div>
      )}

      {/* 토스트 — 관심목록·알림 처리 결과 */}
      {toast && (
        <div style={{
          position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)',
          background: 'var(--panel-3)', border: '1px solid var(--border)', color: 'var(--text)',
          borderRadius: 10, padding: '10px 16px', fontSize: 12.5, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,.35)', zIndex: 50,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
