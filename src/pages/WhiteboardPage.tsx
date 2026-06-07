import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

type Tool = 'pen' | 'eraser' | 'text'

const COLORS = [
  '#ffffff', '#ff4455', '#ff6b35', '#facc15', '#22c55e',
  '#7fffd4', '#60a5fa', '#a78bfa', '#c084fc', '#f472b6',
  '#8aa1c5', '#000000',
]

const SIZES = [2, 4, 8, 16, 30]

function IconPen() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M10 2l3 3L4 14H1v-3L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconEraser() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M2 12h11M4 12L9 3l4 4-4 5H4z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconText() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M2 3h11M7.5 3v9M5 12h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function WhiteboardPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#ffffff')
  const [brushSize, setBrushSize] = useState(4)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const [textInput, setTextInput] = useState<{ x: number; y: number; cx: number; cy: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    canvas.width = wrap.clientWidth
    canvas.height = wrap.clientHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#0a0e1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0, cx: 0, cy: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      cx: (clientX - rect.left) * scaleX,
      cy: (clientY - rect.top) * scaleY,
    }
  }, [])

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = getPos(e)
    if (tool === 'text') {
      setTextInput({ x: pos.x, y: pos.y, cx: pos.cx, cy: pos.cy })
      return
    }
    isDrawing.current = true
    lastPos.current = { x: pos.cx, y: pos.cy }
  }, [tool, getPos])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !lastPos.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.cx, pos.cy)
    ctx.strokeStyle = tool === 'eraser' ? '#0a0e1a' : color
    ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = { x: pos.cx, y: pos.cy }
  }, [tool, color, brushSize, getPos])

  const stopDraw = useCallback(() => {
    isDrawing.current = false
    lastPos.current = null
  }, [])

  const commitText = useCallback((val: string) => {
    if (!textInput) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    if (val.trim()) {
      const fontSize = brushSize * 5 + 6
      ctx.font = `${fontSize}px 'Courier New', monospace`
      ctx.fillStyle = color
      ctx.fillText(val, textInput.cx, textInput.cy)
    }
    setTextInput(null)
  }, [textInput, color, brushSize])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    ctx.fillStyle = '#0a0e1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setTextInput(null)
  }, [])

  const cursor = tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : 'crosshair'

  return (
    <div className="whiteboard-page">
      <div className="whiteboard-toolbar">
        <button type="button" className="wb-back-btn" onClick={() => navigate('/')}>
          ← Orqaga
        </button>

        <div className="wb-divider" />

        <div className="wb-section">
          <button
            type="button"
            className={`wb-tool-btn${tool === 'pen' ? ' is-active' : ''}`}
            onClick={() => setTool('pen')}
            title="Qalamcha"
          >
            <IconPen />
          </button>
          <button
            type="button"
            className={`wb-tool-btn${tool === 'eraser' ? ' is-active' : ''}`}
            onClick={() => setTool('eraser')}
            title="O'chirg'ich"
          >
            <IconEraser />
          </button>
          <button
            type="button"
            className={`wb-tool-btn${tool === 'text' ? ' is-active' : ''}`}
            onClick={() => setTool('text')}
            title="Matn yozish"
          >
            <IconText />
          </button>
        </div>

        <div className="wb-divider" />

        <div className="wb-section wb-colors">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`wb-color-btn${color === c ? ' is-active' : ''}`}
              style={{ background: c, borderColor: c === '#000000' ? '#555' : c }}
              onClick={() => setColor(c)}
              title={c}
            />
          ))}
        </div>

        <div className="wb-divider" />

        <div className="wb-section">
          {SIZES.map(s => (
            <button
              key={s}
              type="button"
              className={`wb-size-btn${brushSize === s ? ' is-active' : ''}`}
              onClick={() => setBrushSize(s)}
              title={`${s}px`}
            >
              <span
                className="wb-size-dot"
                style={{ width: Math.min(s, 18), height: Math.min(s, 18) }}
              />
            </button>
          ))}
        </div>

        <div className="wb-divider" />

        <button type="button" className="wb-clear-btn" onClick={clearCanvas}>
          TOZALASH
        </button>
      </div>

      <div ref={wrapRef} className="whiteboard-canvas-wrap" style={{ cursor }}>
        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {textInput && (
          <input
            className="wb-text-input"
            style={{
              left: textInput.x,
              top: textInput.y - (brushSize * 5 + 6),
              color,
              fontSize: brushSize * 5 + 6,
            }}
            autoFocus
            onBlur={e => commitText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitText((e.target as HTMLInputElement).value)
              if (e.key === 'Escape') setTextInput(null)
            }}
          />
        )}
      </div>
    </div>
  )
}
