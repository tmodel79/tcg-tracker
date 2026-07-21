-- ========================================
-- TCG 트래커 — Supabase 테이블 SQL
-- ara-crm과 완전히 별개 프로젝트 (TCG 전용 Supabase 프로젝트에서만 실행)
-- Supabase > SQL Editor에서 한 번 실행하면 끝
-- ========================================

create table if not exists cards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) not null,
  name          text not null,          -- 카드명
  game          text default '기타',
  grade         text,                   -- 버전·등급 (예: PSA 10)
  buy_date      date,
  buy_price     numeric default 0,      -- 구매가 (원래 통화)
  currency      text default 'KRW',     -- KRW / USD / JPY / EUR
  fx_rate       numeric default 1,      -- 1 통화 = ? 원
  customs       numeric default 0,      -- 관세(원)
  shipping      numeric default 0,      -- 배송대행비(원)
  etc_cost      numeric default 0,      -- 기타비용(원)
  current_price numeric,                -- 현재 시세(원). 없으면 null
  prev_price    numeric,                -- 직전 시세 (등락 표시용)
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Row Level Security: 내 카드만 보임
alter table cards enable row level security;

create policy "own cards" on cards
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger cards_updated_at
  before update on cards
  for each row execute function update_updated_at();
