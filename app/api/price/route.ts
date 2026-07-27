// ========================================
// 시세 조회 API — /api/price
// eBay 판매완료 / TCGPlayer / CardMarket / 130point 서버사이드 가격 파싱
// ========================================

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 1800 // 30분 캐시

interface PriceResult {
  source: string
  price: number | null
  currency: string
  rawPrice: number | null
  url: string
  label: string
  soldCount?: number
  avgPrice?: number | null
  error?: string
}

const FX: Record<string, number> = {
  USD: 1380,
  JPY: 9.1,
  EUR: 1500,
  KRW: 1,
}

const HEADERS_EN = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

const HEADERS_JP = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.5',
  'Accept': 'text/html,application/xhtml+xml',
}

// ── URL 빌더들 ──────────────────────────────────────

function buildEbayQuery(name: string, cardNumber: string | null, lang: string): string {
  const langMap: Record<string, string> = { JP: 'Japanese', EN: 'English', FR: 'French', KR: 'Korean' }
  const parts: string[] = []
  if (cardNumber) parts.push(`"${cardNumber}"`)
  parts.push(name.split(' ').slice(0, 4).join(' '))
  if (langMap[lang]) parts.push(langMap[lang])
  return parts.join(' ')
}

function ebayUrl(query: string) {
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1&_sacat=0&rt=nc`
}

function tcgPlayerUrl(name: string, cardNumber: string | null, game: string) {
  const slug: Record<string, string> = {
    '원피스': 'one-piece-card-game', '포켓몬': 'pokemon',
    '드래곤볼': 'dragon-ball-super-card-game', '유희왕': 'yugioh', '건담': 'gundam-card-game',
  }
  const q = cardNumber || name
  return `https://www.tcgplayer.com/search/${slug[game] || 'all-tcg'}/product?q=${encodeURIComponent(q)}&view=grid`
}

function cardmarketUrl(name: string, cardNumber: string | null, game: string) {
  const slug: Record<string, string> = {
    '원피스': 'OnePiece', '포켓몬': 'Pokemon', '드래곤볼': 'DragonBallSuper', '유희왕': 'YuGiOh',
  }
  const q = cardNumber || name
  return `https://www.cardmarket.com/en/${slug[game] || 'OnePiece'}/Products/Search?searchString=${encodeURIComponent(q)}`
}

function point130Url(query: string) {
  return `https://130point.com/sales/?search=${encodeURIComponent(query)}`
}

function yahooAuctionsUrl(name: string, cardNumber: string | null) {
  const q = cardNumber ? `${cardNumber} ${name}` : name
  return `https://auctions.yahoo.co.jp/search/search?p=${encodeURIComponent(q)}&va=${encodeURIComponent(q)}&exflg=1&b=1&n=50&s1=cbids&o1=d&mode=2`
}

function mercariUrl(name: string, cardNumber: string | null) {
  const q = cardNumber ? `${cardNumber} ${name}` : name
  return `https://jp.mercari.com/search?keyword=${encodeURIComponent(q)}&status=sold_out`
}

function kreamUrl(name: string, cardNumber: string | null) {
  const q = cardNumber ? `${cardNumber} ${name}`.trim() : name
  return `https://kream.co.kr/search?keyword=${encodeURIComponent(q)}`
}

function bunjangUrl(name: string, cardNumber: string | null) {
  const q = cardNumber ? `${cardNumber} ${name}`.trim() : name
  return `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(q)}`
}

// ── 스크래퍼들 ──────────────────────────────────────

