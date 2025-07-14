import { useState, useRef, useCallback } from 'react'
import './App.css'

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCompletion, setShowCompletion] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Always back camera
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        }
      })
      
      if (videoRef.current) {
        // Stop any existing stream
        if (videoRef.current.srcObject) {
          const oldStream = videoRef.current.srcObject as MediaStream
          oldStream.getTracks().forEach(track => track.stop())
        }
        
        videoRef.current.srcObject = stream
        setIsPlaying(true)
        
        // Auto-play
        try {
          await videoRef.current.play()
        } catch (playError) {
          console.warn('Autoplay failed:', playError)
        }
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      setError(`Camera Error: ${err.message}`)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsPlaying(false)
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

  // Simple thumbs up detection (placeholder - replace with actual ML later)
  const detectThumbsUp = useCallback(() => {
    // Simulate thumbs up detection
    setShowCompletion(true)
    setTimeout(() => setShowCompletion(false), 2000)
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔍 AI Visual Inspector</h1>
        <p>AI-powered visual inspection</p>
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
              <p>Start Camera</p>
              <button 
                className="btn btn-primary" 
                onClick={startCamera}
              >
                📱 Start Camera
              </button>
            </div>
          ) : null}
          
          {/* Camera View */}
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
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.play().catch(console.warn)
                  }
                }}
              />
              
              {/* Completion Animation */}
              {showCompletion && (
                <div className="completion-overlay">
                  <div className="completion-animation">
                    <div className="checkmark">✓</div>
                    <p>Perfect! 👍</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="camera-controls">
              <button 
                className="btn btn-capture" 
                onClick={capturePhoto}
              >
                📸 Capture
              </button>
              <button 
                className="btn btn-success" 
                onClick={detectThumbsUp}
              >
                👍 Test Detection
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={stopCamera}
              >
                Stop
              </button>
            </div>
          </div>
        </div>

        {capturedImage && (
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
                onClick={() => alert('AI Analysis ready for implementation!')}
              >
                🤖 Analyze
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
        <p>PWA • Camera • AI Ready</p>
      </footer>
    </div>
  )
}

export default App
