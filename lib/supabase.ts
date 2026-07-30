// ========================================
// TCG 트래커 — Supabase 클라이언트 (lazy 초기화)
// ara-crm의 Supabase와 완전히 별개 프로젝트
// URL·KEY는 .env.local → Vercel 환경변수에서 주입
// ========================================

import { createClient, SupabaseClient, Session } from '@supabase/supabase-js'
import type { Card } from '@/types/card'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url.startsWith('여기에') || url === '') {
    throw new Error('Supabase environment variables are not configured. Check .env.local.')
  }
  _client = createClient(url, key)
  return _client
}

// ────────────────────────────────────────
// Auth — 이메일 매직링크 로그인
// ────────────────────────────────────────

/** 매직 링크 이메일 발송 */
export async function signInWithMagicLink(email: string): Promise<void> {
  const { error } = await getClient().auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  })
  if (error) throw error
}

/** 로그아웃 */
export async function signOut(): Promise<void> {
  const { error } = await getClient().auth.signOut()
  if (error) throw error
}

/** 현재 세션 조회 */
export async function getSession(): Promise<Session | null> {
  const { data, error } = await getClient().auth.getSession()
  if (error) throw error
  return data.session
}

/** 로그인/로그아웃 상태 변화 구독. 구독 해제 함수를 반환한다 */
export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const {
    data: { subscription },
  } = getClient().auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => subscription.unsubscribe()
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

  if (!user) throw new Error('Login required')

  const rows = cards.map((c) => ({ ...c, user_id: user.id }))
  const { error } = await client.from('cards').upsert(rows)
  if (error) throw error
}

// ────────────────────────────────────────
// watchlist CRUD (신규 — RLS 활성화, user_id 필수)
// ────────────────────────────────────────

export interface WatchlistItem {
  id: string
  user_id: string
  card_name: string
  game: string | null
  card_number: string | null
  target_price: number | null
  alert_enabled: boolean
  created_at: string
}

/** 로그인한 사용자를 확인하고 없으면 throw */
async function requireUserId(client: SupabaseClient): Promise<string> {
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) throw new Error('Login required')
  return user.id
}

/** 내 관심목록 전체 불러오기 */
export async function loadWatchlist(): Promise<WatchlistItem[]> {
  const client = getClient()
  const userId = await requireUserId(client)

  const { data, error } = await client
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as WatchlistItem[]) ?? []
}

/** 관심목록 추가 또는 수정 */
export async function upsertWatchlistItem(
  item: Partial<WatchlistItem>
): Promise<WatchlistItem> {
  const client = getClient()
  const userId = await requireUserId(client)

  const payload = { ...item, user_id: userId }

  const { data, error } = await client
    .from('watchlist')
    .upsert(payload)
    .select()
    .single()

  if (error) throw error
  return data as WatchlistItem
}

/** 관심목록 삭제 */
export async function removeWatchlistItem(id: string): Promise<void> {
  const client = getClient()
  const userId = await requireUserId(client)

  const { error } = await client
    .from('watchlist')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

/** 관심목록 알림 on/off 토글 */
export async function toggleWatchlistAlert(id: string, enabled: boolean): Promise<void> {
  const client = getClient()
  const userId = await requireUserId(client)

  const { error } = await client
    .from('watchlist')
    .update({ alert_enabled: enabled })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

// ────────────────────────────────────────
// search_log (신규 — best-effort 기록, 검색 흐름을 막지 않음)
// ────────────────────────────────────────

/** 검색어 기록 (실패해도 조용히 무시) */
export async function logSearch(query: string, game?: string): Promise<void> {
  try {
    const client = getClient()
    const {
      data: { user },
    } = await client.auth.getUser()

    await client.from('search_log').insert({
      user_id: user?.id ?? null,
      query,
      game: game ?? null,
    })
  } catch {
    // best-effort — 검색 흐름을 막으면 안 됨
  }
}

/** 최근 검색어 조회 (로그인한 사용자 기준, 중복 제거) */
export async function loadRecentSearches(limit = 8): Promise<string[]> {
  const client = getClient()
  const userId = await requireUserId(client)

  // 중복 제거 후 limit개를 채워야 하므로 넉넉히 가져온다
  const { data, error } = await client
    .from('search_log')
    .select('query')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit * 4)

  if (error) throw error

  const seen = new Set<string>()
  const result: string[] = []
  for (const row of (data as { query: string }[]) ?? []) {
    if (!seen.has(row.query)) {
      seen.add(row.query)
      result.push(row.query)
      if (result.length >= limit) break
    }
  }
  return result
}
