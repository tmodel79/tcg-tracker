/* eslint-disable @typescript-eslint/no-explicit-any */
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export interface OcrResult {
  name: string | null
  card_number: string | null
  game: string | null
  grade: string | null
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
    max_tokens: 512,
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
            text: `이 트레이딩 카드 이미지를 분석해서 정보를 추출하세요.
반드시 JSON 형식만 반환하고 다른 텍스트는 절대 포함하지 마세요.

{
  "name": "카드 이름 (보이는 그대로, 일본어/영어/한국어 모두 가능)",
  "card_number": "카드 번호 (예: OP01-001, P-033, ST01-012, sv1-001) — 없으면 null",
  "game": "원피스 | 포켓몬 | 드래곤볼 | 건담 | 유희왕 | 기타 중 하나",
  "grade": "등급 케이스 안에 있으면 등급 (예: PSA 10, BGS 9.5) — RAW 카드면 null"
}

판독 불가능한 필드는 null로 설정하세요.`,
          },
        ],
      },
    ],
  })

  const text =
    message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const result: OcrResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to parse the AI response', raw: text })
  }
}
