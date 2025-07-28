import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { mlService } from '../services/mlService';
import type { MotorWireAnalysis, WristStrapAnalysis } from '../services/mlService';
import { arService } from '../services/arService';
import type { ARShowcaseAnalysis } from '../services/arService';
import FeatureCard from './FeatureCard';

// SVG Icon Components
const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const StopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="6" y="6" width="12" height="12" rx="2"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5,3 19,12 5,21"/>
  </svg>
);

const LoadingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
    <path d="M21 12a9 9 0 11-6.219-8.56"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
  </svg>
);

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);

interface FeaturesPageProps {
  onBack: () => void;
}



interface ReportData {
  title: string;
  id: string;
  timestamp: string;
  sections: {
    title: string;
    data: Array<{label: string; value: string}>;
  }[];
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
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // iPhone PWA performance optimization states
  const [frameSkipCount, setFrameSkipCount] = useState(0);
  const [avgInferenceTime, setAvgInferenceTime] = useState(0);
  const performanceBuffer = useRef<number[]>([]);
  
  // "Every 3 frames" optimization with stable tracking
  const [frameCount, setFrameCount] = useState(0);
  const detectionBuffer = useRef<any[]>([]); // Keep last 3 detections for stability
  const stableDetections = useRef<any[]>([]); // Stable tracking boxes
  
  // AR Detection stability (Step 4) - simplified
  const stableARDetections = useRef<any>(null); // Current AR analysis

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
      icon: "connection"
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
    
    // SUPER ROBUST: Canvas clearing to completely remove tracking boxes
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const canvas = canvasRef.current;
        
        // Method 1: Standard clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Method 2: Reset all canvas properties
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        // Method 3: Force complete canvas reset
        const parent = canvas.parentNode;
        const nextSibling = canvas.nextSibling;
        if (parent) {
          parent.removeChild(canvas);
          parent.insertBefore(canvas, nextSibling);
        }
        
