import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { mlService } from '../services/mlService';
import FeatureCard from './FeatureCard';

interface FeaturesPageProps {
  onBack: () => void;
}

const FeaturesPage: React.FC<FeaturesPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionCount, setDetectionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Features configuration
  const features = [
    {
      id: 'assembly',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      feature: t('features.assembly'),
      description: t('descriptions.assembly')
    },
    {
      id: 'inspection',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      feature: t('features.inspection'),
      description: t('descriptions.inspection')
    },
    {
      id: 'repair',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12c.552 0 1-.449 1-1V5c0-.552-.448-1-1-1h-6c-.552 0-1 .448-1 1v6c0 .551.448 1 1 1h6z" stroke="currentColor" strokeWidth="2"/>
          <path d="M3 7v10a4 4 0 0 0 4 4h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      feature: t('features.repair'),
      description: t('descriptions.repair')
    },
    {
      id: 'maintenance',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8z" fill="currentColor"/>
          <path d="M12 6a6 6 0 0 0-6 6h2a4 4 0 0 1 4-4z" fill="currentColor"/>
        </svg>
      ),
      feature: t('features.maintenance'),
      description: t('descriptions.maintenance')
    },
    {
      id: 'quality',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      feature: t('features.quality'),
      description: t('descriptions.quality')
    }
  ];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError('Camera access failed. Please check permissions.');
      console.error('Camera error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsPlaying(false);
    stopDetection();
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsDetecting(false);
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // ESP32 Detection Function for Assembly Verification
  const performESP32Detection = async () => {
    if (!videoRef.current || !canvasRef.current || activeFeature !== 'assembly') return;

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (video.readyState < 2) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Run ESP32 detection
      const analysis = await mlService.detectESP32(canvas, video);
      setDetectionCount(analysis.detections.length);

      // Draw simple tracking boxes
      if (analysis.detections.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.font = '14px Arial';
        
        analysis.detections.forEach((detection) => {
          const { x, y, width, height, confidence } = detection;
          
          // Draw bounding box
          ctx.strokeRect(x, y, width, height);
          ctx.fillRect(x, y, width, height);
          
          // Draw label
          ctx.fillStyle = '#00ff00';
          ctx.fillText(
            `ESP32 ${(confidence * 100).toFixed(0)}%`, 
            x, 
            y - 5
          );
        });
        
        ctx.restore();
      }

    } catch (err) {
      console.error('ESP32 detection failed:', err);
      setDetectionCount(0);
    }
  };

  const startDetection = async () => {
    if (isDetecting || !videoRef.current || activeFeature !== 'assembly') return;

    setIsLoading(true);
    setError('');

    try {
      if (videoRef.current.readyState < 2) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (videoRef.current.readyState < 2) {
          throw new Error('Video stream not ready. Please ensure camera is working.');
        }
      }

      if (!mlService.isReady()) {
        await mlService.initializeESP32Model();
      }

      setIsDetecting(true);
      
      // Start detection loop at 5 FPS for optimal performance
      const detectionInterval = 200;
      detectionIntervalRef.current = setInterval(performESP32Detection, detectionInterval);
      
      await performESP32Detection();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to start detection: ${errorMessage}`);
      setIsDetecting(false);
    } finally {
      setIsLoading(false);
    }
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
              {features.map((featureItem) => (
                <FeatureCard
                  key={featureItem.id}
                  icon={featureItem.icon}
                  feature={featureItem.feature}
                  description={featureItem.description}
                  onClick={() => handleFeatureClick(featureItem.id)}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Assembly Verification Feature with ESP32 Detection */}
      {activeFeature === 'assembly' && (
        <div className="assembly-feature">
          <div className="feature-header">
            <button className="btn btn-back" onClick={() => setActiveFeature('')}>
              ← {t('actions.back')}
            </button>
            <h2 className="feature-title">
              🔧 {t('features.assembly')}
            </h2>
          </div>

          <div className="video-container">
            <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
            <canvas ref={canvasRef} className="detection-overlay" />
          </div>

          <div className="controls">
            <button 
              className={`btn ${isPlaying ? 'btn-secondary' : 'btn-primary'}`}
              onClick={isPlaying ? stopCamera : startCamera}
              disabled={isLoading}
            >
              {isLoading ? '⏳' : (isPlaying ? '📷 Stop Camera' : '📷 Start Camera')}
            </button>
            
            {isPlaying && (
              <button 
                className={`btn ${isDetecting ? 'btn-danger' : 'btn-success'}`}
                onClick={isDetecting ? stopDetection : startDetection}
                disabled={isLoading}
              >
                {isLoading ? '⏳ Loading...' : (isDetecting ? '⏹️ Stop Detection' : '🚀 Start Detection')}
              </button>
            )}
          </div>

          {/* Simple Detection Count Display */}
          <div className="detection-status">
            <div className="detection-count">
              ESP32 Boards Detected: <span className={detectionCount > 0 ? 'detected' : 'none'}>{detectionCount}</span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Other Features Interface */}
      {activeFeature && activeFeature !== 'assembly' && (
        <div className="feature-interface">
          <div className="feature-header">
            <button className="btn btn-back" onClick={() => setActiveFeature('')}>
              ← {t('actions.back')}
            </button>
            <h2 className="feature-title">
              {features.find(f => f.id === activeFeature)?.feature}
            </h2>
          </div>

          <div className="camera-section">
            <div className="video-container">
              <video ref={videoRef} autoPlay playsInline muted />
              <canvas ref={canvasRef} className="detection-overlay" />
            </div>

            <div className="controls">
              <button 
                className={`btn ${isPlaying ? 'btn-secondary' : 'btn-primary'}`}
                onClick={isPlaying ? stopCamera : startCamera}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : (isPlaying ? 'Stop Camera' : 'Start Camera')}
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturesPage; 