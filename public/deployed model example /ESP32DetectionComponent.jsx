import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ESP32Detector } from './ESP32Detector';
import './ESP32Detection.css'; // You'll create this CSS file

const ESP32DetectionComponent = () => {
    const [detector, setDetector] = useState(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [detections, setDetections] = useState([]);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [stream, setStream] = useState(null);
    const [modelStatus, setModelStatus] = useState('Loading model...');
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const fileInputRef = useRef(null);
    
    // Initialize detector on component mount
    useEffect(() => {
        const initDetector = async () => {
            setModelStatus('Loading ESP32 detection model...');
            const detectorInstance = new ESP32Detector();
            
            // Wait for model to load
            const loaded = await detectorInstance.loadModel();
            
            if (loaded) {
                setDetector(detectorInstance);
                setIsModelLoaded(true);
                setModelStatus('Model ready! 🚀');
            } else {
                setModelStatus('Error loading model ❌');
            }
        };
        
        initDetector();
    }, []);
    
    // Handle file upload
    const handleFileUpload = useCallback(async (event) => {
        const file = event.target.files[0];
        if (!file || !detector || !isModelLoaded) return;
        
        setIsProcessing(true);
        
        const img = new Image();
        img.onload = async () => {
            try {
                // Set canvas size
                const canvas = canvasRef.current;
                const overlay = overlayRef.current;
                
                const aspectRatio = img.width / img.height;
                const maxSize = 500;
                
                if (aspectRatio > 1) {
                    canvas.width = maxSize;
                    canvas.height = maxSize / aspectRatio;
                } else {
                    canvas.width = maxSize * aspectRatio;
                    canvas.height = maxSize;
                }
                
                overlay.width = canvas.width;
                overlay.height = canvas.height;
                
                // Draw image on canvas
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Run detection
                const results = await detector.detectObjects(img, canvas.width, canvas.height);
                
                // Draw detections
                detector.drawDetections(overlay, results);
                
                setDetections(results);
                
            } catch (error) {
                console.error('Detection error:', error);
            } finally {
                setIsProcessing(false);
            }
        };
        
        img.src = URL.createObjectURL(file);
    }, [detector, isModelLoaded]);
    
    // Start camera
    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 640, facingMode: 'environment' }
            });
            
            setStream(mediaStream);
            setIsCameraActive(true);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }
            
            // Start continuous detection
            startContinuousDetection(mediaStream);
            
        } catch (error) {
            console.error('Camera error:', error);
            alert('Camera access denied. Please check permissions.');
        }
    }, []);
    
    // Stop camera
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraActive(false);
    }, [stream]);
    
    // Continuous detection for camera
    const startContinuousDetection = useCallback((mediaStream) => {
        const detectFrame = async () => {
            if (!mediaStream || !detector || !isModelLoaded || isProcessing) {
                if (mediaStream) {
                    requestAnimationFrame(detectFrame);
                }
                return;
            }
            
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const overlay = overlayRef.current;
            
            if (video && canvas && overlay && video.readyState === 4) {
                // Set canvas size to match video
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                overlay.width = canvas.width;
                overlay.height = canvas.height;
                
                // Draw video frame
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Run detection
                try {
                    const results = await detector.detectObjects(video, canvas.width, canvas.height);
                    detector.drawDetections(overlay, results);
                    setDetections(results);
                } catch (error) {
                    console.error('Detection error:', error);
                }
            }
            
            if (mediaStream) {
                requestAnimationFrame(detectFrame);
            }
        };
        
        detectFrame();
    }, [detector, isModelLoaded, isProcessing]);
    
    return (
        <div className="esp32-detector">
            <div className="detector-header">
                <h2>🔍 ESP32 Object Detection</h2>
                <p>Upload an image or use your camera to detect ESP32 boards</p>
            </div>
            
            <div className="detector-content">
                <div className="controls-panel">
                    <div className="control-group">
                        <h3>📁 Upload Image</h3>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="file-input"
                            disabled={!isModelLoaded || isProcessing}
                        />
                        <label htmlFor="file-upload" className="file-label">
                            {isProcessing ? 'Processing...' : 'Choose Image'}
                        </label>
                    </div>
                    
                    <div className="control-group">
                        <h3>📹 Camera</h3>
                        <button
                            onClick={startCamera}
                            disabled={!isModelLoaded || isCameraActive}
                            className="camera-btn"
                        >
                            Start Camera
                        </button>
                        <button
                            onClick={stopCamera}
                            disabled={!isCameraActive}
                            className="camera-btn"
                        >
                            Stop Camera
                        </button>
                    </div>
                    
                    <div className="model-status">
                        <h3>🤖 Model Status</h3>
                        <div className={`status ${isModelLoaded ? 'ready' : 'loading'}`}>
                            {modelStatus}
                        </div>
                        <div className="model-details">
                            <p><strong>Model:</strong> YOLOv8 Detection</p>
                            <p><strong>Target:</strong> ESP32 Boards</p>
                            <p><strong>Input Size:</strong> 640x640</p>
                        </div>
                    </div>
                </div>
                
                <div className="detection-panel">
                    <div className="canvas-container">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{ display: isCameraActive ? 'block' : 'none' }}
                        />
                        <canvas ref={canvasRef} />
                        <canvas ref={overlayRef} className="overlay" />
                    </div>
                    
                    <div className="results">
                        <h3>🎯 Detection Results</h3>
                        <div className="results-content">
                            {detections.length === 0 ? (
                                <p>No ESP32 boards detected</p>
                            ) : (
                                <>
                                    <p><strong>Found {detections.length} ESP32 board(s):</strong></p>
                                    {detections.map((detection, index) => (
                                        <div key={index} className="detection-item">
                                            <strong>Detection {index + 1}:</strong> {detection.className}
                                            <span className="confidence">
                                                {(detection.confidence * 100).toFixed(1)}%
                                            </span>
                                            <br />
                                            <small>
                                                Position: ({Math.round(detection.x1)}, {Math.round(detection.y1)}) to 
                                                ({Math.round(detection.x2)}, {Math.round(detection.y2)})
                                            </small>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ESP32DetectionComponent; 