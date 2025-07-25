import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mlService } from '../services/mlService';
import type { ESP32Analysis, ESP32Detection } from '../services/mlService';
import FeatureCard from './FeatureCard';

interface FeaturesPageProps {
  onBack: () => void;
}

const FeaturesPage: React.FC<FeaturesPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Simple state for ESP32 detection only
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<'esp32' | null>(null);
  const [detectionResults, setDetectionResults] = useState<ESP32Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);

  // Camera setup
  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment'
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera setup failed:', err);
        setError('Failed to access camera');
      }
    };

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start ESP32 detection
  const startESP32Detection = async () => {
    try {
      setIsModelLoading(true);
      setError(null);
      
      // Initialize ESP32 model
      await mlService.initializeESP32Model();
      
      setSelectedFeature('esp32');
      setIsDetecting(true);
      setIsModelLoading(false);
      
      console.log('✅ ESP32 detection started');
      
    } catch (err) {
      console.error('ESP32 detection failed:', err);
      setError('Failed to start ESP32 detection');
      setIsModelLoading(false);
    }
  };

  // Stop detection
  const stopDetection = () => {
    setIsDetecting(false);
    setSelectedFeature(null);
    setDetectionResults(null);
    console.log('🛑 Detection stopped');
  };

  // Detection loop
  useEffect(() => {
    let animationFrame: number;

    const runDetection = async () => {
      if (!isDetecting || !videoRef.current || !canvasRef.current || !selectedFeature) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.videoWidth === 0) {
        animationFrame = requestAnimationFrame(runDetection);
        return;
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        // Run ESP32 detection
        const analysis = await mlService.detectESP32(canvas);
        setDetectionResults(analysis);
        
        // Draw detection overlay
        drawESP32Overlay(ctx, analysis.detections, canvas.width, canvas.height);
        
      } catch (err) {
        console.error('Detection failed:', err);
        setError('Detection failed');
      }

      // Continue detection loop
      animationFrame = requestAnimationFrame(runDetection);
    };

    if (isDetecting) {
      runDetection();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isDetecting, selectedFeature]);

  // Draw ESP32 detection overlay
  const drawESP32Overlay = (
    ctx: CanvasRenderingContext2D,
    detections: ESP32Detection[],
    width: number,
    height: number
  ) => {
    ctx.clearRect(0, 0, width, height);
    
    // Redraw video frame
    if (videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, width, height);
    }

    // Draw ESP32 detections with orange border
    detections.forEach((detection) => {
      const { x, y, width: w, height: h, confidence } = detection;
      
      // Draw bounding box
      ctx.strokeStyle = '#FF8C00'; // Orange color for ESP32
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
      
      // Draw confidence label
      ctx.fillStyle = '#FF8C00';
      ctx.font = '16px Arial';
      const label = `ESP32 ${Math.round(confidence * 100)}%`;
      const labelWidth = ctx.measureText(label).width;
      
      // Background for label
      ctx.fillRect(x, y - 25, labelWidth + 10, 20);
      
      // Label text
      ctx.fillStyle = 'white';
      ctx.fillText(label, x + 5, y - 8);
    });
  };

     // Feature cards configuration
   const features = [
     {
       id: 'esp32',
       feature: t('features.esp32.title'),
       description: t('features.esp32.description'),
       icon: <span>🔧</span>,
       onClick: startESP32Detection,
       disabled: isModelLoading
     }
   ];

  return (
    <div className="features-page">
      <header className="page-header">
        <button onClick={onBack} className="back-button">
          ← {t('common.back')}
        </button>
        <h1>{t('features.title')}</h1>
      </header>

      <main className="features-content">
        {!selectedFeature ? (
          // Feature selection
                     <div className="feature-grid">
             {features.map((featureItem) => (
               <FeatureCard
                 key={featureItem.id}
                 feature={featureItem.feature}
                 description={featureItem.description}
                 icon={featureItem.icon}
                 onClick={featureItem.onClick}
               />
             ))}
           </div>
        ) : (
          // Detection interface
          <div className="detection-interface">
            <div className="camera-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-feed"
              />
              <canvas
                ref={canvasRef}
                className="detection-overlay"
              />
            </div>
            
            <div className="detection-controls">
              <button onClick={stopDetection} className="stop-button">
                {t('detection.stop')}
              </button>
            </div>

            {/* Detection Status */}
            {detectionResults && (
              <div className="detection-status">
                <div className="status-card">
                  <h3>{t('features.esp32.title')}</h3>
                  <div className="status-grid">
                    <div className="status-item">
                      <span className="status-label">{t('detection.status')}</span>
                      <span className={`status-value ${detectionResults.status}`}>
                        {detectionResults.esp32Detected 
                          ? t('detection.detected') 
                          : t('detection.notDetected')
                        }
                      </span>
                    </div>
                    <div className="status-item">
                      <span className="status-label">{t('detection.confidence')}</span>
                      <span className="status-value">
                        {Math.round(detectionResults.confidenceScore * 100)}%
                      </span>
                    </div>
                    <div className="status-item">
                      <span className="status-label">{t('detection.count')}</span>
                      <span className="status-value">
                        {detectionResults.detections.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isModelLoading && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p>{t('detection.loadingModel')}</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={() => setError(null)} className="dismiss-error">
                  {t('common.dismiss')}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FeaturesPage; 