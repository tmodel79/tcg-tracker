// ========================================
// 시세 조회 API — /api/price
// eBay 판매완료 / TCGPlayer / CardMarket 서버사이드 조회
// 한판(KR): 크림·번개장터 바로가기 링크 반환
// ========================================

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
// 캐시: 1시간
export const revalidate = 3600

interface PriceResult {
  source: string
  price: number | null      // KRW 환산가 (없으면 null)
  currency: string
  rawPrice: number | null
  url: string               // 해당 사이트 검색 URL
  label: string             // 표시명
  soldCount?: number        // 최근 거래 건수
  avgPrice?: number | null  // 평균 거래가
  error?: string
}

// 환율 (하드코딩 — 실시간이 아닌 참고값)
const FX: Record<string, number> = {
  USD: 1380,
  JPY: 9.1,
  EUR: 1500,
  KRW: 1,
}

// eBay 검색 쿼리 빌드
function buildEbayQuery(name: string, cardNumber: string | null, game: string, lang: string): string {
  const langMap: Record<string, string> = {
    JP: 'Japanese',
    EN: 'English',
    FR: 'French',
    KR: 'Korean',
  }
  const parts: string[] = []
  if (cardNumber) parts.push(`"${cardNumber}"`)
  if (name) parts.push(name.split(' ').slice(0, 3).join(' '))
  if (langMap[lang]) parts.push(langMap[lang])
  return parts.join(' ')
}

// eBay 판매완료 URL
function ebayUrl(query: string): string {
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1&_sacat=0&rt=nc`
}

// TCGPlayer 검색 URL
function tcgplayerUrl(name: string, cardNumber: string | null, game: string): string {
  const gameSlug: Record<string, string> = {
    '원피스': 'one-piece-card-game',
    '포켓몬': 'pokemon',
    '드래곤볼': 'dragon-ball-super-card-game',
    '유희왕': 'yugioh',
    '건담': 'gundam-card-game',
  }
  const slug = gameSlug[game] || 'all-tcg'
  const q = cardNumber || name
  return `https://www.tcgplayer.com/search/${slug}/product?q=${encodeURIComponent(q)}&view=grid`
}

// CardMarket 검색 URL (프판·유럽)
function cardmarketUrl(name: string, cardNumber: string | null, game: string): string {
  const gameSlug: Record<string, string> = {
    '원피스': 'OnePiece',
    '포켓몬': 'Pokemon',
    '드래곤볼': 'DragonBallSuper',
    '유희왕': 'YuGiOh',
  }
  const slug = gameSlug[game] || 'OnePiece'
  const q = cardNumber || name
  return `https://www.cardmarket.com/en/${slug}/Products/Search?searchString=${encodeURIComponent(q)}`
}

// 130point URL (eBay comps)
function pointUrl(query: string): string {
  return `https://130point.com/sales/?search=${encodeURIComponent(query)}`
}

// KREAM 검색 URL
function kreamUrl(name: string, cardNumber: string | null): string {
  const q = cardNumber ? `${cardNumber} ${name}`.trim() : name
  return `https://kream.co.kr/search?keyword=${encodeURIComponent(q)}`
}

// 번개장터 검색 URL
function bunjangUrl(name: string, cardNumber: string | null): string {
  const q = cardNumber ? `${cardNumber} ${name}`.trim() : name
  return `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(q)}`
}

