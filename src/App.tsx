import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'
import FeatureCard from './components/FeatureCard'
import ErrorBoundary from './components/ErrorBoundary'
import RealTimeDetection from './components/RealTimeDetection'

import { AssemblyIcon, InspectionIcon, RepairIcon, MaintenanceIcon, QualityIcon } from './components/TechIcons'
import { mlService } from './services/mlService'
import './App.css'

function App() {
  const { t } = useTranslation()
  
  // Detect PWA mode on mount
  const [isPWA, setIsPWA] = useState(false)
  
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

  // Initialize ML services
  useEffect(() => {
    const initML = async () => {
      try {
        await mlService.initialize();
        const stats = mlService.getPerformanceStats();
        console.log('🤖 ESP32 ML Service initialized:', stats);
      } catch (error) {
        console.warn('⚠️ ML Service initialization failed:', error);
      }
    };
    
    initML();
  }, []);

  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCompletion, setShowCompletion] = useState(false)

  // ESP32 real-time detection state
  const [isESP32RealtimeActive, setIsESP32RealtimeActive] = useState(false)
  const [esp32Detections, setESP32Detections] = useState<any[]>([])
  const [esp32FPS, setESP32FPS] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const esp32AnimationRef = useRef<number | undefined>(undefined)

  const features = [
    {
      id: 'inspection',
      icon: <InspectionIcon />,
      title: t('features.inspection'),
      description: t('descriptions.inspection')
    },
    {
      id: 'assembly',
      icon: <AssemblyIcon />,
      title: t('features.assembly'),
      description: t('descriptions.assembly')
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
          width: { ideal: 640, max: 1280 }, // Optimized for ML model
          height: { ideal: 480, max: 720 }, // Optimized for ML model
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
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
            console.log(`📹 Video playing: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`)
          }
        }
      }

      console.log('✅ Camera started successfully')
    } catch (err) {
      console.error('❌ Camera error:', err)
      setError(`Camera error: ${err}`)
      setIsPlaying(false)
    }
  }, [isPWA])

  const stopCamera = useCallback(() => {
    console.log('🛑 Stopping camera...')
    
    // Stop ESP32 real-time detection if active
    if (isESP32RealtimeActive) {
      setIsESP32RealtimeActive(false);
      if (esp32AnimationRef.current) {
        cancelAnimationFrame(esp32AnimationRef.current);
      }
      setESP32Detections([]);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop()
        console.log(`🔴 Stopped track: ${track.kind}`)
      })
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setStream(null)
    setIsPlaying(false)
    setError(null)
    setShowCompletion(false)
    console.log('✅ Camera stopped successfully')
  }, [stream, isESP32RealtimeActive])

  // Real-time ESP32 detection loop for inspection feature
  const startESP32RealtimeDetection = useCallback(() => {
    const detectFrame = async () => {
      if (!isESP32RealtimeActive || !videoRef.current || !canvasRef.current || !overlayCanvasRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      const context = canvas.getContext('2d');
      const overlayContext = overlayCanvas.getContext('2d');

      if (context && overlayContext && video.readyState >= 2) {
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          overlayCanvas.width = video.videoWidth;
          overlayCanvas.height = video.videoHeight;
          
          context.drawImage(video, 0, 0);

          const startTime = performance.now();
          const result = await mlService.detectESP32(canvas);
          const endTime = performance.now();
          const inferenceTime = endTime - startTime;

          setESP32Detections(result.detections);
          drawESP32Overlay(overlayContext, result.detections, canvas.width, canvas.height);
          setESP32FPS(Math.round(1000 / Math.max(inferenceTime, 16))); // Cap at 60fps
        } catch (error) {
          console.error('ESP32 real-time detection error:', error);
        }
      }

      if (isESP32RealtimeActive) {
        esp32AnimationRef.current = requestAnimationFrame(detectFrame);
      }
    };

    detectFrame();
  }, [isESP32RealtimeActive]);

  // Draw ESP32 detection overlay for inspection feature
  const drawESP32Overlay = (
    context: CanvasRenderingContext2D,
    detections: any[],
    width: number,
    height: number
  ) => {
    context.clearRect(0, 0, width, height);
    
    detections.forEach((detection, index) => {
      const [x1, y1, x2, y2] = detection.bbox;
      
      const color = '#ff6b35'; // Orange for ESP32
      
      // Draw bounding box with rounded corners
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.strokeRect(x1, y1, x2 - x1, y2 - y1);
      
      // Draw label background
      const labelText = `🔧 ESP32 ${index + 1} - ${(detection.confidence * 100).toFixed(0)}%`;
      context.font = 'bold 14px Arial';
      const textMetrics = context.measureText(labelText);
      const labelWidth = textMetrics.width + 12;
      const labelHeight = 22;
      
      context.fillStyle = color;
      context.fillRect(x1, y1 - labelHeight, labelWidth, labelHeight);
      
      // Draw label text
      context.fillStyle = '#ffffff';
      context.fillText(labelText, x1 + 6, y1 - 6);
      
      // Draw confidence indicator
      context.fillStyle = color;
      const confidenceWidth = (x2 - x1) * detection.confidence;
      context.fillRect(x1, y2 - 4, confidenceWidth, 4);
    });
  };

  // Toggle ESP32 realtime detection for inspection feature
  const toggleESP32RealtimeDetection = () => {
    if (isESP32RealtimeActive) {
      setIsESP32RealtimeActive(false);
      if (esp32AnimationRef.current) {
        cancelAnimationFrame(esp32AnimationRef.current);
      }
      setESP32Detections([]);
    } else {
      if (!stream) {
        setError('Please start camera first');
        return;
      }
      
      if (!videoRef.current || videoRef.current.readyState < 2) {
        setError('Camera not ready. Please wait...');
        return;
      }
      
      setIsESP32RealtimeActive(true);
      startESP32RealtimeDetection();
    }
  };

  // Start ESP32 real-time detection when activated
  useEffect(() => {
    if (isESP32RealtimeActive) {
      startESP32RealtimeDetection();
    } else if (esp32AnimationRef.current) {
      cancelAnimationFrame(esp32AnimationRef.current);
    }
  }, [isESP32RealtimeActive, startESP32RealtimeDetection]);

  const handleFeatureSelect = (featureId: string) => {
    setActiveFeature(featureId)
    if (!stream) {
      startCamera()
    }
  }

  const handleBackToMenu = () => {
    setActiveFeature(null)
    stopCamera()
    setShowCompletion(false)
    setError(null)
  }

  const renderFeatureInterface = () => {
    if (!activeFeature) return null

    const currentFeature = features.find(feature => feature.id === activeFeature)
    if (!currentFeature) return null

    // For inspection feature, show the new RealTimeDetection component
    if (activeFeature === 'inspection') {
      return (
        <div className="feature-interface">
          <div className="feature-header">
            <button className="btn btn-secondary" onClick={handleBackToMenu}>
              ← {t('actions.back')}
            </button>
            <h2>{currentFeature.title}</h2>
          </div>
          
          <ErrorBoundary>
            <RealTimeDetection />
          </ErrorBoundary>
        </div>
      )
    }

    // For other features, show simplified interface with ESP32 detection
    return (
      <div className="feature-interface">
        <div className="feature-header">
          <button className="btn btn-secondary" onClick={handleBackToMenu}>
            ← {t('actions.back')}
          </button>
          <h2>{currentFeature.title}</h2>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button className="btn btn-secondary" onClick={() => setError(null)}>
              {t('actions.dismiss')}
            </button>
          </div>
        )}

        <div className="camera-section">
          <div className="camera-container">
            <div className="video-wrapper">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                style={{ width: '100%', height: 'auto' }}
              />
              <canvas 
                ref={canvasRef} 
                style={{ display: 'none' }}
              />
              <canvas 
                ref={overlayCanvasRef}
                className="detection-overlay" 
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none'
                }}
              />
            </div>
          </div>

          {/* ESP32 real-time detection HUD */}
          {isESP32RealtimeActive && (
            <div className="realtime-hud">
              <div className="hud-section">
                <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px' }}>FPS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ff6b35' }}>{esp32FPS}</div>
              </div>
              
              <div className="hud-section">
                <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px' }}>STATUS</div>
                <div style={{ fontSize: '0.8rem', color: '#ff6b35' }}>🔴 LIVE</div>
              </div>
              
              <div className="hud-section">
                <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px' }}>🔧 ESP32</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ff6b35' }}>{esp32Detections.length}</div>
              </div>
              
              <div className="hud-section">
                <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px' }}>CONF</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ff6b35' }}>
                  {esp32Detections.length > 0 ?
                    ((esp32Detections.reduce((sum, d) => sum + d.confidence, 0) / esp32Detections.length) * 100).toFixed(0) + '%' :
                    '0%'
                  }
                </div>
              </div>
            </div>
          )}

          <div className="controls">
            <div className="control-row">
              <button 
                className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
                onClick={isPlaying ? stopCamera : startCamera}
              >
                {isPlaying ? '⏹️ Stop Camera' : '📷 Start Camera'}
              </button>
              
              <button 
                className={`btn ${isESP32RealtimeActive ? 'btn-danger' : 'btn-primary'}`}
                onClick={toggleESP32RealtimeDetection}
                disabled={!isPlaying}
              >
                {isESP32RealtimeActive ? '⏹️ Stop Real-time' : '🤖 Start Real-time'}
              </button>
            </div>
          </div>

          {/* ESP32 Detection Panel */}
          {isPlaying && (
            <div className="results-panel">
              <div className="detection-panel">
                <div className="panel-header">
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ff6b35' }}>🔧 ESP32 Detection</h3>
                  <div 
                    className="status-indicator"
                    style={{
                      background: isESP32RealtimeActive ? 'rgba(255, 107, 53, 0.2)' : 'rgba(128, 128, 128, 0.2)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      border: `1px solid ${isESP32RealtimeActive ? '#ff6b35' : '#888'}`
                    }}
                  >
                    {isESP32RealtimeActive ? '🟢 LIVE' : '⚫ READY'}
                  </div>
                </div>

                {isESP32RealtimeActive && esp32Detections.length > 0 && (
                  <div className="detection-list">
                    <div className="detection-grid">
                      <div className="detection-items">
                        {esp32Detections.map((detection, index) => (
                          <div 
                            key={index} 
                            className="detection-item"
                            style={{
                              background: 'rgba(255, 107, 53, 0.1)',
                              border: '1px solid rgba(255, 107, 53, 0.3)',
                              borderRadius: '6px',
                              padding: '8px',
                              margin: '4px 0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              color: '#ff6b35'
                            }}>
                              🔧 ESP32 {index + 1}
                            </div>
                            <div style={{
                              fontSize: '0.8rem',
                              color: '#ff6b35',
                              opacity: 0.9
                            }}>
                              {(detection.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="detection-status">
                  {!isESP32RealtimeActive && (
                    <div style={{
                      padding: '12px',
                      background: 'rgba(128, 128, 128, 0.1)',
                      borderRadius: '6px',
                      textAlign: 'center',
                      fontSize: '0.9rem',
                      color: '#888'
                    }}>
                      Click "🤖 Start Real-time" to begin live ESP32 detection
                    </div>
                  )}

                  {isESP32RealtimeActive && esp32Detections.length === 0 && (
                    <div style={{
                      padding: '12px',
                      background: 'rgba(255, 107, 53, 0.1)',
                      border: '1px dashed rgba(255, 107, 53, 0.3)',
                      borderRadius: '6px',
                      textAlign: 'center',
                      fontSize: '0.9rem',
                      color: '#ff6b35'
                    }}>
                      Point camera at ESP32 boards to detect them in real-time
                    </div>
                  )}

                  {esp32Detections.length > 0 && (
                    <div className="detection-summary">
                      <div className="summary-grid">
                        <div className="summary-item">
                          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total ESP32:</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff6b35' }}>{esp32Detections.length}</div>
                        </div>
                        <div className="summary-item">
                          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Avg Confidence:</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff6b35' }}>
                            {((esp32Detections.reduce((sum, d) => sum + d.confidence, 0) / esp32Detections.length) * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="summary-item">
                          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>FPS:</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff6b35' }}>{esp32FPS}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (showCompletion) {
    return (
      <div className="App">
        <div className="completion-screen">
          <div className="completion-content">
            <div className="completion-icon">✅</div>
            <h2>{t('completion.title')}</h2>
            <p>{t('completion.message')}</p>
            <button className="btn btn-primary" onClick={handleBackToMenu}>
              {t('actions.continue')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="App">
        <header className="app-header">
          <div className="header-top">
            <div className="header-content">
              <h1>🔍 AI Visual Inspector</h1>
              <LanguageSwitcher />
            </div>
          </div>
          
          {isPWA && (
            <div className="pwa-indicator">
              <span>📱 PWA Mode Active</span>
            </div>
          )}
        </header>

        <main className="main-content">
          {activeFeature ? (
            renderFeatureInterface()
          ) : (
            <>
              <section className="hero">
                <h2>{t('hero.title')}</h2>
                <p>{t('hero.subtitle')}</p>
              </section>

              <section className="features">
                                 <div className="features-grid">
                   {features.map((feature) => (
                     <FeatureCard
                       key={feature.id}
                       icon={feature.icon}
                       feature={feature.title}
                       description={feature.description}
                       onClick={() => handleFeatureSelect(feature.id)}
                     />
                   ))}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App
