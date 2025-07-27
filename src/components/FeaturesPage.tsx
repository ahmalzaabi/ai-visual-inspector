import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { mlService } from '../services/mlService';
import type { MotorWireAnalysis, WristStrapAnalysis } from '../services/mlService';
import { arService } from '../services/arService';
import type { ARShowcaseAnalysis } from '../services/arService';
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
  const [motorWireAnalysis, setMotorWireAnalysis] = useState<MotorWireAnalysis | null>(null);
  const [wristStrapAnalysis, setWristStrapAnalysis] = useState<WristStrapAnalysis | null>(null);
  const [arShowcaseAnalysis, setArShowcaseAnalysis] = useState<ARShowcaseAnalysis | null>(null);
  const [arInitialized, setArInitialized] = useState(false);
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
                  icon: "check"
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



  // Draw wrist strap detections
  const drawWristStrapDetections = (ctx: CanvasRenderingContext2D, detections: any[]) => {
    detections.forEach((detection) => {
      const { wristX, wristY, bluePixelPercentage, hasStrap, handedness } = detection;
      
      // Create visual indicator for wrist area
      const radius = 40;
      const strokeColor = hasStrap ? '#22c55e' : '#fbbf24'; // Green if strap detected, yellow if checking
      const fillColor = hasStrap ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)';
      
      // Draw wrist detection circle
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(wristX, wristY, radius, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Fill circle
      ctx.fillStyle = fillColor;
      ctx.fill();
      
      // Draw wrist strap indicator
      if (hasStrap) {
        // Draw blue band representation
        ctx.strokeStyle = '#3b82f6'; // Blue color
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(wristX, wristY, radius - 5, 0, Math.PI * 1.5); // 3/4 circle to represent strap
        ctx.stroke();
        
        // Add checkmark
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('✓', wristX - 8, wristY + 8);
      }
      
      // Label with detection status
      const label = hasStrap ? 
        `${handedness} Wrist: Anti-Static Strap ✓` : 
        `${handedness} Wrist: ${bluePixelPercentage.toFixed(0)}% Blue`;
      
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const labelMetrics = ctx.measureText(label);
      const labelWidth = labelMetrics.width + 12;
      const labelHeight = 20;
      
      const labelX = wristX - labelWidth / 2;
      const labelY = wristY > labelHeight + radius ? wristY - radius - labelHeight : wristY + radius + labelHeight;
      
      // Label background
      ctx.fillStyle = 'rgba(26, 29, 41, 0.9)';
      ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
      
      // Label border
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
      
      // Label text
      ctx.fillStyle = strokeColor;
      ctx.fillText(label, labelX + 6, labelY + 14);
    });
  };

  // Draw motor wire detections
  const drawMotorWireDetections = (ctx: CanvasRenderingContext2D, detections: any[]) => {
    detections.forEach((detection) => {
      const { x, y, width, height, confidence, class: className } = detection;
      
      // Color based on connection status
      const isConnected = className === 'connected';
      const strokeColor = isConnected ? '#22c55e' : '#ef4444'; // Green for connected, Red for not connected
      const fillColor = isConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      
      // Main bounding box
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // Semi-transparent fill
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, width, height);
      
      // Connection status icon
      const iconSize = 20;
      const iconX = x + width - iconSize - 5;
      const iconY = y + 5;
      
      ctx.fillStyle = strokeColor;
      ctx.font = 'bold 16px Arial';
      ctx.fillText(isConnected ? '🔗' : '❌', iconX, iconY + iconSize);
      
      // Label with connection status
      const label = `${isConnected ? 'Connected' : 'Not Connected'} ${(confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const labelMetrics = ctx.measureText(label);
      const labelWidth = labelMetrics.width + 12;
      const labelHeight = 20;
      
      const labelX = x;
      const labelY = y > labelHeight ? y - labelHeight : y + height;
      
      // Label background
      ctx.fillStyle = 'rgba(26, 29, 41, 0.9)';
      ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
      
      // Label border
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
      
      // Label text
      ctx.fillStyle = strokeColor;
      ctx.fillText(label, labelX + 6, labelY + 14);
    });
  };

  // Smooth drawing function to reduce flicker for ESP32
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

  // AR Technology Showcase Function for Step 4
  const performARShowcase = async () => {
    if (!videoRef.current || !canvasRef.current || activeFeature !== 'assembly' || currentStep !== 4) {
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

      // Get ESP32 detections for AR overlay
      const esp32Analysis = await mlService.detectESP32(canvas, video);
      
      // Run AR Technology Showcase
      const arAnalysis = await arService.detectAndOverlay(canvas, video, esp32Analysis.detections);
      
      setArShowcaseAnalysis(arAnalysis);
      setDetectionCount(esp32Analysis.detections.length); // Keep ESP32 count

      console.log('🚀 AR Showcase updated:', {
        detections: arAnalysis.detections.length,
        esp32Count: arAnalysis.esp32Info.length,
        effects: arAnalysis.showcaseEffects
      });

    } catch (err) {
      console.error('❌ AR showcase failed:', err);
      setArShowcaseAnalysis(null);
    }
  };

  // Wrist Strap Detection Function for Step 3
  const performWristStrapDetection = async () => {
    if (!videoRef.current || !canvasRef.current || activeFeature !== 'assembly' || currentStep !== 3) {
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

      // Run Wrist Strap detection
      const analysis = await mlService.detectWristStrap(canvas, video);
      
      setWristStrapAnalysis(analysis);

      // Draw wrist strap detection indicators immediately
      if (analysis.detections.length > 0) {
        ctx.save();
        drawWristStrapDetections(ctx, analysis.detections);
        ctx.restore();
      }

    } catch (err) {
      console.error('❌ Wrist strap detection failed:', err);
      setWristStrapAnalysis(null);
    }
  };

  // Motor Wire Detection Function for Step 2
  const performMotorWireDetection = async () => {
    if (!videoRef.current || !canvasRef.current || activeFeature !== 'assembly' || currentStep !== 2) {
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

      // Run Motor Wire detection
      const analysis = await mlService.detectMotorWires(canvas, video);
      
      setMotorWireAnalysis(analysis);

      // Draw motor wire detection boxes immediately
      if (analysis.detections.length > 0) {
        ctx.save();
        drawMotorWireDetections(ctx, analysis.detections);
        ctx.restore();
      }

    } catch (err) {
      console.error('❌ Motor wire detection failed:', err);
      setMotorWireAnalysis(null);
    }
  };

  // ESP32 Detection Function for Step 1
  const performESP32Detection = async () => {
    if (!videoRef.current || !canvasRef.current || activeFeature !== 'assembly' || currentStep !== 1) {
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

  // Combined detection function that calls appropriate detector based on current step
  const performDetection = async () => {
    if (currentStep === 1) {
      await performESP32Detection();
    } else if (currentStep === 2) {
      await performMotorWireDetection();
    } else if (currentStep === 3) {
      await performWristStrapDetection();
    } else if (currentStep === 4) {
      await performARShowcase();
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

      // Initialize appropriate model based on current step and switch for performance
      if (currentStep === 1) {
        await mlService.switchToModel('esp32');
      } else if (currentStep === 2) {
        await mlService.switchToModel('motor_wire');
      } else if (currentStep === 3) {
        await mlService.switchToModel('hands');
      } else if (currentStep === 4) {
        // Step 4: Initialize AR Technology Showcase
        if (!arInitialized) {
          console.log('🚀 Initializing AR Technology Showcase...');
          await arService.initialize();
          setArInitialized(true);
        }
        await mlService.switchToModel('esp32'); // Use ESP32 detection for AR overlays
      }

      setIsDetecting(true);
      
      // Start detection loop at 4 FPS for optimal balance of performance and smoothness
      const detectionInterval = 250;
      detectionIntervalRef.current = setInterval(performDetection, detectionInterval);
      
      // Run first detection immediately
      await performDetection();

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
              <span className="icon-esp32"></span> {t('features.assembly')}
            </h2>
          </div>

          <div className="video-container">
            <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
                            <canvas ref={canvasRef} className={`detection-overlay ${isDetecting ? 'active' : ''} ${currentStep === 4 && arShowcaseAnalysis ? 'ar-active' : ''}`} />
          </div>

          <div className="controls">
            <button 
              className={`btn ${isPlaying ? 'btn-secondary' : 'btn-primary'}`}
              onClick={isPlaying ? stopCamera : startCamera}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="icon-loading"></span>
                  Loading...
                </>
              ) : (isPlaying ? (
                <>
                  <span className="icon-stop"></span>
                  {t('actions.stopCamera')}
                </>
              ) : (
                <>
                  <span className="icon-camera"></span>
                  {t('actions.startCamera')}
                </>
              ))}
            </button>
            
            {isPlaying && (
              <button 
                className={`btn ${isDetecting ? 'btn-danger' : 'btn-success'}`}
                onClick={isDetecting ? stopDetection : startDetection}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="icon-loading"></span>
                    Loading...
                  </>
                ) : (isDetecting ? (
                  <>
                    <span className="icon-stop"></span>
                    {t('actions.stopDetection')}
                  </>
                ) : (
                  <>
                    <span className="icon-detect"></span>
                    {t('actions.startDetection')}
                  </>
                ))}
              </button>
            )}
          </div>

          {/* ESP32 Detection Display */}
          <div className="esp32-detection-display">
                         <div className="detection-summary">
               {currentStep === 1 && (
                 <span className="detection-count-badge">
                   <span className="count-number">{detectionCount}</span>
                   <span className="count-label">{t('assembly.detectionLabel')}</span>
                 </span>
               )}
               
               {currentStep === 2 && motorWireAnalysis && (
                 <div className="motor-wire-status">
                   <span className="detection-count-badge motor-wire-connected">
                     <span className="count-number">{motorWireAnalysis.connectedCount}</span>
                     <span className="count-label">{t('assembly.motorWire.connected')}</span>
                   </span>
                   <span className="detection-count-badge motor-wire-disconnected">
                     <span className="count-number">{motorWireAnalysis.notConnectedCount}</span>
                     <span className="count-label">{t('assembly.motorWire.notConnected')}</span>
                   </span>
                 </div>
               )}
               
               {currentStep === 3 && wristStrapAnalysis && (
                 <div className="wrist-strap-status">
                   <span className={`detection-count-badge ${wristStrapAnalysis.isWearingStrap ? 'wrist-strap-detected' : 'wrist-strap-missing'}`}>
                     <span className={`strap-icon ${wristStrapAnalysis.isWearingStrap ? 'icon-wrist' : 'icon-warning'}`}></span>
                     <span className="count-label">
                       {wristStrapAnalysis.isWearingStrap ? t('assembly.wristStrap.detected') : t('assembly.wristStrap.notDetected')}
                     </span>
                   </span>
                 </div>
               )}
               
               {currentStep === 4 && arShowcaseAnalysis && (
                 <div className="ar-showcase-status">
                   <span className="detection-count-badge ar-esp32-info">
                                            <span className="ar-icon icon-ar"></span>
                     <span className="count-label">
                       {arShowcaseAnalysis.esp32Info.length} ESP32 AR Detected
                     </span>
                   </span>
                   {arShowcaseAnalysis.showcaseEffects.hologram && (
                     <span className="detection-count-badge ar-hologram">
                       <span className="hologram-icon">🎯</span>
                       <span className="count-label">{t('assembly.arShowcase.hologramActive')}</span>
                     </span>
                   )}
                   {arShowcaseAnalysis.showcaseEffects.dataStream && (
                     <span className="detection-count-badge ar-datastream">
                       <span className="stream-icon icon-motor"></span>
                       <span className="count-label">{t('assembly.arShowcase.dataStreamActive')}</span>
                     </span>
                   )}
                 </div>
               )}
             </div>
          </div>

                     {/* Assembly Progress Steps */}
           <div className="assembly-progress">
             <h3 className="progress-title">{t('assembly.progressTitle')}</h3>
                         <div className="steps-container">
               {assemblySteps.map((step, index) => {
                 const isStep1 = step.id === 1;
                 const isStep2 = step.id === 2;
                 const isStep3 = step.id === 3;
                 const isStep4 = step.id === 4;
                 const step1Complete = detectionCount >= 2;
                 const step2Complete = motorWireAnalysis?.isFullyConnected || false;
                 const step3Complete = wristStrapAnalysis?.isWearingStrap || false;
                 const step4Complete = arShowcaseAnalysis?.isActive || false;
                 
                 const isCompleted = 
                   (step.id === 1 && step1Complete) ||
                   (step.id === 2 && step2Complete) ||
                   (step.id === 3 && step3Complete) ||
                   (step.id === 4 && step4Complete) ||
                   step.id < currentStep;
                   
                 const isCurrent = step.id === currentStep;
                
                return (
                  <div key={step.id} className={`step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                    <div className="step-indicator">
                                               <span className={`step-icon ${isCompleted ? 'completed' : ''}`}>{isCompleted ? '✓' : step.id}</span>
                                             <span className={`step-icon step-icon-${step.id}`}></span>
                    </div>
                    
                    <div className="step-content">
                      <h4 className="step-title">{step.title}</h4>
                      <p className="step-description">{step.description}</p>
                      
                                                                    {isStep1 && isCurrent && (
                         <div className="step-status">
                           {detectionCount >= step.requiredCount ? (
                             <span className="status-success">
                               <span className="icon-check"></span> {t('assembly.status.step1Complete', { count: detectionCount })}
                             </span>
                           ) : (
                             <span className="status-warning">
                                ⚠️ {detectionCount === 1 ? t('assembly.status.anotherEsp32Needed') : t('assembly.status.place2Boards')}
                                {detectionCount === 1 && <span className="helper-text"> {t('assembly.status.oneMoreRequired')}</span>}
                             </span>
                           )}
                         </div>
                       )}
                       
                       {isStep2 && isCurrent && (
                         <div className="step-status">
                           {motorWireAnalysis ? (
                             motorWireAnalysis.isFullyConnected ? (
                               <span className="status-success">
                                 <span className="icon-check"></span> {t('assembly.status.step2Complete', { connected: motorWireAnalysis.connectedCount })}
                               </span>
                             ) : motorWireAnalysis.totalConnections > 0 ? (
                               <span className="status-warning">
                                 ⚠️ {t('assembly.status.partialConnection', { 
                                   connected: motorWireAnalysis.connectedCount, 
                                   total: motorWireAnalysis.totalConnections 
                                 })}
                               </span>
                             ) : (
                               <span className="status-error">
                                 ❌ {t('assembly.status.noConnections')}
                               </span>
                             )
                           ) : (
                             <span className="status-pending">
                               🔍 {t('assembly.status.detectingConnections')}
                             </span>
                           )}
                         </div>
                       )}
                       
                       {isStep3 && isCurrent && (
                         <div className="step-status">
                           {wristStrapAnalysis ? (
                             wristStrapAnalysis.isWearingStrap ? (
                               <span className="status-success">
                                 <span className="icon-check"></span> {t('assembly.status.step3Complete')}
                               </span>
                             ) : wristStrapAnalysis.status === 'checking' ? (
                               <span className="status-warning">
                                 ⚠️ {t('assembly.status.checkingWristStrap')}
                               </span>
                             ) : (
                               <span className="status-error">
                                 ❌ {t('assembly.status.noWristStrap')}
                               </span>
                             )
                           ) : (
                             <span className="status-pending">
                               🔍 {t('assembly.status.detectingWristStrap')}
                             </span>
                           )}
                         </div>
                       )}
                       
                       {isStep4 && isCurrent && (
                         <div className="step-status">
                           {arShowcaseAnalysis ? (
                             arShowcaseAnalysis.isActive ? (
                               <span className="status-success">
                                 <span className="icon icon-ar"></span> AR Showcase Active! {arShowcaseAnalysis.esp32Info.length} ESP32 Detected
                               </span>
                             ) : (
                               <span className="status-pending">
                                 <span className="icon icon-detect"></span> {t('assembly.status.scanningESP32')}
                               </span>
                             )
                           ) : (
                             <span className="status-pending">
                               <span className="icon icon-ar"></span> {t('assembly.status.loadingARShowcase')}
                             </span>
                           )}
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
                   onClick={async () => {
                     setCurrentStep(2);
                     // Switch to motor wire model for step 2
                     await mlService.switchToModel('motor_wire');
                     if (isDetecting) {
                       // Restart detection with new model
                       if (detectionIntervalRef.current) {
                         clearInterval(detectionIntervalRef.current);
                       }
                       detectionIntervalRef.current = setInterval(performDetection, 250);
                     }
                   }}
                 >
                   {t('actions.continue')} →
                 </button>
               )}
               
               {currentStep === 2 && motorWireAnalysis?.isFullyConnected && (
                 <button 
                   className="btn btn-success"
                   onClick={async () => {
                     setCurrentStep(3);
                     // Switch to hands model for step 3
                     await mlService.switchToModel('hands');
                     if (isDetecting) {
                       // Restart detection with new model
                       if (detectionIntervalRef.current) {
                         clearInterval(detectionIntervalRef.current);
                       }
                       detectionIntervalRef.current = setInterval(performDetection, 250);
                     }
                   }}
                 >
                   {t('actions.next')} →
                 </button>
               )}
               
                                      {currentStep === 3 && wristStrapAnalysis?.isWearingStrap && (
                         <button 
                           className="btn btn-success"
                           onClick={async () => {
                             setCurrentStep(4);
                             // Initialize AR showcase for step 4
                             if (!arInitialized) {
                               setIsLoading(true);
                               try {
                                 await arService.initialize();
                                 setArInitialized(true);
                               } catch (error) {
                                 console.error('AR initialization failed:', error);
                               } finally {
                                 setIsLoading(false);
                               }
                             }
                           }}
                         >
                           <span className="icon icon-ar"></span> {t('assembly.arShowcase.startShowcase')} →
                         </button>
                       )}
                       
                       {currentStep === 4 && arShowcaseAnalysis && (
                         <div className="ar-showcase-controls">
                           <button 
                             className={`btn ${arShowcaseAnalysis.isActive ? 'btn-success' : 'btn-primary'}`}
                             onClick={() => {
                               if (arShowcaseAnalysis.isActive) {
                                 // Set language for bilingual report
                                 arService.setLanguage(t('assembly.steps.step1.title') === 'ESP32 Board Detection' ? 'en' : 'ar');
                                 // Generate and display ESP32 AR report
                                 const report = arService.generateESP32Report(arShowcaseAnalysis.esp32Info);
                                 alert(report);
                               }
                             }}
                             disabled={!arShowcaseAnalysis.isActive}
                           >
                             {arShowcaseAnalysis.isActive ? (
                                               <><span className="icon-report"></span> {t('assembly.arShowcase.generateReport')}</>
              ) : (
                <><span className="icon-loading"></span> {t('assembly.arShowcase.waitingForDetection')}</>
              )}
                           </button>
                         </div>
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
                {isLoading ? (
                  <>
                    <span className="icon-loading"></span>
                    Loading...
                  </>
                ) : (isPlaying ? (
                  <>
                    <span className="icon-stop"></span>
                    {t('actions.stopCamera')}
                  </>
                ) : (
                  <>
                    <span className="icon-camera"></span>
                    {t('actions.startCamera')}
                  </>
                ))}
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