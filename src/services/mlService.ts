import * as tf from '@tensorflow/tfjs';

// ESP32 Detection Types
export interface ESP32Detection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
}

export interface ESP32Analysis {
  detections: ESP32Detection[];
  esp32Detected: boolean;
  confidenceScore: number;
  status: 'detected' | 'not_detected' | 'unknown';
}

// Enhanced ML Service with ESP32 Detection using TensorFlow.js
class MLService {
  private esp32Model: tf.GraphModel | null = null;
  private isInitialized = false;

  constructor() {
    console.log('🔧 ML Service initialized with TensorFlow.js ESP32 detection');
  }

  // Initialize TensorFlow backend
  async initializeTensorFlow(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing TensorFlow.js...');
    
    try {
      await tf.ready();
      
      // Set backend based on device capabilities
      try {
        await tf.setBackend('webgl');
        console.log('✅ Using WebGL backend for GPU acceleration');
      } catch (webglError) {
        console.warn('⚠️ WebGL failed, falling back to CPU:', webglError);
        await tf.setBackend('cpu');
      }
      
      this.isInitialized = true;
      console.log('✅ TensorFlow.js ready, backend:', tf.getBackend());
      
    } catch (error) {
      console.error('❌ TensorFlow.js initialization failed:', error);
      throw error;
    }
  }

  // Initialize ESP32 Detection Model
  async initializeESP32Model(): Promise<void> {
    if (this.esp32Model) return;

    console.log('🚀 Loading ESP32 detection model...');
    
    try {
      await this.initializeTensorFlow();
      
      const modelUrl = '/models/esp32/model.json';
      console.log('📥 Loading model from:', modelUrl);
      
      this.esp32Model = await tf.loadGraphModel(modelUrl);
      console.log('✅ Model loaded successfully');
      
      // Get model info
      if (this.esp32Model.inputs && this.esp32Model.inputs[0]) {
        const inputShape = this.esp32Model.inputs[0].shape;
        console.log('📊 Model input shape:', inputShape);
      }
      
      // Warm up the model with a test input
      console.log('🔥 Warming up model...');
      const testInput = tf.zeros([1, 640, 640, 3]);
      const startTime = performance.now();
      
      const output = this.esp32Model.predict(testInput) as tf.Tensor;
      
      const inferenceTime = performance.now() - startTime;
      console.log(`⚡ Warm-up inference time: ${inferenceTime.toFixed(1)}ms`);
      console.log('📊 Model output shape:', output.shape);
      
      // Cleanup
      testInput.dispose();
      output.dispose();
      
      console.log('✅ ESP32 model ready for detection');
      
    } catch (error) {
      console.error('❌ ESP32 model loading failed:', error);
      this.esp32Model = null;
      throw error;
    }
  }

  // ESP32 Detection Function
  async detectESP32(canvas: HTMLCanvasElement, videoElement?: HTMLVideoElement): Promise<ESP32Analysis> {
    if (!this.esp32Model) {
      console.log('🔄 Model not loaded, initializing...');
      await this.initializeESP32Model();
    }

    if (!this.esp32Model) {
      console.error('❌ Model failed to initialize');
      return {
        detections: [],
        esp32Detected: false,
        confidenceScore: 0,
        status: 'unknown'
      };
    }

    try {
      console.log('🔍 Starting ESP32 detection...');
      
      // Prepare input tensor from canvas or video
      let inputTensor: tf.Tensor4D;
      
      if (videoElement && videoElement.readyState >= 2) {
        // Use video element directly
        inputTensor = tf.browser.fromPixels(videoElement)
          .resizeBilinear([640, 640])
          .toFloat()
          .div(255.0)
          .expandDims(0) as tf.Tensor4D;
      } else {
        // Use canvas
        inputTensor = tf.browser.fromPixels(canvas)
          .resizeBilinear([640, 640])
          .toFloat()
          .div(255.0)
          .expandDims(0) as tf.Tensor4D;
      }

      console.log('📊 Input tensor shape:', inputTensor.shape);

      // Run inference
      const startTime = performance.now();
      const predictions = this.esp32Model.predict(inputTensor) as tf.Tensor;
      const inferenceTime = performance.now() - startTime;
      
      console.log(`⚡ Inference time: ${inferenceTime.toFixed(1)}ms`);
      console.log('📊 Predictions shape:', predictions.shape);
      
      // Parse YOLOv8 output
      const analysis = await this.parseYOLOv8Output(
        predictions, 
        canvas.width, 
        canvas.height
      );

      // Cleanup
      inputTensor.dispose();
      predictions.dispose();

      return analysis;

    } catch (error) {
      console.error('❌ ESP32 detection failed:', error);
      return {
        detections: [],
        esp32Detected: false,
        confidenceScore: 0,
        status: 'unknown'
      };
    }
  }

