import { useEffect, useRef } from 'react'

type Props = {
  ropePosition: number // 0–100; 50=centre; <50 team A winning; >50 team B winning
  teamAScore: number
  teamBScore: number
  teamAName: string
  teamBName: string
  winner: string | null
}

export function BattleArena(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)
  const displayPosRef = useRef(50)
  const propsRef = useRef(props)
  propsRef.current = props

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const cx = canvas.getContext('2d')!
    const W = 640
    const H = 172
    canvas.width = W
    canvas.height = H

    const drawRobot = (x: number, team: 'a' | 'b') => {
      const color = team === 'a' ? '#ff4455' : '#44aaff'
      const visorColor = team === 'a' ? '#ff8899' : '#88ccff'
      const dir = team === 'a' ? 1 : -1

      cx.save()
      cx.shadowColor = color
      cx.shadowBlur = 16

      // Legs
      cx.lineWidth = 9
      cx.strokeStyle = color
      cx.lineCap = 'round'
      cx.beginPath()
      cx.moveTo(x - 9, 108)
      cx.lineTo(x - 13, H - 18)
      cx.stroke()
      cx.beginPath()
      cx.moveTo(x + 9, 108)
      cx.lineTo(x + 13, H - 18)
      cx.stroke()

      // Body
      cx.fillStyle = color
      cx.shadowBlur = 10
      cx.beginPath()
      cx.roundRect(x - 18, 62, 36, 48, 5)
      cx.fill()

      // Chest panel
      cx.fillStyle = 'rgba(255,255,255,0.12)'
      cx.beginPath()
      cx.roundRect(x - 9, 69, 18, 14, 3)
      cx.fill()
      cx.fillStyle = 'rgba(255,255,255,0.6)'
      cx.fillRect(x - 6, 73, 4, 4)
      cx.fillRect(x + 2, 73, 4, 4)

      // Head
      cx.fillStyle = color
      cx.shadowBlur = 14
      cx.beginPath()
      cx.roundRect(x - 18, 26, 36, 36, 7)
      cx.fill()

      // Visor
      cx.fillStyle = visorColor
      cx.shadowBlur = 8
      cx.shadowColor = visorColor
      cx.beginPath()
      cx.roundRect(x + dir * 2 - 10, 36, 20, 9, 3)
      cx.fill()

      // Visor glint
      cx.fillStyle = '#ffffff'
      cx.shadowBlur = 0
      cx.fillRect(x + dir * 2 - 7, 38, 8, 2)

      // Antenna
      cx.strokeStyle = color
      cx.shadowColor = color
      cx.shadowBlur = 8
      cx.lineWidth = 2.5
      cx.beginPath()
      cx.moveTo(x, 26)
      cx.lineTo(x, 17)
      cx.stroke()
      cx.beginPath()
      cx.arc(x, 14, 4, 0, Math.PI * 2)
      cx.fillStyle = color
      cx.fill()

      // Rope arm (extended toward centre)
      cx.lineWidth = 10
      cx.strokeStyle = color
      cx.shadowColor = color
      cx.shadowBlur = 12
      cx.lineCap = 'round'
      cx.beginPath()
      cx.moveTo(x + dir * 18, 76)
      cx.lineTo(x + dir * 54, 86)
      cx.stroke()

      // Back arm
      cx.lineWidth = 8
      cx.shadowBlur = 6
      cx.beginPath()
      cx.moveTo(x - dir * 18, 76)
      cx.lineTo(x - dir * 38, 84)
      cx.stroke()

      cx.restore()
    }

    const draw = () => {
      const { ropePosition, teamAScore, teamBScore, teamAName, teamBName, winner } =
        propsRef.current

      displayPosRef.current += (ropePosition - displayPosRef.current) * 0.1
      const pos = displayPosRef.current

      cx.clearRect(0, 0, W, H)

      // Background
      const bg = cx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#0d1220')
      bg.addColorStop(1, '#06090f')
      cx.fillStyle = bg
      cx.fillRect(0, 0, W, H)

      // Team zone tints
      cx.fillStyle = 'rgba(255,68,85,0.05)'
      cx.fillRect(0, 0, W / 2, H)
      cx.fillStyle = 'rgba(68,170,255,0.05)'
      cx.fillRect(W / 2, 0, W / 2, H)

      // Ground
      cx.strokeStyle = 'rgba(255,255,255,0.08)'
      cx.lineWidth = 1
      cx.setLineDash([])
      cx.beginPath()
      cx.moveTo(0, H - 14)
      cx.lineTo(W, H - 14)
      cx.stroke()

      const robotAX = 76
      const robotBX = W - 76
      const ropeStartX = robotAX + 54
      const ropeEndX = robotBX - 54
      const ropeLen = ropeEndX - ropeStartX
      const flagX = ropeStartX + (ropeLen * pos) / 100
      const ropeY = 86

      // Win threshold markers
      const winAX = ropeStartX + ropeLen * 0.1
      const winBX = ropeStartX + ropeLen * 0.9
      cx.setLineDash([3, 4])
      cx.strokeStyle = 'rgba(255,68,85,0.45)'
      cx.lineWidth = 1.5
      cx.beginPath()
      cx.moveTo(winAX, 52)
      cx.lineTo(winAX, H - 18)
      cx.stroke()
      cx.strokeStyle = 'rgba(68,170,255,0.45)'
      cx.beginPath()
      cx.moveTo(winBX, 52)
      cx.lineTo(winBX, H - 18)
      cx.stroke()
      cx.setLineDash([])

      // Centre line
      cx.strokeStyle = 'rgba(255,255,255,0.15)'
      cx.lineWidth = 1
      cx.beginPath()
      cx.moveTo(W / 2, 52)
      cx.lineTo(W / 2, H - 18)
      cx.stroke()

      // Rope shadow
      cx.lineWidth = 10
      cx.strokeStyle = 'rgba(0,0,0,0.4)'
      cx.lineCap = 'round'
      cx.beginPath()
      cx.moveTo(ropeStartX, ropeY + 3)
      cx.bezierCurveTo(
        ropeStartX + ropeLen * 0.3,
        ropeY + 16,
        ropeStartX + ropeLen * 0.7,
        ropeY + 16,
        ropeEndX,
        ropeY + 3,
      )
      cx.stroke()

      // Rope
      cx.lineWidth = 7
      cx.strokeStyle = '#b87333'
      cx.shadowColor = '#b87333'
      cx.shadowBlur = 6
      cx.beginPath()
      cx.moveTo(ropeStartX, ropeY)
      cx.bezierCurveTo(
        ropeStartX + ropeLen * 0.3,
        ropeY + 14,
        ropeStartX + ropeLen * 0.7,
        ropeY + 14,
        ropeEndX,
        ropeY,
      )
      cx.stroke()
      cx.shadowBlur = 0

      // Rope texture segments
      cx.strokeStyle = 'rgba(255,220,150,0.25)'
      cx.lineWidth = 2
      for (let i = 1; i < 8; i++) {
        const t = i / 8
        const rx = ropeStartX + (ropeEndX - ropeStartX) * t
        const ry = ropeY + 14 * Math.sin(Math.PI * t) * 0.8
        cx.beginPath()
        cx.moveTo(rx - 3, ry - 4)
        cx.lineTo(rx + 3, ry + 4)
        cx.stroke()
      }

      // Flag pole
      const flagColor =
        pos < 48 ? '#ff4455' : pos > 52 ? '#44aaff' : '#aaccff'
      cx.shadowColor = flagColor
      cx.shadowBlur = 14
      cx.strokeStyle = '#dddddd'
      cx.lineWidth = 2.5
      cx.beginPath()
      cx.moveTo(flagX, ropeY - 2)
      cx.lineTo(flagX, ropeY - 26)
      cx.stroke()

      // Flag triangle
      cx.fillStyle = flagColor
      cx.beginPath()
      const fDir = pos <= 50 ? -1 : 1
      cx.moveTo(flagX, ropeY - 26)
      cx.lineTo(flagX + fDir * 18, ropeY - 18)
      cx.lineTo(flagX, ropeY - 10)
      cx.closePath()
      cx.fill()
      cx.shadowBlur = 0

      // Robots (drawn on top of rope)
      drawRobot(robotAX, 'a')
      drawRobot(robotBX, 'b')

      // Team labels + scores
      cx.font = 'bold 13px "Courier New"'
      cx.textAlign = 'center'
      cx.textBaseline = 'top'

      cx.fillStyle = '#ff4455'
      cx.shadowColor = '#ff4455'
      cx.shadowBlur = 8
      cx.fillText(
        `${teamAName.length > 9 ? teamAName.slice(0, 8) + '…' : teamAName} · ${teamAScore}`,
        robotAX,
        4,
      )

      cx.fillStyle = '#44aaff'
      cx.shadowColor = '#44aaff'
      cx.fillText(
        `${teamBName.length > 9 ? teamBName.slice(0, 8) + '…' : teamBName} · ${teamBScore}`,
        robotBX,
        4,
      )
      cx.shadowBlur = 0

      // Winner overlay
      if (winner) {
        cx.fillStyle = 'rgba(0,0,0,0.78)'
        cx.fillRect(0, 0, W, H)
        const wColor =
          winner === 'a' ? '#ff4455' : winner === 'b' ? '#44aaff' : '#ffe066'
        const wText =
          winner === 'a'
            ? `JAMOA A G'ALABA! 🏆`
            : winner === 'b'
              ? `JAMOA B G'ALABA! 🏆`
              : `DURRANG! 🤝`
        cx.font = 'bold 22px "Courier New"'
        cx.fillStyle = wColor
        cx.shadowColor = wColor
        cx.shadowBlur = 22
        cx.textAlign = 'center'
        cx.textBaseline = 'middle'
        cx.fillText(wText, W / 2, H / 2)
        cx.shadowBlur = 0
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <div className="battle-arena-bar">
      <div className="battle-arena-inner">
        <canvas ref={canvasRef} className="battle-arena-canvas" />
      </div>
    </div>
  )
}
