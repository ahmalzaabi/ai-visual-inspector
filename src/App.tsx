import { useState, useRef, useCallback, useEffect } from 'react'
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
  const [hasStream, setHasStream] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Monitor video stream status
  useEffect(() => {
    const checkStream = () => {
      if (videoRef.current?.srcObject) {
        setHasStream(true)
        setDebugInfo('📺 Video stream detected - forcing video display')
        // Force playing state if we have a stream
        if (!isPlaying) {
          setIsPlaying(true)
        }
      } else {
        setHasStream(false)
      }
    }

    const interval = setInterval(checkStream, 1000)
    return () => clearInterval(interval)
  }, [isPlaying])

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
      
      setDebugInfo('✅ Camera stream obtained, setting up video...')
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setHasStream(true)
        
        // Force the video to be visible immediately
        setDebugInfo('🎬 Forcing video display...')
        setIsPlaying(true)
        
        // Try to start playback
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setDebugInfo('▶️ Video playing successfully!')
            }).catch((playError) => {
              console.error('Video play error:', playError)
              setDebugInfo('⚠️ Video play failed but stream is available')
            })
          }
        }, 500)
        
        // Add event listeners
        videoRef.current.onloadedmetadata = () => {
          setDebugInfo('📹 Video metadata loaded!')
        }
        
        videoRef.current.onplay = () => {
          setDebugInfo('🎬 Video play event fired!')
        }
        
        videoRef.current.onerror = (e) => {
          console.error('Video error:', e)
          setError('Video playback error')
          setDebugInfo('❌ Video error occurred')
        }
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err)
      setError(`Camera Error: ${err.message}`)
      setDebugInfo(`❌ ${err.message}`)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsPlaying(false)
      setHasStream(false)
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

  // Show video if we have a stream OR isPlaying is true
  const showVideo = hasStream || isPlaying

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔍 AI Visual Inspector v1.0</h1>
        <p>Capture and analyze images with AI • AR Gestures ✨</p>
        {showVideo && (
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
            <br />
            <small>Stream: {hasStream ? '✅' : '❌'} | Playing: {isPlaying ? '✅' : '❌'} | Show: {showVideo ? '✅' : '❌'}</small>
          </div>
        )}

        <div className="camera-container">
          {!showVideo ? (
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
                    maxHeight: '400px',
                    objectFit: 'cover',
                    background: '#000',
                    borderRadius: '12px',
                    display: 'block'
                  }}
                />
                
                {/* Stream Status Debug */}
                <div style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  zIndex: 25
                }}>
                  {hasStream ? '🟢 STREAM' : '🔴 NO STREAM'}
                </div>
                
                {/* Hand Gesture Tracking Overlay */}
                {isGestureMode && hasStream && (
                  <HandGestureTracker
                    videoRef={videoRef}
                    onGestureDetected={handleGestureDetected}
                    isActive={isGestureMode}
                  />
                )}
                
                {/* AR Elements Overlay */}
                {isGestureMode && hasStream && (
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