// eBay 판매완료 평균가
async function scrapeEbay(query: string): Promise<{ prices: number[]; currency: string }> {
  try {
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1&_sacat=0&rt=nc&_ipg=25`
    const res = await fetch(url, { headers: HEADERS_EN, signal: AbortSignal.timeout(9000) })
    if (!res.ok) return { prices: [], currency: 'USD' }
    const html = await res.text()
    const prices: number[] = []
    const re = /\$\s*([\d,]+(?:\.\d+)?)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null && prices.length < 20) {
      const p = parseFloat(m[1].replace(/,/g, ''))
      if (!isNaN(p) && p > 0.5 && p < 100000) prices.push(p)
    }
    return { prices: prices.slice(0, 12), currency: 'USD' }
  } catch { return { prices: [], currency: 'USD' } }
}

// 130point — eBay 낙찰 평균가 집계 사이트 (JP 카드 특화)
async function scrape130point(query: string): Promise<{ price: number | null; soldCount: number }> {
  try {
    const url = `https://130point.com/sales/?search=${encodeURIComponent(query)}`
    const res = await fetch(url, {
      headers: { ...HEADERS_EN, 'Referer': 'https://130point.com/' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return { price: null, soldCount: 0 }
    const html = await res.text()

    // 가격 파싱: 달러 표기 ($XX.XX)
    const prices: number[] = []
    // 테이블 내 가격 패턴
    const re = /\$\s*([\d,]+(?:\.\d{2})?)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null && prices.length < 20) {
      const p = parseFloat(m[1].replace(/,/g, ''))
      if (!isNaN(p) && p > 0.1 && p < 100000) prices.push(p)
    }

    // 평균 (최저·최고 제외한 중간값)
    if (prices.length === 0) return { price: null, soldCount: 0 }
    const sorted = prices.slice().sort((a, b) => a - b)
    const trimmed = sorted.length > 4 ? sorted.slice(1, -1) : sorted
    const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length
    return { price: Math.round(avg * 100) / 100, soldCount: prices.length }
  } catch { return { price: null, soldCount: 0 } }
}

// TCGPlayer — EN 카드 시세 (마켓 프라이스)
async function scrapeTcgPlayer(name: string, cardNumber: string | null, game: string): Promise<number | null> {
  try {
    const slug: Record<string, string> = {
      '원피스': 'one-piece-card-game', '포켓몬': 'pokemon',
      '드래곤볼': 'dragon-ball-super-card-game', '유희왕': 'yugioh',
    }
    if (!slug[game]) return null
    const q = cardNumber || name
    const url = `https://www.tcgplayer.com/search/${slug[game]}/product?q=${encodeURIComponent(q)}&view=grid`
    const res = await fetch(url, { headers: HEADERS_EN, signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const html = await res.text()

    // JSON-LD 또는 인라인 데이터에서 market price 추출
    const patterns = [
      /"marketPrice"\s*:\s*([\d.]+)/i,
      /"market_price"\s*:\s*([\d.]+)/i,
      /Market Price[^\d$]*\$\s*([\d,]+(?:\.\d+)?)/i,
      /class="[^"]*price[^"]*"[^>]*>\s*\$\s*([\d,]+(?:\.\d+)?)/i,
      // 첫번째 달러 가격 (검색결과 첫 카드)
      /\$\s*([\d]+\.\d{2})/,
    ]
    for (const pat of patterns) {
      const m = html.match(pat)
      if (m) {
        const p = parseFloat(m[1].replace(/,/g, ''))
        if (!isNaN(p) && p > 0 && p < 100000) return p
      }
    }
    return null
  } catch { return null }
}

// CardMarket — EU/FR 카드 시세
async function scrapeCardmarket(name: string, cardNumber: string | null, game: string): Promise<number | null> {
  try {
    const slug: Record<string, string> = {
      '원피스': 'OnePiece', '포켓몬': 'Pokemon',
      '드래곤볼': 'DragonBallSuper', '유희왕': 'YuGiOh',
    }
    if (!slug[game]) return null
    const q = cardNumber || name
    const url = `https://www.cardmarket.com/en/${slug[game]}/Products/Search?searchString=${encodeURIComponent(q)}`
    const res = await fetch(url, {
      headers: { ...HEADERS_EN, 'Accept-Language': 'en-GB,en;q=0.9' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const html = await res.text()

    // "From X.XX €" 또는 "€X.XX" 패턴
    const patterns = [
      /From\s+(\d+[.,]\d{2})\s*€/i,
      /€\s*(\d+[.,]\d{2})/,
      /"minPrice"\s*:\s*([\d.]+)/i,
      /"lowPrice"\s*:\s*"?([\d.]+)"?/i,
      /class="[^"]*price[^"]*"[^>]*>\s*(\d+[.,]\d{2})\s*€/i,
    ]
    for (const pat of patterns) {
      const m = html.match(pat)
      if (m) {
        const p = parseFloat(m[1].replace(',', '.'))
        if (!isNaN(p) && p > 0 && p < 100000) return p
      }
    }
    return null
  } catch { return null }
}

// Yahoo Auctions Japan — JP 카드 낙찰가
async function scrapeYahooJP(name: string, cardNumber: string | null): Promise<{ price: number | null; soldCount: number }> {
  try {
    const q = cardNumber ? `${cardNumber} ${name}` : name
    const url = `https://auctions.yahoo.co.jp/closedsearch/closedsearch?p=${encodeURIComponent(q)}&va=${encodeURIComponent(q)}&exflg=1&b=1&n=20&s1=cbids&o1=d`
    const res = await fetch(url, { headers: HEADERS_JP, signal: AbortSignal.timeout(10000) })
    if (!res.ok) return { price: null, soldCount: 0 }
    const html = await res.text()

    // 円価格 파싱: XXX,XXX円
    const prices: number[] = []
    const re = /([\d,]+)\s*円/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null && prices.length < 15) {
      const p = parseInt(m[1].replace(/,/g, ''), 10)
      if (!isNaN(p) && p > 100 && p < 50000000) prices.push(p)
    }
    if (prices.length === 0) return { price: null, soldCount: 0 }
    const sorted = prices.slice().sort((a, b) => a - b)
    const trimmed = sorted.length > 4 ? sorted.slice(1, -1) : sorted
    const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length
    return { price: Math.round(avg), soldCount: prices.length }
  } catch { return { price: null, soldCount: 0 } }
}

// Mercari Japan
async function scrapeMercariJP(name: string, cardNumber: string | null): Promise<number | null> {
  try {
    const q = cardNumber ? `${cardNumber} ${name}` : name
    const url = `https://jp.mercari.com/search?keyword=${encodeURIComponent(q)}&status=sold_out&sort=created_time&order=desc`
    const res = await fetch(url, {
      headers: { ...HEADERS_JP, 'Accept': 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(9000),
    })
    if (!res.ok) return null
    const html = await res.text()

    // JSON-LD 또는 Next.js __NEXT_DATA__ 에서 가격 파싱
    const prices: number[] = []
    const re = /"price"\s*:\s*(\d+)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null && prices.length < 10) {
      const p = parseInt(m[1], 10)
      if (!isNaN(p) && p > 100 && p < 50000000) prices.push(p)
    }
    if (prices.length === 0) return null
    const sorted = prices.slice().sort((a, b) => a - b)
    const trimmed = sorted.length > 3 ? sorted.slice(1, -1) : sorted
    return Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length)
  } catch { return null }
}

// ── 메인 핸들러 ────────────────────────────────────

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const name = sp.get('name') || ''
  const cardNumber = sp.get('cardNumber') || null
  const game = sp.get('game') || '원피스'
  const lang = sp.get('lang') || 'JP'

  if (!name) return NextResponse.json({ error: 'Card name is required' }, { status: 400 })

  const results: PriceResult[] = []

  // ── 한판 (KR) ──────────────────────────────────
  if (lang === 'KR') {
    results.push({ source: 'kream',   label: 'KREAM', price: null, currency: 'KRW', rawPrice: null, url: kreamUrl(name, cardNumber) })
    results.push({ source: 'bunjang', label: 'Bunjang',       price: null, currency: 'KRW', rawPrice: null, url: bunjangUrl(name, cardNumber) })
    return NextResponse.json({ results, lang, name, cardNumber, game })
  }

  // ── 일판 (JP) ──────────────────────────────────
  if (lang === 'JP') {
    const [yahoo, mercariPrice, ebayData, ptData] = await Promise.all([
      scrapeYahooJP(name, cardNumber),
      scrapeMercariJP(name, cardNumber),
      scrapeEbay(buildEbayQuery(name, cardNumber, lang)),
      scrape130point(buildEbayQuery(name, cardNumber, lang)),
    ])

    // Yahoo Auctions
    results.push({
      source: 'yahoo',
      label: 'Yahoo Auctions Japan',
      price: yahoo.price ? Math.round(yahoo.price * FX.JPY) : null,
      currency: 'JPY',
      rawPrice: yahoo.price,
      url: yahooAuctionsUrl(name, cardNumber),
      soldCount: yahoo.soldCount,
      avgPrice: yahoo.price,
    })

    // Mercari Japan
    results.push({
      source: 'mercari',
      label: 'Mercari Japan',
      price: mercariPrice ? Math.round(mercariPrice * FX.JPY) : null,
      currency: 'JPY',
      rawPrice: mercariPrice,
      url: mercariUrl(name, cardNumber),
    })

    // 130point (eBay 낙찰 집계)
    results.push({
      source: '130point',
      label: '130point (eBay sales)',
      price: ptData.price ? Math.round(ptData.price * FX.USD) : null,
      currency: 'USD',
      rawPrice: ptData.price,
      url: point130Url(buildEbayQuery(name, cardNumber, lang)),
      soldCount: ptData.soldCount,
      avgPrice: ptData.price,
    })

    // eBay (직접 스크래핑)
    const avgEbay = ebayData.prices.length > 0
      ? ebayData.prices.reduce((a, b) => a + b, 0) / ebayData.prices.length
      : null
    results.push({
      source: 'ebay',
      label: 'eBay (sold listings)',
      price: avgEbay ? Math.round(avgEbay * FX.USD) : null,
      currency: 'USD',
      rawPrice: avgEbay ? Math.round(avgEbay * 100) / 100 : null,
      url: ebayUrl(buildEbayQuery(name, cardNumber, lang)),
      soldCount: ebayData.prices.length,
      avgPrice: avgEbay ? Math.round(avgEbay * 100) / 100 : null,
    })

    return NextResponse.json({ results, lang, name, cardNumber, game })
  }

  // ── 영판 (EN) ──────────────────────────────────
  if (lang === 'EN') {
    const ebayQuery = buildEbayQuery(name, cardNumber, lang)
    const [ebayData, tcgPrice, ptData] = await Promise.all([
      scrapeEbay(ebayQuery),
      scrapeTcgPlayer(name, cardNumber, game),
      scrape130point(ebayQuery),
    ])

    // TCGPlayer (EN 카드 핵심)
    results.push({
      source: 'tcgplayer',
      label: 'TCGPlayer',
      price: tcgPrice ? Math.round(tcgPrice * FX.USD) : null,
      currency: 'USD',
      rawPrice: tcgPrice,
      url: tcgPlayerUrl(name, cardNumber, game),
    })

    // 130point
    results.push({
      source: '130point',
      label: '130point (eBay sales)',
      price: ptData.price ? Math.round(ptData.price * FX.USD) : null,
      currency: 'USD',
      rawPrice: ptData.price,
      url: point130Url(ebayQuery),
      soldCount: ptData.soldCount,
      avgPrice: ptData.price,
    })

    // eBay
    const avgEbay = ebayData.prices.length > 0
      ? ebayData.prices.reduce((a, b) => a + b, 0) / ebayData.prices.length
      : null
    results.push({
      source: 'ebay',
      label: 'eBay (sold listings)',
      price: avgEbay ? Math.round(avgEbay * FX.USD) : null,
      currency: 'USD',
      rawPrice: avgEbay ? Math.round(avgEbay * 100) / 100 : null,
      url: ebayUrl(ebayQuery),
      soldCount: ebayData.prices.length,
      avgPrice: avgEbay ? Math.round(avgEbay * 100) / 100 : null,
    })

    return NextResponse.json({ results, lang, name, cardNumber, game })
  }

  // ── 프판 (FR) ──────────────────────────────────
  if (lang === 'FR') {
    const ebayQuery = buildEbayQuery(name, cardNumber, lang)
    const [ebayData, cmPrice, ptData] = await Promise.all([
      scrapeEbay(ebayQuery),
      scrapeCardmarket(name, cardNumber, game),
      scrape130point(ebayQuery),
    ])

    // CardMarket (FR 카드 핵심)
    results.push({
      source: 'cardmarket',
      label: 'CardMarket',
      price: cmPrice ? Math.round(cmPrice * FX.EUR) : null,
      currency: 'EUR',
      rawPrice: cmPrice,
      url: cardmarketUrl(name, cardNumber, game),
    })

    // 130point
    results.push({
      source: '130point',
      label: '130point (eBay sales)',
      price: ptData.price ? Math.round(ptData.price * FX.USD) : null,
      currency: 'USD',
      rawPrice: ptData.price,
      url: point130Url(ebayQuery),
      soldCount: ptData.soldCount,
      avgPrice: ptData.price,
    })

    // eBay
    const avgEbay = ebayData.prices.length > 0
      ? ebayData.prices.reduce((a, b) => a + b, 0) / ebayData.prices.length
      : null
    results.push({
      source: 'ebay',
      label: 'eBay (sold listings)',
      price: avgEbay ? Math.round(avgEbay * FX.USD) : null,
      currency: 'USD',
      rawPrice: avgEbay ? Math.round(avgEbay * 100) / 100 : null,
      url: ebayUrl(ebayQuery),
      soldCount: ebayData.prices.length,
      avgPrice: avgEbay ? Math.round(avgEbay * 100) / 100 : null,
    })

    return NextResponse.json({ results, lang, name, cardNumber, game })
  }

  return NextResponse.json({ results: [], lang, name, cardNumber, game })
}
