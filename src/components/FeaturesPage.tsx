import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { mlService } from '../services/mlService';
import type { ESP32Analysis } from '../services/mlService';
import FeatureCard from './FeatureCard';
import ErrorBoundary from './ErrorBoundary';

interface FeaturesPageProps {
  onBack: () => void;
}

const FeaturesPage: React.FC<FeaturesPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  
  // State management
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResults, setDetectionResults] = useState<ESP32Analysis | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);

  // Features configuration
  const features = [
    {
      id: 'assembly',
      icon: <span>🔧</span>,
      feature: t('features.assembly'),
      description: t('descriptions.assembly')
    },
    {
      id: 'inspection',
      icon: <span>🔍</span>,
      feature: t('features.inspection'),
      description: t('descriptions.inspection')
    },
    {
      id: 'repair',
      icon: <span>🛠️</span>,
      feature: t('features.repair'),
      description: t('descriptions.repair')
    },
    {
      id: 'maintenance',
      icon: <span>⚙️</span>,
      feature: t('features.maintenance'),
      description: t('descriptions.maintenance')
    },
    {
      id: 'quality',
      icon: <span>✅</span>,
      feature: t('features.quality'),
      description: t('descriptions.quality')
    }
  ];

  // Camera setup
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Stop any existing streams first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        streamRef.current = null;
      }

      console.log('📱 Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 24, max: 30 }
        },
        audio: false
      });
      
      streamRef.current = mediaStream;
      setIsPlaying(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded');
          if (videoRef.current) {
            videoRef.current.play().catch(error => {
              console.warn('Video play error:', error);
            });
          }
        };
        
        videoRef.current.oncanplay = () => {
          console.log('📹 Video ready to play');
        };

        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
      }

      console.log('✅ Camera started successfully');
    } catch (error) {
      console.error('❌ Camera error:', error);
      
      let errorMessage = 'Failed to start camera';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported in this browser.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    }
  }, []);

  const stopCamera = useCallback(() => {
    console.log('🛑 Stopping camera...');
    
    // Stop detection
    setIsDetecting(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
        console.log(`🔇 Stopped ${track.kind} track`);
      });
      streamRef.current = null;
    }
    
    // Reset states
    setIsPlaying(false);
    setDetectionResults(null);
    
    // Clear overlay
    if (overlayCanvasRef.current) {
      const overlayContext = overlayCanvasRef.current.getContext('2d');
      if (overlayContext) {
        overlayContext.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
    }
    
    console.log('✅ Camera stopped');
  }, []);

  // Start detection for ESP32 (works for all features)
  const startDetection = async () => {
    try {
      setIsModelLoading(true);
      setError(null);
      
      // Initialize ESP32 model
      await mlService.initializeESP32Model();
      
      setIsDetecting(true);
      setIsModelLoading(false);
      
      console.log('✅ Detection started');
      
    } catch (err) {
      console.error('Detection failed:', err);
      setError('Failed to start detection');
      setIsModelLoading(false);
    }
  };

  // Stop detection
  const stopDetection = () => {
    setIsDetecting(false);
    setDetectionResults(null);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    console.log('🛑 Detection stopped');
  };

  // Detection loop
  useEffect(() => {
    const runDetection = async () => {
      if (!isDetecting || !videoRef.current || !canvasRef.current || !overlayCanvasRef.current) {
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

          // Run ESP32 detection
          const analysis = await mlService.detectESP32(canvas);
          setDetectionResults(analysis);
          
          // Draw detection overlay
          drawDetectionOverlay(overlayContext, analysis, canvas.width, canvas.height);
          
        } catch (err) {
          console.error('Detection failed:', err);
          setError('Detection failed');
        }
      }

      if (isDetecting) {
        animationRef.current = requestAnimationFrame(runDetection);
      }
    };

    if (isDetecting) {
      runDetection();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDetecting]);

  // Draw detection overlay
  const drawDetectionOverlay = (
    context: CanvasRenderingContext2D,
    analysis: ESP32Analysis,
    width: number,
    height: number
  ) => {
    context.clearRect(0, 0, width, height);
    
    // Draw detections with different colors based on feature
    analysis.detections.forEach((detection) => {
      const { x, y, width: w, height: h, confidence } = detection;
      
      // Different colors for different features
      let strokeColor = '#FF8C00'; // Default orange for ESP32
      let fillColor = 'rgba(255, 140, 0, 0.1)';
      
      switch (activeFeature) {
        case 'assembly':
          strokeColor = '#FF8C00'; // Orange
          fillColor = 'rgba(255, 140, 0, 0.1)';
          break;
        case 'inspection':
          strokeColor = '#10B981'; // Green
          fillColor = 'rgba(16, 185, 129, 0.1)';
          break;
        case 'repair':
          strokeColor = '#EF4444'; // Red
          fillColor = 'rgba(239, 68, 68, 0.1)';
          break;
        case 'maintenance':
          strokeColor = '#8B5CF6'; // Purple
          fillColor = 'rgba(139, 92, 246, 0.1)';
          break;
        case 'quality':
          strokeColor = '#06B6D4'; // Cyan
          fillColor = 'rgba(6, 182, 212, 0.1)';
          break;
      }
      
      // Fill detection area
      context.fillStyle = fillColor;
      context.fillRect(x, y, w, h);
      
      // Draw bounding box
      context.strokeStyle = strokeColor;
      context.lineWidth = 3;
      context.strokeRect(x, y, w, h);
      
      // Draw confidence label
      context.fillStyle = strokeColor;
      context.font = '16px Arial';
      const label = `${activeFeature?.toUpperCase()} ${Math.round(confidence * 100)}%`;
      const labelWidth = context.measureText(label).width;
      
      // Background for label
      context.fillRect(x, y - 25, labelWidth + 10, 20);
      
      // Label text
      context.fillStyle = 'white';
      context.fillText(label, x + 5, y - 8);
    });
  };

  const handleFeatureClick = (featureId: string) => {
    setActiveFeature(featureId);
    // Auto-start camera when a feature is selected
    if (!isPlaying) {
      startCamera();
    }
  };

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
                  feature={feature.feature}
                  description={feature.description}
                  isActive={activeFeature === feature.id}
                  onClick={() => handleFeatureClick(feature.id)}
                />
              ))}
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
              {features.find(f => f.id === activeFeature)?.feature}
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
                  <button className="btn btn-primary btn-sm" onClick={startCamera}>
                    Retry Camera
                  </button>
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
                  <p>{t('camera.placeholder')}</p>
                </div>
                <button 
                  className="btn btn-primary btn-large" 
                  onClick={startCamera}
                  disabled={isPlaying}
                >
                  {t('camera.start')}
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
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%'
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
                  {!isDetecting ? (
                    <button 
                      className="btn btn-primary"
                      onClick={startDetection}
                      disabled={isModelLoading}
                    >
                      {isModelLoading ? 'Loading Model...' : `Start ${activeFeature} Detection`}
                    </button>
                  ) : (
                    <button 
                      className="btn btn-danger"
                      onClick={stopDetection}
                    >
                      Stop Detection
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

            {/* Detection Status Panel */}
            {isDetecting && detectionResults && (
              <div className="detection-panel">
                <div className="panel-header">
                  <h3>{activeFeature} Detection</h3>
                  <div className="panel-stats">
                    <span className="stat">Status: {detectionResults.status}</span>
                    <span className="stat">Detections: {detectionResults.detections.length}</span>
                  </div>
                </div>
                
                {detectionResults.detections.length > 0 ? (
                  <div className="detections-grid">
                    {detectionResults.detections.map((detection, index) => (
                      <div key={index} className="detection-item">
                        <div className="detection-info">
                          <span className="detection-class">{activeFeature?.toUpperCase()}</span>
                          <span className="detection-confidence">
                            {Math.round(detection.confidence * 100)}%
                          </span>
                        </div>
                        <div className="detection-bbox">
                          Position: ({Math.round(detection.x)}, {Math.round(detection.y)})
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-detections">
                    <p>Looking for {activeFeature} components...</p>
                    <p className="hint">Point camera at relevant objects</p>
                  </div>
                )}
              </div>
            )}
          </ErrorBoundary>
        </>
      )}
    </div>
  );
};

export default FeaturesPage; 