  // Parse YOLOv8 output format
  private async parseYOLOv8Output(
    predictions: tf.Tensor,
    originalWidth: number,
    originalHeight: number
  ): Promise<ESP32Analysis> {
    const data = await predictions.data();
    const shape = predictions.shape;
    
    console.log('🔬 Parsing output shape:', shape);
    console.log('🔬 First 10 values:', Array.from(data.slice(0, 10)).map(v => v.toFixed(4)));
    
    const detections: ESP32Detection[] = [];
    const confThreshold = 0.25; // Confidence threshold
    
    // Handle YOLOv8 output format: [1, 8400, 85] or [1, 85, 8400]
    let numDetections = 0;
    let featuresPerDetection = 0;
    
    if (shape.length === 3 && shape[0] === 1 && shape[1] && shape[2]) {
      if (shape[1] === 8400) {
        // Format: [1, 8400, 85] 
        numDetections = shape[1];
        featuresPerDetection = shape[2];
        console.log('📋 Detected format: [1, 8400, 85]');
      } else if (shape[2] === 8400) {
        // Format: [1, 85, 8400]
        numDetections = shape[2];
        featuresPerDetection = shape[1];
        console.log('📋 Detected format: [1, 85, 8400]');
      }
    }
    
    if (numDetections > 0 && featuresPerDetection >= 5) {
      for (let i = 0; i < numDetections; i++) {
        let x, y, w, h, objectness;
        
        if (shape[1] === 8400 && shape[2]) {
          // Format: [1, 8400, 85]
          x = data[i * shape[2] + 0];
          y = data[i * shape[2] + 1];
          w = data[i * shape[2] + 2];
          h = data[i * shape[2] + 3];
          objectness = data[i * shape[2] + 4];
        } else {
          // Format: [1, 85, 8400]
          x = data[i + 0 * numDetections];
          y = data[i + 1 * numDetections];
          w = data[i + 2 * numDetections];
          h = data[i + 3 * numDetections];
          objectness = data[i + 4 * numDetections];
        }
        
        // Apply sigmoid to objectness if needed
        const confidence = objectness > 1 ? 1 / (1 + Math.exp(-objectness)) : Math.max(0, Math.min(1, objectness));
        
        if (confidence > confThreshold) {
          // Convert center coordinates to corner coordinates
          const centerX = x * originalWidth;
          const centerY = y * originalHeight;
          const width = w * originalWidth;
          const height = h * originalHeight;
          
          const left = Math.max(0, centerX - width / 2);
          const top = Math.max(0, centerY - height / 2);
          
          // Validate detection
          if (width > 10 && height > 10 && 
              left + width <= originalWidth && top + height <= originalHeight) {
            
            detections.push({
              x: Math.round(left),
              y: Math.round(top),
              width: Math.round(width),
              height: Math.round(height),
              confidence: confidence,
              class: 'ESP32'
            });
          }
        }
      }
    }

    console.log(`🎯 Found ${detections.length} ESP32 detections (threshold: ${confThreshold})`);
    
    // Apply Non-Maximum Suppression
    const finalDetections = this.applyNMS(detections, 0.4);
    console.log(`✅ After NMS: ${finalDetections.length} detections`);
    
    const avgConfidence = finalDetections.length > 0 
      ? finalDetections.reduce((sum, det) => sum + det.confidence, 0) / finalDetections.length 
      : 0;

    return {
      detections: finalDetections,
      esp32Detected: finalDetections.length > 0,
      confidenceScore: avgConfidence,
      status: finalDetections.length > 0 ? 'detected' : 'not_detected'
    };
  }

  // Non-Maximum Suppression
  private applyNMS(detections: ESP32Detection[], iouThreshold: number): ESP32Detection[] {
    if (detections.length === 0) return [];
    
    // Sort by confidence (highest first)
    detections.sort((a, b) => b.confidence - a.confidence);
    
    const keep: ESP32Detection[] = [];
    const suppressed = new Set<number>();
    
    for (let i = 0; i < detections.length; i++) {
      if (suppressed.has(i)) continue;
      
      keep.push(detections[i]);
      
      // Suppress overlapping detections
      for (let j = i + 1; j < detections.length; j++) {
        if (suppressed.has(j)) continue;
        
        const iou = this.calculateIOU(detections[i], detections[j]);
        if (iou > iouThreshold) {
          suppressed.add(j);
        }
      }
    }
    
    return keep;
  }

  // Calculate Intersection over Union
  private calculateIOU(det1: ESP32Detection, det2: ESP32Detection): number {
    const x1 = Math.max(det1.x, det2.x);
    const y1 = Math.max(det1.y, det2.y);
    const x2 = Math.min(det1.x + det1.width, det2.x + det2.width);
    const y2 = Math.min(det1.y + det1.height, det2.y + det2.height);
    
    if (x2 <= x1 || y2 <= y1) return 0;
    
    const intersection = (x2 - x1) * (y2 - y1);
    const area1 = det1.width * det1.height;
    const area2 = det2.width * det2.height;
    const union = area1 + area2 - intersection;
    
    return intersection / union;
  }

  // Cleanup
  dispose(): void {
    if (this.esp32Model) {
      this.esp32Model.dispose();
      this.esp32Model = null;
    }
    this.isInitialized = false;
  }

  // Status check
  isReady(): boolean {
    return this.isInitialized && this.esp32Model !== null;
  }
}

// Export singleton instance
export const mlService = new MLService();