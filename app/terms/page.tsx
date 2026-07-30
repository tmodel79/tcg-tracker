// ========================================
// 이용약관 — 정적 서버 컴포넌트
// 최소 초안. 다국어화는 다음 단계에서 처리 예정 (현재는 한국어만).
// ========================================

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이용약관 — CardLedger',
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

export default function TermsPage() {
  return (
    <div style={page}>
      <div style={container}>
        <h1 style={h1}>이용약관</h1>
        <p style={meta}>시행일: 2026년 7월 30일 · CardLedger</p>

        <h2 style={h2}>1. 서비스 소개</h2>
        <p style={p}>
          CardLedger(이하 &ldquo;서비스&rdquo;)는 트레이딩 카드 게임(TCG) 컬렉션의 구매 원가·시세·손익을
          기록하고, 여러 마켓의 시세를 검색·비교할 수 있도록 돕는 개인용 포트폴리오 관리 도구입니다.
        </p>

        <h2 style={h2}>2. 이용자의 의무</h2>
        <p style={p}>
          이용자는 서비스 가입 시 정확한 이메일 정보를 제공해야 하며, 본인의 계정과 인증 링크를
          안전하게 관리할 책임이 있습니다. 이용자는 서비스를 불법적인 목적으로 사용하거나, 타인의
          계정 정보를 도용하거나, 서비스의 정상적인 운영을 방해하는 행위를 해서는 안 됩니다.
        </p>

        <h2 style={h2}>3. 면책조항</h2>
        <p style={p}>
          서비스에서 제공하는 시세 정보(eBay, TCGPlayer, Cardmarket, 130point, Yahoo Auctions,
          Mercari 등 외부 마켓 데이터 포함)는 참고용이며, 정확성·완전성·최신성을 보장하지 않습니다.
          이용자는 시세 정보를 바탕으로 한 매매·투자 판단에 대해 전적으로 스스로 책임을 지며,
          서비스는 이로 인해 발생한 손실에 대해 책임을 지지 않습니다.
        </p>

        <h2 style={h2}>4. 서비스 변경·중단</h2>
        <p style={p}>
          서비스는 운영상·기술상 필요에 따라 사전 고지 후 서비스의 전부 또는 일부 내용을 변경하거나
          중단할 수 있습니다. 다만 이용자에게 중대한 영향을 미치는 변경의 경우 합리적인 기간을 두고
          공지합니다.
        </p>

        <h2 style={h2}>5. 준거법</h2>
        <p style={p}>
          본 약관은 대한민국 법률에 따라 해석되며, 서비스 이용과 관련하여 분쟁이 발생할 경우
          대한민국 법령 및 관할 법원의 관할에 따릅니다.
        </p>

        <h2 style={h2}>문의</h2>
        <p style={p}>
          서비스 이용 관련 문의사항은 <strong>tmodel1264@gmail.com</strong> 으로 연락해 주세요.
        </p>
      </div>
    </div>
  )
}
