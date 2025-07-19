import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'
import FeatureCard from './components/FeatureCard'
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
          console.warn('Permission check failed:', permError);
        }
      }

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        }
      };

      // For PWA, use more conservative constraints
      if (isPWA) {
        constraints.video = {
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Keep stream reference to prevent garbage collection
      streamRef.current = stream;
      setStream(stream);
      
      if (videoRef.current) {
        const videoElement = videoRef.current;
        
        if (videoElement.srcObject) {
          const oldStream = videoElement.srcObject as MediaStream
          oldStream.getTracks().forEach(track => track.stop())
        }
        
        // For iOS PWA, set additional video attributes
        if (isPWA && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
          videoElement.setAttribute('playsinline', 'true');
          videoElement.setAttribute('webkit-playsinline', 'true');
          videoElement.setAttribute('x-webkit-airplay', 'allow');
          videoElement.muted = true; // Required for autoplay in iOS
        }
        
        videoElement.srcObject = stream;
        
        // Ensure video properties are set for visibility
        videoElement.style.display = 'block';
        videoElement.style.visibility = 'visible';
        videoElement.style.opacity = '1';
        
        // Add event listeners to detect stream loss
        const handleStreamEnd = () => {
          console.warn('Stream ended, attempting to restart...');
          if (streamRef.current && streamRef.current.active) {
            // Stream is still active, this might be a false alarm
            return;
          }
          // Only restart if we're still supposed to be playing
          if (isPlaying) {
            setTimeout(() => startCamera(), 1000);
          }
        };
        
        const handleVideoError = (e: Event) => {
          console.error('Video error:', e);
          if (isPlaying) {
            setTimeout(() => startCamera(), 1000);
          }
        };
        
        stream.getTracks().forEach(track => {
          track.addEventListener('ended', handleStreamEnd);
        });
        
        videoElement.addEventListener('error', handleVideoError);
        
        setIsPlaying(true);
        
        // Better play handling with multiple attempts
        const attemptPlay = async (attempts = 0) => {
          if (attempts > 3) {
            throw new Error('Failed to start video playback after multiple attempts');
          }
          
          try {
            await videoElement.play();
            console.log('Video playback started successfully');
          } catch (error) {
            console.warn(`Autoplay attempt ${attempts + 1} failed:`, error);
            
            if (attempts === 0) {
              // First attempt failed, try with user interaction
              videoElement.muted = true;
              videoElement.controls = false;
            }
            
            // Wait and try again
            await new Promise(resolve => setTimeout(resolve, 500));
            return attemptPlay(attempts + 1);
          }
        };
        
        await attemptPlay();
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      
      // More specific error messages for PWA
      let errorMessage = err.message;
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in PWA mode. Try opening in Safari browser.';
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Camera blocked by security policy. Try opening in Safari browser.';
      }
      
      setError(`${t('camera.error')}: ${errorMessage}`)
    }
  }, [t, isPWA, isPlaying])

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

            {/* Status Bar */}
            <div className="status-bar">
              <div className="status-indicator ready">
                <span className="status-dot"></span>
                <span>{t('status.ready')}</span>
              </div>
            </div>
          </>
        )}

        {/* Active Feature Camera Interface */}
        {activeFeature && (
          <section className="inspection-section">
            <div className="section-header">
                             <button 
                 className="back-button"
                 onClick={() => {
                   setActiveFeature(null)
                   stopCamera()
                   setCapturedImage(null)
                 }}
               >
                 <span>←</span>
                 <span>{t('actions.back')}</span>
               </button>
              <h2>{features.find(f => f.id === activeFeature)?.title}</h2>
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

                         <div className="camera-container">
               {/* Camera placeholder - shown when not playing */}
               <div className={`camera-placeholder ${isPlaying ? 'hidden' : ''}`}>
                 <div className="camera-icon">📷</div>
                 <p>{t('camera.placeholder')}</p>
                 <button 
                   className="btn btn-primary" 
                   onClick={startCamera}
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
                    onClick={() => alert('AI Analysis ready for implementation!')}
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

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>AI Visual Inspector</span>
          <span className="footer-separator">•</span>
          <span>PWA Ready</span>
          <span className="footer-separator">•</span>
          <span>Camera Enabled</span>
        </div>
      </footer>
    </div>
  )
}

export default App
