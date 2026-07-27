import type { Metadata } from 'next'
import './globals.css'
import { ClientWrapper } from '@/components/ClientWrapper'

export const metadata: Metadata = {
  title: 'CardLedger — Card Portfolio Tracker',
  description: 'Manage your card collection like a stock portfolio. Total cost, P&L and returns on one screen.',
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
    <html lang="ko" data-theme="dark">
      <head>
        {/* 테마 깜빡임 방지: 렌더 전에 localStorage 테마를 즉시 적용 */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('cl_theme');
            if (t === 'gray' || t === 'dark') {
              document.documentElement.setAttribute('data-theme', t);
            }
          } catch(e) {}
        `}} />
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
