import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import FeatureCard from './FeatureCard'
import ErrorBoundary from './ErrorBoundary'
import { AssemblyIcon, InspectionIcon, RepairIcon, MaintenanceIcon, QualityIcon } from './TechIcons'
import { mlService } from '../services/mlService'

interface FeaturesPageProps {
  onBack: () => void;
}

const FeaturesPage: React.FC<FeaturesPageProps> = ({ onBack }) => {
  const { t } = useTranslation()
  
  // iOS PWA Detection
  const [isIOSPWA, setIsIOSPWA] = useState(false)
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    isLowEnd: false,
    hasLimitedMemory: false,
    supportsWebGL: true
  })
  
  useEffect(() => {
    const checkPWAAndCapabilities = () => {
      const isPWAMode = (
        ('standalone' in window.navigator && (window.navigator as any).standalone) ||
        window.matchMedia('(display-mode: standalone)').matches
      ) && /iPhone|iPad|iPod/.test(navigator.userAgent)
      
      const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4
      const hasLimitedMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4
      
      // Test WebGL support
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      const supportsWebGL = !!gl
      
      setIsIOSPWA(isPWAMode)
      setDeviceCapabilities({
        isLowEnd: !!isLowEnd,
        hasLimitedMemory: !!hasLimitedMemory,
        supportsWebGL
      })
      
      console.log('📱 Device Capabilities:', {
        isIOSPWA: isPWAMode,
        isLowEnd,
        hasLimitedMemory,
        supportsWebGL,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as any).deviceMemory
      })
    }
    
    checkPWAAndCapabilities()
    
    // Handle orientation changes (iOS PWA specific)
    const handleOrientationChange = () => {
      setTimeout(checkPWAAndCapabilities, 500)
    }
    
    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', checkPWAAndCapabilities)
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', checkPWAAndCapabilities)
    }
  }, [])

  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCompletion, setShowCompletion] = useState(false)

  // Assembly Verification - Multiple Models with Smart Tracking
  const [activeAssemblyModel, setActiveAssemblyModel] = useState<'esp32' | 'motor_connected' | 'motor_not_connected' | null>(null)
  const [isAssemblyRealtimeActive, setIsAssemblyRealtimeActive] = useState(false)
  const [assemblyDetections, setAssemblyDetections] = useState<any[]>([])
  const [assemblyFPS, setAssemblyFPS] = useState(0)

  const [assemblyProgress, setAssemblyProgress] = useState({
    step1_connections: 0,  // Number of connection points found
    step2_motors: 0,      // Number of motors detected (out of 4)
    step3_esp32: false,   // ESP32 board detected
    currentStep: 1,       // Current assembly step (1, 2, or 3)
    isComplete: false     // All assembly steps completed
  })

  // Deep Inspection states (no model for now)
  const [isInspectionRealtimeActive, setIsInspectionRealtimeActive] = useState(false)

  // iOS PWA performance monitoring
  const [performanceStats, setPerformanceStats] = useState<any>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const assemblyAnimationRef = useRef<number | undefined>(undefined)
  const inspectionAnimationRef = useRef<number | undefined>(undefined)

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

      // iOS PWA: Enhanced camera permission handling
      if (isIOSPWA) {
        try {
          // Request permissions more explicitly for iOS PWA
          const permissionStatus = await (navigator as any).permissions?.query({ name: 'camera' });
          if (permissionStatus && permissionStatus.state === 'denied') {
            throw new Error('Camera permission denied. Please enable camera access in Settings > Safari > Camera & Microphone Permissions');
          }
        } catch (permError) {
          console.warn('Permission query failed, proceeding with camera request:', permError);
        }
      }

      // iOS PWA: Optimized camera constraints for better performance
      const baseConstraints = {
        video: {
          facingMode: 'environment', // Prefer back camera
          frameRate: { ideal: deviceCapabilities.isLowEnd ? 15 : 24, max: 30 }
        },
        audio: false
      }

      let constraints
      if (isIOSPWA) {
        // iOS PWA specific optimizations
                 constraints = {
           ...baseConstraints,
           video: {
             ...baseConstraints.video,
             width: { 
               ideal: deviceCapabilities.hasLimitedMemory ? 480 : 640, 
               max: deviceCapabilities.hasLimitedMemory ? 720 : 1280 
             },
             height: { 
               ideal: deviceCapabilities.hasLimitedMemory ? 360 : 480, 
               max: deviceCapabilities.hasLimitedMemory ? 540 : 720 
             },
             // iOS Safari specific settings
             aspectRatio: { ideal: 4/3 }
           }
         }
      } else {
        // Standard constraints for other platforms
        constraints = {
          ...baseConstraints,
          video: {
            ...baseConstraints.video,
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 }
          }
        }
      }

      console.log('📱 Requesting camera access with iOS PWA optimizations...')
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      streamRef.current = mediaStream
      setIsPlaying(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        // iOS PWA: Enhanced video setup
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded')
          if (videoRef.current) {
            videoRef.current.play().catch(error => {
              console.warn('Video play error:', error)
              // iOS PWA: Retry play after user interaction
              if (isIOSPWA) {
                const playVideo = () => {
                  videoRef.current?.play().catch(console.warn)
                  document.removeEventListener('touchstart', playVideo)
                }
                document.addEventListener('touchstart', playVideo, { once: true })
              }
            })
          }
        }
        
        videoRef.current.oncanplay = () => {
          console.log('📹 Video ready to play')
          // Update performance stats
          updatePerformanceStats()
        }

        // iOS PWA: Essential video attributes
        videoRef.current.playsInline = true
        videoRef.current.muted = true
        videoRef.current.autoplay = true
        
        // iOS PWA: Prevent video from pausing when app goes to background
        if (isIOSPWA) {
          videoRef.current.addEventListener('pause', () => {
            if (!document.hidden && isPlaying) {
              videoRef.current?.play().catch(console.warn)
            }
          })
        }
      }

      console.log('✅ Camera started successfully for iOS PWA')
    } catch (error) {
      console.error('❌ Camera error:', error)
      
      let errorMessage = 'Failed to start camera'
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = isIOSPWA 
            ? 'Camera permission denied. Please enable camera access in Settings > Safari > Camera & Microphone Permissions, then reload the app.'
            : 'Camera permission denied. Please allow camera access and try again.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.'
        } else if (error.name === 'NotSupportedError') {
          errorMessage = isIOSPWA 
            ? 'Camera not supported. Please use Safari browser and ensure iOS 14.3 or later.'
            : 'Camera not supported in this browser.'
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Camera configuration not supported. Trying basic settings...'
          
          // iOS PWA: Enhanced fallback with multiple attempts
          try {
            console.log('🔄 Trying fallback camera settings...')
            let fallbackStream: MediaStream | null = null
            
            // Fallback 1: Basic constraints
            try {
              fallbackStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' }, 
                audio: false 
              })
            } catch {
              // Fallback 2: Any camera
              fallbackStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: false 
              })
            }
            
            if (fallbackStream) {
              streamRef.current = fallbackStream
              setIsPlaying(true)
              if (videoRef.current) {
                videoRef.current.srcObject = fallbackStream
                videoRef.current.playsInline = true
                videoRef.current.muted = true
              }
              console.log('✅ Fallback camera settings successful')
              return
            }
          } catch (fallbackError) {
            errorMessage = 'Camera access failed even with basic settings.'
          }
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    }
  }, [isIOSPWA, deviceCapabilities]);

  const stopCamera = useCallback(() => {
    console.log('🛑 Stopping camera...')
    
    // Stop all real-time detection
    setIsAssemblyRealtimeActive(false)
    setIsInspectionRealtimeActive(false)
    
    if (assemblyAnimationRef.current) {
      cancelAnimationFrame(assemblyAnimationRef.current)
    }
    if (inspectionAnimationRef.current) {
      cancelAnimationFrame(inspectionAnimationRef.current)
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop()
        console.log(`🔇 Stopped ${track.kind} track`)
      });
      streamRef.current = null
    }
    
    // Reset states
    setIsPlaying(false)
    setAssemblyDetections([])

    setAssemblyProgress({
      step1_connections: 0,
      step2_motors: 0,
      step3_esp32: false,
      currentStep: 1,
      isComplete: false
    })
    
    // Clear overlay
    if (overlayCanvasRef.current) {
      const overlayContext = overlayCanvasRef.current.getContext('2d');
      if (overlayContext) {
        overlayContext.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
    }
    
    console.log('✅ Camera stopped')
  }, []);

  // Update performance stats
  const updatePerformanceStats = useCallback(() => {
    try {
      const stats = mlService.getPerformanceStats()
      setPerformanceStats(stats)
    } catch (error) {
      console.warn('Performance stats update failed:', error)
    }
  }, [])

  // Assembly Verification real-time detection
  const startAssemblyRealtimeDetection = useCallback(() => {
    const detectFrame = async () => {
      if (!isAssemblyRealtimeActive || !videoRef.current || !canvasRef.current || !overlayCanvasRef.current) {
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
          let result: any;
          
          // Run different models based on selection with smart progress tracking
          switch (activeAssemblyModel) {
            case 'esp32':
              result = await mlService.detectESP32Assembly(canvas);
              setAssemblyDetections(result.detections);
              const esp32Found = result.detections.length > 0;
              drawAssemblyOverlay(overlayContext, result.detections, canvas.width, canvas.height, 'ESP32');
              
              // Update ESP32 progress and check completion
              setAssemblyProgress(prev => {
                const newProgress = { ...prev, step3_esp32: esp32Found };
                if (esp32Found && prev.step2_motors === 4 && prev.step1_connections > 0) {
                  newProgress.isComplete = true;
                  newProgress.currentStep = 3;
                }
                return newProgress;
              });
              break;
              
            case 'motor_connected':
              result = await mlService.detectMotorConnection(canvas);
              setAssemblyDetections(result.detections);
              const motorDetections = result.detections.filter((d: any) => d.class === 'motor');
              const currentMotorCount = motorDetections.length;
              drawAssemblyOverlay(overlayContext, result.detections, canvas.width, canvas.height, 'MotorConnected');
              
              // Smart motor counting with progress tracking
              setAssemblyProgress(prev => {
                const newProgress = { ...prev, step2_motors: currentMotorCount };
                if (currentMotorCount > 0) {
                  newProgress.currentStep = Math.max(newProgress.currentStep, 2);
                }
                if (currentMotorCount === 4) {
                  console.log('🎉 ALL 4 MOTORS DETECTED - Motor Assembly Complete!');
                } else if (currentMotorCount > 0) {
                  console.log(`⚡ ${currentMotorCount}/4 MOTORS DETECTED - ${4 - currentMotorCount} motors missing`);
                }
                return newProgress;
              });
              break;
              
            case 'motor_not_connected':
              result = await mlService.detectMotorConnection(canvas);
              setAssemblyDetections(result.detections);
              const connectionPoints = result.detections.filter((d: any) => d.class === 'connect_here');
              const connectionCount = connectionPoints.length;
              drawAssemblyOverlay(overlayContext, result.detections, canvas.width, canvas.height, 'MotorNotConnected');
              
              // Assembly Step 1 progress tracking
              setAssemblyProgress(prev => {
                const newProgress = { ...prev, step1_connections: connectionCount };
                if (connectionCount > 0) {
                  console.log('🔌 ASSEMBLY STEP 1: Connection points detected - Ready for motor installation');
                  newProgress.currentStep = Math.max(newProgress.currentStep, 1);
                }
                return newProgress;
              });
              break;
          }
          
          const endTime = performance.now();
          const inferenceTime = endTime - startTime;
          
          // iOS PWA: Adaptive FPS calculation
          const targetFPS = deviceCapabilities.isLowEnd ? 15 : 20
          const actualFPS = Math.min(Math.round(1000 / Math.max(inferenceTime, 16)), targetFPS)
          setAssemblyFPS(actualFPS)
          
          // Update performance stats periodically
          if (Math.random() < 0.1) { // 10% chance per frame
            updatePerformanceStats()
          }
        } catch (error) {
          console.error('Assembly real-time detection error:', error);
          
          // iOS PWA: Handle WebGL context loss gracefully
          if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as Error).message
            if (errorMessage.includes('WebGL') || errorMessage.includes('context')) {
              console.warn('🔥 WebGL context issue detected, will retry...')
              // The ML service will handle context recovery internally
            }
          }
        }
      }

      if (isAssemblyRealtimeActive) {
        assemblyAnimationRef.current = requestAnimationFrame(detectFrame);
      }
    };

    detectFrame();
  }, [isAssemblyRealtimeActive, activeAssemblyModel, deviceCapabilities, updatePerformanceStats]);

  // Deep Inspection real-time detection
  const startInspectionRealtimeDetection = useCallback(() => {
    const detectFrame = async () => {
      if (!isInspectionRealtimeActive || !videoRef.current || !canvasRef.current || !overlayCanvasRef.current) {
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

          // Deep Inspection feature disabled for now - no model
          console.log('Deep Inspection feature disabled - no model configured');
          
          // Update performance stats periodically
          if (Math.random() < 0.1) { // 10% chance per frame
            updatePerformanceStats()
          }
        } catch (error) {
          console.error('Deep Inspection real-time detection error:', error);
        }
      }

      if (isInspectionRealtimeActive) {
        inspectionAnimationRef.current = requestAnimationFrame(detectFrame);
      }
    };

    detectFrame();
  }, [isInspectionRealtimeActive, deviceCapabilities, updatePerformanceStats]);

  const drawAssemblyOverlay = (context: CanvasRenderingContext2D, detections: any[], width: number, height: number, modelType: string) => {
    context.clearRect(0, 0, width, height);
    
    detections.forEach((detection) => {
      const [x1, y1, x2, y2] = detection.bbox;
      const boxWidth = x2 - x1;
      const boxHeight = y2 - y1;
      
      // Different colors for different models
      let strokeColor = '#ff6b35'; // ESP32 orange
      let fillColor = 'rgba(255, 107, 53, 0.1)';
      let label = '';
      
      switch (modelType) {
        case 'ESP32':
          strokeColor = '#ff6b35';
          fillColor = 'rgba(255, 107, 53, 0.1)';
          label = `ESP32 ${(detection.confidence * 100).toFixed(0)}%`;
          break;
        case 'MotorConnected':
          strokeColor = '#10b981'; // Green for connected motors
          fillColor = 'rgba(16, 185, 129, 0.1)';
          label = `${detection.class} ${(detection.confidence * 100).toFixed(0)}%`;
          break;
        case 'MotorNotConnected':
          strokeColor = '#f59e0b'; // Yellow for connection points
          fillColor = 'rgba(245, 158, 11, 0.1)';
          label = `Step 1: ${detection.class} ${(detection.confidence * 100).toFixed(0)}%`;
          break;
      }
      
      context.strokeStyle = strokeColor;
      context.lineWidth = isIOSPWA ? 2 : 3;
      context.fillStyle = fillColor;
      
      // Fill detection area
      context.fillRect(x1, y1, boxWidth, boxHeight);
      
      // Draw border
      context.strokeRect(x1, y1, boxWidth, boxHeight);
      
      // Label background - optimized for iOS PWA
      context.font = isIOSPWA ? '12px -apple-system, BlinkMacSystemFont, sans-serif' : '14px Arial';
      const textWidth = context.measureText(label).width;
      
      context.fillStyle = strokeColor;
      context.fillRect(x1, y1 - 22, textWidth + 8, 18);
      
      // Label text
      context.fillStyle = 'white';
      context.fillText(label, x1 + 4, y1 - 6);
      
      // Corner indicators - simplified for iOS PWA performance
      const cornerSize = isIOSPWA ? 8 : 12;
      context.fillStyle = strokeColor;
      
      // Top corners
      context.fillRect(x1 - 1, y1 - 1, cornerSize, 2);
      context.fillRect(x1 - 1, y1 - 1, 2, cornerSize);
      context.fillRect(x2 - cornerSize + 1, y1 - 1, cornerSize, 2);
      context.fillRect(x2 - 1, y1 - 1, 2, cornerSize);
      
      // Bottom corners
      context.fillRect(x1 - 1, y2 - 1, cornerSize, 2);
      context.fillRect(x1 - 1, y2 - cornerSize + 1, 2, cornerSize);
      context.fillRect(x2 - cornerSize + 1, y2 - 1, cornerSize, 2);
      context.fillRect(x2 - 1, y2 - cornerSize + 1, 2, cornerSize);
    });
  };



  // Toggle Assembly real-time detection with model validation
  const toggleAssemblyRealtimeDetection = () => {
    if (!activeAssemblyModel && !isAssemblyRealtimeActive) {
      console.warn('Please select an assembly model first');
      alert('Please select an assembly model first (ESP32, Motor Connected, or Connection Points)');
      return;
    }

    if (isAssemblyRealtimeActive) {
      setIsAssemblyRealtimeActive(false);
      if (assemblyAnimationRef.current) {
        cancelAnimationFrame(assemblyAnimationRef.current);
      }
      setAssemblyDetections([]);
      // Clear overlay but maintain progress tracking
      if (overlayCanvasRef.current) {
        const overlayContext = overlayCanvasRef.current.getContext('2d');
        if (overlayContext) {
          overlayContext.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
      }
    } else {
      setIsAssemblyRealtimeActive(true);
      startAssemblyRealtimeDetection();
    }
  };

  // Toggle Deep Inspection real-time detection
  const toggleInspectionRealtimeDetection = () => {
    if (isInspectionRealtimeActive) {
      setIsInspectionRealtimeActive(false);
      if (inspectionAnimationRef.current) {
        cancelAnimationFrame(inspectionAnimationRef.current);
      }
      // Deep Inspection cleanup - no states to reset
      // Clear overlay
      if (overlayCanvasRef.current) {
        const overlayContext = overlayCanvasRef.current.getContext('2d');
        if (overlayContext) {
          overlayContext.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
      }
    } else {
      setIsInspectionRealtimeActive(true);
      startInspectionRealtimeDetection();
    }
  };

  // Start real-time detection when activated
  useEffect(() => {
    if (isAssemblyRealtimeActive) {
      startAssemblyRealtimeDetection();
    } else if (assemblyAnimationRef.current) {
      cancelAnimationFrame(assemblyAnimationRef.current);
    }
  }, [isAssemblyRealtimeActive, startAssemblyRealtimeDetection]);

  useEffect(() => {
    if (isInspectionRealtimeActive) {
      startInspectionRealtimeDetection();
    } else if (inspectionAnimationRef.current) {
      cancelAnimationFrame(inspectionAnimationRef.current);
    }
  }, [isInspectionRealtimeActive, startInspectionRealtimeDetection]);

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
      {!activeFeature && (
        <>
          {/* Back Button */}
          <div className="page-header">
            <button className="btn btn-back" onClick={onBack}>
              ← {t('actions.back')}
            </button>
            <h1 className="page-title">{t('features.title')}</h1>
          </div>

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

          {/* Status Section with iOS PWA Info */}
          <section className="status-section">
            <div className="status-card">
              <h3>📱 {isIOSPWA ? 'iOS PWA Optimized' : 'Multi-Model AI Platform'}</h3>
              <p>
                {isIOSPWA 
                  ? 'Optimized for iPhone Safari PWA with advanced memory management and WebGL acceleration.'
                  : 'Advanced computer vision with specialized models for assembly verification and deep inspection analysis.'
                }
              </p>
              <div className="tech-stack">
                {isIOSPWA && <span className="tech-badge">iOS PWA</span>}
                <span className="tech-badge">ESP32 Detection</span>
                <span className="tech-badge">Deep Inspection</span>
                <span className="tech-badge">Real-time AI</span>
                {deviceCapabilities.supportsWebGL && <span className="tech-badge">WebGL</span>}
                {deviceCapabilities.isLowEnd && <span className="tech-badge">Power Optimized</span>}
              </div>
              
              {/* iOS PWA Performance Stats */}
              {isIOSPWA && performanceStats && (
                <div className="performance-stats">
                  <h4>Performance Status</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Memory</span>
                      <span className="stat-value">{performanceStats.memory.memoryMB}MB</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Mode</span>
                      <span className="stat-value">{performanceStats.device.performanceMode}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Models</span>
                      <span className="stat-value">{performanceStats.inference.modelsLoaded.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {activeFeature && (
        <>
          {/* Feature Header */}
          <div className="page-header">
            <button className="btn btn-back" onClick={() => setActiveFeature(null)}>
              ← {t('actions.back')}
            </button>
            <h1 className="page-title">
              {activeFeature === 'assembly' && '🔧 ' + t('features.assembly')}
              {activeFeature === 'inspection' && '🔍 ' + t('features.inspection')}
              {activeFeature === 'repair' && '🛠️ ' + t('features.repair')}
              {activeFeature === 'maintenance' && '⚙️ ' + t('features.maintenance')}
              {activeFeature === 'quality' && '✓ ' + t('features.quality')}
            </h1>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <h4>{t('camera.error')}</h4>
                <p>{error}</p>
                <div className="error-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => setError(null)}>
                    Dismiss
                  </button>
                  {isIOSPWA && (
                    <button className="btn btn-primary btn-sm" onClick={startCamera}>
                      Retry Camera
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <ErrorBoundary>
            <div className="camera-container">
              {/* Camera placeholder */}
              <div className={`camera-placeholder ${isPlaying ? 'hidden' : ''}`}>
                <div className="placeholder-content">
                  <div className="camera-icon">📷</div>
                  <h3>{t('camera.start')}</h3>
                  <p>{isIOSPWA ? 'Tap to start camera (iOS PWA optimized)' : t('camera.placeholder')}</p>
                  {/* iOS PWA specific hints */}
                  {isIOSPWA && (
                    <div className="ios-hints">
                      <p className="hint">• Ensure good lighting for best results</p>
                      <p className="hint">• Hold device steady during detection</p>
                      {deviceCapabilities.isLowEnd && <p className="hint">• Power-optimized mode active</p>}
                    </div>
                  )}
                </div>
                <button 
                  className="btn btn-primary btn-large" 
                  onClick={startCamera}
                  disabled={isPlaying}
                >
                  📱 {isIOSPWA ? 'Start iOS Camera' : t('camera.start')}
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
                    style={{
                      // iOS PWA: Ensure proper video scaling
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%'
                    }}
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.play().catch(console.warn)
                      }
                    }}
                  />
                  
                  {/* Overlay canvas for real-time detection */}
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
                  
                  {/* Hidden canvas for processing */}
                  <canvas 
                    ref={canvasRef}
                    style={{ display: 'none' }}
                  />
                </div>
                
                <div className="camera-controls">
                  {activeFeature === 'assembly' ? (
                    <>
                      {/* Assembly Model Selection */}
                      <div className="assembly-model-selector">
                        <h4>🔧 Select Assembly Model:</h4>
                        <div className="model-buttons">
                          <button 
                            className={`btn model-btn ${activeAssemblyModel === 'motor_not_connected' ? 'btn-primary active' : 'btn-secondary'}`}
                            onClick={() => setActiveAssemblyModel('motor_not_connected')}
                          >
                            🔌 Step 1: Connection Points
                          </button>
                          
                          <button 
                            className={`btn model-btn ${activeAssemblyModel === 'motor_connected' ? 'btn-primary active' : 'btn-secondary'}`}
                            onClick={() => setActiveAssemblyModel('motor_connected')}
                          >
                            ⚡ Step 2: Motor Detection
                          </button>
                          
                          <button 
                            className={`btn model-btn ${activeAssemblyModel === 'esp32' ? 'btn-primary active' : 'btn-secondary'}`}
                            onClick={() => setActiveAssemblyModel('esp32')}
                          >
                            🔧 Step 3: ESP32 Board
                          </button>
                        </div>
                      </div>

                      {/* Assembly Progress Tracker */}
                      {(assemblyProgress.step1_connections > 0 || assemblyProgress.step2_motors > 0 || assemblyProgress.step3_esp32) && (
                        <div className="assembly-progress-tracker">
                          <h4>📊 Assembly Progress:</h4>
                          <div className="progress-steps">
                            <div className={`progress-step ${assemblyProgress.step1_connections > 0 ? 'completed' : assemblyProgress.currentStep === 1 ? 'active' : 'pending'}`}>
                              <div className="step-icon">🔌</div>
                              <div className="step-info">
                                <span className="step-title">Step 1: Connection Points</span>
                                <span className="step-status">
                                  {assemblyProgress.step1_connections > 0 
                                    ? `✅ ${assemblyProgress.step1_connections} connection points detected` 
                                    : 'Waiting for connection points...'}
                                </span>
                              </div>
                            </div>

                            <div className={`progress-step ${assemblyProgress.step2_motors === 4 ? 'completed' : assemblyProgress.step2_motors > 0 ? 'active' : 'pending'}`}>
                              <div className="step-icon">⚡</div>
                              <div className="step-info">
                                <span className="step-title">Step 2: Motor Installation</span>
                                <span className="step-status">
                                  {assemblyProgress.step2_motors === 4 
                                    ? '✅ All 4 motors detected!' 
                                    : assemblyProgress.step2_motors > 0 
                                      ? `⚠️ ${assemblyProgress.step2_motors}/4 motors - ${4 - assemblyProgress.step2_motors} missing`
                                      : 'Waiting for motors...'}
                                </span>
                              </div>
                            </div>

                            <div className={`progress-step ${assemblyProgress.step3_esp32 ? 'completed' : assemblyProgress.currentStep === 3 ? 'active' : 'pending'}`}>
                              <div className="step-icon">🔧</div>
                              <div className="step-info">
                                <span className="step-title">Step 3: ESP32 Board</span>
                                <span className="step-status">
                                  {assemblyProgress.step3_esp32 
                                    ? '✅ ESP32 board detected!' 
                                    : 'Waiting for ESP32 board...'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Overall Progress Bar */}
                          <div className="overall-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ 
                                  width: `${((assemblyProgress.step1_connections > 0 ? 1 : 0) + 
                                            (assemblyProgress.step2_motors > 0 ? assemblyProgress.step2_motors / 4 : 0) + 
                                            (assemblyProgress.step3_esp32 ? 1 : 0)) / 3 * 100}%` 
                                }}
                              ></div>
                            </div>
                            <span className="progress-text">
                              {assemblyProgress.isComplete 
                                ? '🎉 Assembly Complete!' 
                                : `Assembly Progress: ${Math.round(((assemblyProgress.step1_connections > 0 ? 1 : 0) + 
                                                                    (assemblyProgress.step2_motors > 0 ? assemblyProgress.step2_motors / 4 : 0) + 
                                                                    (assemblyProgress.step3_esp32 ? 1 : 0)) / 3 * 100)}%`}
                              </span>
                            </div>
                          </div>
                        )}

                      {/* Assembly Control Button */}
                      <button 
                        className={`btn ${activeAssemblyModel ? 'btn-primary' : 'btn-disabled'}`}
                        onClick={toggleAssemblyRealtimeDetection}
                        disabled={!activeAssemblyModel}
                      >
                        {isAssemblyRealtimeActive ? '⏹️ Stop Detection' : `▶️ Start ${activeAssemblyModel ? activeAssemblyModel.replace('_', ' ').replace('motor ', 'Motor ').replace('not connected', 'Connection Points').replace('connected', 'Detection').replace('esp32', 'ESP32') : ''} Detection`}
                      </button>
                      {isIOSPWA && isAssemblyRealtimeActive && (
                        <div className="ios-performance-hint">
                          <span className="hint">FPS: {assemblyFPS} | Memory: {performanceStats?.memory.memoryMB}MB</span>
                        </div>
                      )}
                    </>
                  ) : activeFeature === 'inspection' ? (
                    <>
                      <button 
                        className={`btn ${isInspectionRealtimeActive ? 'btn-danger' : 'btn-primary'}`}
                        onClick={toggleInspectionRealtimeDetection}
                      >
                        {isInspectionRealtimeActive ? '⏹️ Stop Motor Detection' : '🔌 Start Motor Detection'}
                      </button>
                      {isIOSPWA && isInspectionRealtimeActive && (
                        <div className="ios-performance-hint">
                          <span className="hint">Feature Disabled - No Model Configured</span>
                        </div>
                      )}
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

            {/* Assembly Verification Panel */}
            {activeFeature === 'assembly' && isAssemblyRealtimeActive && (
              <div className="detection-panel">
                <div className="panel-header">
                  <h3>🔧 ESP32 Assembly Detection</h3>
                  <div className="panel-stats">
                    <span className="stat">FPS: {assemblyFPS}</span>
                    <span className="stat">Detections: {assemblyDetections.length}</span>
                    {isIOSPWA && performanceStats && (
                      <span className="stat">Mode: {performanceStats.device.performanceMode}</span>
                    )}
                  </div>
                </div>
                
                {assemblyDetections.length > 0 ? (
                  <div className="detections-grid">
                    {assemblyDetections.slice(0, isIOSPWA ? 3 : 5).map((detection, index) => (
                      <div key={index} className="detection-item assembly-detection">
                        <div className="detection-info">
                          <span className="detection-class">ESP32 Component</span>
                          <span className="detection-confidence">
                            {(detection.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="detection-bbox">
                          Position: ({Math.round(detection.bbox[0])}, {Math.round(detection.bbox[1])})
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-detections">
                    <p>🔍 Looking for ESP32 components...</p>
                    <p className="hint">Point camera at ESP32 boards or components</p>
                    {isIOSPWA && <p className="hint">iOS PWA optimized for best performance</p>}
                  </div>
                )}
              </div>
            )}

            {/* Deep Inspection Panel */}
            {activeFeature === 'inspection' && isInspectionRealtimeActive && (
              <div className="detection-panel">
                <div className="panel-header">
                  <h3>🔌 Motor Connection Analysis</h3>
                  <div className="panel-stats">
                    <span className="stat">Status: Disabled</span>
                    <span className="stat">Model: Not Configured</span>
                    {isIOSPWA && performanceStats && (
                      <span className="stat">Memory: {performanceStats.memory.memoryMB}MB</span>
                    )}
                  </div>
                </div>
                
                <div className="connection-indicator">
                  <div className="connection-status">
                    <div 
                      className="status-indicator unknown"
                    >
                      🚫 Feature Disabled
                    </div>
                  </div>
                  
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill" 
                      style={{ 
                        width: '0%',
                        backgroundColor: '#6b7280'
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="detections-list">
                  {false ? (
                    <div className="detections-list">
                      {[].map((detection: any, index: number) => (
                        <div key={index} className="detection-item">
                          <span className="detection-class">{detection.class}</span>
                          <span className="detection-confidence">{(detection.confidence * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-detections">
                      <span>🚫 Deep Inspection Disabled - No Model Configured</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ErrorBoundary>
        </>
      )}
    </div>
  )
}

export default FeaturesPage 