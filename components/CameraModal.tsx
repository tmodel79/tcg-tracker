/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type CardType = 'raw' | 'graded'

export interface OcrResult {
  name?: string | null
  card_number?: string | null
  game?: string | null
  grade?: string | null
}

interface CameraModalProps {
  open: boolean
  onClose: () => void
  /** imageDataUrl: 촬영된 카드 이미지, ocrResult: 자동인식 결과(없을 수도 있음) */
  onCapture: (imageDataUrl: string, ocrResult?: OcrResult) => void
}

// 카드 비율
const RATIOS: Record<CardType, number> = {
  raw: 63 / 88,     // 일반 트레이딩카드 (63×88mm)
  graded: 88 / 122, // PSA/BGS 등급 슬랩 (약 88×122mm)
}

export function CameraModal({ open, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number>(0)

  const [cardType, setCardType] = useState<CardType>('raw')
  const [autoOcr, setAutoOcr] = useState(true)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ocr' | 'done' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')
  const [captured, setCaptured] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState('')

  // 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraError('')
    } catch (e: any) {
      setCameraError(
        e.name === 'NotAllowedError'
          ? '카메라 권한을 허용해 주세요.'
          : `카메라를 열 수 없습니다: ${e.message}`
      )
    }
  }, [])

  // 카메라 중지
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    cancelAnimationFrame(animRef.current)
  }, [])

  useEffect(() => {
    if (open) {
      setStatus('idle')
      setCaptured(null)
      setErrMsg('')
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [open, startCamera, stopCamera])

  // 오버레이 그리기 (rAF 루프)
  const drawOverlay = useCallback(() => {
    const canvas = overlayRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const cw = canvas.offsetWidth
    const ch = canvas.offsetHeight
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw
      canvas.height = ch
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, cw, ch)

    // 가이드 박스 계산 (화면의 78% 높이 기준)
    const ratio = RATIOS[cardType]
    let gh = ch * 0.78
    let gw = gh * ratio
    if (gw > cw * 0.88) { gw = cw * 0.88; gh = gw / ratio }
    const gx = (cw - gw) / 2
    const gy = (ch - gh) / 2

    // 어두운 마스크
    ctx.fillStyle = 'rgba(0,0,0,0.52)'
    ctx.fillRect(0, 0, cw, ch)

    // 투명 가이드 구멍
    ctx.globalCompositeOperation = 'destination-out'
    const r = 10
    ctx.beginPath()
    ctx.moveTo(gx + r, gy)
    ctx.arcTo(gx + gw, gy, gx + gw, gy + gh, r)
    ctx.arcTo(gx + gw, gy + gh, gx, gy + gh, r)
    ctx.arcTo(gx, gy + gh, gx, gy, r)
    ctx.arcTo(gx, gy, gx + gw, gy, r)
    ctx.closePath()
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'

    // 모서리 강조선
    const lLen = 24, lW = 3
    ctx.strokeStyle = '#e8b13a'
    ctx.lineWidth = lW
    ctx.lineCap = 'round'
    ;[
      [gx, gy, lLen, 0, 0, lLen],
      [gx + gw, gy, -lLen, 0, 0, lLen],
      [gx, gy + gh, lLen, 0, 0, -lLen],
      [gx + gw, gy + gh, -lLen, 0, 0, -lLen],
    ].forEach(([x, y, dx1, dy1, dx2, dy2]) => {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx1, y + dy1); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx2, y + dy2); ctx.stroke()
    })

    // 타입 안내 텍스트
    ctx.font = 'bold 13px sans-serif'
    ctx.fillStyle = 'rgba(232,177,58,0.9)'
    ctx.textAlign = 'center'
    ctx.fillText(
      cardType === 'raw' ? '📄 RAW 카드를 프레임에 맞춰 주세요' : '🏷️ 등급 슬랩을 프레임에 맞춰 주세요',
      cw / 2, gy - 12
    )

    animRef.current = requestAnimationFrame(drawOverlay)
  }, [cardType])

  useEffect(() => {
    if (!open) return
    animRef.current = requestAnimationFrame(drawOverlay)
    return () => cancelAnimationFrame(animRef.current)
  }, [open, drawOverlay])

  // 가이드 박스 좌표 계산 (촬영 시 crop 용)
  function getGuideRect() {
    const video = videoRef.current
    const overlay = overlayRef.current
    if (!video || !overlay) return null

    const cw = overlay.offsetWidth
    const ch = overlay.offsetHeight
    const ratio = RATIOS[cardType]
    let gh = ch * 0.78
    let gw = gh * ratio
    if (gw > cw * 0.88) { gw = cw * 0.88; gh = gw / ratio }
    const gx = (cw - gw) / 2
    const gy = (ch - gh) / 2

    // 실제 video 해상도 vs 표시 크기 비율
    const scaleX = (video.videoWidth || cw) / cw
    const scaleY = (video.videoHeight || ch) / ch

    return {
      x: gx * scaleX, y: gy * scaleY,
      w: gw * scaleX, h: gh * scaleY,
      dispW: gw, dispH: gh,
    }
  }

  // 촬영 버튼
  const handleCapture = async () => {
    const video = videoRef.current
    if (!video) return

    const guide = getGuideRect()
    if (!guide) return

    setStatus('loading')

    // 가이드 영역만 크롭해서 캔버스에 그리기
    const out = document.createElement('canvas')
    out.width = Math.round(guide.w)
    out.height = Math.round(guide.h)
    const ctx = out.getContext('2d')
    if (!ctx) { setStatus('error'); return }

    ctx.drawImage(video, guide.x, guide.y, guide.w, guide.h, 0, 0, guide.w, guide.h)
    const dataUrl = out.toDataURL('image/jpeg', 0.92)
    setCaptured(dataUrl)
    stopCamera()

    if (!autoOcr) {
      setStatus('done')
      return
    }

    // 자동 OCR
    setStatus('ocr')
    try {
      const base64 = dataUrl.split(',')[1]
      const res = await fetch('/api/card-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: 'image/jpeg' }),
      })
      const ocrResult = await res.json()
      if (ocrResult.error) {
        setErrMsg(`OCR 오류: ${ocrResult.error}`)
        setStatus('done')
        // OCR 실패해도 이미지는 전달
        onCapture(dataUrl, undefined)
      } else {
        setStatus('done')
        onCapture(dataUrl, ocrResult)
      }
    } catch (e: any) {
      setErrMsg(`네트워크 오류: ${e.message}`)
      setStatus('done')
      onCapture(dataUrl, undefined)
    }
  }

  // 재촬영
  const handleRetry = () => {
    setCaptured(null)
    setStatus('idle')
    setErrMsg('')
    startCamera()
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.9)',
        zIndex: 100,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, width: '100%', maxWidth: 520, padding: '0 16px' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, flex: 1 }}>카드 스캔</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
        >×</button>
      </div>

      {/* 카메라 / 결과 뷰 */}
      <div
        style={{
          position: 'relative',
          width: '100%', maxWidth: 520,
          aspectRatio: '4/3',
          background: '#111',
          borderRadius: 14,
          overflow: 'hidden',
          margin: '0 16px',
        }}
      >
        {cameraError ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ff5065', fontSize: 14, padding: 24, textAlign: 'center' }}>
            {cameraError}
          </div>
        ) : captured ? (
          // 캡처된 이미지
          <img src={captured} alt="captured" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          // 카메라 피드 + 오버레이
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <canvas
              ref={overlayRef}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />
          </>
        )}

        {/* OCR 로딩 오버레이 */}
        {(status === 'loading' || status === 'ocr') && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(232,177,58,0.3)', borderTop: '3px solid #e8b13a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: '#e8b13a', fontSize: 13, fontWeight: 600 }}>
              {status === 'ocr' ? 'AI 인식 중…' : '처리 중…'}
            </span>
          </div>
        )}
      </div>

      {/* 컨트롤 */}
      <div style={{ width: '100%', maxWidth: 520, padding: '14px 16px 0' }}>

        {/* 카드 타입 토글 */}
        {!captured && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {(['raw', 'graded'] as CardType[]).map((t) => (
              <button
                key={t}
                onClick={() => setCardType(t)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: cardType === t ? 'var(--accent, #e8b13a)' : 'rgba(255,255,255,0.1)',
                  color: cardType === t ? '#111' : '#ccc',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'raw' ? '📄 RAW 카드' : '🏷️ 등급 카드'}
              </button>
            ))}
          </div>
        )}

        {/* 자동인식 체크 */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ccc', fontSize: 13.5, marginBottom: 14, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoOcr}
            onChange={(e) => setAutoOcr(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#e8b13a' }}
          />
          <span>
            자동 인식 (AI가 카드명·번호 자동으로 읽기)
            <span style={{ color: '#666', fontSize: 11.5, marginLeft: 6 }}>서버에 ANTHROPIC_API_KEY 필요</span>
          </span>
        </label>

        {/* 에러 */}
        {errMsg && (
          <p style={{ color: '#ff5065', fontSize: 12, marginBottom: 10 }}>{errMsg}</p>
        )}

        {/* 버튼 */}
        {!captured ? (
          <button
            onClick={handleCapture}
            disabled={!!cameraError || status === 'loading'}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 12, fontSize: 15, fontWeight: 800,
              background: '#e8b13a', color: '#111', border: 'none', cursor: 'pointer',
              opacity: cameraError ? 0.4 : 1,
            }}
          >
            📸 촬영
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleRetry}
              style={{ flex: 1, padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, background: 'rgba(255,255,255,0.1)', color: '#ccc', border: 'none', cursor: 'pointer' }}
            >
              재촬영
            </button>
            {status === 'done' && (
              <button
                onClick={() => onCapture(captured!)}
                style={{ flex: 2, padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#e8b13a', color: '#111', border: 'none', cursor: 'pointer' }}
              >
                이 사진 사용
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
