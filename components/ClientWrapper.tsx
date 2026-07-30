'use client'

import { I18nProvider } from '@/lib/i18n'
import { PwaRegister } from '@/components/PwaRegister'
import { AuthGate } from '@/components/AuthGate'

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <PwaRegister />
      <AuthGate>{children}</AuthGate>
    </I18nProvider>
  )
}
