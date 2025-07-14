import { useEffect, useRef, useState, useCallback } from 'react'
import { Hands } from '@mediapipe/hands'
import type { Results } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'

interface HandGestureTrackerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  onGestureDetected: (fingerCount: number, landmarks: any[]) => void
  isActive: boolean
}

interface FingerLandmarks {
  thumb: number[]
  index: number[]
  middle: number[]
  ring: number[]
  pinky: number[]
}

const HandGestureTracker: React.FC<HandGestureTrackerProps> = ({
  videoRef,
  onGestureDetected,
  isActive
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handsRef = useRef<Hands | null>(null)
  const cameraRef = useRef<Camera | null>(null)
  const [fingerCount, setFingerCount] = useState<number>(0)
  const [isInitialized, setIsInitialized] = useState(false)

  // Finger tip and PIP joint indices for each finger
  const fingerLandmarks: FingerLandmarks = {
    thumb: [4, 3],     // Tip, IP joint
    index: [8, 6],     // Tip, PIP joint
    middle: [12, 10],  // Tip, PIP joint
    ring: [16, 14],    // Tip, PIP joint
    pinky: [20, 18]    // Tip, PIP joint
  }

  // Calculate if finger is extended
  const isFingerExtended = useCallback((landmarks: any[], fingerType: keyof FingerLandmarks): boolean => {
    const [tipIndex, pipIndex] = fingerLandmarks[fingerType]
    
    if (fingerType === 'thumb') {
      // For thumb, check if tip is to the right/left of the IP joint
      const tip = landmarks[tipIndex]
      const pip = landmarks[pipIndex]
      const wrist = landmarks[0]
      
      // Calculate hand orientation and distance
      const handDirection = tip.x - wrist.x
      const thumbDistance = Math.abs(tip.x - pip.x)
      return Math.abs(handDirection) > 0.05 && thumbDistance > 0.03 // Threshold for thumb extension
    } else {
      // For other fingers, check if tip is above PIP joint
      const tip = landmarks[tipIndex]
      const pip = landmarks[pipIndex]
      return tip.y < pip.y - 0.02 // Threshold for finger extension
    }
  }, [])

  // Count extended fingers
  const countFingers = useCallback((landmarks: any[]): number => {
    if (!landmarks || landmarks.length < 21) return 0

    let count = 0
    
    // Check each finger
    Object.keys(fingerLandmarks).forEach((finger) => {
      if (isFingerExtended(landmarks, finger as keyof FingerLandmarks)) {
        count++
      }
    })

    return count
  }, [isFingerExtended])

  // Draw hand landmarks on canvas
  const drawLandmarks = useCallback((landmarks: any[], canvasCtx: CanvasRenderingContext2D) => {
    const width = canvasCtx.canvas.width
    const height = canvasCtx.canvas.height

    // Clear canvas
    canvasCtx.clearRect(0, 0, width, height)

    // Draw connections between landmarks
    const connections = [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index finger
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle finger
      [0, 9], [9, 10], [10, 11], [11, 12],
      // Ring finger
      [0, 13], [13, 14], [14, 15], [15, 16],
      // Pinky
      [0, 17], [17, 18], [18, 19], [19, 20],
      // Palm
      [5, 9], [9, 13], [13, 17]
    ]

    // Draw connections
    canvasCtx.strokeStyle = '#00ff00'
    canvasCtx.lineWidth = 2
    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start]
      const endPoint = landmarks[end]
      if (startPoint && endPoint) {
        canvasCtx.beginPath()
        canvasCtx.moveTo(startPoint.x * width, startPoint.y * height)
        canvasCtx.lineTo(endPoint.x * width, endPoint.y * height)
        canvasCtx.stroke()
      }
    })

    // Draw landmarks
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * width
      const y = landmark.y * height
      
      // Different colors for different types of landmarks
      if ([4, 8, 12, 16, 20].includes(index)) {
        // Fingertips - red
        canvasCtx.fillStyle = '#ff0000'
        canvasCtx.beginPath()
        canvasCtx.arc(x, y, 6, 0, 2 * Math.PI)
        canvasCtx.fill()
      } else if (index === 0) {
        // Wrist - blue
        canvasCtx.fillStyle = '#0000ff'
        canvasCtx.beginPath()
        canvasCtx.arc(x, y, 8, 0, 2 * Math.PI)
        canvasCtx.fill()
      } else {
        // Other landmarks - green
        canvasCtx.fillStyle = '#00ff00'
        canvasCtx.beginPath()
        canvasCtx.arc(x, y, 4, 0, 2 * Math.PI)
        canvasCtx.fill()
      }
    })

    // Draw finger count
    canvasCtx.fillStyle = '#ffffff'
    canvasCtx.font = 'bold 48px Arial'
    canvasCtx.fillText(`Fingers: ${fingerCount}`, 20, 60)
  }, [fingerCount])

  // Handle MediaPipe results
  const onResults = useCallback((results: Results) => {
    if (!canvasRef.current) return

    const canvasCtx = canvasRef.current.getContext('2d')
    if (!canvasCtx) return

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const handLandmarks = results.multiHandLandmarks[0]
      
      // Count fingers
      const count = countFingers(handLandmarks)
      setFingerCount(count)
      
      // Draw landmarks
      drawLandmarks(handLandmarks, canvasCtx)
      
      // Notify parent component
      onGestureDetected(count, handLandmarks)
    } else {
      // No hands detected
      setFingerCount(0)
      canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height)
      onGestureDetected(0, [])
    }
  }, [countFingers, drawLandmarks, onGestureDetected])

  // Initialize MediaPipe
  useEffect(() => {
    if (!isActive || !videoRef.current || isInitialized) return

    const initializeMediaPipe = async () => {
      try {
        // Initialize MediaPipe Hands
        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        })

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })

        hands.onResults(onResults)
        handsRef.current = hands

        // Initialize camera
        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (handsRef.current && videoRef.current) {
                await handsRef.current.send({ image: videoRef.current })
              }
            },
            width: 640,
            height: 480
          })

          cameraRef.current = camera
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('Error initializing MediaPipe:', error)
      }
    }

    initializeMediaPipe()

    // Cleanup
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop()
      }
    }
  }, [isActive, videoRef, onResults, isInitialized])

  // Start/stop camera based on active state
  useEffect(() => {
    if (isInitialized && cameraRef.current) {
      if (isActive) {
        cameraRef.current.start()
      } else {
        cameraRef.current.stop()
      }
    }
  }, [isActive, isInitialized])

  return (
    <canvas
      ref={canvasRef}
      className="hand-gesture-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}
    />
  )
}

export default HandGestureTracker 