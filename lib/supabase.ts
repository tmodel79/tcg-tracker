// ========================================
// TCG 트래커 — Supabase 클라이언트 (lazy 초기화)
// ara-crm의 Supabase와 완전히 별개 프로젝트
// URL·KEY는 .env.local → Vercel 환경변수에서 주입
// ========================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Card } from '@/types/card'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url.startsWith('여기에') || url === '') {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.')
  }
  _client = createClient(url, key)
  return _client
}

// ────────────────────────────────────────
// cards CRUD (인수인계서 섹션 6 "바꿀 부분")
// ────────────────────────────────────────

/** 내 카드 전체 불러오기 */
export async function loadCards(): Promise<Card[]> {
  const { data, error } = await getClient()
    .from('cards')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data as Card[]) ?? []
}

/** 카드 추가 또는 수정 */
export async function upsertCard(card: Partial<Card>): Promise<Card> {
  // user_id가 없으면 제거 (개인용 트래커 — RLS 비활성화 상태)
  const { user_id: _uid, ...rest } = card as Card
  const payload = _uid ? card : rest

  const { data, error } = await getClient()
    .from('cards')
    .upsert(payload)
    .select()
    .single()

  if (error) throw error
  return data as Card
}

/** 카드 삭제 */
export async function removeCard(id: string): Promise<void> {
  const { error } = await getClient().from('cards').delete().eq('id', id)
  if (error) throw error
}

/** 카드 이미지를 Storage에 업로드하고 공개 URL 반환 */
export async function uploadCardImage(file: File, cardId: string): Promise<string> {
  const client = getClient()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${cardId}.${ext}`

  const { error } = await client.storage
    .from('card-images')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw error

  const { data } = client.storage.from('card-images').getPublicUrl(path)
  return data.publicUrl
}

/** JSON 백업에서 일괄 import */
export async function importCards(cards: Card[]): Promise<void> {
  const client = getClient()
  const {
    data: { user },
  } = await client.auth.getUser()

  if (!user) throw new Error('로그인이 필요합니다')

  const rows = cards.map((c) => ({ ...c, user_id: user.id }))
  const { error } = await client.from('cards').upsert(rows)
  if (error) throw error
}
