/* eslint-disable @typescript-eslint/no-explicit-any */
// ========================================
// 구매 영수증 OCR API — /api/receipt-ocr
// 구매 확인서 스크린샷 → 카드명·가격·수수료·배송비 자동 추출
// ========================================

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export interface ReceiptOcrResult {
  name: string | null
  card_number: string | null
  game: string | null
  buy_price: number | null
  currency: 'KRW' | 'USD' | 'JPY' | 'EUR' | null
  fee: number | null        // 플랫폼 수수료 (원화 또는 원화 환산)
  shipping: number | null   // 배송비
  platform: string | null   // eBay / Yahoo Auction / Mercari / 기타
  image_url: string | null  // 상품 이미지 URL (있으면)
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured on the server.' },
      { status: 500 }
    )
  }

  let imageBase64: string
  let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

  try {
    const body = await req.json()
    imageBase64 = body.imageBase64
    mediaType = body.mediaType ?? 'image/jpeg'
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!imageBase64) {
    return NextResponse.json({ error: 'Missing image data.' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 768,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          {
            type: 'text',
            text: `이것은 트레이딩카드 구매 확인서(영수증/주문내역) 스크린샷입니다.
다음 정보를 추출해서 반드시 JSON 형식만 반환하세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "name": "카드 상품명 (제목에서 추출, 최대한 정확하게)",
  "card_number": "카드 번호 (예: OP01-001, P-033) — 없으면 null",
  "game": "원피스 | 포켓몬 | 드래곤볼 | 건담 | 유희왕 | 기타 중 하나 — 판단 불가면 null",
  "buy_price": 상품 가격 (숫자만, 쉼표/통화기호 제외, 수수료 배송비 제외한 순수 상품가),
  "currency": "KRW | USD | JPY | EUR 중 하나 — 원화면 KRW, 달러면 USD, 엔화면 JPY, 유로면 EUR",
  "fee": 수수료/세금 금액 (숫자, 없으면 null) — 원래 통화 기준,
  "shipping": 배송비 (숫자, 없으면 null) — 원래 통화 기준,
  "platform": "eBay | Yahoo Auction | Mercari | 번개장터 | KREAM | 기타" — 화면에서 확인된 플랫폼,
  "image_url": null
}

금액은 화면에 보이는 원래 통화 기준으로 숫자만 추출하세요.
판독 불가 필드는 null로 설정하세요.`,
          },
        ],
      },
    ],
  })

  const text =
    message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const result: ReceiptOcrResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to parse the AI response', raw: text })
  }
}
