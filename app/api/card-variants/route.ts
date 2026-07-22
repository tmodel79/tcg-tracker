/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'

export interface CardVariant {
  id: string
  name: string
  image_url: string
  variant_name?: string
  set_name?: string
}

// ── Pokemon (pokemontcg.io) ──────────────────────────────────────────────
async function fetchPokemon(cardNumber: string): Promise<CardVariant[]> {
  const parts = cardNumber.split('-')
  const localId = parts.length > 1 ? parts.slice(1).join('-') : cardNumber
  const setId = parts.length > 1 ? parts[0] : ''
  const q = setId ? `number:${localId} set.id:${setId}` : `number:${localId}`

  const res = await fetch(
    `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}&pageSize=20`,
    { next: { revalidate: 3600 } }
  )
  if (!res.ok) return []
  const data = await res.json()

  return (data.data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    image_url: c.images?.large ?? c.images?.small ?? '',
    variant_name: c.rarity ?? c.subtypes?.join(' '),
    set_name: c.set?.name,
  })).filter((v: CardVariant) => v.image_url)
}

// ── One Piece (TCGDex) ───────────────────────────────────────────────────
async function fetchOnePiece(cardNumber: string): Promise<CardVariant[]> {
  try {
    const res = await fetch(
      `https://api.tcgdex.net/v2/en/cards?localId=${encodeURIComponent(cardNumber)}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    const arr: any[] = Array.isArray(data) ? data : [data]

    return arr
      .filter((c: any) => c && (c.image || c.images))
      .map((c: any) => ({
        id: c.id ?? c.localId,
        name: c.name ?? cardNumber,
        image_url: c.image ? `${c.image}/high.jpg` : (c.images?.large ?? ''),
        variant_name: c.rarity,
        set_name: c.set?.name ?? c.serie?.name,
      }))
      .filter((v: CardVariant) => v.image_url)
  } catch {
    return []
  }
}

// ── Yu-Gi-Oh! (YGOProDeck) ──────────────────────────────────────────────
async function fetchYugioh(cardNumber: string): Promise<CardVariant[]> {
  try {
    const res = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${encodeURIComponent(cardNumber)}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()

    return (data.data ?? []).flatMap((c: any) =>
      (c.card_images ?? []).map((img: any, i: number) => ({
        id: String(img.id),
        name: c.name,
        image_url: img.image_url ?? '',
        variant_name: i === 0 ? '기본 아트' : `아트 #${i + 1}`,
        set_name: undefined,
      }))
    ).filter((v: CardVariant) => v.image_url)
  } catch {
    return []
  }
}

// ── Dragon Ball Super (TCGDex) ───────────────────────────────────────────
async function fetchDragonBall(cardNumber: string): Promise<CardVariant[]> {
  try {
    const res = await fetch(
      `https://api.tcgdex.net/v2/en/cards?localId=${encodeURIComponent(cardNumber)}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    const arr: any[] = Array.isArray(data) ? data : [data]

    return arr
      .filter((c: any) => c && c.image)
      .map((c: any) => ({
        id: c.id ?? c.localId,
        name: c.name ?? cardNumber,
        image_url: `${c.image}/high.jpg`,
        variant_name: c.rarity,
        set_name: c.set?.name,
      }))
  } catch {
    return []
  }
}

// ── Main handler ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const game = req.nextUrl.searchParams.get('game') ?? ''
  const cardNumber = (req.nextUrl.searchParams.get('number') ?? '').trim()

  if (!cardNumber || cardNumber.length < 2) {
    return NextResponse.json({ variants: [] })
  }

  let variants: CardVariant[] = []

  try {
    if (game === '포켓몬') variants = await fetchPokemon(cardNumber)
    else if (game === '원피스') variants = await fetchOnePiece(cardNumber)
    else if (game === '유희왕') variants = await fetchYugioh(cardNumber)
    else if (game === '드래곤볼') variants = await fetchDragonBall(cardNumber)
  } catch (e) {
    console.error('card-variants error:', e)
  }

  return NextResponse.json({ variants })
}
