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
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsPlaying(true)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Unable to access camera. Please ensure camera permissions are granted.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsPlaying(false)
      setIsGestureMode(false)
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
      }
    }
  }, [])

  const clearCapture = useCallback(() => {
    setCapturedImage(null)
  }, [])

  const toggleGestureMode = useCallback(() => {
    setIsGestureMode(!isGestureMode)
    if (!isGestureMode) {
      setCapturedImage(null) // Clear any captured images when entering gesture mode
    }
  }, [isGestureMode])

  const handleGestureDetected = useCallback((count: number, landmarks: any[]) => {
    setFingerCount(count)
    setHandLandmarks(landmarks)
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔍 AI Visual Inspector v1.0</h1>
        <p>Capture and analyze images with AI • Auto-deploy test ✅</p>
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

        <div className="camera-container">
          {!isPlaying ? (
            <div className="camera-placeholder">
              <div className="camera-icon">📷</div>
              <p>Camera not active</p>
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
                  className="video-feed"
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
