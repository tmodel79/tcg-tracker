// ========================================
// 개인정보처리방침 — 정적 서버 컴포넌트
// 최소 초안. 다국어화는 다음 단계에서 처리 예정 (현재는 한국어만).
// ========================================

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보처리방침 — CardLedger',
}

const page: React.CSSProperties = {
  minHeight: '100dvh',
  background: '#0b0e13',
  color: '#e6edf3',
  padding: '48px 20px 80px',
  fontFamily:
    "'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

const container: React.CSSProperties = {
  maxWidth: 680,
  margin: '0 auto',
}

const h1: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  marginBottom: 8,
}

const meta: React.CSSProperties = {
  fontSize: 13,
  color: '#8b98a5',
  marginBottom: 36,
}

const h2: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  marginTop: 32,
  marginBottom: 10,
  color: '#e8b13a',
}

const p: React.CSSProperties = {
  fontSize: 13.5,
  lineHeight: 1.75,
  color: '#c4ccd4',
  marginBottom: 10,
}

const li: React.CSSProperties = {
  fontSize: 13.5,
  lineHeight: 1.75,
  color: '#c4ccd4',
  marginBottom: 6,
}

export default function PrivacyPage() {
  return (
    <div style={page}>
      <div style={container}>
        <h1 style={h1}>개인정보처리방침</h1>
        <p style={meta}>시행일: 2026년 7월 30일 · CardLedger</p>

        <h2 style={h2}>1. 수집하는 개인정보 항목</h2>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li style={li}>이메일 주소 (로그인 인증용)</li>
          <li style={li}>
            카드 컬렉션 데이터 (카드명·구매가·구매일·현재 시세·이미지 등 이용자가 직접 입력한 정보)
          </li>
          <li style={li}>관심목록(워치리스트) 및 검색 기록 (서비스 이용 편의를 위한 최근 검색어 등)</li>
        </ul>

        <h2 style={h2}>2. 수집 목적</h2>
        <p style={p}>
          수집한 개인정보는 이메일 인증을 통한 로그인, 이용자별 카드 포트폴리오·관심목록 데이터의
          저장 및 제공, 서비스 이용 통계 분석 및 개선을 위한 목적으로만 사용됩니다.
        </p>

        <h2 style={h2}>3. 보관 기간</h2>
        <p style={p}>
          개인정보는 이용자가 계정을 유지하는 동안 보관되며, 회원 탈퇴 또는 삭제 요청 시 관련
          법령에서 별도로 정하는 경우를 제외하고 지체 없이 파기합니다.
        </p>

        <h2 style={h2}>4. 제3자 제공</h2>
        <p style={p}>
          서비스는 이용자의 개인정보를 본인의 동의 없이 제3자에게 제공하지 않습니다. 단, 법령에
          의거하거나 수사기관의 적법한 절차에 따른 요청이 있는 경우는 예외로 합니다.
        </p>

        <h2 style={h2}>5. 이용자의 권리</h2>
        <p style={p}>
          이용자는 언제든지 자신의 개인정보 열람·정정·삭제를 요청할 수 있으며, 계정 삭제(회원
          탈퇴)를 요청할 수 있습니다. 요청은 아래 문의처를 통해 접수할 수 있으며, 확인 후 지체
          없이 처리합니다.
        </p>

        <h2 style={h2}>문의처</h2>
        <p style={p}>
          개인정보 관련 문의사항은 <strong>tmodel1264@gmail.com</strong> 으로 연락해 주세요.
        </p>
      </div>
    </div>
  )
}
