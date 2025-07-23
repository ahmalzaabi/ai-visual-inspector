import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { TestDetection } from '../services/testDetectionService';
import { testDetectionService } from '../services/testDetectionService';
import './RealTimeDetection.css';

interface TestDetectionWithTimestamp extends TestDetection {
  timestamp: number;
}

// Common COCO-SSD object classes
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
];

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
};

const RealTimeTestDetection: React.FC = () => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  // State
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detections, setDetections] = useState<TestDetectionWithTimestamp[]>([]);
  const [fps, setFps] = useState(0);
  const [performanceStats, setPerformanceStats] = useState({ inference: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // Object selection state
  const [enabledObjects, setEnabledObjects] = useState<string[]>([
    'person', 'car', 'bicycle', 'cat', 'dog', 'bottle', 'cup', 'laptop', 'cell phone', 'book'
  ]);
  const [showAllObjects, setShowAllObjects] = useState(false);

  // Real-time detection loop
  const runDetectionLoop = useCallback(() => {
    const detectFrame = async () => {
      if (!isActive || !videoRef.current || !canvasRef.current || !overlayCanvasRef.current) {
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
          const filteredDetections = result.detections.filter(det => 
            enabledObjects.includes(det.class)
          );

          const detectionsWithTimestamp = filteredDetections.map(det => ({
            ...det,
            timestamp: Date.now()
          }));

          setDetections(detectionsWithTimestamp);
          setPerformanceStats({ 
            inference: inferenceTime, 
            total: result.processingTime 
          });
          
          drawDetectionOverlay(overlayContext, filteredDetections, canvas.width, canvas.height);
          setFps(Math.round(1000 / Math.max(inferenceTime, 16))); // Cap at 60fps
        } catch (error) {
          console.error('Detection error:', error);
        }
      }

      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(detectFrame);
      }
    };

    detectFrame();
  }, [isActive, enabledObjects]);

  // Draw detection overlay
  const drawDetectionOverlay = (
    context: CanvasRenderingContext2D,
    detections: TestDetection[],
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

  // Start camera - using the same pattern as the working App.tsx version
  const startCamera = useCallback(async () => {
    try {
      setError(null); // Clear any previous errors
      console.log('📱 Starting camera for real-time object detection...');
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported in this browser')
      }

      // Stop any existing streams first
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
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
      
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        // Enhanced video setup for mobile - same as working version
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded')
          videoRef.current?.play().catch(console.warn)
        }
        
        videoRef.current.oncanplay = () => {
          console.log('📹 Video ready to play - starting detection')
          setIsActive(true); // Start detection when video is ready
        }

        // Mobile specific adjustments
        if ('playsInline' in videoRef.current) {
          videoRef.current.playsInline = true
        }
        videoRef.current.muted = true
      }

      console.log('✅ Camera started successfully');
    } catch (error) {
      console.error('❌ Camera error:', error);
      
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
            setStream(basicStream)
            if (videoRef.current) {
              videoRef.current.srcObject = basicStream
              videoRef.current.oncanplay = () => {
                setIsActive(true);
              }
            }
            return
          } catch (fallbackError) {
            console.error('❌ Fallback camera also failed:', fallbackError);
            errorMessage = 'Camera access failed even with basic settings.'
          }
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage); // Set the error state
      console.error('❌ Final camera error:', errorMessage);
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

  // Start detection when active
  useEffect(() => {
    if (isActive) {
      runDetectionLoop();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isActive, runDetectionLoop]);

  // Toggle object selection
  const toggleObject = (objectName: string) => {
    setEnabledObjects(prev => 
      prev.includes(objectName) 
        ? prev.filter(name => name !== objectName)
        : [...prev, objectName]
    );
  };

  // Toggle all objects
  const toggleAllObjects = () => {
    if (enabledObjects.length === COCO_OBJECTS.length) {
      setEnabledObjects(['person', 'car', 'bicycle', 'cat', 'dog']); // Default selection
    } else {
      setEnabledObjects([...COCO_OBJECTS]);
    }
  };

  // Optional: Auto-start camera when component mounts (commented out for manual control)
  // useEffect(() => {
  //   console.log('🚀 RealTimeTestDetection component mounted, auto-starting camera...');
  //   startCamera();
  // }, []);  // Empty dependency array to run only on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const displayObjects = showAllObjects ? COCO_OBJECTS : COCO_OBJECTS.slice(0, 20);

  return (
    <div className="realtime-detection">
      <div className="detection-header">
        <h2>🧪 Real-time Object Detection Test</h2>
        <p>AI-powered real-time object detection using COCO-SSD (80 object types)</p>
        <div className="detection-controls">
          <button 
            className={`btn ${isActive ? 'btn-danger' : 'btn-primary'}`}
            onClick={isActive ? stopCamera : startCamera}
          >
            {isActive ? '⏹️ Stop Detection' : '▶️ Start Real-time Detection'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message" style={{ 
          margin: '20px', 
          padding: '15px', 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#ef4444'
        }}>
          <span style={{ fontSize: '1.2em', marginRight: '8px' }}>⚠️</span>
          <div style={{ display: 'inline-block' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Camera Error</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{error}</p>
            <button 
              className="btn btn-primary" 
              style={{ marginTop: '10px', padding: '8px 16px' }}
              onClick={startCamera}
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      )}

      {/* Main Camera View */}
      <div className="camera-container">
        {!stream && !error && !isActive && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'white',
            zIndex: 10
          }}>
            <div style={{ fontSize: '3em', marginBottom: '20px' }}>📷</div>
            <h3>Ready for Real-time Detection</h3>
            <p>Click "Start Real-time Detection" to begin</p>
          </div>
        )}
        
        <div className="video-wrapper">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-feed"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              background: '#000'
            }}
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
        <div className="object-selector">
          <div className="selector-header">
            <h3>🎯 Select Objects to Detect</h3>
            <div className="selector-controls">
              <button 
                className="btn btn-sm btn-secondary" 
                onClick={toggleAllObjects}
              >
                {enabledObjects.length === COCO_OBJECTS.length ? 'Reset' : 'Select All'}
              </button>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => setShowAllObjects(!showAllObjects)}
              >
                {showAllObjects ? 'Show Less' : `Show All (${COCO_OBJECTS.length})`}
              </button>
            </div>
          </div>
          
          <div className="objects-grid">
            {displayObjects.map(obj => (
              <label key={obj} className="object-toggle">
                <input
                  type="checkbox"
                  checked={enabledObjects.includes(obj)}
                  onChange={() => toggleObject(obj)}
                />
                <span 
                  className="object-name"
                  style={{ borderLeft: `4px solid ${getObjectColor(obj)}` }}
                >
                  {obj}
                </span>
                <span className="object-count">
                  {detections.filter(d => d.class === obj).length}
                </span>
              </label>
            ))}
          </div>
          
          <div className="selection-summary">
            <p>✅ {enabledObjects.length} of {COCO_OBJECTS.length} objects enabled</p>
          </div>
        </div>

        <div className="live-detections">
          <h3>🔍 Live Detections</h3>
          <div className="detection-list">
            {detections.length > 0 ? (
              detections.slice(0, 10).map((detection, index) => (
                <div key={index} className="detection-item">
                  <span 
                    className="detection-class"
                    style={{ color: getObjectColor(detection.class) }}
                  >
                    {detection.class}
                  </span>
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
                🧪 Point camera at objects to detect them in real-time
              </div>
            )}
            {detections.length > 10 && (
              <div className="more-detections">
                +{detections.length - 10} more objects detected
              </div>
            )}
          </div>
        </div>

        <div className="statistics-panel">
          <h3>📊 Detection Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Objects:</span>
              <span className="stat-value">{detections.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Unique Types:</span>
              <span className="stat-value">{new Set(detections.map(d => d.class)).size}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg Confidence:</span>
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
                {testDetectionService.getPerformanceStats().isModelLoaded ? '✅ COCO-SSD' : '❌ Error'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeTestDetection;