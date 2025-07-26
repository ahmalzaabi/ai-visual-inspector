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
  const [currentStep, setCurrentStep] = useState(1);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Assembly steps configuration
  const assemblySteps = [
    {
      id: 1,
      title: t('assembly.steps.step1.title'),
      description: t('assembly.steps.step1.description'),
      requirement: t('assembly.steps.step1.requirement'),
      requiredCount: 2,
      icon: "📱"
    },
    {
      id: 2,
      title: t('assembly.steps.step2.title'),
      description: t('assembly.steps.step2.description'),
      requirement: t('assembly.steps.step2.requirement'),
      requiredCount: 2,
      icon: "🔌"
    },
    {
      id: 3,
      title: t('assembly.steps.step3.title'),
      description: t('assembly.steps.step3.description'),
      requirement: t('assembly.steps.step3.requirement'),
      requiredCount: 2,
      icon: "🔗"
    },
    {
      id: 4,
      title: t('assembly.steps.step4.title'),
      description: t('assembly.steps.step4.description'),
      requirement: t('assembly.steps.step4.requirement'),
      requiredCount: 2,
      icon: "✅"
    }
  ];

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



  // Smooth drawing function to reduce flicker
  const drawDetections = (ctx: CanvasRenderingContext2D, detections: any[]) => {
    detections.forEach((detection, index) => {
      const { x, y, width, height, confidence } = detection;
      
      // Main bounding box - using app's green theme color
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // Semi-transparent fill
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.fillRect(x, y, width, height);
      
      // Corner markers for better visibility
      const cornerSize = 15;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(x, y + cornerSize);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerSize, y);
      ctx.stroke();
      
      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(x + width - cornerSize, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + cornerSize);
      ctx.stroke();
      
      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(x, y + height - cornerSize);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x + cornerSize, y + height);
      ctx.stroke();
      
      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(x + width - cornerSize, y + height);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x + width, y + height - cornerSize);
      ctx.stroke();
      
      // Label with app theme styling
      const label = `ESP32 ${(confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const labelMetrics = ctx.measureText(label);
      const labelWidth = labelMetrics.width + 12;
      const labelHeight = 24;
      
      const labelX = x;
      const labelY = y > labelHeight ? y - labelHeight : y + height;
      
      // Label background - matching app's dark theme
      ctx.fillStyle = 'rgba(26, 29, 41, 0.9)';
      ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
      
      // Label border
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
      
      // Label text
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(label, labelX + 6, labelY + 16);
      
      // Detection number badge
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x + width - 12, y + 12, 10, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#1a1d29';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((index + 1).toString(), x + width - 12, y + 16);
      ctx.textAlign = 'left';
    });
  };

  // ESP32 Detection Function for Assembly Verification
  const performESP32Detection = async () => {
    if (!videoRef.current || !canvasRef.current || activeFeature !== 'assembly') {
      return;
    }

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('❌ Could not get canvas context');
        return;
      }

      if (video.readyState < 2) {
        return;
      }

      // CRITICAL: Ensure canvas dimensions match video exactly
      const videoRect = video.getBoundingClientRect();
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.style.width = videoRect.width + 'px';
      canvas.style.height = videoRect.height + 'px';

      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Run ESP32 detection
      const analysis = await mlService.detectESP32(canvas, video);
      
      setDetectionCount(analysis.detections.length);

      // Draw detection boxes immediately
      if (analysis.detections.length > 0) {
        ctx.save();
        drawDetections(ctx, analysis.detections);
        ctx.restore();
      }

    } catch (err) {
      console.error('❌ ESP32 detection failed:', err);
      setDetectionCount(0);
    }
  };

  const startDetection = async () => {
    if (isDetecting || !videoRef.current || activeFeature !== 'assembly') {
      return;
    }

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
      
      // Start detection loop at 4 FPS for optimal balance of performance and smoothness
      const detectionInterval = 250;
      detectionIntervalRef.current = setInterval(performESP32Detection, detectionInterval);
      
      // Run first detection immediately
      await performESP32Detection();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Failed to start detection:', errorMessage);
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
            <canvas ref={canvasRef} className={`detection-overlay ${isDetecting ? 'active' : ''}`} />
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

          {/* ESP32 Detection Display */}
          <div className="esp32-detection-display">
                         <div className="detection-summary">
               <span className="detection-count-badge">
                 <span className="count-number">{detectionCount}</span>
                 <span className="count-label">{t('assembly.detectionLabel')}</span>
               </span>
             </div>
          </div>

                     {/* Assembly Progress Steps */}
           <div className="assembly-progress">
             <h3 className="progress-title">{t('assembly.progressTitle')}</h3>
            <div className="steps-container">
              {assemblySteps.map((step, index) => {
                const isCompleted = step.id < currentStep || (step.id === 1 && detectionCount >= step.requiredCount);
                const isCurrent = step.id === currentStep;
                const isStep1 = step.id === 1;
                
                return (
                  <div key={step.id} className={`step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                    <div className="step-indicator">
                      <span className="step-icon">{isCompleted ? '✅' : step.icon}</span>
                      <span className="step-number">{step.id}</span>
                    </div>
                    
                    <div className="step-content">
                      <h4 className="step-title">{step.title}</h4>
                      <p className="step-description">{step.description}</p>
                      
                                             {isStep1 && isCurrent && (
                         <div className="step-status">
                           {detectionCount >= step.requiredCount ? (
                             <span className="status-success">
                               ✅ {t('assembly.status.step1Complete', { count: detectionCount })}
                             </span>
                           ) : (
                                                          <span className="status-warning">
                                ⚠️ {detectionCount === 1 ? t('assembly.status.anotherEsp32Needed') : t('assembly.status.place2Boards')}
                                {detectionCount === 1 && <span className="helper-text"> {t('assembly.status.oneMoreRequired')}</span>}
                             </span>
                           )}
                         </div>
                       )}
                      
                                             {!isStep1 && isCurrent && (
                         <div className="step-status">
                           <span className="status-pending">
                             📋 {t('assembly.status.manualStep')}
                           </span>
                         </div>
                       )}
                    </div>
                    
                    {index < assemblySteps.length - 1 && (
                      <div className={`step-connector ${isCompleted ? 'completed' : ''}`}></div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Progress Controls */}
            <div className="progress-controls">
                             {currentStep === 1 && detectionCount >= 2 && (
                 <button 
                   className="btn btn-success"
                   onClick={() => setCurrentStep(2)}
                 >
                   {t('actions.continue')} →
                 </button>
               )}
              
                             {currentStep > 1 && currentStep < 4 && (
                 <div className="manual-controls">
                   <button 
                     className="btn btn-secondary"
                     onClick={() => setCurrentStep(currentStep - 1)}
                   >
                     ← {t('actions.previous')}
                   </button>
                   <button 
                     className="btn btn-success"
                     onClick={() => setCurrentStep(currentStep + 1)}
                   >
                     {t('actions.next')} →
                   </button>
                 </div>
               )}
              
                             {currentStep === 4 && (
                 <div className="completion-controls">
                   <button 
                     className="btn btn-secondary"
                     onClick={() => setCurrentStep(3)}
                   >
                     ← {t('actions.previous')}
                   </button>
                   <button 
                     className="btn btn-primary"
                     onClick={() => {
                       setCurrentStep(1);
                       setDetectionCount(0);
                     }}
                   >
                     {t('assembly.status.completionMessage')}
                   </button>
                 </div>
               )}
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
              <canvas ref={canvasRef} className={`detection-overlay ${isDetecting ? 'active' : ''}`} />
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