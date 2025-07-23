import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'
import FeatureCard from './components/FeatureCard'
import ErrorBoundary from './components/ErrorBoundary'

import { AssemblyIcon, InspectionIcon, RepairIcon, MaintenanceIcon, QualityIcon } from './components/TechIcons'
import { mlService } from './services/mlService'
import { testDetectionService } from './services/testDetectionService'
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
        
        await testDetectionService.initialize();
        const testStats = testDetectionService.getPerformanceStats();
        console.log('🧪 Test Detection Service initialized:', testStats);
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


  const [isRealtimeDetectionActive, setIsRealtimeDetectionActive] = useState(false)
  const [realtimeDetections, setRealtimeDetections] = useState<any[]>([])
  const [realtimeFPS, setRealtimeFPS] = useState(0)
  const [enabledObjects, setEnabledObjects] = useState<string[]>([
    'person', 'car', 'bicycle', 'cat', 'dog', 'bottle', 'cup', 'laptop', 'cell phone', 'book'
  ])
  const [isESP32RealtimeActive, setIsESP32RealtimeActive] = useState(false)
  const [esp32Detections, setESP32Detections] = useState<any[]>([])
  const [esp32FPS, setESP32FPS] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const realtimeAnimationRef = useRef<number | undefined>(undefined)
  const esp32AnimationRef = useRef<number | undefined>(undefined)

  // COCO objects list for test feature
  const COCO_OBJECTS = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
    'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench',
    'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra',
    'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
    'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove',
    'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',
    'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
    'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
    'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
    'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
    'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier',
    'toothbrush'
  ]

  // Object colors for different categories
  const getObjectColor = (className: string): string => {
    const colors: { [key: string]: string } = {
      'person': '#ff6b6b',
      'car': '#4ecdc4', 
      'bicycle': '#45b7d1',
      'motorcycle': '#f9ca24',
      'cat': '#f0932b',
      'dog': '#eb4d4b', 
      'bird': '#6c5ce7',
      'bottle': '#a29bfe',
      'cup': '#fd79a8',
      'laptop': '#00b894',
      'cell phone': '#fdcb6e',
      'book': '#e17055',
      'chair': '#74b9ff',
      'tv': '#55a3ff'
    };
    return colors[className] || '#00d4ff';
  }

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
    },

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
    // Stop real-time detection if active
    if (isRealtimeDetectionActive) {
      setIsRealtimeDetectionActive(false);
      if (realtimeAnimationRef.current) {
        cancelAnimationFrame(realtimeAnimationRef.current);
      }
      setRealtimeDetections([]);
    }
    
    // Stop ESP32 real-time detection if active
    if (isESP32RealtimeActive) {
      setIsESP32RealtimeActive(false);
      if (esp32AnimationRef.current) {
        cancelAnimationFrame(esp32AnimationRef.current);
      }
      setESP32Detections([]);
    }
    
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
  }, [stream, isRealtimeDetectionActive, isESP32RealtimeActive])



  // Real-time detection loop for test feature
  const startRealtimeDetection = useCallback(() => {
    const detectFrame = async () => {
      if (!isRealtimeDetectionActive || !videoRef.current || !canvasRef.current || !overlayCanvasRef.current) {
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
          const result = await testDetectionService.detectObjects(canvas);
          const endTime = performance.now();
          const inferenceTime = endTime - startTime;

          // Filter detections by enabled objects
          const filteredDetections = result.detections.filter((det: any) => 
            enabledObjects.includes(det.class)
          );

          setRealtimeDetections(filteredDetections);
          drawDetectionOverlay(overlayContext, filteredDetections, canvas.width, canvas.height);
          setRealtimeFPS(Math.round(1000 / Math.max(inferenceTime, 16))); // Cap at 60fps
        } catch (error) {
          console.error('Real-time detection error:', error);
        }
      }

      if (isRealtimeDetectionActive) {
        realtimeAnimationRef.current = requestAnimationFrame(detectFrame);
      }
    };

    detectFrame();
  }, [isRealtimeDetectionActive, enabledObjects]);

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

  // Draw detection overlay for COCO-SSD (test feature)
  const drawDetectionOverlay = (
    context: CanvasRenderingContext2D,
    detections: any[],
    width: number,
    height: number
  ) => {
    // Clear overlay
    context.clearRect(0, 0, width, height);
    
    detections.forEach((detection) => {
      const [x1, y1, x2, y2] = detection.bbox;
      const color = getObjectColor(detection.class);
      
      // Draw bounding box
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.strokeRect(x1, y1, x2 - x1, y2 - y1);
      
      // Draw filled background for label
      const labelText = `${detection.class} ${(detection.confidence * 100).toFixed(0)}%`;
      context.font = 'bold 16px Arial';
      const textMetrics = context.measureText(labelText);
      const labelWidth = textMetrics.width + 16;
      const labelHeight = 28;
      
      // Draw label background
      context.fillStyle = color;
      context.fillRect(x1, y1 - labelHeight, labelWidth, labelHeight);
      
      // Draw label text
      context.fillStyle = '#ffffff';
      context.fillText(labelText, x1 + 8, y1 - 8);
      
      // Draw confidence indicator
      const confidenceWidth = (x2 - x1) * detection.confidence;
      context.fillStyle = `${color}80`; // Semi-transparent
      context.fillRect(x1, y2 - 4, confidenceWidth, 4);
    });
  };

  // Draw ESP32 detection overlay for inspection feature
  const drawESP32Overlay = (
    context: CanvasRenderingContext2D,
    detections: any[],
    width: number,
    height: number
  ) => {
    // Clear overlay
    context.clearRect(0, 0, width, height);
    
    detections.forEach((detection, index) => {
      const [x1, y1, x2, y2] = detection.bbox;
      const color = '#ff6600'; // Orange for ESP32s
      
      // Draw bounding box
      context.strokeStyle = color;
      context.lineWidth = 4;
      context.strokeRect(x1, y1, x2 - x1, y2 - y1);
      
      // Draw filled background for label
      const labelText = `🔧 ESP32 #${index + 1} - ${(detection.confidence * 100).toFixed(0)}%`;
      context.font = 'bold 18px Arial';
      const textMetrics = context.measureText(labelText);
      const labelWidth = textMetrics.width + 20;
      const labelHeight = 32;
      
      // Draw label background
      context.fillStyle = color;
      context.fillRect(x1, y1 - labelHeight, labelWidth, labelHeight);
      
      // Draw label text
      context.fillStyle = '#ffffff';
      context.fillText(labelText, x1 + 10, y1 - 8);
      
      // Draw confidence indicator (thicker for ESP32s)
      const confidenceWidth = (x2 - x1) * detection.confidence;
      context.fillStyle = `${color}60`; // Semi-transparent orange
      context.fillRect(x1, y2 - 6, confidenceWidth, 6);
      
      // Add corner markers for better visibility
      const cornerSize = 12;
      context.fillStyle = color;
      // Top-left corner
      context.fillRect(x1 - 2, y1 - 2, cornerSize, 3);
      context.fillRect(x1 - 2, y1 - 2, 3, cornerSize);
      // Top-right corner  
      context.fillRect(x2 - cornerSize + 2, y1 - 2, cornerSize, 3);
      context.fillRect(x2 - 2, y1 - 2, 3, cornerSize);
      // Bottom-left corner
      context.fillRect(x1 - 2, y2 - 2, cornerSize, 3);
      context.fillRect(x1 - 2, y2 - cornerSize + 2, 3, cornerSize);
      // Bottom-right corner
      context.fillRect(x2 - cornerSize + 2, y2 - 2, cornerSize, 3);
      context.fillRect(x2 - 2, y2 - cornerSize + 2, 3, cornerSize);
    });
  };

  // Toggle realtime detection for test feature
  const toggleRealtimeDetection = () => {
    if (isRealtimeDetectionActive) {
      setIsRealtimeDetectionActive(false);
      if (realtimeAnimationRef.current) {
        cancelAnimationFrame(realtimeAnimationRef.current);
      }
      setRealtimeDetections([]);
      // Clear overlay
      if (overlayCanvasRef.current) {
        const overlayContext = overlayCanvasRef.current.getContext('2d');
        if (overlayContext) {
          overlayContext.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
      }
    } else {
      setIsRealtimeDetectionActive(true);
      startRealtimeDetection();
    }
  };

  // Toggle ESP32 realtime detection for inspection feature
  const toggleESP32RealtimeDetection = () => {
    if (isESP32RealtimeActive) {
      setIsESP32RealtimeActive(false);
      if (esp32AnimationRef.current) {
        cancelAnimationFrame(esp32AnimationRef.current);
      }
      setESP32Detections([]);
      // Clear overlay
      if (overlayCanvasRef.current) {
        const overlayContext = overlayCanvasRef.current.getContext('2d');
        if (overlayContext) {
          overlayContext.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
      }
    } else {
      setIsESP32RealtimeActive(true);
      startESP32RealtimeDetection();
    }
  };

  // Toggle object selection
  const toggleObject = (objectName: string) => {
    setEnabledObjects(prev => 
      prev.includes(objectName) 
        ? prev.filter(name => name !== objectName)
        : [...prev, objectName]
    );
  };



  // Start real-time detection when activated
  useEffect(() => {
    if (isRealtimeDetectionActive) {
      startRealtimeDetection();
    } else if (realtimeAnimationRef.current) {
      cancelAnimationFrame(realtimeAnimationRef.current);
    }
  }, [isRealtimeDetectionActive, startRealtimeDetection]);

  // Start ESP32 real-time detection when activated
  useEffect(() => {
    if (isESP32RealtimeActive) {
      startESP32RealtimeDetection();
    } else if (esp32AnimationRef.current) {
      cancelAnimationFrame(esp32AnimationRef.current);
    }
  }, [isESP32RealtimeActive, startESP32RealtimeDetection]);

  const handleFeatureClick = (featureId: string) => {
    setActiveFeature(featureId)
    // Auto-start camera when a feature is selected
    if (!isPlaying) {
      startCamera()
    }
  }



  if (showCompletion) {
    return (
      <div className="App">
        <div className="completion-screen">
          <div className="completion-content">
            <div className="completion-icon">✅</div>
            <h2>{t('completion.title')}</h2>
            <p>{t('completion.message')}</p>
            <button className="btn btn-primary" onClick={() => setShowCompletion(false)}>
              {t('actions.continue')}
            </button>
          </div>
        </div>
      </div>
    )
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
          <div className="header-actions">
            <LanguageSwitcher />
          </div>
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
                <h3>📷 {t('camera.start')}</h3>
                <p>AI-powered inspection platform with multiple detection models.</p>
                <div className="tech-stack">
                  <span className="tech-badge">Camera API</span>
                  <span className="tech-badge">PWA</span>
                  <span className="tech-badge">Mobile Ready</span>
                  <span className="tech-badge">Arabic Support</span>
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

              {/* Camera active */}
              <div className={`camera-active ${!isPlaying ? 'hidden' : ''}`}>
                <div className="video-container" style={{ position: 'relative' }}>
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
                  
                  {/* Overlay canvas for real-time detection */}
                  {(activeFeature === 'test' || activeFeature === 'assembly' || activeFeature === 'inspection') && (
                    <canvas 
                      ref={overlayCanvasRef}
                      style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 5
                      }}
                    />
                  )}
                  
                  {/* Real-time detection HUD */}
                  {activeFeature === 'test' && isRealtimeDetectionActive && (
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      left: '20px',
                      display: 'flex',
                      gap: '15px',
                      zIndex: 10
                    }}>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)',
                        color: 'white'
                      }}>
                        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px' }}>FPS</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#00d4ff' }}>{realtimeFPS}</div>
                      </div>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)',
                        color: 'white'
                      }}>
                        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px' }}>OBJECTS</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#00d4ff' }}>{realtimeDetections.length}</div>
                      </div>
                    </div>
                  )}

                  {/* ESP32 real-time detection HUD */}
                  {activeFeature === 'inspection' && isESP32RealtimeActive && (
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      left: '20px',
                      display: 'flex',
                      gap: '15px',
                      zIndex: 10
                    }}>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 102, 0, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)',
                        color: 'white'
                      }}>
                        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px' }}>FPS</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ff6600' }}>{esp32FPS}</div>
                      </div>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 102, 0, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)',
                        color: 'white'
                      }}>
                        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px' }}>🔧 ESP32s</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ff6600' }}>{esp32Detections.length}</div>
                      </div>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 102, 0, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)',
                        color: 'white'
                      }}>
                        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px' }}>AVG CONF</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ff6600' }}>
                          {esp32Detections.length > 0 ?
                            ((esp32Detections.reduce((sum, d) => sum + d.confidence, 0) / esp32Detections.length) * 100).toFixed(0) + '%' :
                            '0%'
                          }
                        </div>
                      </div>
                    </div>
                  )}

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
                  
                  {/* Different analyze buttons based on feature */}
                  {activeFeature === 'test' ? (
                    <>
                      <button 
                        className={`btn ${isRealtimeDetectionActive ? 'btn-danger' : 'btn-primary'}`}
                        onClick={toggleRealtimeDetection}
                      >
                        {isRealtimeDetectionActive ? '⏹️ Stop Real-time' : '🚀 Start Real-time'}
                      </button>
                    </>
                  ) : activeFeature === 'assembly' ? (
                    <>
                      <button 
                        className="btn btn-primary"
                        onClick={() => console.log('Assembly feature - ESP32 only')}
                      >
                        🔧 ESP32 Assembly
                      </button>
                    </>
                  
                  ) : activeFeature === 'inspection' ? (
                    <>
                      <button 
                        className={`btn ${isESP32RealtimeActive ? 'btn-danger' : 'btn-primary'}`}
                        onClick={toggleESP32RealtimeDetection}
                      >
                        {isESP32RealtimeActive ? '⏹️ Stop Real-time' : '🔧 Start Real-time'}
                      </button>
                    </>
                  
                  ) : (
                    <button 
                      className="btn btn-primary"
                      onClick={() => console.log('Feature not implemented yet')}
                    >
                      🤖 {t('actions.analyze')}
                    </button>
                  )}
                  

                  <button 
                    className="btn btn-secondary" 
                    onClick={stopCamera}
                  >
                    {t('actions.stop')}
                  </button>
                </div>
              </div>
            </div>

            {/* Object Selection Panel for Test Feature */}
            {activeFeature === 'test' && isPlaying && (
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.9)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                margin: '20px 0',
                color: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🎯 Object Selection ({enabledObjects.length}/{COCO_OBJECTS.length})</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="btn btn-sm"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => setEnabledObjects([...COCO_OBJECTS])}
                    >
                      Select All
                    </button>
                    <button 
                      className="btn btn-sm"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => setEnabledObjects(['person', 'car', 'bicycle', 'cat', 'dog', 'bottle', 'cup', 'laptop', 'cell phone', 'book'])}
                    >
                      Common Only
                    </button>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                  gap: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {COCO_OBJECTS.slice(0, 20).map(obj => (
                    <label key={obj} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: '1px solid transparent'
                    }}>
                      <input
                        type="checkbox"
                        checked={enabledObjects.includes(obj)}
                        onChange={() => toggleObject(obj)}
                        style={{ margin: 0, accentColor: '#00d4ff' }}
                      />
                      <span style={{ 
                        flex: 1, 
                        fontSize: '0.85rem',
                        paddingLeft: '8px',
                        borderLeft: `4px solid ${getObjectColor(obj)}`,
                        color: 'rgba(255, 255, 255, 0.9)'
                      }}>
                        {obj}
                      </span>
                      <span style={{ 
                        background: '#00d4ff',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        minWidth: '20px',
                        textAlign: 'center',
                        opacity: 0.9
                      }}>
                        {realtimeDetections.filter(d => d.class === obj).length}
                      </span>
                    </label>
                  ))}
                </div>
                
                {realtimeDetections.length > 0 && (
                  <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>🔍 Live Detections ({realtimeDetections.length}):</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {realtimeDetections.slice(0, 8).map((det, idx) => (
                        <span key={idx} style={{ 
                          background: getObjectColor(det.class) + '40',
                          color: getObjectColor(det.class),
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          border: `1px solid ${getObjectColor(det.class)}`
                        }}>
                          {det.class} {(det.confidence * 100).toFixed(0)}%
                        </span>
                      ))}
                      {realtimeDetections.length > 8 && (
                        <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                          +{realtimeDetections.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ESP32 Detection Panel for Inspection Feature */}
            {activeFeature === 'inspection' && isPlaying && (
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.9)', 
                border: '1px solid rgba(255, 102, 0, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                margin: '20px 0',
                color: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ff6600' }}>🔧 ESP32 Component Detection</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{
                      background: isESP32RealtimeActive ? 'rgba(255, 102, 0, 0.2)' : 'rgba(128, 128, 128, 0.2)',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      border: `1px solid ${isESP32RealtimeActive ? '#ff6600' : '#888'}`
                    }}>
                      {isESP32RealtimeActive ? '🔴 LIVE' : '⚫ READY'}
                    </div>
                  </div>
                </div>
                
                {isESP32RealtimeActive && esp32Detections.length > 0 && (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    {esp32Detections.map((detection, index) => (
                      <div key={index} style={{ 
                        background: 'rgba(255, 102, 0, 0.1)',
                        border: '2px solid rgba(255, 102, 0, 0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        position: 'relative'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          marginBottom: '8px' 
                        }}>
                          <span style={{ 
                            fontSize: '1rem', 
                            fontWeight: 'bold',
                            color: '#ff6600'
                          }}>
                            🔧 ESP32 #{index + 1}
                          </span>
                          <span style={{ 
                            background: '#ff6600',
                            color: '#000',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}>
                            {(detection.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '8px' }}>
                          Size: {Math.round(detection.bbox[2] - detection.bbox[0])} × {Math.round(detection.bbox[3] - detection.bbox[1])} px
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                          Position: ({Math.round(detection.bbox[0])}, {Math.round(detection.bbox[1])})
                        </div>
                        
                        {/* Detection Quality Indicator */}
                        <div style={{ 
                          marginTop: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ fontSize: '0.8rem' }}>Quality:</span>
                          <div style={{
                            width: '100px',
                            height: '4px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '2px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${detection.confidence * 100}%`,
                              height: '100%',
                              background: detection.confidence > 0.8 ? '#ff6600' : 
                                          detection.confidence > 0.6 ? '#ffaa00' : '#ff9999',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          <span style={{ 
                            fontSize: '0.8rem',
                            color: detection.confidence > 0.8 ? '#ff6600' : 
                                   detection.confidence > 0.6 ? '#ffaa00' : '#ff9999'
                          }}>
                            {detection.confidence > 0.8 ? 'GOOD' : 
                             detection.confidence > 0.6 ? 'OK' : 'POOR'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!isESP32RealtimeActive && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '30px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontStyle: 'italic',
                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔧</div>
                    Click "🔧 Start Real-time" to begin live ESP32 detection
                  </div>
                )}
                
                {isESP32RealtimeActive && esp32Detections.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '30px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontStyle: 'italic',
                    border: '2px dashed rgba(255, 102, 0, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(255, 102, 0, 0.05)'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔍</div>
                    Point camera at ESP32 components to detect them in real-time
                  </div>
                )}
                
                {/* ESP32 Detection Statistics */}
                {esp32Detections.length > 0 && (
                  <div style={{ 
                    marginTop: '15px', 
                    padding: '15px', 
                    background: 'rgba(255, 102, 0, 0.1)', 
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 102, 0, 0.2)'
                  }}>
                    <div style={{ fontSize: '0.9rem', marginBottom: '8px', fontWeight: '600' }}>📊 Detection Statistics:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                      <div style={{ flex: '1', minWidth: '120px' }}>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total ESP32s:</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff6600' }}>{esp32Detections.length}</div>
                      </div>
                      <div style={{ flex: '1', minWidth: '120px' }}>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Average Confidence:</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff6600' }}>
                          {((esp32Detections.reduce((sum, d) => sum + d.confidence, 0) / esp32Detections.length) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div style={{ flex: '1', minWidth: '120px' }}>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Detection FPS:</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff6600' }}>{esp32FPS}</div>
                      </div>
                    </div>
                  </div>
                )}
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
