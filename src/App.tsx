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
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      setDebugInfo('🔄 Starting camera...')
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      console.log('📹 Stream obtained:', stream.active, stream.getVideoTracks().length)
      setDebugInfo('✅ Camera access granted')
      
      if (videoRef.current) {
        // Stop any existing stream
        if (videoRef.current.srcObject) {
          const oldStream = videoRef.current.srcObject as MediaStream
          oldStream.getTracks().forEach(track => track.stop())
        }
        
        // Assign the new stream
        videoRef.current.srcObject = stream
        console.log('🎬 Setting isPlaying to true...')
        setIsPlaying(true) // Set immediately when stream is assigned
        console.log('🎬 isPlaying state updated')
        
        // Force re-render check
        setTimeout(() => {
          console.log('🔍 State check - isPlaying:', isPlaying)
          if (!isPlaying) {
            console.log('⚠️ isPlaying is still false, forcing update...')
            setIsPlaying(true)
          }
        }, 100)
        
        // Set up event handlers
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight)
          setDebugInfo(`📹 Video ready: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`)
        }
        
        videoRef.current.onplay = () => {
          console.log('▶️ Video playing')
          setDebugInfo('▶️ Video playing')
        }
        
        videoRef.current.oncanplay = () => {
          console.log('✅ Video can play')
          setDebugInfo('✅ Video ready to play')
        }
        
        videoRef.current.onerror = (e) => {
          console.error('Video error:', e)
          setDebugInfo('❌ Video error occurred')
        }
        
        // Force play the video
        try {
          await videoRef.current.play()
          setDebugInfo('✅ Video started successfully')
        } catch (playError) {
          console.warn('Auto-play failed, but video should still be visible:', playError)
          setDebugInfo('⚠️ Video ready (click to play if needed)')
        }
        
        // Debug info about video element
        setTimeout(() => {
          if (videoRef.current) {
            const video = videoRef.current
            console.log('🔍 Video element debug:', {
              srcObject: !!video.srcObject,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              readyState: video.readyState,
              paused: video.paused,
              ended: video.ended,
              muted: video.muted,
              autoplay: video.autoplay
            })
          }
        }, 2000)
      }
    } catch (err: any) {
      console.error('Camera error:', err)
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
      setCapturedImage(null)
      setDebugInfo('🖐️ Gesture mode activated')
    } else {
      setDebugInfo('📷 Photo mode activated')
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
            <br />
            <small>isPlaying: {isPlaying ? '✅' : '❌'} | Video Ref: {videoRef.current ? '✅' : '❌'}</small>
          </div>
        )}

        <div className="camera-container">
          {!isPlaying ? (
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
          ) : null}
          
          {/* Always render video element, but hide when not playing */}
          <div 
            className="camera-active"
            style={{ 
              display: isPlaying ? 'flex' : 'none',
              width: '100%',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div className="video-container">
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="video-feed"
                style={{
                  width: '100%',
                  height: 'auto',
                  minHeight: '300px',
                  backgroundColor: '#000',
                  borderRadius: '12px',
                  border: '3px solid lime', // Visible border to see video element
                  display: 'block'
                }}
                onClick={() => {
                  // Allow user to manually start video if autoplay fails
                  if (videoRef.current) {
                    videoRef.current.play().catch(console.warn)
                  }
                }}
              />
              
              {/* Video Debug Info Overlay */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '0.5rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                zIndex: 50
              }}>
                Video: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}
                <br />
                State: {videoRef.current?.readyState || 0} | Paused: {videoRef.current?.paused ? 'Yes' : 'No'}
                <br />
                Stream: {videoRef.current?.srcObject ? 'Yes' : 'No'}
              </div>
              
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
