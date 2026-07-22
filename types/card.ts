// ========================================
// TCG 트래커 — 카드 타입 정의
// Supabase cards 테이블과 1:1 대응
// ara-crm과 완전 별개 프로젝트
// ========================================

export type Currency = 'KRW' | 'USD' | 'JPY' | 'EUR'

export type Game =
  | '원피스'
  | '포켓몬'
  | '드래곤볼'
  | '건담'
  | '유희왕'
  | '기타'

export interface Card {
  id: string              // uuid
  user_id: string         // auth.users(id)
  name: string            // 카드명 (필수)
  game: Game              // 게임 종류
  grade: string | null    // 버전·등급 (예: PSA 10)
  buy_date: string | null // 구매일 (YYYY-MM-DD)
  buy_price: number       // 구매가 (원래 통화)
  currency: Currency      // KRW / USD / JPY / EUR
  fx_rate: number         // 1 통화 = ? 원
  customs: number         // 관세(원)
  shipping: number        // 배송대행비(원)
  etc_cost: number        // 기타비용(원)
  current_price: number | null  // 현재 시세(원). 없으면 null
  prev_price: number | null     // 직전 시세 (등락 표시용)
  card_number: string | null    // 카드번호 (예: OP01-001, P-033)
  image_url: string | null      // 카드 이미지 URL (Supabase Storage or external)
  created_at: string
  updated_at: string
}

// 화면에서 계산하는 파생값 (DB에 저장하지 않음)
export interface CardCalc {
  buyKRW: number        // buy_price * fx_rate
  totalCost: number     // buyKRW + customs + shipping + etc_cost
  hasNow: boolean       // current_price 입력 여부
  now: number | null    // current_price
  pnl: number           // current_price - totalCost (hasNow 일 때만 의미 있음)
  pct: number           // pnl / totalCost * 100
  delta: number | null  // current_price - prev_price (직전 대비 등락)
}

// 포트폴리오 합계 (화면 계산)
export interface PortfolioSummary {
  invest: number   // Σ totalCost
  value: number    // Σ (hasNow ? current_price : totalCost)
  pnl: number      // value - invest
  pct: number      // pnl / invest * 100
  totalCards: number
  pricedCards: number
}

// 모달 폼 상태
export interface CardFormData {
  name: string
  game: Game
  grade: string
  buy_date: string
  buy_price: string
  currency: Currency
  fx_rate: string
  customs: string
  shipping: string
  etc_cost: string
  current_price: string
}

export const GAMES: Game[] = ['원피스', '포켓몬', '드래곤볼', '건담', '유희왕', '기타']
export const GAMES_WITH_ALL = ['전체', ...GAMES] as const

export const FX_DEFAULT: Record<Currency, number> = {
  KRW: 1,
  USD: 1380,
  JPY: 9.1,
  EUR: 1500,
}

export type SortMode = 'pct' | 'pctAsc' | 'pnl' | 'cost' | 'date' | 'name'
