import { useState, useRef, useCallback } from 'react'
import './App.css'

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔍 AI Visual Inspector v1.0</h1>
        <p>Capture and analyze images with AI • Auto-deploy test ✅</p>
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
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="video-feed"
              />
              <div className="camera-controls">
                <button 
                  className="btn btn-capture" 
                  onClick={capturePhoto}
                >
                  📸 Capture
                </button>
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
        <p>PWA ready • Works offline • Mobile optimized</p>
      </footer>
    </div>
  )
}

export default App
