import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { DetectionResult } from '../services/mlService';
import { mlService } from '../services/mlService';
import './RealTimeDetection.css';

interface DetectionWithTimestamp extends DetectionResult {
  timestamp: number;
}

const RealTimeDetection: React.FC = () => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  // State
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detections, setDetections] = useState<DetectionWithTimestamp[]>([]);
  const [fps, setFps] = useState(0);
  const [performanceStats, setPerformanceStats] = useState({ inference: 0, total: 0 });

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      console.log('📱 Requesting camera access...');
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded');
        };
        
        videoRef.current.oncanplay = () => {
          console.log('📹 Video ready to play');
          setIsActive(true);
          startRealTimeDetection();
        };
      }

      console.log('✅ Camera started successfully');
    } catch (error) {
      console.error('❌ Camera error:', error);
    }
  }, [stream]);

  // Stop camera
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
  }, [stream]);

  // Real-time detection loop
  const startRealTimeDetection = useCallback(() => {
    const detectFrame = async () => {
      if (!isActive || !videoRef.current || !canvasRef.current || !overlayCanvasRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      const context = canvas.getContext('2d');
      const overlayContext = overlayCanvas.getContext('2d');

      if (context && overlayContext) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        overlayCanvas.width = video.videoWidth;
        overlayCanvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0);

        try {
          const startTime = performance.now();
          const result = await mlService.detectBreadboard(canvas);
          const endTime = performance.now();
          const inferenceTime = endTime - startTime;

          const detectionsWithTimestamp = result.detections.map(det => ({
            ...det,
            timestamp: Date.now()
          }));

          setDetections(detectionsWithTimestamp);
          setPerformanceStats({ 
            inference: inferenceTime, 
            total: result.processingTime 
          });
          
          drawDetectionOverlay(overlayContext, result.detections, canvas.width, canvas.height);
          setFps(Math.round(1000 / inferenceTime));
        } catch (error) {
          console.error('Detection error:', error);
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    detectFrame();
  }, [isActive]);

  // Draw detection overlay
  const drawDetectionOverlay = (
    context: CanvasRenderingContext2D,
    detections: DetectionResult[],
    width: number,
    height: number
  ) => {
    // Clear overlay
    context.clearRect(0, 0, width, height);
    
    detections.forEach((detection) => {
      const [x1, y1, x2, y2] = detection.bbox;
      
      // Simple color and icon mapping for breadboard detection
      const color = '#00d4ff';
      const icon = '🔌';
      
      // Draw bounding box
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.strokeRect(x1, y1, x2 - x1, y2 - y1);
      
      // Draw filled background for label
      const labelText = `${icon} ${detection.class} ${(detection.confidence * 100).toFixed(0)}%`;
      context.font = 'bold 16px Arial';
      const textMetrics = context.measureText(labelText);
      const labelWidth = textMetrics.width + 16;
      const labelHeight = 28;
      
      // Draw label background
      context.fillStyle = color;
      context.fillRect(x1, y1 - labelHeight, labelWidth, labelHeight);
      
      // Draw label text
      context.fillStyle = '#000000';
      context.fillText(labelText, x1 + 8, y1 - 8);
      
      // Draw confidence arc
      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;
      const radius = 30;
      const confidenceAngle = (detection.confidence * 2 * Math.PI) - Math.PI / 2;
      
      context.beginPath();
      context.arc(centerX, centerY, radius, -Math.PI / 2, confidenceAngle, false);
      context.strokeStyle = color;
      context.lineWidth = 4;
      context.stroke();
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="realtime-detection">
      <div className="detection-header">
        <h2>🔌 Real-time Breadboard Detection</h2>
        <p>AI-powered breadboard detection using your trained model</p>
        <div className="detection-controls">
          <button 
            className={`btn ${isActive ? 'btn-danger' : 'btn-primary'}`}
            onClick={isActive ? stopCamera : startCamera}
          >
            {isActive ? '⏹️ Stop Detection' : '▶️ Start Breadboard Detection'}
          </button>
        </div>
      </div>

      {/* Main Camera View */}
      <div className="camera-container">
        <div className="video-wrapper">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-feed"
          />
          
          <canvas
            ref={overlayCanvasRef}
            className="detection-overlay"
          />
          
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </div>
        
        {/* Performance HUD */}
        <div className="performance-hud">
          <div className="hud-item">
            <span className="hud-label">FPS:</span>
            <span className="hud-value">{fps}</span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Inference:</span>
            <span className="hud-value">{performanceStats.inference.toFixed(1)}ms</span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Total:</span>
            <span className="hud-value">{performanceStats.total.toFixed(1)}ms</span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Objects:</span>
            <span className="hud-value">{detections.length}</span>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="detection-panel">
        <div className="live-detections">
          <h3>🔌 Live Breadboard Detections</h3>
          <div className="detection-list">
            {detections.length > 0 ? (
              detections.map((detection, index) => (
                <div key={index} className="detection-item">
                  <span className="detection-class">🔌 {detection.class}</span>
                  <span className="detection-confidence">
                    {(detection.confidence * 100).toFixed(1)}%
                  </span>
                  <span className="detection-bbox">
                    [{detection.bbox.map(b => b.toFixed(0)).join(', ')}]
                  </span>
                </div>
              ))
            ) : (
              <div className="no-detections">
                🔌 Point camera at a breadboard to detect
              </div>
            )}
          </div>
        </div>

        <div className="statistics-panel">
          <h3>📊 Detection Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Detected:</span>
              <span className="stat-value">{detections.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Confidence:</span>
              <span className="stat-value">
                {detections.length > 0 ? 
                  ((detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length) * 100).toFixed(1) + '%' : 
                  '0%'
                }
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Current FPS:</span>
              <span className="stat-value">{fps}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Model Status:</span>
              <span className="stat-value">
                {mlService.getPerformanceStats().isBreadboardModelLoaded && mlService.getPerformanceStats().isESP32ModelLoaded ? '✅ Loaded' : '❌ Error'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDetection; 