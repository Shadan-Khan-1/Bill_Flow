import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, CameraOff, X, Scan, AlertCircle } from 'lucide-react'
import Modal from './Modal'

/**
 * Barcode / QR scanner using the browser's BarcodeDetector API
 * with fallback instructions when not supported.
 *
 * Usage:
 *   <BarcodeScanner open={open} onClose={...} onScan={(code) => handleSKU(code)} />
 */
export default function BarcodeScanner({ open, onClose, onScan }) {
  const videoRef   = useRef(null)
  const streamRef  = useRef(null)
  const rafRef     = useRef(null)
  const detectorRef= useRef(null)

  const [supported,  setSupported]  = useState(true)
  const [scanning,   setScanning]   = useState(false)
  const [lastScan,   setLastScan]   = useState(null)
  const [error,      setError]      = useState('')
  const [manualSKU,  setManualSKU]  = useState('')

  /* Check BarcodeDetector support */
  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setSupported(false)
    } else {
      window.BarcodeDetector.getSupportedFormats().then(formats => {
        detectorRef.current = new window.BarcodeDetector({ formats })
      })
    }
  }, [])

  /* Start camera */
  const startCamera = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setScanning(true)
        scan()
      }
    } catch (err) {
      setError(err.name === 'NotAllowedError'
        ? 'Camera access denied. Please allow camera permission.'
        : `Camera error: ${err.message}`
      )
    }
  }, [])

  /* Stop camera */
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setScanning(false)
  }, [])

  /* Scan loop */
  const scan = useCallback(async () => {
    if (!videoRef.current || !detectorRef.current) return
    try {
      const barcodes = await detectorRef.current.detect(videoRef.current)
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue
        setLastScan(code)
        stopCamera()
        onScan?.(code)
        return
      }
    } catch (_) {}
    rafRef.current = requestAnimationFrame(scan)
  }, [onScan, stopCamera])

  /* Lifecycle */
  useEffect(() => {
    if (open && supported) startCamera()
    return () => stopCamera()
  }, [open])

  useEffect(() => {
    if (!open) { stopCamera(); setLastScan(null); setError(''); setManualSKU('') }
  }, [open])

  const handleManual = (e) => {
    e.preventDefault()
    if (!manualSKU.trim()) return
    onScan?.(manualSKU.trim())
    setManualSKU('')
    onClose()
  }

  return (
    <Modal open={open} onClose={() => { stopCamera(); onClose() }} title="Barcode / QR Scanner">
      <div style={{ textAlign: 'center' }}>

        {/* Camera view */}
        {supported && (
          <div style={{
            position: 'relative',
            background: '#000',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 16,
            aspectRatio: '16/9',
          }}>
            <video
              ref={videoRef}
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Scan overlay */}
            {scanning && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{
                  width: 200, height: 120,
                  border: '2px solid var(--accent)',
                  borderRadius: 8,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                  position: 'relative',
                }}>
                  {/* Corner marks */}
                  {[['0','0'],['0','auto'],['auto','0'],['auto','auto']].map(([t,b], i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      top: t === '0' ? -2 : 'auto', bottom: b === '0' ? -2 : 'auto',
                      left: i % 2 === 0 ? -2 : 'auto', right: i % 2 === 1 ? -2 : 'auto',
                      width: 14, height: 14,
                      borderTop:    t === '0' ? '3px solid var(--accent)' : 'none',
                      borderBottom: b === '0' ? '3px solid var(--accent)' : 'none',
                      borderLeft:   i % 2 === 0 ? '3px solid var(--accent)' : 'none',
                      borderRight:  i % 2 === 1 ? '3px solid var(--accent)' : 'none',
                    }} />
                  ))}
                  {/* Scan line animation */}
                  <div style={{
                    position: 'absolute', top: '50%', left: 4, right: 4, height: 2,
                    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                    animation: 'scanLine 1.5s ease-in-out infinite',
                  }} />
                </div>
                <style>{`
                  @keyframes scanLine {
                    0%   { top: 10%; }
                    50%  { top: 90%; }
                    100% { top: 10%; }
                  }
                `}</style>
              </div>
            )}

            {!scanning && !error && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
              }}>
                <Camera size={36} color="var(--text-muted)" />
                <button className="btn btn-primary" onClick={startCamera}>
                  <Scan size={14} /> Start Scanning
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 9, padding: '10px 14px', marginBottom: 14,
            fontSize: 13, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Not supported warning */}
        {!supported && (
          <div style={{
            background: 'var(--accent-dim)', border: '1px solid var(--border-active)',
            borderRadius: 9, padding: '12px 14px', marginBottom: 14,
            fontSize: 13, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CameraOff size={14} />
            BarcodeDetector not supported in this browser. Use Chrome on Android or enter SKU manually.
          </div>
        )}

        {/* Last scan result */}
        {lastScan && (
          <div style={{
            background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 9, padding: '10px 14px', marginBottom: 14,
            fontSize: 13, color: 'var(--green)', fontWeight: 600,
          }}>
            ✅ Scanned: <span style={{ fontFamily: "'DM Mono', monospace" }}>{lastScan}</span>
          </div>
        )}

        {/* Manual entry fallback */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            Or enter SKU / barcode manually:
          </p>
          <form onSubmit={handleManual} style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder="e.g. SAM-S24-BLK"
              value={manualSKU}
              onChange={e => setManualSKU(e.target.value)}
              style={{ fontFamily: "'DM Mono', monospace" }}
            />
            <button className="btn btn-primary" type="submit" style={{ flexShrink: 0 }}>
              Use
            </button>
          </form>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
          {scanning && (
            <button className="btn btn-ghost" onClick={stopCamera}>
              <CameraOff size={14} /> Stop
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => { stopCamera(); onClose() }}>
            <X size={14} /> Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
