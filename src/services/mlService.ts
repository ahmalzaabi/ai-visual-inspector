// ESP32 Detection Service - Mobile Optimized
// TensorFlow.js with memory management for iPhone PWA

import * as tf from '@tensorflow/tfjs';

export interface DetectionResult {
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  score: number;
}

export interface ESP32Analysis {
  detections: DetectionResult[];
  confidence: number;
  processingTime: number;
  performance: {
    preprocessing: number;
    inference: number;
    postprocessing: number;
  };
}

class MLService {
  private esp32Model: tf.GraphModel | null = null;
  private isInitialized = false;
  private memoryCheckInterval: number | null = null;
  private lastMemoryWarning = 0;
  private maxMemoryMB = 150; // Memory limit for mobile devices
  private inferenceCount = 0;
  private tempTensors: tf.Tensor[] = []; // Track temporary tensors

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Loading ESP32 model...');
    
    try {
      // Setup TensorFlow.js with mobile optimizations
      await tf.ready();
      await tf.setBackend('webgl');
      
      // Configure for mobile performance
      tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
      
      // Load ESP32 model
      console.log('📦 Loading ESP32 model from /models/esp32/model.json...');
      this.esp32Model = await tf.loadGraphModel('/models/esp32/model.json');
      
      // Test model with dummy input
      console.log('🔍 Testing ESP32 model...');
      const testInput = tf.zeros([1, 640, 640, 3]);
      const esp32Output = await this.esp32Model.predict(testInput) as tf.Tensor;
      
      console.log('✅ ESP32 model loaded! Output shape:', esp32Output.shape);
      
      // Clean up test tensors
      testInput.dispose();
      esp32Output.dispose();
      
      // Start memory monitoring
      this.startMemoryMonitoring();
      
      this.isInitialized = true;
      console.log('🎯 Ready for ESP32 detection!');
      
    } catch (error) {
      console.error('❌ Model loading failed:', error);
      throw error;
    }
  }

  async detectESP32(canvas: HTMLCanvasElement): Promise<ESP32Analysis> {
    if (!this.isInitialized || !this.esp32Model) {
      await this.initialize();
    }

    // Check memory before inference
    if (!this.checkMemoryHealth()) {
      console.warn('⚠️ Memory threshold exceeded, skipping inference');
      return {
        detections: [],
        confidence: 0,
        processingTime: 0,
        performance: { preprocessing: 0, inference: 0, postprocessing: 0 }
      };
    }

    const startTime = performance.now();
    this.inferenceCount++;
    
    let inputTensor: tf.Tensor | null = null;
    let predictions: tf.Tensor | null = null;

    try {
      // 1. Preprocess image with memory management
      const preprocessStart = performance.now();
      
      // Use tidy to automatically clean up intermediate tensors
      inputTensor = tf.tidy(() => {
        return tf.browser.fromPixels(canvas)
          .resizeNearestNeighbor([640, 640])
          .expandDims(0)
          .div(255.0);
      });
      
      const preprocessTime = performance.now() - preprocessStart;

      // 2. Run inference
      const inferenceStart = performance.now();
      predictions = await this.esp32Model!.predict(inputTensor) as tf.Tensor;
      const inferenceTime = performance.now() - inferenceStart;

      // 3. Process results
      const postprocessStart = performance.now();
      const detections = this.processYOLOOutput(predictions, canvas.width, canvas.height);
      const postprocessTime = performance.now() - postprocessStart;

      const totalTime = performance.now() - startTime;

      const result: ESP32Analysis = {
        detections,
        confidence: detections.length > 0 ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length : 0,
        processingTime: totalTime,
        performance: {
          preprocessing: preprocessTime,
          inference: inferenceTime,
          postprocessing: postprocessTime
        }
      };

      // Periodic memory cleanup
      if (this.inferenceCount % 20 === 0) {
        this.performMemoryCleanup();
      }

      return result;

    } catch (error) {
      console.error('❌ ESP32 detection error:', error);
      return {
        detections: [],
        confidence: 0,
        processingTime: performance.now() - startTime,
        performance: { preprocessing: 0, inference: 0, postprocessing: 0 }
      };
    } finally {
      // Always clean up tensors
      if (inputTensor) {
        inputTensor.dispose();
      }
      if (predictions) {
        predictions.dispose();
      }
      this.cleanupTempTensors();
    }
  }

  private processYOLOOutput(predictions: tf.Tensor, originalWidth: number, originalHeight: number): DetectionResult[] {
    const data = predictions.dataSync() as Float32Array;
    const detections: DetectionResult[] = [];
    
    // YOLOv8 output format: [batch, features, anchors] -> [1, 5, 8400]
    const shape = predictions.shape;
    
    // Handle different output formats
    let numBoxes: number;
    
    if (shape.length === 3) {
      // Format: [1, features, boxes]
      [, , numBoxes] = shape;
    } else {
      console.warn('⚠️ Unexpected YOLO output format:', shape);
      return [];
    }

    const confThreshold = 0.4; // Confidence threshold for ESP32
    
    for (let i = 0; i < numBoxes; i++) {
      // YOLOv8 format: [cx, cy, w, h, confidence]
      const confidence = data[4 * numBoxes + i];
      
      if (confidence > confThreshold) {
        // Raw coordinate values
        const rawCx = data[0 * numBoxes + i];
        const rawCy = data[1 * numBoxes + i];
        const rawW = data[2 * numBoxes + i];
        const rawH = data[3 * numBoxes + i];
        
        // Scale from model size (640x640) to original canvas size
        const scaleX = originalWidth / 640;
        const scaleY = originalHeight / 640;
        
        const cx = rawCx * scaleX;
        const cy = rawCy * scaleY;
        const w = rawW * scaleX;
        const h = rawH * scaleY;
        
        // Convert center format to corner format
        const x1 = Math.max(0, cx - w/2);
        const y1 = Math.max(0, cy - h/2);
        const x2 = Math.min(originalWidth, cx + w/2);
        const y2 = Math.min(originalHeight, cy + h/2);
        
        // Size filtering for ESP32
        const minWidth = 30;
        const minHeight = 30;
        const boxWidth = x2 - x1;
        const boxHeight = y2 - y1;
        
        // Aspect ratio filtering for ESP32 (can be square-ish to rectangular)
        const aspectRatio = boxWidth / boxHeight;
        const isValidAspectRatio = aspectRatio > 0.3 && aspectRatio < 3.0;
        
        if (boxWidth > minWidth && boxHeight > minHeight && isValidAspectRatio) {
          detections.push({
            class: 'ESP32',
            confidence: confidence,
            bbox: [x1, y1, x2, y2],
            score: confidence
          });
        }
      }
    }
    
    // Apply Non-Maximum Suppression
    const nmsThreshold = 0.3;
    const nmsResults = this.applyNMS(detections, nmsThreshold);
    
    // Final confidence filtering
    const finalResults = nmsResults.filter(detection => detection.confidence >= 0.45);
    
    return finalResults;
  }

  private applyNMS(detections: DetectionResult[], iouThreshold: number): DetectionResult[] {
    if (detections.length === 0) return [];
    
    // Sort by confidence descending
    detections.sort((a, b) => b.confidence - a.confidence);
    const keep: DetectionResult[] = [];
    const suppressed = new Set<number>();
    
    for (let i = 0; i < detections.length; i++) {
      if (suppressed.has(i)) continue;
      keep.push(detections[i]);
      
      // Suppress overlapping detections
      for (let j = i + 1; j < detections.length; j++) {
        if (suppressed.has(j)) continue;
        const iou = this.calculateIoU(detections[i].bbox, detections[j].bbox);
        if (iou > iouThreshold) {
          suppressed.add(j);
        }
      }
    }
    
    return keep;
  }

  private calculateIoU(box1: [number, number, number, number], box2: [number, number, number, number]): number {
    const [x1_1, y1_1, x2_1, y2_1] = box1;
    const [x1_2, y1_2, x2_2, y2_2] = box2;
    
    const intersectionX1 = Math.max(x1_1, x1_2);
    const intersectionY1 = Math.max(y1_1, y1_2);
    const intersectionX2 = Math.min(x2_1, x2_2);
    const intersectionY2 = Math.min(y2_1, y2_2);
    
    if (intersectionX2 <= intersectionX1 || intersectionY2 <= intersectionY1) {
      return 0;
    }
    
    const intersectionArea = (intersectionX2 - intersectionX1) * (intersectionY2 - intersectionY1);
    const box1Area = (x2_1 - x1_1) * (y2_1 - y1_1);
    const box2Area = (x2_2 - x1_2) * (y2_2 - y1_2);
    const unionArea = box1Area + box2Area - intersectionArea;
    
    return intersectionArea / unionArea;
  }

  // Memory management methods
  private startMemoryMonitoring(): void {
    this.memoryCheckInterval = window.setInterval(() => {
      const memory = tf.memory();
      const memoryMB = memory.numBytes / (1024 * 1024);
      
      if (memoryMB > this.maxMemoryMB) {
        const now = Date.now();
        if (now - this.lastMemoryWarning > 5000) { // Only warn every 5 seconds
          console.warn(`⚠️ High memory usage: ${memoryMB.toFixed(1)}MB (limit: ${this.maxMemoryMB}MB)`);
          this.lastMemoryWarning = now;
          this.performMemoryCleanup();
        }
      }
    }, 2000);
  }

  private checkMemoryHealth(): boolean {
    const memory = tf.memory();
    const memoryMB = memory.numBytes / (1024 * 1024);
    return memoryMB < this.maxMemoryMB;
  }

  private performMemoryCleanup(): void {
    try {
      // Clean up any tracked temporary tensors
      this.cleanupTempTensors();
      
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
      
    } catch (error) {
      console.error('❌ Memory cleanup error:', error);
    }
  }

  private cleanupTempTensors(): void {
    this.tempTensors.forEach(tensor => {
      if (!tensor.isDisposed) {
        tensor.dispose();
      }
    });
    this.tempTensors = [];
  }

  // Performance stats
  getPerformanceStats() {
    const memory = tf.memory();
    return {
      isESP32ModelLoaded: this.esp32Model !== null,
      backend: tf.getBackend(),
      memory: {
        numTensors: memory.numTensors,
        numDataBuffers: memory.numDataBuffers,
        numBytes: memory.numBytes,
        memoryMB: (memory.numBytes / (1024 * 1024)).toFixed(1),
        isHealthy: this.checkMemoryHealth()
      },
      inferenceCount: this.inferenceCount
    };
  }

  // Cleanup method for component unmount
  cleanup(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    this.cleanupTempTensors();
    this.performMemoryCleanup();
  }
}

export const mlService = new MLService();