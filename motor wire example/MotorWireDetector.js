import * as tf from '@tensorflow/tfjs';

export class MotorWireDetector {
    constructor() {
        this.model = null;
        this.isModelLoaded = false;
        this.isProcessing = false;
        
        // Model configuration
        this.inputSize = 416; // Different input size for motor wire model
        this.classNames = ['connected', 'not_connected'];
        this.confidenceThreshold = 0.5;
        this.iouThreshold = 0.4;
        
        this.loadModel();
    }
    
    async loadModel() {
        try {
            console.log('Loading motor wire connection model...');
            
            // Load the converted TensorFlow.js model from public folder
            const modelUrl = '/motor_wire_model_web/model.json';
            
            this.model = await tf.loadGraphModel(modelUrl);
            
            this.isModelLoaded = true;
            console.log('Motor wire connection model loaded successfully');
            
            // Log model input/output info
            console.log('Model inputs:', this.model.inputs);
            console.log('Model outputs:', this.model.outputs);
            
            return true;
            
        } catch (error) {
            console.error('Error loading motor wire model:', error);
            return false;
        }
    }
    
    async detectConnections(imageElement, canvasWidth, canvasHeight) {
        if (!this.isModelLoaded || this.isProcessing) {
            return [];
        }
        
        this.isProcessing = true;
        
        try {
            // Get actual image dimensions
            const imageWidth = imageElement.videoWidth || imageElement.width;
            const imageHeight = imageElement.videoHeight || imageElement.height;
            
            console.log(`Processing motor wire image: ${imageWidth} x ${imageHeight}`);
            
            // Preprocess image for model
            const inputTensor = await this.preprocessImage(imageElement);
            
            // Run inference
            const predictions = this.model.predict(inputTensor);
            
            // Process predictions
            const detections = await this.postprocessPredictions(
                predictions, 
                imageWidth, 
                imageHeight, 
                canvasWidth, 
                canvasHeight
            );
            
            // Clean up tensors
            inputTensor.dispose();
            predictions.dispose();
            
            this.isProcessing = false;
            return detections;
            
        } catch (error) {
            console.error('Error during motor wire detection:', error);
            this.isProcessing = false;
            return [];
        }
    }
    
    async preprocessImage(imageElement) {
        return tf.tidy(() => {
            // Convert image to tensor
            let tensor = tf.browser.fromPixels(imageElement);
            
            // Resize to model input size (416x416)
            tensor = tf.image.resizeBilinear(tensor, [this.inputSize, this.inputSize]);
            
            // Normalize to [0, 1]
            tensor = tensor.div(255.0);
            
            // Add batch dimension
            tensor = tensor.expandDims(0);
            
            return tensor;
        });
    }
    
    async postprocessPredictions(predictions, imageWidth, imageHeight, canvasWidth, canvasHeight) {
        const predArray = await predictions.data();
        const detections = [];
        
        const outputShape = predictions.shape;
        console.log('Model output shape:', outputShape);
        
        let numDetections, numFeatures;
        
        if (outputShape[1] === 6) {
            // Format: [1, 6, num_detections] - features first, with 2 classes
            numFeatures = outputShape[1];
            numDetections = outputShape[2];
            
            // Parse detections
            for (let i = 0; i < numDetections; i++) {
                const centerX = predArray[i];
                const centerY = predArray[numDetections + i];
                const width = predArray[2 * numDetections + i];
                const height = predArray[3 * numDetections + i];
                const connectedConf = predArray[4 * numDetections + i];
                const notConnectedConf = predArray[5 * numDetections + i];
                
                // Determine the class with highest confidence
                const isConnected = connectedConf > notConnectedConf;
                const confidence = Math.max(connectedConf, notConnectedConf);
                const classId = isConnected ? 0 : 1;
                
                if (confidence > this.confidenceThreshold) {
                    const detection = this.createDetection(
                        centerX, centerY, width, height, confidence, classId, isConnected,
                        imageWidth, imageHeight, canvasWidth, canvasHeight
                    );
                    detections.push(detection);
                }
            }
        } else if (outputShape[2] === 6) {
            // Format: [1, num_detections, 6] - detections first
            numDetections = outputShape[1];
            numFeatures = outputShape[2];
            
            for (let i = 0; i < numDetections; i++) {
                const baseIdx = i * numFeatures;
                const centerX = predArray[baseIdx];
                const centerY = predArray[baseIdx + 1];
                const width = predArray[baseIdx + 2];
                const height = predArray[baseIdx + 3];
                const connectedConf = predArray[baseIdx + 4];
                const notConnectedConf = predArray[baseIdx + 5];
                
                // Determine the class with highest confidence
                const isConnected = connectedConf > notConnectedConf;
                const confidence = Math.max(connectedConf, notConnectedConf);
                const classId = isConnected ? 0 : 1;
                
                if (confidence > this.confidenceThreshold) {
                    const detection = this.createDetection(
                        centerX, centerY, width, height, confidence, classId, isConnected,
                        imageWidth, imageHeight, canvasWidth, canvasHeight
                    );
                    detections.push(detection);
                }
            }
        }
        
        // Apply Non-Maximum Suppression
        return this.applyNMS(detections);
    }
    
