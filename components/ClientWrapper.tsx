'use client'

import { I18nProvider } from '@/lib/i18n'
import { PwaRegister } from '@/components/PwaRegister'

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <PwaRegister />
      {children}
    </I18nProvider>
  )
}
