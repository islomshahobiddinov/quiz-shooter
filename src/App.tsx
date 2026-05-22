import { useEffect, useRef, useState } from 'react'
import quizzes from './quizzes.json'
import './App.css'

type QuizQuestion = {
  q: string
  a: string[]
  c: number
}

type HudState = {
  question: string
  questionNumber: number
  score: number
  lives: number
  finished: boolean
  won: boolean
}

type QuizTopic = {
  id: string
  title: string
  description: string
  questions: QuizQuestion[]
}

const topics = quizzes as QuizTopic[]
const firstTopic = topics[0]

const neutralColor = '#5599ff'
const neutralGlow = 'rgba(85,153,255,0.15)'

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const crosshairRef = useRef<SVGSVGElement | null>(null)
  const soundEnabledRef = useRef(true)
  const questionsRef = useRef<QuizQuestion[]>(firstTopic.questions)
  const [selectedTopic, setSelectedTopic] = useState<QuizTopic | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [hud, setHud] = useState<HudState>({
    question: '',
    questionNumber: 1,
    score: 0,
    lives: 3,
    finished: false,
    won: false,
  })

  soundEnabledRef.current = soundEnabled

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
    let lives = 3
    let locked = false
    let gameOver = false
    let isPlaying = false
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
      if (!soundEnabledRef.current) {
        return
      }

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
      if (!soundEnabledRef.current) {
        return
      }

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
      if (!soundEnabledRef.current) {
        return
      }

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
      if (!soundEnabledRef.current) {
        return
      }

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

    const roundRect = (
      x: number,
      y: number,
      rectWidth: number,
      rectHeight: number,
      radius: number,
    ) => {
      cx.beginPath()
      cx.moveTo(x + radius, y)
      cx.lineTo(x + rectWidth - radius, y)
      cx.quadraticCurveTo(x + rectWidth, y, x + rectWidth, y + radius)
      cx.lineTo(x + rectWidth, y + rectHeight - radius)
      cx.quadraticCurveTo(
        x + rectWidth,
        y + rectHeight,
        x + rectWidth - radius,
        y + rectHeight,
      )
      cx.lineTo(x + radius, y + rectHeight)
      cx.quadraticCurveTo(x, y + rectHeight, x, y + rectHeight - radius)
      cx.lineTo(x, y + radius)
      cx.quadraticCurveTo(x, y, x + radius, y)
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
        if (!this.revealColor) {
          return neutralGlow
        }

        return this.revealColor === '#00e5cc'
          ? 'rgba(0,229,204,0.18)'
          : 'rgba(255,85,85,0.18)'
      }

      update() {
        if (!this.arrived) {
          const deltaY = this.homeY - this.y
          const deltaX = this.homeX - this.x
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

          if (distance < 4) {
            this.x = this.homeX
            this.y = this.homeY
            this.arrived = true
          } else {
            this.x += (deltaX / distance) * this.speed
            this.y += (deltaY / distance) * this.speed
          }
        }

        if (this.flash > 0) {
          this.flash -= 1
        }

        if (this.hit) {
          this.hitTimer += 1
        }
      }

      draw() {
        if (this.hit && this.hitTimer > 25) {
          return
        }

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

        for (const radiusValue of [0.58, 0.76]) {
          cx.beginPath()
          cx.ellipse(0, 0, this.w * radiusValue * 0.5, this.h * 0.55, 0, 0, Math.PI * 2)
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
        const distance = Math.sqrt((targetX - startX) ** 2 + (targetY - startY) ** 2) || 1
        this.vx = ((targetX - startX) / distance) * 20
        this.vy = ((targetY - startY) / distance) * 20
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

    type Star = {
      x: number
      y: number
      r: number
      t: number
    }

    const updateHud = (overrides: Partial<HudState> = {}) => {
      const questions = getQuestions()

      setHud({
        question: questions[questionIndex]?.q || questions[questions.length - 1].q,
        questionNumber: Math.min(questionIndex + 1, questions.length),
        score,
        lives,
        finished: gameOver,
        won: false,
        ...overrides,
      })
    }

    const spawnTargets = () => {
      targets = []
      const question = getQuestions()[questionIndex]
      question.a.forEach((answer, index) => targets.push(new Target(answer, index, index === question.c)))
      locked = false
      updateHud()
    }

    const endGame = (won: boolean) => {
      gameOver = true
      playGameOverSound(won)
      updateHud({ finished: true, won })
    }

    const shoot = (x: number, y: number) => {
      if (!isPlaying || gameOver || locked) {
        return
      }

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
            particles.push(new Particle(target.x + target.w / 2, target.y + target.h / 2, color))
          }

          shake = target.correct ? 6 : 20

          schedule(() => {
            if (shotCorrect) {
              playCorrectSound()
              const questions = getQuestions()
              score += 1
              questionIndex += 1

              if (questionIndex >= questions.length) {
                endGame(true)
                return
              }

              targets = []
              updateHud()
              schedule(spawnTargets, 500)
            } else {
              playWrongSound()
              lives -= 1

              if (lives <= 0) {
                endGame(false)
                return
              }

              messageText = "NOTO'G'RI!"
              messageColor = '#ff6666'
              messageTimer = 80
              targets = []
              updateHud()
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

      bullets = bullets.filter((bullet) => bullet.life > 0)

      for (const target of targets) {
        target.update()
        target.draw()
      }

      for (const particle of particles) {
        particle.update()
        particle.draw()
      }

      particles = particles.filter((particle) => particle.life > 0)

      if (isPlaying) {
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

      if (isPlaying && !gameOver) {
        spawnTargets()
      }
    }

    const resetGame = () => {
      questionIndex = 0
      score = 0
      lives = 3
      gameOver = false
      locked = false
      isPlaying = true
      bullets = []
      particles = []
      targets = []
      messageTimer = 0
      spawnTargets()
    }

    ;(window as Window & { restartQuizShooter?: () => void }).restartQuizShooter = resetGame
    ;(window as Window & { startQuizShooter?: () => void }).startQuizShooter = resetGame
    ;(window as Window & { stopQuizShooter?: () => void }).stopQuizShooter = () => {
      isPlaying = false
      gameOver = false
      locked = false
      bullets = []
      particles = []
      targets = []
      messageTimer = 0
      setHud((current) => ({
        ...current,
        question: '',
        questionNumber: 1,
        score: 0,
        lives: 3,
        finished: false,
        won: false,
      }))
    }

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
      timeouts.forEach((timeout) => window.clearTimeout(timeout))
      audioContext?.close()
      delete (window as Window & { restartQuizShooter?: () => void }).restartQuizShooter
      delete (window as Window & { startQuizShooter?: () => void }).startQuizShooter
      delete (window as Window & { stopQuizShooter?: () => void }).stopQuizShooter
    }
  }, [])

  const restart = () => {
    window.restartQuizShooter?.()
  }

  const startTopic = (topic: QuizTopic) => {
    questionsRef.current = topic.questions
    setSelectedTopic(topic)
    setHud({
      question: topic.questions[0].q,
      questionNumber: 1,
      score: 0,
      lives: 3,
      finished: false,
      won: false,
    })
    window.startQuizShooter?.()
  }

  const backToTopics = () => {
    setSelectedTopic(null)
    questionsRef.current = firstTopic.questions
    window.stopQuizShooter?.()
  }

  const livesText = `${'♥'.repeat(Math.max(0, hud.lives))}${'♡'.repeat(Math.max(0, 3 - hud.lives))}`
  const totalQuestions = selectedTopic?.questions.length || 0

  return (
    <main className={`quiz-shooter${selectedTopic ? ' is-playing' : ''}`}>
      <div className={`hud${selectedTopic ? '' : ' is-hidden'}`}>
        <div className="score-bar">
          <button type="button" className="topic-back" onClick={backToTopics}>
            MAVZULAR
          </button>
          <span>
            TO'G'RI: <span>{hud.score}</span>
          </span>
          <span>
            SAVOL: <span>{hud.questionNumber}</span>/{totalQuestions}
          </span>
          <span className="lives">{livesText}</span>
          <button
            type="button"
            className="sound-toggle"
            aria-label={soundEnabled ? "Ovozni o'chirish" : 'Ovozni yoqish'}
            onClick={() => setSoundEnabled((enabled) => !enabled)}
          >
            OVOZ: {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="question-box">
          <div className="question-text">{hud.question}</div>
        </div>
      </div>

      <svg ref={crosshairRef} className="crosshair" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="11" fill="none" stroke="#ff3333" strokeWidth="1.5" />
        <circle cx="15" cy="15" r="2.5" fill="#ff3333" />
        <line x1="15" y1="2" x2="15" y2="8" stroke="#ff3333" strokeWidth="1.5" />
        <line x1="15" y1="22" x2="15" y2="28" stroke="#ff3333" strokeWidth="1.5" />
        <line x1="2" y1="15" x2="8" y2="15" stroke="#ff3333" strokeWidth="1.5" />
        <line x1="22" y1="15" x2="28" y2="15" stroke="#ff3333" strokeWidth="1.5" />
      </svg>

      <canvas ref={canvasRef} className="game-canvas" />

      <section className={`topic-menu${selectedTopic ? '' : ' is-visible'}`}>
        <div className="topic-menu-inner">
          <h1>Mavzuni tanlang</h1>
          <div className="topic-grid">
            {topics.map((topic) => (
              <button key={topic.id} type="button" className="topic-card" onClick={() => startTopic(topic)}>
                <span>{topic.title}</span>
                <small>{topic.description}</small>
                <strong>{topic.questions.length} ta savol</strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className={`overlay${hud.finished ? ' is-visible' : ''}`}>
        <h2>{hud.won ? 'TUGADI! 🏆' : 'GAME OVER'}</h2>
        <p>
          {totalQuestions} dan {hud.score} ta to'g'ri javob
        </p>
        <div className="overlay-actions">
          <button type="button" onClick={restart}>
            ▶ QAYTA BOSHLASH
          </button>
          <button type="button" onClick={backToTopics}>
            MAVZULAR
          </button>
        </div>
      </div>
    </main>
  )
}

declare global {
  interface Window {
    restartQuizShooter?: () => void
    startQuizShooter?: () => void
    stopQuizShooter?: () => void
  }
}

export default App
