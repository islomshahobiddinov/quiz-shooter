import { useEffect, useRef } from 'react'
import type { QuizQuestion } from '../lib/quizzesApi'

export type ShooterProgress = {
  question: string
  questionNumber: number
  score: number
  lives: number
}

export type ShooterFinished = {
  won: boolean
  score: number
}

type ShooterCanvasProps = {
  questions: QuizQuestion[]
  initialLives?: number
  soundEnabled: boolean
  active: boolean
  resetSignal: number
  endSignal?: number
  onProgress: (state: ShooterProgress) => void
  onAnswer?: (correct: boolean, snapshot: { score: number; lives: number; questionIndex: number }) => void
  onFinished: (info: ShooterFinished) => void
}

const neutralColor = '#5599ff'
const neutralGlow = 'rgba(85,153,255,0.15)'

export function ShooterCanvas({
  questions,
  initialLives = 3,
  soundEnabled,
  active,
  resetSignal,
  endSignal,
  onProgress,
  onAnswer,
  onFinished,
}: ShooterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const crosshairRef = useRef<SVGSVGElement | null>(null)

  const questionsRef = useRef<QuizQuestion[]>(questions)
  const soundRef = useRef(soundEnabled)
  const livesStartRef = useRef(initialLives)
  const activeRef = useRef(active)
  const onProgressRef = useRef(onProgress)
  const onAnswerRef = useRef(onAnswer)
  const onFinishedRef = useRef(onFinished)
  const apiRef = useRef<{ reset: () => void; forceEnd: () => void } | null>(null)

  questionsRef.current = questions
  soundRef.current = soundEnabled
  livesStartRef.current = initialLives
  activeRef.current = active
  onProgressRef.current = onProgress
  onAnswerRef.current = onAnswer
  onFinishedRef.current = onFinished

  useEffect(() => {
    const canvas = canvasRef.current
    const crosshair = crosshairRef.current
    const maybeContext = canvas?.getContext('2d')

    if (!canvas || !crosshair || !maybeContext) {
      return
    }

    const cx = maybeContext
    let width = window.innerWidth
    let height = window.innerHeight
    let mouseX = width / 2
    let mouseY = height / 2
    let questionIndex = 0
    let score = 0
    let lives = livesStartRef.current
    let locked = false
    let gameOver = false
    let targets: Target[] = []
    let bullets: Bullet[] = []
    let particles: Particle[] = []
    let stars: Star[] = []
    let shake = 0
    let messageTimer = 0
    let messageText = ''
    let messageColor = '#ff6666'
    let animationFrame = 0
    let audioContext: AudioContext | null = null
    const timeouts = new Set<number>()

    const getQuestions = () => questionsRef.current

    const getAudioContext = () => {
      audioContext ||= new AudioContext()
      return audioContext
    }

    const unlockAudio = async () => {
      if (!soundRef.current) return
      const audio = getAudioContext()
      if (audio.state === 'suspended') {
        await audio.resume()
      }
    }

    const playTone = (
      frequency: number,
      duration: number,
      type: OscillatorType = 'sine',
      volume = 0.08,
      delay = 0,
    ) => {
      if (!soundRef.current) return
      const audio = getAudioContext()
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      const startTime = audio.currentTime + delay
      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, startTime)
      gain.gain.setValueAtTime(0.0001, startTime)
      gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
      oscillator.connect(gain)
      gain.connect(audio.destination)
      oscillator.start(startTime)
      oscillator.stop(startTime + duration + 0.03)
    }

    const playNoiseBurst = (duration: number, volume = 0.06) => {
      if (!soundRef.current) return
      const audio = getAudioContext()
      const bufferSize = Math.max(1, Math.floor(audio.sampleRate * duration))
      const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
      }
      const source = audio.createBufferSource()
      const filter = audio.createBiquadFilter()
      const gain = audio.createGain()
      const startTime = audio.currentTime
      filter.type = 'highpass'
      filter.frequency.setValueAtTime(900, startTime)
      gain.gain.setValueAtTime(volume, startTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
      source.buffer = buffer
      source.connect(filter)
      filter.connect(gain)
      gain.connect(audio.destination)
      source.start(startTime)
      source.stop(startTime + duration)
    }

    const playLaserSweep = () => {
      if (!soundRef.current) return
      const audio = getAudioContext()
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      const startTime = audio.currentTime
      const duration = 0.13
      oscillator.type = 'sawtooth'
      oscillator.frequency.setValueAtTime(980, startTime)
      oscillator.frequency.exponentialRampToValueAtTime(145, startTime + duration)
      gain.gain.setValueAtTime(0.0001, startTime)
      gain.gain.exponentialRampToValueAtTime(0.13, startTime + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
      oscillator.connect(gain)
      gain.connect(audio.destination)
      oscillator.start(startTime)
      oscillator.stop(startTime + duration + 0.03)
    }

    const playShootSound = () => {
      playLaserSweep()
      playNoiseBurst(0.045, 0.035)
      playTone(72, 0.08, 'triangle', 0.045, 0.035)
    }

    const playCorrectSound = () => {
      playTone(520, 0.08, 'sine', 0.06)
      playTone(740, 0.1, 'sine', 0.06, 0.08)
      playTone(980, 0.12, 'triangle', 0.05, 0.17)
    }

    const playWrongSound = () => {
      playTone(180, 0.14, 'sawtooth', 0.07)
      playTone(120, 0.18, 'sawtooth', 0.06, 0.11)
    }

    const playGameOverSound = (won: boolean) => {
      if (won) {
        playTone(660, 0.1, 'triangle', 0.06)
        playTone(880, 0.1, 'triangle', 0.06, 0.1)
        playTone(1320, 0.18, 'triangle', 0.05, 0.22)
      } else {
        playTone(220, 0.16, 'sawtooth', 0.06)
        playTone(160, 0.2, 'sawtooth', 0.055, 0.14)
        playTone(90, 0.28, 'sawtooth', 0.05, 0.32)
      }
    }

    const schedule = (callback: () => void, delay: number) => {
      const timeout = window.setTimeout(() => {
        timeouts.delete(timeout)
        callback()
      }, delay)
      timeouts.add(timeout)
    }

    const syncCanvasSize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      stars = makeStars()
    }

    const makeStars = () =>
      Array.from({ length: 140 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.3,
        t: Math.random() * Math.PI * 2,
      }))

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      cx.beginPath()
      cx.moveTo(x + r, y)
      cx.lineTo(x + w - r, y)
      cx.quadraticCurveTo(x + w, y, x + w, y + r)
      cx.lineTo(x + w, y + h - r)
      cx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      cx.lineTo(x + r, y + h)
      cx.quadraticCurveTo(x, y + h, x, y + h - r)
      cx.lineTo(x, y + r)
      cx.quadraticCurveTo(x, y, x + r, y)
      cx.closePath()
    }

    class Target {
      text: string
      idx: number
      correct: boolean
      w: number
      h = 48
      x: number
      y: number
      homeX: number
      homeY: number
      speed: number
      arrived = false
      rot = 0
      hit = false
      hitTimer = 0
      flash = 0
      revealColor: string | null = null

      constructor(text: string, idx: number, isCorrect: boolean) {
        this.text = text
        this.idx = idx
        this.correct = isCorrect
        this.w = Math.max(120, text.length * 9 + 40)
        const leftPadding = 24
        const rightPadding = 24
        const availableWidth = width - leftPadding - rightPadding
        const step = availableWidth / getQuestions()[questionIndex].a.length
        const centerX = leftPadding + step * idx + step / 2
        this.homeX = Math.min(Math.max(centerX - this.w / 2, 20), width - this.w - 20)
        this.homeY = 180
        this.x = this.homeX
        this.y = -80 - idx * 60
        this.speed = 2.5 + Math.random() * 1.5
      }

      get color() {
        return this.revealColor || neutralColor
      }

      get glow() {
        if (!this.revealColor) return neutralGlow
        return this.revealColor === '#00e5cc' ? 'rgba(0,229,204,0.18)' : 'rgba(255,85,85,0.18)'
      }

      update() {
        if (!this.arrived) {
          const dy = this.homeY - this.y
          const dx = this.homeX - this.x
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 4) {
            this.x = this.homeX
            this.y = this.homeY
            this.arrived = true
          } else {
            this.x += (dx / d) * this.speed
            this.y += (dy / d) * this.speed
          }
        }
        if (this.flash > 0) this.flash -= 1
        if (this.hit) this.hitTimer += 1
      }

      draw() {
        if (this.hit && this.hitTimer > 25) return
        const alpha = this.hit ? Math.max(0, 1 - this.hitTimer / 25) : 1
        cx.save()
        cx.globalAlpha = alpha
        cx.translate(this.x + this.w / 2, this.y + this.h / 2)
        cx.rotate(this.rot)
        cx.shadowColor = this.color
        cx.shadowBlur = this.flash > 0 ? 35 : 14
        roundRect(-this.w / 2, -this.h / 2, this.w, this.h, 8)
        cx.fillStyle = this.glow
        cx.fill()
        cx.strokeStyle = this.color
        cx.lineWidth = this.flash > 0 ? 3 : 1.8
        cx.stroke()
        cx.shadowBlur = 0
        for (const r of [0.58, 0.76]) {
          cx.beginPath()
          cx.ellipse(0, 0, this.w * r * 0.5, this.h * 0.55, 0, 0, Math.PI * 2)
          cx.strokeStyle = this.color
          cx.globalAlpha = alpha * 0.18
          cx.lineWidth = 1
          cx.stroke()
        }
        cx.globalAlpha = alpha
        cx.fillStyle = '#ffffff'
        cx.font = 'bold 13px "Courier New"'
        cx.textAlign = 'center'
        cx.textBaseline = 'middle'
        const words = this.text.split(' ')
        if (words.length > 3) {
          const half = Math.ceil(words.length / 2)
          cx.fillText(words.slice(0, half).join(' '), 0, -8)
          cx.fillText(words.slice(half).join(' '), 0, 8)
        } else {
          cx.fillText(this.text, 0, 0)
        }
        cx.restore()
      }

      hitTest(x: number, y: number) {
        return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h
      }
    }

    class Bullet {
      x: number
      y: number
      vx: number
      vy: number
      life = 60

      constructor(startX: number, startY: number, targetX: number, targetY: number) {
        this.x = startX
        this.y = startY
        const d = Math.sqrt((targetX - startX) ** 2 + (targetY - startY) ** 2) || 1
        this.vx = ((targetX - startX) / d) * 20
        this.vy = ((targetY - startY) / d) * 20
      }

      update() {
        this.x += this.vx
        this.y += this.vy
        this.life -= 1
      }

      draw() {
        cx.beginPath()
        cx.moveTo(this.x, this.y)
        cx.lineTo(this.x - this.vx * 2.5, this.y - this.vy * 2.5)
        cx.strokeStyle = '#ffe066'
        cx.shadowColor = '#ffcc00'
        cx.shadowBlur = 12
        cx.lineWidth = 3
        cx.stroke()
        cx.shadowBlur = 0
      }
    }

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      life: number
      maxLife: number
      r: number
      color: string

      constructor(x: number, y: number, color: string) {
        this.x = x
        this.y = y
        this.vx = (Math.random() - 0.5) * 9
        this.vy = (Math.random() - 0.5) * 9
        this.life = 50 + Math.random() * 20
        this.maxLife = this.life
        this.r = 2 + Math.random() * 3
        this.color = color
      }

      update() {
        this.x += this.vx
        this.y += this.vy
        this.vy += 0.25
        this.life -= 1
      }

      draw() {
        cx.globalAlpha = this.life / this.maxLife
        cx.beginPath()
        cx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
        cx.fillStyle = this.color
        cx.fill()
        cx.globalAlpha = 1
      }
    }

    type Star = { x: number; y: number; r: number; t: number }

    const pushProgress = () => {
      const qs = getQuestions()
      onProgressRef.current({
        question: qs[questionIndex]?.q || qs[qs.length - 1]?.q || '',
        questionNumber: Math.min(questionIndex + 1, qs.length),
        score,
        lives,
      })
    }

    const spawnTargets = () => {
      targets = []
      const question = getQuestions()[questionIndex]
      if (!question) return
      question.a.forEach((answer, index) =>
        targets.push(new Target(answer, index, index === question.c)),
      )
      locked = false
      pushProgress()
    }

    const endGame = (won: boolean) => {
      if (gameOver) return
      gameOver = true
      playGameOverSound(won)
      onFinishedRef.current({ won, score })
    }

    const shoot = (x: number, y: number) => {
      if (!activeRef.current || gameOver || locked) return
      bullets.push(new Bullet(width / 2, height - 20, x, y))
      playShootSound()
      for (const target of targets) {
        if (!target.hit && target.arrived && target.hitTest(x, y)) {
          target.hit = true
          target.flash = 15
          locked = true
          const shotCorrect = target.correct
          for (const item of targets) {
            item.revealColor = item.correct ? '#00e5cc' : '#ff5555'
          }
          const color = target.correct ? '#00e5cc' : '#ff4444'
          for (let i = 0; i < 35; i += 1) {
            particles.push(
              new Particle(target.x + target.w / 2, target.y + target.h / 2, color),
            )
          }
          shake = target.correct ? 6 : 20
          schedule(() => {
            if (shotCorrect) {
              playCorrectSound()
              const qs = getQuestions()
              score += 1
              questionIndex += 1
              onAnswerRef.current?.(true, { score, lives, questionIndex })
              if (questionIndex >= qs.length) {
                endGame(true)
                return
              }
              targets = []
              pushProgress()
              schedule(spawnTargets, 500)
            } else {
              playWrongSound()
              lives -= 1
              onAnswerRef.current?.(false, { score, lives, questionIndex })
              if (lives <= 0) {
                endGame(false)
                return
              }
              messageText = "NOTO'G'RI!"
              messageColor = '#ff6666'
              messageTimer = 80
              targets = []
              pushProgress()
              schedule(spawnTargets, 1000)
            }
          }, 600)
          break
        }
      }
    }

    const drawGun = () => {
      const gunX = width / 2
      const gunY = height - 18
      const angle = Math.atan2(mouseY - gunY, mouseX - gunX)
      cx.save()
      cx.translate(gunX, gunY)
      cx.rotate(angle)
      cx.shadowColor = '#7fffd4'
      cx.shadowBlur = 18
      cx.fillStyle = '#7fffd4'
      roundRect(10, -5, 38, 10, 3)
      cx.fill()
      cx.fillStyle = '#4dd9c0'
      roundRect(-13, -10, 26, 20, 6)
      cx.fill()
      cx.shadowBlur = 0
      cx.restore()
    }

    const loop = () => {
      cx.clearRect(0, 0, width, height)
      cx.fillStyle = '#0a0e1a'
      cx.fillRect(0, 0, width, height)
      for (const star of stars) {
        star.t += 0.025
        cx.globalAlpha = 0.35 + Math.sin(star.t) * 0.3
        cx.fillStyle = '#aac8ff'
        cx.beginPath()
        cx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
        cx.fill()
      }
      cx.globalAlpha = 1
      let shakeX = 0
      let shakeY = 0
      if (shake > 0) {
        shakeX = (Math.random() - 0.5) * 10 * (shake / 20)
        shakeY = (Math.random() - 0.5) * 10 * (shake / 20)
        shake -= 1
      }
      cx.save()
      cx.translate(shakeX, shakeY)
      for (const bullet of bullets) {
        bullet.update()
        bullet.draw()
      }
      bullets = bullets.filter((b) => b.life > 0)
      for (const target of targets) {
        target.update()
        target.draw()
      }
      for (const particle of particles) {
        particle.update()
        particle.draw()
      }
      particles = particles.filter((p) => p.life > 0)
      if (activeRef.current && !gameOver) {
        drawGun()
      }
      if (messageTimer > 0) {
        messageTimer -= 1
        cx.globalAlpha = Math.min(1, messageTimer / 25)
        cx.fillStyle = messageColor
        cx.font = 'bold 20px "Courier New"'
        cx.textAlign = 'center'
        cx.fillText(messageText, width / 2, height / 2)
        cx.globalAlpha = 1
      }
      cx.restore()
      animationFrame = requestAnimationFrame(loop)
    }

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX
      mouseY = event.clientY
      crosshair.style.left = `${mouseX}px`
      crosshair.style.top = `${mouseY}px`
    }

    const handleClick = async (event: MouseEvent) => {
      await unlockAudio()
      shoot(event.clientX, event.clientY)
    }

    const handleResize = () => {
      syncCanvasSize()
      targets = []
      if (activeRef.current && !gameOver) {
        spawnTargets()
      }
    }

    const reset = () => {
      questionIndex = 0
      score = 0
      lives = livesStartRef.current
      gameOver = false
      locked = false
      bullets = []
      particles = []
      targets = []
      messageTimer = 0
      spawnTargets()
    }

    const forceEnd = () => {
      endGame(false)
    }

    apiRef.current = { reset, forceEnd }

    syncCanvasSize()
    crosshair.style.left = `${mouseX}px`
    crosshair.style.top = `${mouseY}px`
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)
    window.addEventListener('resize', handleResize)
    animationFrame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animationFrame)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
      window.removeEventListener('resize', handleResize)
      timeouts.forEach((t) => window.clearTimeout(t))
      audioContext?.close()
      apiRef.current = null
    }
  }, [])

  // Reset on signal change
  useEffect(() => {
    apiRef.current?.reset()
  }, [resetSignal])

  // Force-end on signal change (skip initial)
  const endSignalRef = useRef(endSignal)
  useEffect(() => {
    if (endSignal === undefined || endSignal === endSignalRef.current) {
      endSignalRef.current = endSignal
      return
    }
    endSignalRef.current = endSignal
    apiRef.current?.forceEnd()
  }, [endSignal])

  return (
    <>
      <svg
        ref={crosshairRef}
        className="crosshair"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 30 30"
        style={{ display: active ? undefined : 'none' }}
      >
        <circle cx="15" cy="15" r="11" fill="none" stroke="#ff3333" strokeWidth="1.5" />
        <circle cx="15" cy="15" r="2.5" fill="#ff3333" />
        <line x1="15" y1="2" x2="15" y2="8" stroke="#ff3333" strokeWidth="1.5" />
        <line x1="15" y1="22" x2="15" y2="28" stroke="#ff3333" strokeWidth="1.5" />
        <line x1="2" y1="15" x2="8" y2="15" stroke="#ff3333" strokeWidth="1.5" />
        <line x1="22" y1="15" x2="28" y2="15" stroke="#ff3333" strokeWidth="1.5" />
      </svg>
      <canvas ref={canvasRef} className="game-canvas" />
    </>
  )
}
