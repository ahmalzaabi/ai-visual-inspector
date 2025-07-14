import { useEffect, useRef, useState } from 'react'

interface AROverlayProps {
  fingerCount: number
  handLandmarks: any[]
  isActive: boolean
}

interface ARElement {
  id: string
  type: 'cube' | 'sphere' | 'pyramid' | 'star' | 'heart'
  color: string
  position: { x: number; y: number }
  size: number
  animation: 'pulse' | 'rotate' | 'bounce' | 'glow' | 'float'
}

const AROverlay: React.FC<AROverlayProps> = ({
  fingerCount,
  isActive
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(0)
  const [arElements, setArElements] = useState<ARElement[]>([])
  const [animationTime, setAnimationTime] = useState(0)

  // Define AR elements for each finger count
  const getARElementsForFingerCount = (count: number): ARElement[] => {
    const elements: ARElement[] = []
    
    switch (count) {
      case 1:
        elements.push({
          id: 'one-star',
          type: 'star',
          color: '#FFD700',
          position: { x: 50, y: 30 },
          size: 80,
          animation: 'glow'
        })
        break
        
      case 2:
        elements.push(
          {
            id: 'two-cube-1',
            type: 'cube',
            color: '#FF6B6B',
            position: { x: 30, y: 25 },
            size: 60,
            animation: 'rotate'
          },
          {
            id: 'two-cube-2',
            type: 'cube',
            color: '#4ECDC4',
            position: { x: 70, y: 25 },
            size: 60,
            animation: 'rotate'
          }
        )
        break
        
      case 3:
        elements.push(
          {
            id: 'three-sphere-1',
            type: 'sphere',
            color: '#FF6B6B',
            position: { x: 25, y: 20 },
            size: 50,
            animation: 'bounce'
          },
          {
            id: 'three-sphere-2',
            type: 'sphere',
            color: '#4ECDC4',
            position: { x: 50, y: 20 },
            size: 50,
            animation: 'bounce'
          },
          {
            id: 'three-sphere-3',
            type: 'sphere',
            color: '#45B7D1',
            position: { x: 75, y: 20 },
            size: 50,
            animation: 'bounce'
          }
        )
        break
        
      case 4:
        elements.push(
          {
            id: 'four-pyramid-1',
            type: 'pyramid',
            color: '#9B59B6',
            position: { x: 20, y: 20 },
            size: 45,
            animation: 'float'
          },
          {
            id: 'four-pyramid-2',
            type: 'pyramid',
            color: '#E74C3C',
            position: { x: 40, y: 20 },
            size: 45,
            animation: 'float'
          },
          {
            id: 'four-pyramid-3',
            type: 'pyramid',
            color: '#F39C12',
            position: { x: 60, y: 20 },
            size: 45,
            animation: 'float'
          },
          {
            id: 'four-pyramid-4',
            type: 'pyramid',
            color: '#27AE60',
            position: { x: 80, y: 20 },
            size: 45,
            animation: 'float'
          }
        )
        break
        
      case 5:
        elements.push(
          {
            id: 'five-heart-center',
            type: 'heart',
            color: '#E91E63',
            position: { x: 50, y: 30 },
            size: 100,
            animation: 'pulse'
          }
        )
        // Add smaller hearts around
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI * 2) / 4
          const radius = 120
          const x = 50 + Math.cos(angle) * (radius / window.innerWidth * 100)
          const y = 30 + Math.sin(angle) * (radius / window.innerHeight * 100)
          
          elements.push({
            id: `five-heart-${i}`,
            type: 'heart',
            color: '#FF69B4',
            position: { x, y },
            size: 40,
            animation: 'pulse'
          })
        }
        break
        
      default:
        break
    }
    
    return elements
  }

  // Draw AR elements
  const drawARElements = (ctx: CanvasRenderingContext2D, elements: ARElement[]) => {
    const canvas = ctx.canvas
    const width = canvas.width
    const height = canvas.height

    elements.forEach(element => {
      const x = (element.position.x / 100) * width
      const y = (element.position.y / 100) * height
      let size = element.size

      // Apply animations
      switch (element.animation) {
        case 'pulse':
          size = element.size * (1 + Math.sin(animationTime * 0.005) * 0.3)
          break
        case 'rotate':
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(animationTime * 0.002)
          ctx.translate(-x, -y)
          break
                 case 'bounce':
           const bounceY = y + Math.sin(animationTime * 0.008) * 20
           drawShape(ctx, element.type, x, bounceY, size, element.color)
           return
        case 'glow':
          // Create glow effect
          ctx.shadowColor = element.color
          ctx.shadowBlur = 20 + Math.sin(animationTime * 0.01) * 10
          break
                 case 'float':
           const floatY = y + Math.sin(animationTime * 0.003 + element.position.x) * 15
           drawShape(ctx, element.type, x, floatY, size, element.color)
           ctx.shadowBlur = 0
           return
      }

      drawShape(ctx, element.type, x, y, size, element.color)
      
      if (element.animation === 'rotate') ctx.restore()
      ctx.shadowBlur = 0
    })
  }

  // Draw different shapes
  const drawShape = (
    ctx: CanvasRenderingContext2D,
    type: ARElement['type'],
    x: number,
    y: number,
    size: number,
    color: string
  ) => {
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 3

    switch (type) {
      case 'cube':
        // Draw 3D-looking cube
        const cubeSize = size / 2
        // Front face
        ctx.fillRect(x - cubeSize, y - cubeSize, cubeSize * 2, cubeSize * 2)
        // Top face (lighter)
        ctx.fillStyle = lightenColor(color, 20)
        ctx.beginPath()
        ctx.moveTo(x - cubeSize, y - cubeSize)
        ctx.lineTo(x - cubeSize + 15, y - cubeSize - 15)
        ctx.lineTo(x + cubeSize + 15, y - cubeSize - 15)
        ctx.lineTo(x + cubeSize, y - cubeSize)
        ctx.closePath()
        ctx.fill()
        // Right face (darker)
        ctx.fillStyle = darkenColor(color, 20)
        ctx.beginPath()
        ctx.moveTo(x + cubeSize, y - cubeSize)
        ctx.lineTo(x + cubeSize + 15, y - cubeSize - 15)
        ctx.lineTo(x + cubeSize + 15, y + cubeSize - 15)
        ctx.lineTo(x + cubeSize, y + cubeSize)
        ctx.closePath()
        ctx.fill()
        break
        
      case 'sphere':
        const gradient = ctx.createRadialGradient(x - size/4, y - size/4, 0, x, y, size/2)
        gradient.addColorStop(0, lightenColor(color, 40))
        gradient.addColorStop(1, color)
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, size / 2, 0, Math.PI * 2)
        ctx.fill()
        break
        
      case 'pyramid':
        ctx.beginPath()
        ctx.moveTo(x, y - size / 2)
        ctx.lineTo(x - size / 2, y + size / 2)
        ctx.lineTo(x + size / 2, y + size / 2)
        ctx.closePath()
        ctx.fill()
        // Add 3D effect
        ctx.fillStyle = darkenColor(color, 30)
        ctx.beginPath()
        ctx.moveTo(x, y - size / 2)
        ctx.lineTo(x + size / 2, y + size / 2)
        ctx.lineTo(x + size / 3, y + size / 3)
        ctx.closePath()
        ctx.fill()
        break
        
      case 'star':
        drawStar(ctx, x, y, 5, size / 2, size / 4)
        ctx.fill()
        break
        
      case 'heart':
        drawHeart(ctx, x, y, size)
        ctx.fill()
        break
    }
  }

  // Helper function to draw a star
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) => {
    let rot = (Math.PI / 2) * 3
    let x = cx
    let y = cy
    const step = Math.PI / spikes

    ctx.beginPath()
    ctx.moveTo(cx, cy - outerRadius)

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius
      y = cy + Math.sin(rot) * outerRadius
      ctx.lineTo(x, y)
      rot += step

      x = cx + Math.cos(rot) * innerRadius
      y = cy + Math.sin(rot) * innerRadius
      ctx.lineTo(x, y)
      rot += step
    }

    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath()
  }

  // Helper function to draw a heart
  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const scale = size / 100
    ctx.beginPath()
    ctx.moveTo(x, y + 25 * scale)
    ctx.bezierCurveTo(x, y + 22 * scale, x - 5 * scale, y + 15 * scale, x - 25 * scale, y + 15 * scale)
    ctx.bezierCurveTo(x - 55 * scale, y + 15 * scale, x - 55 * scale, y - 15 * scale, x - 25 * scale, y - 15 * scale)
    ctx.bezierCurveTo(x - 10 * scale, y - 25 * scale, x, y - 5 * scale, x, y + 25 * scale)
    ctx.bezierCurveTo(x, y - 5 * scale, x + 10 * scale, y - 25 * scale, x + 25 * scale, y - 15 * scale)
    ctx.bezierCurveTo(x + 55 * scale, y - 15 * scale, x + 55 * scale, y + 15 * scale, x + 25 * scale, y + 15 * scale)
    ctx.bezierCurveTo(x + 5 * scale, y + 15 * scale, x, y + 22 * scale, x, y + 25 * scale)
  }

  // Color manipulation helpers
  const lightenColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '')
    const num = parseInt(hex, 16)
    const r = Math.min(255, (num >> 16) + amount)
    const g = Math.min(255, ((num >> 8) & 0x00FF) + amount)
    const b = Math.min(255, (num & 0x0000FF) + amount)
    return `rgb(${r}, ${g}, ${b})`
  }

  const darkenColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '')
    const num = parseInt(hex, 16)
    const r = Math.max(0, (num >> 16) - amount)
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount)
    const b = Math.max(0, (num & 0x0000FF) - amount)
    return `rgb(${r}, ${g}, ${b})`
  }

  // Animation loop
  useEffect(() => {
    if (!isActive || !canvasRef.current) return

    const animate = (timestamp: number) => {
      setAnimationTime(timestamp)
      
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw AR elements
      if (arElements.length > 0) {
        drawARElements(ctx, arElements)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive, arElements, animationTime])

  // Update AR elements when finger count changes
  useEffect(() => {
    if (isActive) {
      const newElements = getARElementsForFingerCount(fingerCount)
      setArElements(newElements)
    } else {
      setArElements([])
    }
  }, [fingerCount, isActive])

  // Resize canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="ar-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 20
      }}
    />
  )
}

export default AROverlay 