// ========================================
// URL 자동 가져오기 API — /api/url-import
// eBay / 야후옥션 / 메르카리 URL → 카드 정보 자동 추출
// ========================================

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8,ko;q=0.7',
}

function detectPlatform(url: string): string {
  if (url.includes('ebay.com')) return 'ebay'
  if (url.includes('auctions.yahoo.co.jp') || url.includes('page.auctions.yahoo')) return 'yahoo'
  if (url.includes('mercari.com') || url.includes('mercari.co.jp')) return 'mercari'
  if (url.includes('cardmarket.com')) return 'cardmarket'
  if (url.includes('tcgplayer.com')) return 'tcgplayer'
  return 'unknown'
}

// 텍스트에서 JSON-LD 추출
function extractJsonLd(html: string): Record<string, unknown> | null {
  const match = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)
  if (!match) return null
  try { return JSON.parse(match[1]) } catch { return null }
}

// eBay 상품 파싱
async function fetchEbay(url: string) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`Failed to reach eBay (${res.status})`)
  const html = await res.text()

  const ld = extractJsonLd(html)
  const name = (ld?.name as string)
    || html.match(/<h1[^>]*class="[^"]*x-item-title__mainTitle[^"]*"[^>]*><span[^>]*>([^<]+)<\/span>/)?.[1]
    || html.match(/<meta property="og:title" content="([^"]+)"/)?.[1]?.replace(/ \| eBay$/, '')
    || null

  const priceStr = (ld?.offers as Record<string, unknown>)?.price as string
    || html.match(/"pricingDetails"[^}]*"convertedPrice"\s*:\s*\{[^}]*"value"\s*:\s*"?([\d.]+)"?/)?.[1]
    || html.match(/itemprop="price"[^>]*content="([\d.]+)"/)?.[1]
    || html.match(/"price"\s*:\s*"?([\d.]+)"?/)?.[1]
    || html.match(/US \$\s*([\d,]+(?:\.\d+)?)/)?.[1]
  const price = priceStr ? parseFloat(String(priceStr).replace(/,/g, '')) : null

  const shippingStr = html.match(/Shipping:\s*US \$\s*([\d,]+(?:\.\d+)?)/)?.[1]
    || html.match(/"shippingCost"\s*:\s*"?([\d.]+)"?/)?.[1]
  const shipping = shippingStr ? parseFloat(String(shippingStr).replace(/,/g, '')) : null

  const imageUrl = (ld?.image as string)
    || html.match(/https:\/\/i\.ebayimg\.com\/images\/g\/[^"'\s]+\.jpg/)?.[0]
    || null

  const cardNumberMatch = name?.match(/([A-Z]{1,3}\d{2}-\d{3}|[A-Z]-\d{3}|[A-Z]{2}\d[a-z]-\d{3})/i)

  return {
    name: name?.trim() || null,
    card_number: cardNumberMatch?.[0] || null,
    buy_price: price,
    currency: 'USD' as const,
    fee: null,
    shipping,
    platform: 'eBay',
    image_url: imageUrl,
    source_url: url,
  }
}

// 야후옥션 파싱
async function fetchYahoo(url: string) {
  const res = await fetch(url, {
    headers: { ...HEADERS, 'Accept-Language': 'ja-JP,ja;q=0.9' },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`Failed to reach Yahoo Auctions JP (${res.status})`)
  const html = await res.text()

  const ld = extractJsonLd(html)
  const name = (ld?.name as string)
    || html.match(/<meta property="og:title" content="([^"]+)"/)?.[1]?.replace(/\s*- Yahoo!.*$/, '')
    || html.match(/<h1[^>]*>([^<]{3,80})<\/h1>/)?.[1]
    || null

  const priceStr = (ld?.offers as Record<string, unknown>)?.price as string
    || html.match(/現在の価格[^\d]*([\d,]+)\s*円/)?.[1]
    || html.match(/"currentPrice"\s*:\s*([\d,]+)/)?.[1]
    || html.match(/([\d,]+)\s*円/)?.[1]
  const price = priceStr ? parseFloat(String(priceStr).replace(/,/g, '')) : null

  const imageUrl = (ld?.image as string)
    || html.match(/https:\/\/auction\.c\.yimg\.jp\/[^"'\s]+\.jpg/)?.[0]
    || null

  const cardNumberMatch = name?.match(/([A-Z]{1,3}\d{2}-\d{3}|[A-Z]-\d{3})/i)

  return {
    name: name?.trim() || null,
    card_number: cardNumberMatch?.[0] || null,
    buy_price: price,
    currency: 'JPY' as const,
    fee: null,
    shipping: null,
    platform: 'Yahoo Auctions JP',
    image_url: imageUrl,
    source_url: url,
  }
}

// 메르카리 파싱
async function fetchMercari(url: string) {
  const isJp = url.includes('mercari.co.jp')
  const res = await fetch(url, {
    headers: {
      ...HEADERS,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      'Accept-Language': isJp ? 'ja-JP,ja;q=0.9' : 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`Failed to reach Mercari (${res.status})`)
  const html = await res.text()

  const ld = extractJsonLd(html)
  const name = (ld?.name as string)
    || html.match(/"name"\s*:\s*"([^"]{3,120})"/)?.[1]
    || html.match(/<meta property="og:title" content="([^"]+)"/)?.[1]
    || null

  const priceStr = (ld?.offers as Record<string, unknown>)?.price as string
    || html.match(/"price"\s*:\s*"?([\d,]+)"?/)?.[1]
    || html.match(/¥\s*([\d,]+)/)?.[1]
    || html.match(/\$\s*([\d,]+(?:\.\d+)?)/)?.[1]
  const price = priceStr ? parseFloat(String(priceStr).replace(/,/g, '')) : null

  const imageUrl = (ld?.image as string)
    || html.match(/https:\/\/static\.mercdn\.net\/item\/detail\/[^"'\s]+\.jpg/)?.[0]
    || null

  const cardNumberMatch = name?.match(/([A-Z]{1,3}\d{2}-\d{3}|[A-Z]-\d{3})/i)

  return {
    name: name?.trim() || null,
    card_number: cardNumberMatch?.[0] || null,
    buy_price: price,
    currency: (isJp ? 'JPY' : 'USD') as 'JPY' | 'USD',
    fee: null,
    shipping: null,
    platform: 'Mercari',
    image_url: imageUrl,
    source_url: url,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const platform = detectPlatform(url.trim())

    let result
    switch (platform) {
      case 'ebay':    result = await fetchEbay(url.trim()); break
      case 'yahoo':   result = await fetchYahoo(url.trim()); break
      case 'mercari': result = await fetchMercari(url.trim()); break
      default:
        return NextResponse.json(
          { error: 'Unsupported site.\nSupported: eBay, Yahoo Auctions JP, Mercari' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
