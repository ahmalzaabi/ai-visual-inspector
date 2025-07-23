import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { DetectionResult } from '../services/mlService';
import { mlService } from '../services/mlService';
import './RealTimeDetection.css';

interface DetectionWithTimestamp extends DetectionResult {
  timestamp: number;
}

interface PerformanceMetrics {
  fps: number;
  inferenceTime: number;
  memoryUsage: string;
  isHealthy: boolean;
}

const RealTimeDetection: React.FC = () => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastInferenceRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  
  // State
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detections, setDetections] = useState<DetectionWithTimestamp[]>([]);
  const [perfMetrics, setPerfMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    inferenceTime: 0,
    memoryUsage: '0MB',
    isHealthy: true
  });

  // Mobile optimization settings
  const INFERENCE_THROTTLE_MS = 500; // Run inference every 500ms for mobile
  const MAX_DETECTIONS_DISPLAY = 10; // Limit displayed detections
  const CANVAS_MAX_WIDTH = 640; // Limit canvas size for memory
  const CANVAS_MAX_HEIGHT = 480;

  // Start camera with mobile optimizations
  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Mobile-optimized camera settings
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = () => {
          // Adjust canvas size for mobile
          if (canvasRef.current && overlayCanvasRef.current) {
            const video = videoRef.current!;
            const aspectRatio = video.videoWidth / video.videoHeight;
            
            let canvasWidth = Math.min(video.videoWidth, CANVAS_MAX_WIDTH);
            let canvasHeight = Math.min(video.videoHeight, CANVAS_MAX_HEIGHT);
            
            // Maintain aspect ratio
            if (canvasWidth / canvasHeight !== aspectRatio) {
              if (canvasWidth / aspectRatio <= CANVAS_MAX_HEIGHT) {
                canvasHeight = canvasWidth / aspectRatio;
              } else {
                canvasWidth = canvasHeight * aspectRatio;
              }
            }
            
            canvasRef.current.width = canvasWidth;
            canvasRef.current.height = canvasHeight;
            overlayCanvasRef.current.width = canvasWidth;
            overlayCanvasRef.current.height = canvasHeight;
          }
        };
        
        videoRef.current.oncanplay = () => {
          setIsActive(true);
          startRealTimeDetection();
        };
      }

    } catch (error) {
      console.error('❌ Camera error:', error);
    }
  }, [stream]);

  // Stop camera and cleanup
  const stopCamera = useCallback(() => {
    setIsActive(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setDetections([]);
    
    // Cleanup ML service
    mlService.dispose();
  }, [stream]);

  // Throttled real-time detection loop optimized for mobile
  const startRealTimeDetection = useCallback(() => {
    let lastFpsUpdate = performance.now();
    let frameCount = 0;

    const detectFrame = async () => {
      if (!isActive || !videoRef.current || !canvasRef.current || !overlayCanvasRef.current) {
        return;
      }

      const now = performance.now();
      frameCount++;
      frameCountRef.current++;

      // Update FPS every second
      if (now - lastFpsUpdate >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
        setPerfMetrics(prev => ({ ...prev, fps: currentFps }));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      // Throttle inference for mobile performance
      const shouldRunInference = (now - lastInferenceRef.current) >= INFERENCE_THROTTLE_MS;

      if (shouldRunInference) {
        lastInferenceRef.current = now;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        const context = canvas.getContext('2d');
        const overlayContext = overlayCanvas.getContext('2d');

        if (context && overlayContext) {
          // Draw video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          try {
            const startTime = performance.now();
            
            // Run ESP32 detection
            const result = await mlService.detectESP32(canvas);
            
            const endTime = performance.now();
            const inferenceTime = endTime - startTime;

            // Limit number of detections for performance
            const limitedDetections = result.detections.slice(0, MAX_DETECTIONS_DISPLAY);
            
            const detectionsWithTimestamp = limitedDetections.map(det => ({
              ...det,
              timestamp: Date.now()
            }));

            setDetections(detectionsWithTimestamp);
            
            // Update performance metrics
            const perfStats = mlService.getPerformanceStats();
            setPerfMetrics(prev => ({
              ...prev,
              inferenceTime: Math.round(inferenceTime),
              memoryUsage: perfStats.memory.memoryMB + 'MB',
              isHealthy: perfStats.memory.isHealthy
            }));
            
            drawDetectionOverlay(overlayContext, limitedDetections, canvas.width, canvas.height);
            
          } catch (error) {
            console.error('❌ Detection error:', error);
            setPerfMetrics(prev => ({ ...prev, isHealthy: false }));
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    detectFrame();
  }, [isActive]);

  // Optimized detection overlay drawing
  const drawDetectionOverlay = (
    context: CanvasRenderingContext2D,
    detections: DetectionResult[],
    width: number,
    height: number
  ) => {
    // Clear overlay
    context.clearRect(0, 0, width, height);
    
    detections.forEach((detection, index) => {
      const [x1, y1, x2, y2] = detection.bbox;
      
      // ESP32 styling
      const color = '#ff6b35';
      const icon = '🔧';
      
      // Draw bounding box
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.strokeRect(x1, y1, x2 - x1, y2 - y1);
      
      // Draw confidence badge
      const confidence = Math.round(detection.confidence * 100);
      const labelText = `${icon} ESP32 ${confidence}%`;
      
      context.font = 'bold 14px Arial';
      const textMetrics = context.measureText(labelText);
      const labelWidth = textMetrics.width + 12;
      const labelHeight = 22;
      
      // Draw label background
      context.fillStyle = color;
      context.fillRect(x1, y1 - labelHeight, labelWidth, labelHeight);
      
      // Draw label text
      context.fillStyle = '#ffffff';
      context.fillText(labelText, x1 + 6, y1 - 6);
      
      // Draw detection number for multiple objects
      if (detections.length > 1) {
        context.fillStyle = color;
        context.fillRect(x2 - 25, y1, 25, 25);
        context.fillStyle = '#ffffff';
        context.font = 'bold 12px Arial';
        context.fillText((index + 1).toString(), x2 - 18, y1 + 16);
      }
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Performance monitoring effect
  useEffect(() => {
    const interval = setInterval(() => {
      const stats = mlService.getPerformanceStats();
      if (!perfMetrics.isHealthy && stats.memory.isHealthy) {
        setPerfMetrics(prev => ({ ...prev, isHealthy: true }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [perfMetrics.isHealthy]);

  return (
    <div className="realtime-detection">
      <div className="detection-header">
        <h2>🔧 ESP32 Real-time Detection</h2>
        <p>Optimized for iPhone PWA performance</p>
        
        <div className="detection-controls">
          <button 
            className={`btn ${isActive ? 'btn-danger' : 'btn-primary'}`}
            onClick={isActive ? stopCamera : startCamera}
          >
            {isActive ? '⏹️ Stop Detection' : '▶️ Start ESP32 Detection'}
          </button>
        </div>
      </div>

      {/* Performance HUD */}
      <div className="performance-hud">
        <div className={`performance-indicator ${perfMetrics.isHealthy ? 'healthy' : 'warning'}`}>
          <span>📊 {perfMetrics.fps}fps</span>
          <span>⚡ {perfMetrics.inferenceTime}ms</span>
          <span>💾 {perfMetrics.memoryUsage}</span>
          <span className={`health-status ${perfMetrics.isHealthy ? 'healthy' : 'warning'}`}>
            {perfMetrics.isHealthy ? '✅' : '⚠️'}
          </span>
        </div>
      </div>

      {/* Detection Count */}
      {detections.length > 0 && (
        <div className="detection-summary">
          <div className="detection-count">
            Found: <strong>{detections.length}</strong> ESP32 board(s)
          </div>
        </div>
      )}

      {/* Camera Feed */}
      <div className="camera-container">
        <div className="video-wrapper">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            style={{ 
              width: '100%', 
              height: 'auto',
              maxWidth: `${CANVAS_MAX_WIDTH}px`,
              maxHeight: `${CANVAS_MAX_HEIGHT}px`
            }}
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

      {/* Detection List for Mobile */}
      {detections.length > 0 && (
        <div className="detection-list-mobile">
          <h3>Detected ESP32 Boards:</h3>
          {detections.slice(0, 5).map((detection, index) => (
            <div key={index} className="detection-item">
              <span className="detection-icon">🔧</span>
              <span className="detection-info">
                ESP32 - {Math.round(detection.confidence * 100)}%
              </span>
            </div>
          ))}
          {detections.length > 5 && (
            <div className="detection-more">
              +{detections.length - 5} more ESP32 boards detected
            </div>
          )}
        </div>
      )}

      {/* Mobile Optimization Info */}
      <div className="mobile-info">
        <small>
          🚀 Mobile optimized: {INFERENCE_THROTTLE_MS}ms throttle, 
          {CANVAS_MAX_WIDTH}x{CANVAS_MAX_HEIGHT} max resolution
        </small>
      </div>
    </div>
  );
};

export default RealTimeDetection; 