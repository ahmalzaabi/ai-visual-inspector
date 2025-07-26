import * as tf from '@tensorflow/tfjs';

export class ESP32Detector {
    constructor() {
        this.model = null;
        this.isModelLoaded = false;
        this.isProcessing = false;
        
        // Model configuration
        this.inputSize = 640;
        this.classNames = ['ESP32'];
        this.confidenceThreshold = 0.5;
        this.iouThreshold = 0.4;
        
        this.loadModel();
    }
    
    async loadModel() {
        try {
            console.log('Loading ESP32 detection model...');
            
            // Load the converted TensorFlow.js model from public folder
            const modelUrl = '/esp32_model_web/model.json';
            
            this.model = await tf.loadGraphModel(modelUrl);
            
            this.isModelLoaded = true;
            console.log('ESP32 model loaded successfully');
            
            // Log model input/output info
            console.log('Model inputs:', this.model.inputs);
            console.log('Model outputs:', this.model.outputs);
            
            return true;
            
        } catch (error) {
            console.error('Error loading ESP32 model:', error);
            return false;
        }
    }
    
    async detectObjects(imageElement, canvasWidth, canvasHeight) {
        if (!this.isModelLoaded || this.isProcessing) {
            return [];
        }
        
        this.isProcessing = true;
        
        try {
            // Get actual image dimensions
            const imageWidth = imageElement.videoWidth || imageElement.width;
            const imageHeight = imageElement.videoHeight || imageElement.height;
            
            console.log(`Processing image: ${imageWidth} x ${imageHeight}`);
            
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
            console.error('Error during detection:', error);
            this.isProcessing = false;
            return [];
        }
    }
    
    async preprocessImage(imageElement) {
        return tf.tidy(() => {
            // Convert image to tensor
            let tensor = tf.browser.fromPixels(imageElement);
            
            // Resize to model input size (640x640)
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
        
        if (outputShape[1] === 5) {
            // Format: [1, 5, 8400] - features first
            numFeatures = outputShape[1];
            numDetections = outputShape[2];
            
            // Parse detections
            for (let i = 0; i < numDetections; i++) {
                const centerX = predArray[i];
                const centerY = predArray[numDetections + i];
                const width = predArray[2 * numDetections + i];
                const height = predArray[3 * numDetections + i];
                const confidence = predArray[4 * numDetections + i];
                
                if (confidence > this.confidenceThreshold) {
                    const detection = this.createDetection(
                        centerX, centerY, width, height, confidence,
                        imageWidth, imageHeight, canvasWidth, canvasHeight
                    );
                    detections.push(detection);
                }
            }
        } else if (outputShape[2] === 5) {
            // Format: [1, 8400, 5] - detections first
            numDetections = outputShape[1];
            numFeatures = outputShape[2];
            
            for (let i = 0; i < numDetections; i++) {
                const baseIdx = i * numFeatures;
                const centerX = predArray[baseIdx];
                const centerY = predArray[baseIdx + 1];
                const width = predArray[baseIdx + 2];
                const height = predArray[baseIdx + 3];
                const confidence = predArray[baseIdx + 4];
                
                if (confidence > this.confidenceThreshold) {
                    const detection = this.createDetection(
                        centerX, centerY, width, height, confidence,
                        imageWidth, imageHeight, canvasWidth, canvasHeight
                    );
                    detections.push(detection);
                }
            }
        }
        
        // Apply Non-Maximum Suppression
        return this.applyNMS(detections);
    }
    
    createDetection(centerX, centerY, width, height, confidence, imageWidth, imageHeight, canvasWidth, canvasHeight) {
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
            class: 0,
            className: this.classNames[0],
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
            const { x1, y1, x2, y2, confidence, className } = detection;
            
            // Draw bounding box
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            
            // Draw label
            const label = `${className} ${(confidence * 100).toFixed(1)}%`;
            ctx.font = '16px Arial';
            const labelWidth = ctx.measureText(label).width;
            
            // Label background
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.fillRect(x1, y1 - 25, labelWidth + 10, 25);
            
            // Label text
            ctx.fillStyle = 'black';
            ctx.fillText(label, x1 + 5, y1 - 5);
        });
    }
} 