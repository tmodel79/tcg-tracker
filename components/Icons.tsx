'use client'

// ========================================
// Icons — 전문 SVG 라인 아이콘 세트 (이모지 대체)
// 24×24 viewBox · stroke: currentColor · 파이낸스 대시보드 스타일
// ========================================

import React from 'react'

export interface IconProps {
  size?: number
  strokeWidth?: number
  style?: React.CSSProperties
  className?: string
}

function makeIcon(paths: React.ReactNode) {
  function Icon({ size = 16, strokeWidth = 2, style, className }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, ...style }}
        className={className}
        aria-hidden="true"
      >
        {paths}
      </svg>
    )
  }
  return Icon
}

/** 대시보드 — 막대 차트 */
export const IconDashboard = makeIcon(
  <>
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="12" y1="20" x2="12" y2="8" />
    <line x1="18" y1="20" x2="18" y2="4" />
  </>
)

/** 컬렉션 — 겹친 카드 */
export const IconCards = makeIcon(
  <>
    <rect x="3" y="7" width="13" height="14" rx="2" />
    <path d="M8 3h11a2 2 0 0 1 2 2v12" />
  </>
)

/** 추가 — 플러스 원 */
export const IconPlus = makeIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </>
)

/** 검색 — 돋보기 */
export const IconSearch = makeIcon(
  <>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </>
)

/** 백업 — 저장 */
export const IconSave = makeIcon(
  <>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </>
)

/** CSV — 표 */
export const IconTable = makeIcon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </>
)

/** 직접 입력 — 연필 */
export const IconEdit = makeIcon(
  <>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </>
)

/** URL — 링크 체인 */
export const IconLink = makeIcon(
  <>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </>
)

/** JSON 복원 — 폴더 */
export const IconFolder = makeIcon(
  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
)

/** 불러오기 — 다운로드 */
export const IconDownload = makeIcon(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </>
)

/** 영수증 스캔 — 카메라 */
export const IconCamera = makeIcon(
  <>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </>
)

/** 상승 추세 */
export const IconTrendUp = makeIcon(
  <>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </>
)

/** 하락 추세 */
export const IconTrendDown = makeIcon(
  <>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </>
)

/** 기록 핀 */
export const IconPin = makeIcon(
  <>
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </>
)

/** 최저가 — 별 */
export const IconStar = makeIcon(
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
)

/** 글로벌 — 지구 */
export const IconGlobe = makeIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <path d="M12 3a13.5 13.5 0 0 1 0 18a13.5 13.5 0 0 1 0-18z" />
  </>
)
