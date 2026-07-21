'use client'

import { useCallback, useEffect, useState } from 'react'
import { loadCards, upsertCard, removeCard, importCards } from '@/lib/supabase'
import { uid } from '@/lib/utils'
import type { Card } from '@/types/card'

export function useCards() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const data = await loadCards()
      setCards(data)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const saveCard = useCallback(
    async (data: Partial<Card>, isNew: boolean) => {
      const row: Partial<Card> = isNew
        ? { ...data, id: uid() }
        : data
      const saved = await upsertCard(row)
      setCards((prev) =>
        isNew
          ? [...prev, saved]
          : prev.map((c) => (c.id === saved.id ? saved : c))
      )
      return saved
    },
    []
  )

  const deleteCard = useCallback(async (id: string) => {
    await removeCard(id)
    setCards((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const importJson = useCallback(async (incoming: Card[]) => {
    await importCards(incoming)
    await fetch()
  }, [fetch])

  return { cards, loading, error, saveCard, deleteCard, importJson, refetch: fetch }
}