    createDetection(centerX, centerY, width, height, confidence, classId, isConnected, imageWidth, imageHeight, canvasWidth, canvasHeight) {
        // Step 1: Convert model coordinates to original image coordinates
        const imgCenterX = (centerX / this.inputSize) * imageWidth;
        const imgCenterY = (centerY / this.inputSize) * imageHeight;
        const imgWidth = (width / this.inputSize) * imageWidth;
        const imgHeight = (height / this.inputSize) * imageHeight;
        
        // Step 2: Convert center/width/height to x1,y1,x2,y2
        const imgX1 = imgCenterX - imgWidth / 2;
        const imgY1 = imgCenterY - imgHeight / 2;
        const imgX2 = imgCenterX + imgWidth / 2;
        const imgY2 = imgCenterY + imgHeight / 2;
        
        // Step 3: Scale to canvas coordinates
        const scaleX = canvasWidth / imageWidth;
        const scaleY = canvasHeight / imageHeight;
        
        return {
            x1: Math.max(0, imgX1 * scaleX),
            y1: Math.max(0, imgY1 * scaleY),
            x2: Math.min(canvasWidth, imgX2 * scaleX),
            y2: Math.min(canvasHeight, imgY2 * scaleY),
            confidence: confidence,
            class: classId,
            className: this.classNames[classId],
            isConnected: isConnected,
            width: Math.abs(imgX2 - imgX1) * scaleX,
            height: Math.abs(imgY2 - imgY1) * scaleY
        };
    }
    
    applyNMS(detections) {
        if (detections.length === 0) return [];
        
        // Sort by confidence (highest first)
        detections.sort((a, b) => b.confidence - a.confidence);
        
        const keep = [];
        const suppressed = new Set();
        
        for (let i = 0; i < detections.length; i++) {
            if (suppressed.has(i)) continue;
            
            keep.push(detections[i]);
            
            // Suppress overlapping detections
            for (let j = i + 1; j < detections.length; j++) {
                if (suppressed.has(j)) continue;
                
                const iou = this.calculateIoU(detections[i], detections[j]);
                if (iou > this.iouThreshold) {
                    suppressed.add(j);
                }
            }
        }
        
        return keep;
    }
    
    calculateIoU(box1, box2) {
        const x1 = Math.max(box1.x1, box2.x1);
        const y1 = Math.max(box1.y1, box2.y1);
        const x2 = Math.min(box1.x2, box2.x2);
        const y2 = Math.min(box1.y2, box2.y2);
        
        if (x2 <= x1 || y2 <= y1) return 0;
        
        const intersection = (x2 - x1) * (y2 - y1);
        const area1 = (box1.x2 - box1.x1) * (box1.y2 - box1.y1);
        const area2 = (box2.x2 - box2.x1) * (box2.y2 - box2.y1);
        const union = area1 + area2 - intersection;
        
        return intersection / union;
    }
    
    // Utility method to draw detections on canvas
    drawDetections(canvas, detections) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        detections.forEach((detection) => {
            const { x1, y1, x2, y2, confidence, className, isConnected } = detection;
            
            // Use different colors based on connection status
            const strokeColor = isConnected ? '#27ae60' : '#e74c3c'; // Green for connected, red for not connected
            const fillColor = isConnected ? 'rgba(39, 174, 96, 0.2)' : 'rgba(231, 76, 60, 0.2)';
            
            // Draw filled rectangle
            ctx.fillStyle = fillColor;
            ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
            
            // Draw bounding box
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            
            // Draw status indicator in center
            const centerX = (x1 + x2) / 2;
            const centerY = (y1 + y2) / 2;
            const indicatorSize = 20;
            
            // Draw status circle
            ctx.fillStyle = strokeColor;
            ctx.beginPath();
            ctx.arc(centerX, centerY, indicatorSize / 2, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw status icon
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const statusIcon = isConnected ? '✓' : '✗';
            ctx.fillText(statusIcon, centerX, centerY);
            
            // Draw label
            const label = `${className} ${(confidence * 100).toFixed(1)}%`;
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            const labelWidth = ctx.measureText(label).width;
            
            const labelBgColor = isConnected ? 'rgba(39, 174, 96, 0.9)' : 'rgba(231, 76, 60, 0.9)';
            ctx.fillStyle = labelBgColor;
            ctx.fillRect(x1, y1 - 25, labelWidth + 10, 25);
            
            // Draw label text
            ctx.fillStyle = 'white';
            ctx.fillText(label, x1 + 5, y1 - 5);
        });
    }
} 