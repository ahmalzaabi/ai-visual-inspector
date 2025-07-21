import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'
import FeatureCard from './components/FeatureCard'
import ErrorBoundary from './components/ErrorBoundary'
import { AssemblyIcon, InspectionIcon, RepairIcon, MaintenanceIcon, QualityIcon } from './components/TechIcons'
import './App.css'

function App() {
  const { t } = useTranslation()
  
  // Detect PWA mode on mount
  useEffect(() => {
    const checkPWA = () => {
      const isPWAMode = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      setIsPWA(isPWAMode);
    };
    
    checkPWA();
    window.addEventListener('resize', checkPWA);
    return () => window.removeEventListener('resize', checkPWA);
  }, []);

  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCompletion, setShowCompletion] = useState(false)
  const [isPWA, setIsPWA] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const features = [
    {
      id: 'assembly',
      icon: <AssemblyIcon />,
      title: t('features.assembly'),
      description: t('descriptions.assembly')
    },
    {
      id: 'inspection',
      icon: <InspectionIcon />,
      title: t('features.inspection'),
      description: t('descriptions.inspection')
    },
    {
      id: 'repair',
      icon: <RepairIcon />,
      title: t('features.repair'),
      description: t('descriptions.repair')
    },
    {
      id: 'maintenance',
      icon: <MaintenanceIcon />,
      title: t('features.maintenance'),
      description: t('descriptions.maintenance')
    },
    {
      id: 'quality',
      icon: <QualityIcon />,
      title: t('features.quality'),
      description: t('descriptions.quality')
    }
  ]

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported in this browser')
      }

      // Stop any existing streams first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        streamRef.current = null;
      }

      // For iOS PWA, request permissions more explicitly
      if (isPWA && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        // Try to get permission first
        try {
          const permissionStatus = await (navigator as any).permissions?.query({ name: 'camera' });
          if (permissionStatus && permissionStatus.state === 'denied') {
            throw new Error('Camera permission denied. Please enable in Settings > Safari > Camera');
          }
        } catch (permError) {
          console.warn('Permission query failed, proceeding with camera request:', permError);
        }
      }

      // Optimized constraints for ML processing and mobile compatibility
      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 }, // Reduced for better ML performance
          height: { ideal: 480, max: 720 }, // Reduced for better ML performance
          facingMode: 'environment', // Prefer back camera
          frameRate: { ideal: 15, max: 30 } // Reduced frame rate for better performance
        },
        audio: false
      }

      console.log('📱 Requesting camera access...')
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      streamRef.current = mediaStream
      setStream(mediaStream)
      setIsPlaying(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        // Enhanced video setup for mobile
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded')
          videoRef.current?.play().catch(console.warn)
        }
        
        videoRef.current.oncanplay = () => {
          console.log('📹 Video ready to play')
        }

        // Mobile specific adjustments
        if ('playsInline' in videoRef.current) {
          videoRef.current.playsInline = true
        }
      }

      console.log('✅ Camera started successfully')
    } catch (error) {
      console.error('❌ Camera error:', error)
      
      let errorMessage = 'Failed to start camera'
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and try again.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.'
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported in this browser.'
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Camera configuration not supported. Trying basic settings...'
          
          // Fallback with basic constraints
          try {
            const basicStream = await navigator.mediaDevices.getUserMedia({ 
              video: true, 
              audio: false 
            })
            streamRef.current = basicStream
            setStream(basicStream)
            setIsPlaying(true)
            if (videoRef.current) {
              videoRef.current.srcObject = basicStream
            }
            return
          } catch (fallbackError) {
            errorMessage = 'Camera access failed even with basic settings.'
          }
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    }
  }, [isPWA])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsPlaying(false)
  }, [stream])

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

  const detectThumbsUp = useCallback(() => {
    setShowCompletion(true)
    setTimeout(() => setShowCompletion(false), 2000)
  }, [])

  const handleFeatureClick = (featureId: string) => {
    setActiveFeature(featureId)
    // Auto-start camera when a feature is selected
    if (!isPlaying) {
      startCamera()
    }
  }

  return (
    <div className="app">
      {/* Header with Language Switcher */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>{t('title')}</h1>
            <p>{t('subtitle')}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="app-main">
        {!activeFeature && (
          <>
            {/* Features Grid */}
            <section className="features-section">
              <div className="features-grid">
                {features.map((feature) => (
                  <FeatureCard
                    key={feature.id}
                    icon={feature.icon}
                    feature={feature.title}
                    description={feature.description}
                    isActive={activeFeature === feature.id}
                    onClick={() => handleFeatureClick(feature.id)}
                  />
                ))}
              </div>
            </section>

            {/* Status Section */}
            <section className="status-section">
              <div className="status-card">
                <h3>📷 Camera Stream Ready</h3>
                <p>Clean camera interface ready for your custom implementation.</p>
                <div className="tech-stack">
                  <span className="tech-badge">Camera API</span>
                  <span className="tech-badge">PWA</span>
                  <span className="tech-badge">Mobile Ready</span>
                </div>
              </div>
            </section>
          </>
        )}

        {activeFeature && (
          <ErrorBoundary>
            <section className="camera-section">
            <div className="camera-header">
              <button 
                className="btn btn-back" 
                onClick={() => {
                  setActiveFeature(null)
                  stopCamera()
                }}
              >
                ← {t('actions.back')}
              </button>
              <h2>
                {features.find(f => f.id === activeFeature)?.title}
              </h2>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <div className="error-content">
                  <h4>{t('camera.error')}</h4>
                  <p>{error}</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={startCamera}
                  >
                    🔄 Try Again
                  </button>
                </div>
              </div>
            )}

            <div className="camera-container">
              {/* Camera placeholder */}
              <div className={`camera-placeholder ${isPlaying ? 'hidden' : ''}`}>
                <div className="placeholder-content">
                  <div className="camera-icon">📷</div>
                  <h3>{t('camera.start')}</h3>
                  <p>{t('camera.placeholder')}</p>
                </div>
                <button 
                  className="btn btn-primary btn-large" 
                  onClick={startCamera}
                  disabled={isPlaying}
                >
                  📱 {t('camera.start')}
                </button>
              </div>

              {/* Camera active - always rendered, controlled by CSS */}
              <div className={`camera-active ${!isPlaying ? 'hidden' : ''}`}>
                <div className="video-container">
                  <video 
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    webkit-playsinline="true"
                    x-webkit-airplay="allow"
                    className="video-feed"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.play().catch(console.warn)
                      }
                    }}
                  />
                  
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
                    📸 {t('actions.capture')}
                  </button>
                  <button 
                    className="btn btn-success" 
                    onClick={detectThumbsUp}
                  >
                    👍 {t('actions.test')}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={stopCamera}
                  >
                    {t('actions.stop')}
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
                    onClick={() => alert('Ready for your custom analysis!')}
                  >
                    🤖 {t('actions.analyze')}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={clearCapture}
                  >
                    🗑️ {t('actions.clear')}
                  </button>
                </div>
              </div>
            )}
            </section>
          </ErrorBoundary>
        )}
      </main>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default App
