import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TCG 트래커 — 카드 포트폴리오',
  description: '카드 컬렉션을 주식 포트폴리오처럼 관리. 총원가·손익·수익률 한 화면에서.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
