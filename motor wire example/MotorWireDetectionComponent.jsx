import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MotorWireDetector } from './MotorWireDetector';
import './MotorWireDetection.css';

const MotorWireDetectionComponent = () => {
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
            setModelStatus('Loading motor wire connection model...');
            const detectorInstance = new MotorWireDetector();
            
            // Wait for model to load
            const loaded = await detectorInstance.loadModel();
            
            if (loaded) {
                setDetector(detectorInstance);
                setIsModelLoaded(true);
                setModelStatus('Motor wire analyzer ready! ⚡');
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
                const results = await detector.detectConnections(img, canvas.width, canvas.height);
                
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
                    const results = await detector.detectConnections(video, canvas.width, canvas.height);
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
    
    // Calculate connection summary
    const connectedCount = detections.filter(d => d.isConnected).length;
    const notConnectedCount = detections.filter(d => !d.isConnected).length;
    
    return (
        <div className="motor-wire-detector">
            <div className="detector-header">
                <h2>⚡ Motor Wire Connection Analyzer</h2>
                <p>Verify motor wire connections - check if wires are properly connected or disconnected</p>
            </div>
            
            <div className="detector-content">
                <div className="controls-panel">
                    <div className="control-group">
                        <h3>📁 Upload Motor Image</h3>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="file-input"
                            disabled={!isModelLoaded || isProcessing}
                        />
                        <label htmlFor="file-upload" className="file-label">
                            {isProcessing ? 'Processing...' : 'Choose Motor/Wire Image'}
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
                            <p><strong>Model:</strong> Motor Wire Status Analyzer</p>
                            <p><strong>Classes:</strong> Connected • Not Connected</p>
                            <p><strong>Input Size:</strong> 416x416</p>
                            <p><strong>Purpose:</strong> Verify wire connections</p>
                        </div>
                    </div>
                    
                    <div className="connection-guide">
                        <h3>🔧 Connection Status Guide</h3>
                        <div className="status-indicators">
                            <div className="indicator connected">
                                <span className="indicator-dot"></span>
                                <span>Connected - Wire properly attached</span>
                            </div>
                            <div className="indicator not-connected">
                                <span className="indicator-dot"></span>
                                <span>Not Connected - Wire loose/detached</span>
                            </div>
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
                        <h3>⚡ Connection Analysis Results</h3>
                        <div className="results-content">
                            {detections.length === 0 ? (
                                <p>Upload a motor/wire image or start camera to analyze connection status</p>
                            ) : (
                                <>
                                    <p><strong>Found {detections.length} connection(s):</strong></p>
                                    <p>
                                        <span className="indicator connected">
                                            <span className="indicator-dot"></span>
                                            Connected: {connectedCount}
                                        </span> • 
                                        <span className="indicator not-connected">
                                            <span className="indicator-dot"></span>
                                            Not Connected: {notConnectedCount}
                                        </span>
                                    </p>
                                    <br />
                                    {detections.map((detection, index) => {
                                        const confidence = (detection.confidence * 100).toFixed(1);
                                        const centerX = Math.round((detection.x1 + detection.x2) / 2);
                                        const centerY = Math.round((detection.y1 + detection.y2) / 2);
                                        const statusClass = detection.isConnected ? 'connected' : 'not-connected';
                                        const statusText = detection.isConnected ? 'Properly Connected' : 'Not Connected';
                                        
                                        return (
                                            <div key={index} className={`connection-result ${statusClass}`}>
                                                <strong>Connection {index + 1}:</strong> {statusText}
                                                <span className={`confidence ${statusClass}`}>{confidence}%</span>
                                                <br />
                                                <small>
                                                    Center: <span className="coordinates">({centerX}, {centerY})</span>
                                                </small>
                                                <br />
                                                <small>
                                                    Area: <span className="coordinates">
                                                        ({Math.round(detection.x1)}, {Math.round(detection.y1)}) to 
                                                        ({Math.round(detection.x2)}, {Math.round(detection.y2)})
                                                    </span>
                                                </small>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MotorWireDetectionComponent; 