import { useState, useRef, useCallback } from 'react'
import './App.css'
import HandGestureTracker from './components/HandGestureTracker'
import AROverlay from './components/AROverlay'

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGestureMode, setIsGestureMode] = useState(false)
  const [fingerCount, setFingerCount] = useState(0)
  const [handLandmarks, setHandLandmarks] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState<string>('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      setDebugInfo('🔄 Requesting camera access...')
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }

      setDebugInfo('📱 Camera API supported, requesting permissions...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      setDebugInfo('✅ Camera stream obtained')
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Add event listeners for video loading
        videoRef.current.onloadedmetadata = () => {
          setDebugInfo('📹 Video metadata loaded, starting playback...')
          
          // Ensure video starts playing
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setDebugInfo('▶️ Video playing successfully!')
              setIsPlaying(true)
            }).catch((playError) => {
              console.error('Video play error:', playError)
              setDebugInfo('⚠️ Video play failed, but showing anyway')
              // Still set playing to true since we have the stream
              setIsPlaying(true)
            })
          }
        }
        
        videoRef.current.onplay = () => {
          setDebugInfo('🎬 Video play event fired')
          setIsPlaying(true)
        }
        
        videoRef.current.onerror = (e) => {
          console.error('Video error:', e)
          setError('Video playback error')
          setDebugInfo('❌ Video playback failed')
        }

        // Fallback: if video doesn't fire events within 3 seconds, show it anyway
        setTimeout(() => {
          if (!isPlaying && videoRef.current?.srcObject) {
            setDebugInfo('⏰ Timeout: Showing video without events')
            setIsPlaying(true)
          }
        }, 3000)
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err)
      setError(`Camera Error: ${err.message}`)
      setDebugInfo(`❌ ${err.message}`)
    }
  }, [isPlaying])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsPlaying(false)
      setIsGestureMode(false)
      setDebugInfo('⏹️ Camera stopped')
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageData)
        setDebugInfo('📸 Photo captured successfully')
      }
    }
  }, [])

  const clearCapture = useCallback(() => {
    setCapturedImage(null)
  }, [])

  const toggleGestureMode = useCallback(() => {
    const newMode = !isGestureMode
    setIsGestureMode(newMode)
    if (newMode) {
      setCapturedImage(null) // Clear any captured images when entering gesture mode
      setDebugInfo('🖐️ Gesture mode activated')
    } else {
      setDebugInfo('📷 Photo mode activated')
    }
  }, [isGestureMode])

  const handleGestureDetected = useCallback((count: number, landmarks: any[]) => {
    setFingerCount(count)
    setHandLandmarks(landmarks)
    if (count > 0) {
      setDebugInfo(`🖐️ ${count} finger${count > 1 ? 's' : ''} detected`)
    }
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔍 AI Visual Inspector v1.0</h1>
        <p>Capture and analyze images with AI • AR Gestures ✨</p>
        {isPlaying && (
          <div className="mode-toggle">
            <button 
              className={`btn ${isGestureMode ? 'btn-success' : 'btn-secondary'}`}
              onClick={toggleGestureMode}
            >
              {isGestureMode ? '🖐️ Gesture Mode ON' : '📷 Photo Mode'}
            </button>
          </div>
        )}
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {debugInfo && (
          <div className="debug-info">
            ℹ️ {debugInfo}
          </div>
        )}

        <div className="camera-container">
          {!isPlaying && !videoRef.current?.srcObject ? (
            <div className="camera-placeholder">
              <div className="camera-icon">📷</div>
              <p>Camera not active</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                Make sure to allow camera permissions
              </p>
              <button 
                className="btn btn-primary" 
                onClick={startCamera}
              >
                Start Camera
              </button>
            </div>
          ) : (
            <div className="camera-active">
              <div className="video-container">
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                  className="video-feed"
                  style={{
                    width: '100%',
                    height: 'auto',
                    minHeight: '200px',
                    objectFit: 'cover',
                    background: '#000'
                  }}
                />
                
                {/* Hand Gesture Tracking Overlay */}
                {isGestureMode && (
                  <HandGestureTracker
                    videoRef={videoRef}
                    onGestureDetected={handleGestureDetected}
                    isActive={isGestureMode}
                  />
                )}
                
                {/* AR Elements Overlay */}
                {isGestureMode && (
                  <AROverlay
                    fingerCount={fingerCount}
                    handLandmarks={handLandmarks}
                    isActive={isGestureMode}
                  />
                )}

                {/* Gesture Info Display */}
                {isGestureMode && (
                  <div className="gesture-info">
                    <div className="finger-count-display">
                      <span className="finger-count">{fingerCount}</span>
                      <span className="finger-label">
                        {fingerCount === 0 ? 'Show fingers' : 
                         fingerCount === 1 ? '⭐ Star!' :
                         fingerCount === 2 ? '🧊 Cubes!' :
                         fingerCount === 3 ? '⚪ Spheres!' :
                         fingerCount === 4 ? '🔺 Pyramids!' :
                         fingerCount === 5 ? '❤️ Hearts!' : 'Too many!'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="camera-controls">
                {!isGestureMode ? (
                  <button 
                    className="btn btn-capture" 
                    onClick={capturePhoto}
                  >
                    📸 Capture
                  </button>
                ) : (
                  <div className="gesture-instructions">
                    <p>🖐️ Show 1-5 fingers to see AR elements!</p>
                  </div>
                )}
                <button 
                  className="btn btn-secondary" 
                  onClick={stopCamera}
                >
                  Stop Camera
                </button>
              </div>
            </div>
          )}
        </div>

        {capturedImage && !isGestureMode && (
          <div className="captured-image-container">
            <h3>📸 Captured Image</h3>
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="captured-image"
            />
            <div className="image-actions">
              <button 
                className="btn btn-success"
                onClick={() => alert('AI Analysis would happen here!')}
              >
                🤖 Analyze with AI
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={clearCapture}
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </main>

      <footer className="app-footer">
        <p>PWA ready • Works offline • Mobile optimized • AR Gestures ✨</p>
      </footer>
    </div>
  )
}

export default App
