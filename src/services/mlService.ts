// Multi-Model ML Service for Breadboard and ESP32 Detection
// Using Roboflow API for breadboard detection and TensorFlow.js for ESP32
// Mobile-optimized with memory management

import * as tf from '@tensorflow/tfjs';
import { roboflowService } from './roboflowService';

export interface DetectionResult {
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  score: number;
}

export interface BreadboardAnalysis {
  detections: DetectionResult[];
  confidence: number;
  processingTime: number;
  performance: {
    preprocessing: number;
    inference: number;
    postprocessing: number;
  };
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

    console.log('🚀 Loading ESP32 model and initializing Roboflow...');
    
    try {
      // Setup TensorFlow.js with mobile optimizations
      console.log('📊 TensorFlow.js setup...');
      await tf.ready();
      console.log('🔧 Setting backend to WebGL...');
      await tf.setBackend('webgl');
      
      // Configure for mobile performance
      tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
      
      console.log('✅ Backend:', tf.getBackend());
      
      // Load only ESP32 model (breadboard uses Roboflow API)
      console.log('📦 Loading ESP32 model from /models/esp32/model.json...');
      this.esp32Model = await tf.loadGraphModel('/models/esp32/model.json');
      
      console.log('🔍 Testing ESP32 model with dummy input...');
      const testInput = tf.zeros([1, 640, 640, 3]);
      const esp32Output = await this.esp32Model.predict(testInput) as tf.Tensor;
      
      console.log('✅ ESP32 model loaded! Output shape:', esp32Output.shape);
      console.log('🔢 ESP32 output data preview:', esp32Output.dataSync().slice(0, 10));
      
      // Clean up test tensors
      testInput.dispose();
      esp32Output.dispose();
      
      // Check Roboflow API health
      console.log('🌐 Checking Roboflow API health...');
      const roboflowHealthy = await roboflowService.checkHealth();
      console.log(`🔍 Roboflow API status: ${roboflowHealthy ? '✅ Healthy' : '❌ Unavailable'}`);
      
      // Start memory monitoring
      this.startMemoryMonitoring();
      
      this.isInitialized = true;
      console.log('🎯 Ready for ESP32 detection (local) and breadboard detection (Roboflow API)!');
      
    } catch (error) {
      console.error('❌ Model loading failed:', error);
      console.error('Error details:', error);
      throw error;
    }
  }

  async detectBreadboard(canvas: HTMLCanvasElement): Promise<BreadboardAnalysis> {
    console.log('🍞 Starting breadboard detection with Roboflow API...');
    
    // Use Roboflow API for better accuracy and no memory issues
    return await roboflowService.detectBreadboard(canvas);
  }

  async detectESP32(canvas: HTMLCanvasElement): Promise<ESP32Analysis> {
    console.log('🔧 Starting ESP32 detection...');
    if (!this.isInitialized || !this.esp32Model) {
      console.log('🔄 Model not initialized, initializing...');
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
      console.log('🔄 Preprocessing ESP32 image...');
      
      // Use tidy to automatically clean up intermediate tensors
      inputTensor = tf.tidy(() => {
        return tf.browser.fromPixels(canvas)
          .resizeNearestNeighbor([640, 640])
          .expandDims(0)
          .div(255.0);
      });
      
      console.log(`📐 Input tensor shape: [${inputTensor.shape.join(', ')}]`);
      const preprocessTime = performance.now() - preprocessStart;

      // 2. Run inference
      const inferenceStart = performance.now();
      console.log('🧠 Running ESP32 model inference...');
      predictions = await this.esp32Model!.predict(inputTensor) as tf.Tensor;
      const inferenceTime = performance.now() - inferenceStart;

      // 3. Process results
      const postprocessStart = performance.now();
      console.log('🔍 Processing ESP32 model output...');
      const detections = this.processYOLOOutput(predictions, canvas.width, canvas.height, 'ESP32');
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

      if (detections.length > 0) {
        console.log(`🔧 Detected ${detections.length} ESP32(s)! Avg confidence: ${(result.confidence * 100).toFixed(1)}%`);
      }

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

  private processYOLOOutput(predictions: tf.Tensor, originalWidth: number, originalHeight: number, className: string): DetectionResult[] {
    const data = predictions.dataSync() as Float32Array;
    const detections: DetectionResult[] = [];
    
    // YOLOv8 output format: [batch, features, anchors] -> [1, 5, 8400]
    const shape = predictions.shape;
    console.log(`🔍 Processing YOLO output for ${className}:`);
    console.log(`   📏 Shape: [${shape.join(', ')}]`);
    console.log(`   📊 Data length: ${data.length}`);
    console.log(`   🖼️  Original size: ${originalWidth}x${originalHeight}`);
    
    // Handle different output formats
    let numBoxes: number;
    
    if (shape.length === 3) {
      // Format: [1, features, boxes]
      [, , numBoxes] = shape;
    } else {
      console.warn('⚠️ Unexpected YOLO output format:', shape);
      return [];
    }

    console.log(`   📦 Number of boxes to process: ${numBoxes}`);

    // Different thresholds for different models based on their performance
    const confThreshold = className === 'ESP32' ? 0.4 : 0.5; // Higher threshold to reduce false positives
    let highConfCount = 0;
    
    // Sample some confidence values for debugging (reduced for mobile)
    const sampleConfs = [];
    for (let i = 0; i < Math.min(20, numBoxes); i += 10) {
      sampleConfs.push(data[4 * numBoxes + i].toFixed(3));
    }
    console.log(`   🎯 Sample confidence values: [${sampleConfs.join(', ')}] (threshold: ${confThreshold})`);
    
    for (let i = 0; i < numBoxes; i++) {
      // YOLOv8 format: [cx, cy, w, h, confidence]
      const confidence = data[4 * numBoxes + i];
      
      if (confidence > confThreshold) {
        highConfCount++;
        
        // Raw coordinate values
        const rawCx = data[0 * numBoxes + i];
        const rawCy = data[1 * numBoxes + i];
        const rawW = data[2 * numBoxes + i];
        const rawH = data[3 * numBoxes + i];
        
        // Only log first few detections to avoid spam
        if (highConfCount <= 2) { // Reduced logging for mobile
          console.log(`   📍 Detection #${highConfCount}: raw coords: cx=${rawCx.toFixed(3)}, cy=${rawCy.toFixed(3)}, w=${rawW.toFixed(3)}, h=${rawH.toFixed(3)}`);
        }
        
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
        
        // Only log first few high-confidence detections to avoid spam
        if (highConfCount <= 2) {
          console.log(`   🔍 High conf detection (${confidence.toFixed(3)}): bbox=[${x1.toFixed(1)}, ${y1.toFixed(1)}, ${x2.toFixed(1)}, ${y2.toFixed(1)}], size=${(x2-x1).toFixed(1)}x${(y2-y1).toFixed(1)}`);
        }
        
        // More aggressive filtering for minimum detection size
        const minWidth = className === 'ESP32' ? 30 : 50;  // ESP32s can be smaller
        const minHeight = className === 'ESP32' ? 30 : 50; // Breadboards are usually larger
        const boxWidth = x2 - x1;
        const boxHeight = y2 - y1;
        
        // Also filter based on aspect ratio to reduce false positives
        const aspectRatio = boxWidth / boxHeight;
        const isValidAspectRatio = className === 'ESP32' ? 
          (aspectRatio > 0.3 && aspectRatio < 3.0) :  // ESP32s can be square-ish to rectangular
          (aspectRatio > 0.8 && aspectRatio < 5.0);   // Breadboards are typically rectangular
        
        if (boxWidth > minWidth && boxHeight > minHeight && isValidAspectRatio) {
          detections.push({
            class: className,
            confidence: confidence,
            bbox: [x1, y1, x2, y2],
            score: confidence
          });
        } else if (highConfCount <= 3) { // Reduced logging
          console.log(`   ❌ Filtered out detection: size=${boxWidth.toFixed(1)}x${boxHeight.toFixed(1)}, aspect=${aspectRatio.toFixed(2)}, minSize=${minWidth}x${minHeight}`);
        }
      }
    }
    
    console.log(`   ⚡ High confidence detections (>${confThreshold}): ${highConfCount}`);
    console.log(`   ✅ Valid detections after size filter: ${detections.length}`);
    
    // More aggressive NMS for different object types
    const nmsThreshold = className === 'ESP32' ? 0.3 : 0.4; // ESP32s should have less overlap tolerance
    const nmsResults = this.applyNMS(detections, nmsThreshold);
    console.log(`   🎯 Final detections after NMS (threshold=${nmsThreshold}): ${nmsResults.length}`);
    
    // Final confidence-based filtering - only keep the most confident detections
    const finalResults = nmsResults.filter(detection => {
      const minFinalConf = className === 'ESP32' ? 0.45 : 0.55;
      return detection.confidence >= minFinalConf;
    });
    
    console.log(`   ✅ High-confidence final results: ${finalResults.length}`);
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
      console.log('🧹 Performing memory cleanup...');
      
      // Clean up any tracked temporary tensors
      this.cleanupTempTensors();
      
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
      
      // Log memory after cleanup
      const memory = tf.memory();
      console.log(`📊 Memory after cleanup: ${(memory.numBytes / (1024 * 1024)).toFixed(1)}MB`);
      
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

  // Enhanced performance stats with memory info
  getPerformanceStats() {
    const memory = tf.memory();
    return {
      isBreadboardModelLoaded: 'Roboflow API', // Using cloud API
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