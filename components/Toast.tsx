'use client'

import { useEffect, useRef, useState } from 'react'

interface ToastProps {
  message: string
  onClear: () => void
}

export function Toast({ message, onClear }: ToastProps) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!message) return
    setVisible(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(onClear, 300)
    }, 2200)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [message, onClear])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 22,
        left: '50%',
        transform: visible
          ? 'translateX(-50%) translateY(0)'
          : 'translateX(-50%) translateY(20px)',
        background: 'var(--panel-3)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
        padding: '11px 18px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        opacity: visible ? 1 : 0,
        transition: '0.25s',
        zIndex: 80,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  )
}