// eBay 판매완료 가격 스크래핑 (서버사이드)
async function fetchEbayPrices(query: string): Promise<{ prices: number[]; currency: string }> {
  try {
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1&_sacat=0&rt=nc&_ipg=25`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return { prices: [], currency: 'USD' }
    const html = await res.text()

    // 판매가 파싱: 정규식으로 달러 가격 추출
    const prices: number[] = []
    const re = /\$\s*([\d,]+(?:\.\d+)?)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null && prices.length < 15) {
      const p = parseFloat(m[1].replace(/,/g, ''))
      if (!isNaN(p) && p > 0.5 && p < 50000) prices.push(p)
    }
    return { prices: prices.slice(0, 10), currency: 'USD' }
  } catch {
    return { prices: [], currency: 'USD' }
  }
}

// TCGPlayer 가격 스크래핑
async function fetchTcgPlayerPrice(name: string, cardNumber: string | null, game: string): Promise<number | null> {
  try {
    const gameSlug: Record<string, string> = {
      '원피스': 'one-piece-card-game',
      '포켓몬': 'pokemon',
      '드래곤볼': 'dragon-ball-super-card-game',
      '유희왕': 'yugioh',
    }
    const slug = gameSlug[game]
    if (!slug) return null

    const q = cardNumber || name
    const url = `https://www.tcgplayer.com/search/${slug}/product?q=${encodeURIComponent(q)}&view=grid`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()

    // 가격 파싱: TCGPlayer의 market price
    const match = html.match(/Market Price[^$]*\$\s*([\d,]+(?:\.\d+)?)/i)
      || html.match(/"marketPrice"\s*:\s*([\d.]+)/i)
      || html.match(/\$\s*([\d,]+\.\d{2})/i)
    if (match) {
      const p = parseFloat(match[1].replace(/,/g, ''))
      if (!isNaN(p) && p > 0) return p
    }
    return null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const name = sp.get('name') || ''
  const cardNumber = sp.get('cardNumber') || null
  const game = sp.get('game') || '원피스'
  const lang = sp.get('lang') || 'JP'

  if (!name) {
    return NextResponse.json({ error: '카드명 필요' }, { status: 400 })
  }

  const results: PriceResult[] = []

  // ── 언어판별 시세 조회 ──
  if (lang === 'KR') {
    // 한판: 크림 + 번개장터 링크만 (스크래핑 어려움)
    results.push({
      source: 'kream',
      label: '크림 (KREAM)',
      price: null,
      currency: 'KRW',
      rawPrice: null,
      url: kreamUrl(name, cardNumber),
    })
    results.push({
      source: 'bunjang',
      label: '번개장터',
      price: null,
      currency: 'KRW',
      rawPrice: null,
      url: bunjangUrl(name, cardNumber),
    })
  } else {
    // 일판·영판·프판: eBay 판매완료 스크래핑
    const ebayQuery = buildEbayQuery(name, cardNumber, game, lang)
    const { prices, currency: ebayCurrency } = await fetchEbayPrices(ebayQuery)

    const avgEbay = prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : null
    const fxRate = FX[ebayCurrency] || 1380

    results.push({
      source: 'ebay',
      label: 'eBay (판매완료)',
      price: avgEbay ? Math.round(avgEbay * fxRate) : null,
      currency: ebayCurrency,
      rawPrice: avgEbay ? Math.round(avgEbay * 100) / 100 : null,
      url: ebayUrl(ebayQuery),
      soldCount: prices.length,
      avgPrice: avgEbay ? Math.round(avgEbay * 100) / 100 : null,
    })

    // 130point (eBay comps 전문)
    results.push({
      source: '130point',
      label: '130point',
      price: null, // 스크래핑 어려워서 링크만
      currency: 'USD',
      rawPrice: null,
      url: pointUrl(ebayQuery),
    })

    // 영판: TCGPlayer 추가
    if (lang === 'EN') {
      const tcgPrice = await fetchTcgPlayerPrice(name, cardNumber, game)
      results.push({
        source: 'tcgplayer',
        label: 'TCGPlayer',
        price: tcgPrice ? Math.round(tcgPrice * FX.USD) : null,
        currency: 'USD',
        rawPrice: tcgPrice,
        url: tcgplayerUrl(name, cardNumber, game),
      })
    }

    // 프판: CardMarket 추가 링크
    if (lang === 'FR') {
      results.push({
        source: 'cardmarket',
        label: 'CardMarket',
        price: null,
        currency: 'EUR',
        rawPrice: null,
        url: cardmarketUrl(name, cardNumber, game),
      })
    }
  }

  return NextResponse.json({ results, lang, name, cardNumber, game })
}
