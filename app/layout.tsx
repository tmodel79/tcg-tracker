import type { Metadata } from 'next'
import './globals.css'
import { ClientWrapper } from '@/components/ClientWrapper'

export const metadata: Metadata = {
  title: 'CardLedger — 카드 포트폴리오',
  description: '카드 컬렉션을 주식 포트폴리오처럼 관리. 총원가·손익·수익률 한 화면에서.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CardLedger',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0a0e17" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  )
}