        // Method 4: iPhone PWA specific clearing
        const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                        (window.navigator as any).standalone === true;
        if (isIOSPWA) {
          // Force complete refresh by recreating canvas context
          const tempWidth = canvas.width;
          const tempHeight = canvas.height;
          canvas.width = 1;
          canvas.height = 1;
          setTimeout(() => {
            canvas.width = tempWidth;
            canvas.height = tempHeight;
          }, 10);
        }
      }
    }
    
    // Reset detection states and buffers
    setDetectionCount(0);
    setMotorWireAnalysis(null);
    setWristStrapAnalysis(null);
    setArShowcaseAnalysis(null);
    
    // Reset "every 3 frames" optimization buffers
    setFrameCount(0);
    detectionBuffer.current = [];
    stableDetections.current = [];
    
    // Reset AR detection state
    stableARDetections.current = null;
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
      
      // Label with app theme styling - FIXED positioning to stay within canvas bounds
      const label = `ESP32 ${(confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const labelMetrics = ctx.measureText(label);
      const labelWidth = labelMetrics.width + 12;
      const labelHeight = 24;
      
      // Smart label positioning - ensure it stays within canvas bounds
      const canvasWidth = ctx.canvas.width;
      const canvasHeight = ctx.canvas.height;
      
      let labelX = x;
      let labelY = y > labelHeight ? y - labelHeight : y + height;
      
      // Prevent label from going off right edge
      if (labelX + labelWidth > canvasWidth) {
        labelX = canvasWidth - labelWidth - 5;
      }
      
      // Prevent label from going off bottom edge
      if (labelY + labelHeight > canvasHeight) {
        labelY = y - labelHeight - 5;
      }
      
      // Final fallback - place inside box if still off screen
      if (labelY < 0) {
        labelY = y + 5;
      }
      
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

  // STABLE AR: AR Technology Showcase with stable tracking (Step 4)
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

      // OPTIMIZED: Only resize canvas if dimensions actually changed
      const videoRect = video.getBoundingClientRect();
      const needsResize = canvas.width !== video.videoWidth || canvas.height !== video.videoHeight;
      
      if (needsResize) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.style.width = videoRect.width + 'px';
      canvas.style.height = videoRect.height + 'px';
        console.log('📐 AR Canvas resized to:', video.videoWidth, 'x', video.videoHeight);
      }

      // CRITICAL: Clear canvas first to prevent AR duplication
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get ESP32 detections for AR overlay
      console.log('🔍 Running AR detection...');
      const esp32Analysis = await mlService.detectESP32(canvas, video);
      
      // Add ESP32 detections to buffer for stability (but don't run AR yet)
      detectionBuffer.current.push(esp32Analysis.detections);
      if (detectionBuffer.current.length > 3) {
        detectionBuffer.current.shift();
      }
      
      // Get stable ESP32 detections
      const stableESP32Detections = mergeDetectionsForStability(detectionBuffer.current);
      
      // Run AR Technology Showcase ONCE with stable detections
      const arAnalysis = await arService.detectAndOverlay(canvas, video, stableESP32Detections);
      
      console.log('📊 AR analysis result:', {
        detections: arAnalysis.detections.length,
        esp32Count: arAnalysis.esp32Info.length,
        effects: arAnalysis.showcaseEffects
      });
      
      // Store final AR analysis (no need for AR buffering - AR service handles its own stability)
      stableARDetections.current = arAnalysis;
      setArShowcaseAnalysis(arAnalysis);
      setDetectionCount(stableESP32Detections.length);

      console.log('✅ AR overlay drawn once with stable ESP32 detections');

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

  // STABLE TRACKING: ESP32 Detection with buffering to prevent blinking
  const performESP32DetectionWithStability = async () => {
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

      // OPTIMIZED: Only resize canvas if dimensions actually changed
      const videoRect = video.getBoundingClientRect();
      const needsResize = canvas.width !== video.videoWidth || canvas.height !== video.videoHeight;
      
      if (needsResize) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.style.width = videoRect.width + 'px';
      canvas.style.height = videoRect.height + 'px';
        console.log('📐 Canvas resized to:', video.videoWidth, 'x', video.videoHeight);
      }

      // Run ESP32 detection
      console.log('🔍 Running ESP32 detection...');
      const analysis = await mlService.detectESP32(canvas, video);
      console.log('📊 ESP32 analysis result:', {
        detections: analysis.detections.length,
        confidenceScores: analysis.detections.map(d => d.confidence.toFixed(2)),
        status: analysis.status
      });
      
      // Add to detection buffer for stability
      detectionBuffer.current.push(analysis.detections);
      if (detectionBuffer.current.length > 3) {
        detectionBuffer.current.shift(); // Keep only last 3 detections
      }
      
      // Create stable detections by merging recent detections
      const mergedDetections = mergeDetectionsForStability(detectionBuffer.current);
      stableDetections.current = mergedDetections;
      
      console.log('📦 Merged detections for stability:', mergedDetections.length);
      setDetectionCount(mergedDetections.length);

      // Clear and draw stable tracking boxes
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (mergedDetections.length > 0) {
        ctx.save();
        drawDetections(ctx, mergedDetections);
        ctx.restore();
      }

    } catch (err) {
      console.error('❌ ESP32 detection failed:', err);
      setDetectionCount(0);
    }
  };

  // Helper function to merge detections for stability
  const mergeDetectionsForStability = (detectionHistory: any[][]): any[] => {
    if (detectionHistory.length === 0) return [];
    
    // Use the most recent detection as base, but smooth confidence scores
    const latestDetections = detectionHistory[detectionHistory.length - 1] || [];
    
    // If we have history, smooth the confidence scores
    if (detectionHistory.length > 1) {
      return latestDetections.map(detection => ({
        ...detection,
        confidence: Math.min(detection.confidence + 0.05, 1.0) // Slightly boost confidence for stability
      }));
    }
    
    return latestDetections;
  };



  // OPTIMIZED: "Every 3 frames" detection with stable tracking
  const performDetection = async () => {
    const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                    (window.navigator as any).standalone === true;
    
    // Increment frame counter
    const currentFrame = frameCount + 1;
    setFrameCount(currentFrame);
    
    // "Every 3 frames" optimization - but always run first 3 frames to populate buffer
    const shouldRunInference = currentFrame <= 3 || currentFrame % 3 === 0;
    
          if (!shouldRunInference) {
        // Use stable detections from buffer - no inference, just redraw
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            
            if (currentStep === 1 && stableDetections.current.length > 0) {
              // Redraw stable ESP32 detections
              drawDetections(ctx, stableDetections.current);
            } else if (currentStep === 4) {
              // AR step: Don't redraw cached frames - AR handles its own animations
              console.log('📹 AR: Skipping cached frame - AR animations continue naturally');
            }
          }
        }
        console.log(`📹 Frame ${currentFrame}: Using cached detections (every 3 frames optimization)`);
        return;
      }
    
    console.log(`🔍 Frame ${currentFrame}: Running inference (every 3rd frame)`);
    
    // iPhone PWA intelligent frame skipping for performance
    if (isIOSPWA && avgInferenceTime > 150 && frameSkipCount < 2) {
      setFrameSkipCount(prev => prev + 1);
      console.log(`⏭️ Frame skip ${frameSkipCount + 1}/2 - iPhone performance optimization`);
      return;
    }
    
    // Extra iPhone optimization: Skip frames if device is struggling
    if (isIOSPWA && avgInferenceTime > 300) {
      console.log('📱 iPhone struggling - increasing frame skip for stability');
      setFrameSkipCount(prev => prev + 1);
      return;
    }
    
    // Reset frame skip counter
    setFrameSkipCount(0);
    
    const startTime = performance.now();
    
    try {
    if (currentStep === 1) {
        await performESP32DetectionWithStability();
    } else if (currentStep === 2) {
      await performMotorWireDetection();
    } else if (currentStep === 3) {
      await performWristStrapDetection();
    } else if (currentStep === 4) {
      await performARShowcase();
      }
      
      // Track inference performance for adaptive optimization
      const inferenceTime = performance.now() - startTime;
      
      // Update rolling average (keep last 10 measurements)
      performanceBuffer.current.push(inferenceTime);
      if (performanceBuffer.current.length > 10) {
        performanceBuffer.current.shift();
      }
      
      const newAvg = performanceBuffer.current.reduce((a, b) => a + b, 0) / performanceBuffer.current.length;
      setAvgInferenceTime(newAvg);
      
    } catch (error) {
      console.error('❌ Detection failed:', error);
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
      
      // OPTIMIZED: Adaptive detection interval based on device capabilities
      const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                      (window.navigator as any).standalone === true;
      
      // OPTIMIZED: Fast visual updates with "every 3 frames" inference
      const detectionInterval = isIOSPWA ? 200 : 150; // 5 FPS visual on iPhone, ~7 FPS on desktop
      console.log(`📱 Detection interval: ${detectionInterval}ms (${1000/detectionInterval} FPS visual) - Every 3rd frame runs inference`);
      
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

  const generateReport = async () => {
    if (!arShowcaseAnalysis) {
      alert('No AR showcase analysis data available.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const report = arService.generateESP32Report(arShowcaseAnalysis.esp32Info);
      setReportData(report);
      setShowReport(true);
      console.log('Report generated successfully.');
    } catch (err) {
      setError('Failed to generate report.');
      console.error('Report generation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const closeReport = () => {
    setShowReport(false);
    setReportData(null);
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
              {t('features.assembly')}
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
                  <LoadingIcon />
                  Loading...
                </>
              ) : (isPlaying ? (
                <>
                  <StopIcon />
                  {t('actions.stopCamera')}
                </>
              ) : (
                <>
                  <CameraIcon />
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
                    <LoadingIcon />
                    Loading...
                  </>
                ) : (isDetecting ? (
                  <>
                    <StopIcon />
                    {t('actions.stopDetection')}
                  </>
                ) : (
                  <>
                    <PlayIcon />
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
                     {wristStrapAnalysis.isWearingStrap ? <CheckIcon /> : <WarningIcon />}
                     <span className="count-label">
                       {wristStrapAnalysis.isWearingStrap ? t('assembly.wristStrap.detected') : t('assembly.wristStrap.notDetected')}
                     </span>
                   </span>
                 </div>
               )}
               
               {currentStep === 4 && arShowcaseAnalysis && (
                 <div className="ar-showcase-status">
                   <span className="detection-count-badge ar-esp32-info">
                     <CheckIcon />
                     <span className="count-label">
                       {arShowcaseAnalysis.esp32Info.length} ESP32 AR Detected
                     </span>
                   </span>
                   {arShowcaseAnalysis.showcaseEffects.hologram && (
                     <span className="detection-count-badge ar-hologram">
                       <PlayIcon />
                       <span className="count-label">{t('assembly.arShowcase.hologramActive')}</span>
                     </span>
                   )}
                   {arShowcaseAnalysis.showcaseEffects.dataStream && (
                     <span className="detection-count-badge ar-datastream">
                       <SearchIcon />
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
                      <span className={`step-icon ${isCompleted ? 'completed' : ''}`}>
                        {isCompleted ? <CheckIcon /> : step.id}
                      </span>
                    </div>
                    
                    <div className="step-content">
                      <h4 className="step-title">{step.title}</h4>
                      <p className="step-description">{step.description}</p>
                      
                                                                    {isStep1 && isCurrent && (
                         <div className="step-status">
                           {detectionCount >= step.requiredCount ? (
                             <span className="status-success">
                               <CheckIcon /> {t('assembly.status.step1Complete', { count: detectionCount })}
                             </span>
                           ) : (
                             <span className="status-warning">
                                <WarningIcon /> {detectionCount === 1 ? t('assembly.status.anotherEsp32Needed') : t('assembly.status.place2Boards')}
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
                                 <CheckIcon /> {t('assembly.status.step2Complete', { connected: motorWireAnalysis.connectedCount })}
                               </span>
                             ) : motorWireAnalysis.totalConnections > 0 ? (
                               <span className="status-warning">
                                 <WarningIcon /> {t('assembly.status.partialConnection', { 
                                   connected: motorWireAnalysis.connectedCount, 
                                   total: motorWireAnalysis.totalConnections 
                                 })}
                               </span>
                             ) : (
                               <span className="status-error">
                                 <ErrorIcon /> {t('assembly.status.noConnections')}
                               </span>
                             )
                           ) : (
                             <span className="status-pending">
                               <SearchIcon /> {t('assembly.status.detectingConnections')}
                             </span>
                           )}
                         </div>
                       )}
                       
                       {isStep3 && isCurrent && (
                         <div className="step-status">
                           {wristStrapAnalysis ? (
                             wristStrapAnalysis.isWearingStrap ? (
                               <span className="status-success">
                                 <CheckIcon /> {t('assembly.status.step3Complete')}
                               </span>
                             ) : wristStrapAnalysis.status === 'checking' ? (
                               <span className="status-warning">
                                 <SearchIcon /> {t('assembly.status.checkingWristStrap')}
                               </span>
                             ) : (
                               <span className="status-error">
                                 <ErrorIcon /> {t('assembly.status.noWristStrap')}
                               </span>
                             )
                           ) : (
                             <span className="status-pending">
                               <SearchIcon /> {t('assembly.status.detectingWristStrap')}
                             </span>
                           )}
                         </div>
                       )}
                       
                       {isStep4 && isCurrent && (
                         <div className="step-status">
                           {arShowcaseAnalysis ? (
                             arShowcaseAnalysis.isActive ? (
                               <span className="status-success">
                                 <CheckIcon /> AR Showcase Active! {arShowcaseAnalysis.esp32Info.length} ESP32 Detected
                               </span>
                             ) : (
                               <span className="status-pending">
                                 <SearchIcon /> {t('assembly.status.scanningESP32')}
                               </span>
                             )
                           ) : (
                             <span className="status-pending">
                               <LoadingIcon /> {t('assembly.status.loadingARShowcase')}
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
                           <PlayIcon /> {t('assembly.arShowcase.startShowcase')} →
                         </button>
                       )}
                       
                       {currentStep === 4 && arShowcaseAnalysis && (
                         <div className="ar-showcase-controls">
                           <button 
                             className={`btn ${arShowcaseAnalysis.isActive ? 'btn-success' : 'btn-primary'}`}
                             onClick={generateReport}
                             disabled={isLoading}
                           >
                             {isLoading ? (
                               <><LoadingIcon /> {t('assembly.arShowcase.generatingReport')}</>
                             ) : (
                               <><CheckIcon /> {t('assembly.arShowcase.generateReport')}</>
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
                     {t('assembly.completion.allStepsComplete')}
                   </button>
                 </div>
               )}
            </div>
          </div>

          {error && (
            <div className="error-message">
              <ErrorIcon />
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
                    <LoadingIcon />
                    Loading...
                  </>
                ) : (isPlaying ? (
                  <>
                    <StopIcon />
                    {t('actions.stopCamera')}
                  </>
                ) : (
                  <>
                    <CameraIcon />
                    {t('actions.startCamera')}
                  </>
                ))}
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      )}

      {showReport && reportData && (
        <div className="report-modal-overlay">
          <div className="assembly-report">
            <div className="report-header">
              <div>
                <h2 className="report-title">{reportData.title}</h2>
                <span className="report-id">ID: {reportData.id}</span>
              </div>
              <button className="btn btn-secondary" onClick={closeReport}>
                <ErrorIcon /> Close
              </button>
            </div>
            
            {reportData.sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="report-section">
                <h4>{section.title}</h4>
                <div className="report-data">
                  {section.data.map((item, itemIndex) => (
                    <div key={itemIndex} className="report-item">
                      <div className="report-label">{item.label}</div>
                      <div className="report-value">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="report-section">
              <h4>Report Information</h4>
              <div className="report-data">
                <div className="report-item">
                  <div className="report-label">Generated On</div>
                  <div className="report-value">{reportData.timestamp}</div>
                </div>
                <div className="report-item">
                  <div className="report-label">Report Status</div>
                  <div className="report-value">{t('assembly.completion.reportGenerated')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturesPage; 