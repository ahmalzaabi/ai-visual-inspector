// Multi-Model AI Service - iOS PWA Optimized
// TensorFlow.js with advanced memory management for iPhone PWA
// Supports ESP32 Assembly Detection + Deep Inspection Model

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

export interface DeepInspectionAnalysis {
  detections: DetectionResult[];
  confidence: number;
  processingTime: number;
  defectTypes: string[];
  qualityScore: number;
  performance: {
    preprocessing: number;
    inference: number;
    postprocessing: number;
  };
}

export interface MotorAnalysis {
  detections: DetectionResult[];
  confidence: number;
  processingTime: number;
  connectionStatus: 'connected' | 'not_connected' | 'unknown';
  performance: {
    preprocessing: number;
    inference: number;
    postprocessing: number;
  };
}

export type ModelType = 'esp32' | 'breadboard' | 'motor_connected' | 'motor_not_connected';

// iOS PWA Detection
const isIOSPWA = () => {
  return (
    ('standalone' in window.navigator && (window.navigator as any).standalone) ||
    window.matchMedia('(display-mode: standalone)').matches
  ) && /iPhone|iPad|iPod/.test(navigator.userAgent);
};

// Device capability detection
const getDeviceCapabilities = () => {
  const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  const hasLimitedMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4;
  
  return {
    isIOSDevice,
    isIOSPWA: isIOSPWA(),
    isLowEndDevice,
    hasLimitedMemory,
    // Adjust memory limits based on device
    maxMemoryMB: isIOSDevice ? (hasLimitedMemory ? 120 : 180) : 200,
    // Frame rate limits for battery optimization
    maxFPS: isIOSDevice ? 20 : 30,
    // Inference throttling
    minInferenceInterval: isIOSDevice ? 100 : 50 // ms between inferences
  };
};

class MLService {
  private esp32Model: tf.GraphModel | null = null;
  private breadboardModel: tf.GraphModel | null = null;
  private motorConnectedModel: tf.GraphModel | null = null;
  private motorNotConnectedModel: tf.GraphModel | null = null;
  private modelsInitialized: Set<ModelType> = new Set();
  private memoryCheckInterval: number | null = null;
  private lastMemoryWarning = 0;
  private inferenceCount = 0;
  private tempTensors: tf.Tensor[] = []; // Track temporary tensors

  // iOS PWA optimizations
  private deviceCapabilities = getDeviceCapabilities();
  private lastInferenceTime = 0;
  private frameSkipCounter = 0;
  private performanceMode: 'high' | 'balanced' | 'power_save' = 'balanced';

  constructor() {
    console.log('🍎 iOS PWA Detection:', {
      isIOSPWA: this.deviceCapabilities.isIOSPWA,
      isIOSDevice: this.deviceCapabilities.isIOSDevice,
      maxMemoryMB: this.deviceCapabilities.maxMemoryMB,
      maxFPS: this.deviceCapabilities.maxFPS
    });

    // Setup iOS PWA specific optimizations
    if (this.deviceCapabilities.isIOSPWA) {
      this.setupIOSPWAOptimizations();
    }
  }

  private setupIOSPWAOptimizations(): void {
    // Handle app state changes for battery optimization
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performanceMode = 'power_save';
        console.log('📱 PWA backgrounded - entering power save mode');
      } else {
        this.performanceMode = 'balanced';
        console.log('📱 PWA foregrounded - resuming normal performance');
      }
    });

    // Handle device orientation changes
    window.addEventListener('orientationchange', () => {
      // Clear GPU memory on orientation change to prevent crashes
      setTimeout(() => {
        this.forceMemoryCleanup();
      }, 500);
    });

    // Handle page lifecycle for PWA
    window.addEventListener('pagehide', () => {
      this.performMemoryCleanup();
    });

    // Low memory warnings (iOS specific)
    if ('onmemorywarning' in window) {
      (window as any).onmemorywarning = () => {
        console.warn('⚠️ iOS Low Memory Warning - aggressive cleanup');
        this.handleLowMemory();
      };
    }
  }

  async initializeModel(modelType: ModelType): Promise<void> {
    if (this.modelsInitialized.has(modelType)) return;

    console.log(`🚀 Loading ${modelType} model for iOS PWA...`);
    
    try {
      // Setup TensorFlow.js with iOS PWA optimizations
      await tf.ready();
      
      // iOS PWA WebGL optimization
      if (this.deviceCapabilities.isIOSDevice) {
        // Use WebGL with iOS-specific optimizations
      await tf.setBackend('webgl');
      
        // iOS Safari WebGL optimizations
        tf.env().set('WEBGL_VERSION', 2);
        tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
        tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
        tf.env().set('WEBGL_RENDER_FLOAT32_CAPABLE', false);
        tf.env().set('WEBGL_FLUSH_THRESHOLD', 1);
        
        // Memory optimizations for iPhone
        tf.env().set('WEBGL_SIZE_UPLOAD_UNIFORM', 4);
        tf.env().set('WEBGL_MAX_TEXTURE_SIZE', 4096);
        
        console.log('🍎 iOS WebGL optimizations applied');
      } else {
        await tf.setBackend('webgl');
      tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
      }

      if (modelType === 'esp32') {
        // Load ESP32 Assembly Verification model
        console.log('📦 Loading ESP32 Assembly model...');
        
        // iOS PWA: Load with timeout and retry logic
        const modelUrl = '/models/esp32/model.json';
        this.esp32Model = await this.loadModelWithRetry(modelUrl, 3);
      
        // Test ESP32 model with iOS-optimized input
        console.log('🔍 Testing ESP32 Assembly model...');
        await this.testModelInference(this.esp32Model, 'ESP32');
        
            } else if (modelType === 'breadboard') {
        // Load Breadboard model (optimized)
        console.log('📦 Loading Breadboard model...');
        
        const modelUrl = '/models/breadboard_new/model.json';
        this.breadboardModel = await this.loadModelWithRetry(modelUrl, 3);
        
        // Test Breadboard model
        console.log('🔍 Testing Breadboard model...');
        await this.testModelInference(this.breadboardModel, 'Breadboard');
        
      } else if (modelType === 'motor_connected') {
        // Load Motor Connected model
        console.log('📦 Loading Motor Connected model...');
        
        const modelUrl = '/models/motor_connected/model.json';
        this.motorConnectedModel = await this.loadModelWithRetry(modelUrl, 3);
        
        // Test Motor Connected model
        console.log('🔍 Testing Motor Connected model...');
        await this.testModelInference(this.motorConnectedModel, 'MotorConnected');
        
      } else if (modelType === 'motor_not_connected') {
        // Load Motor Not Connected model
        console.log('📦 Loading Motor Not Connected model...');
        
        const modelUrl = '/models/motor_not_connected/model.json';
        this.motorNotConnectedModel = await this.loadModelWithRetry(modelUrl, 3);
        
        // Test Motor Not Connected model
        console.log('🔍 Testing Motor Not Connected model...');
        await this.testModelInference(this.motorNotConnectedModel, 'MotorNotConnected');
      }
      
      this.modelsInitialized.add(modelType);
      
      // Start memory monitoring if first model
      if (this.modelsInitialized.size === 1) {
      this.startMemoryMonitoring();
      }
      
      console.log(`🎯 ${modelType} model ready for iOS PWA detection!`);
      
    } catch (error) {
      console.error(`❌ ${modelType} model loading failed:`, error);
      
      // iOS PWA: Try fallback strategies
      if (this.deviceCapabilities.isIOSPWA) {
        console.log('🔄 Trying iOS PWA fallback strategies...');
        await this.tryFallbackStrategies(modelType);
      } else {
      throw error;
    }
  }
  }

  private async loadModelWithRetry(url: string, maxRetries: number): Promise<tf.GraphModel> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📥 Model load attempt ${attempt}/${maxRetries}`);
        
        // iOS PWA: Add cache-busting for model loading issues
        const cacheBuster = this.deviceCapabilities.isIOSPWA ? `?v=${Date.now()}` : '';
        const modelUrl = `${url}${cacheBuster}`;
        
        const model = await tf.loadGraphModel(modelUrl, {
          // iOS PWA optimizations
          requestInit: {
            cache: 'no-cache',
            mode: 'cors'
          }
        });
        
        return model;
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Model load attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Progressive backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Model loading failed after all retries');
  }

  private async testModelInference(model: tf.GraphModel, modelName: string): Promise<void> {
    tf.tidy(() => {
      const testInput = tf.zeros([1, 640, 640, 3]);
      const output = model.predict(testInput) as tf.Tensor;
      console.log(`✅ ${modelName} model loaded! Output shape:`, output.shape);
    });
  }

  private async tryFallbackStrategies(modelType: ModelType): Promise<void> {
    console.log('🔧 Attempting iOS PWA fallback strategies...');
    
    try {
      // Strategy 1: Switch to CPU backend
      console.log('🔄 Trying CPU backend...');
      await tf.setBackend('cpu');
      await this.initializeModel(modelType);
      return;
    } catch (error) {
      console.warn('❌ CPU fallback failed:', error);
    }
    
    // Strategy 2: Clear all memory and retry
    try {
      console.log('🧹 Clearing memory and retrying...');
      this.forceMemoryCleanup();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await tf.setBackend('webgl');
      await this.initializeModel(modelType);
      return;
    } catch (error) {
      console.warn('❌ Memory cleanup fallback failed:', error);
    }
    
    throw new Error(`All fallback strategies failed for ${modelType}`);
  }

  // Legacy method for backward compatibility
  async initialize(): Promise<void> {
    await this.initializeModel('esp32');
  }

  async detectESP32Assembly(canvas: HTMLCanvasElement): Promise<ESP32Analysis> {
    if (!this.modelsInitialized.has('esp32') || !this.esp32Model) {
      await this.initializeModel('esp32');
    }

    // iOS PWA: Frame rate limiting
    if (!this.shouldRunInference()) {
      return this.getEmptyESP32Analysis();
    }

    // Check memory before inference
    if (!this.checkMemoryHealth()) {
      console.warn('⚠️ Memory threshold exceeded, skipping ESP32 inference');
      return this.getEmptyESP32Analysis();
    }

    const startTime = performance.now();
    this.inferenceCount++;
    this.lastInferenceTime = startTime;
    
    let inputTensor: tf.Tensor | null = null;
    let predictions: tf.Tensor | null = null;

    try {
      // 1. Preprocess image with iOS PWA optimizations
      const preprocessStart = performance.now();
      
      inputTensor = tf.tidy(() => {
        // iOS optimization: Use smaller input size if low-end device
        const targetSize = this.deviceCapabilities.hasLimitedMemory ? 416 : 640;
        
        return tf.browser.fromPixels(canvas)
          .resizeNearestNeighbor([targetSize, targetSize])
          .expandDims(0)
          .div(255.0);
      });
      
      const preprocessTime = performance.now() - preprocessStart;

      // 2. Run inference with iOS optimizations
      const inferenceStart = performance.now();
      predictions = await this.esp32Model!.predict(inputTensor) as tf.Tensor;
      const inferenceTime = performance.now() - inferenceStart;

      // 3. Process results
      const postprocessStart = performance.now();
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

      // iOS PWA: Adaptive performance monitoring
      this.adjustPerformanceMode(totalTime);

      return result;

    } catch (error) {
      console.error('❌ ESP32 Assembly detection failed:', error);
      
      // iOS PWA: Handle WebGL context loss
      if (this.isWebGLContextLost(error)) {
        await this.handleWebGLContextLoss();
      }
      
      throw error;
    } finally {
      // Clean up tensors
      if (inputTensor) inputTensor.dispose();
      if (predictions) predictions.dispose();
      this.cleanupTempTensors();
    }
  }

  async detectMotorConnection(canvas: HTMLCanvasElement): Promise<MotorAnalysis> {
    // Initialize motor models if needed
    if (!this.modelsInitialized.has('motor_connected')) {
      await this.initializeModel('motor_connected');
    }
    if (!this.modelsInitialized.has('motor_not_connected')) {
      await this.initializeModel('motor_not_connected');
    }

    // iOS PWA: Frame rate limiting
    if (!this.shouldRunInference()) {
      return this.getEmptyMotorAnalysis();
    }

    // Check memory before inference
    if (!this.checkMemoryHealth()) {
      console.warn('⚠️ Memory threshold exceeded, skipping Motor Detection inference');
      return this.getEmptyMotorAnalysis();
    }

    const startTime = performance.now();
    let inputTensor: tf.Tensor | null = null;
    let connectedPredictions: tf.Tensor | null = null;
    let notConnectedPredictions: tf.Tensor | null = null;

    try {
      // 1. Preprocess image for both models
      const preprocessStart = performance.now();
      inputTensor = tf.tidy(() => {
        const targetSize = 640;
        return tf.browser.fromPixels(canvas)
          .resizeNearestNeighbor([targetSize, targetSize])
          .expandDims(0)
          .div(255.0);
      });
      
      const preprocessTime = performance.now() - preprocessStart;

      // 2. Run inference on both motor models
      const inferenceStart = performance.now();
      console.log('🔌 Running motor detection inference...');
      connectedPredictions = this.motorConnectedModel!.predict(inputTensor) as tf.Tensor;
      notConnectedPredictions = this.motorNotConnectedModel!.predict(inputTensor) as tf.Tensor;
      console.log('📊 Motor predictions shapes:', {
        connected: connectedPredictions.shape,
        notConnected: notConnectedPredictions.shape
      });
      const inferenceTime = performance.now() - inferenceStart;

      // 3. Process results from both models
      const postprocessStart = performance.now();
      const connectedDetections = this.processYOLOOutput(connectedPredictions, canvas.width, canvas.height, 'Motor');
      const notConnectedDetections = this.processYOLOOutput(notConnectedPredictions, canvas.width, canvas.height, 'Motor');
      const postprocessTime = performance.now() - postprocessStart;
      
      console.log('🎯 Motor detection results:', {
        connected: connectedDetections.length,
        notConnected: notConnectedDetections.length
      });

      const totalTime = performance.now() - startTime;

      // Determine connection status based on detections
      let connectionStatus: 'connected' | 'not_connected' | 'unknown' = 'unknown';
      let allDetections: DetectionResult[] = [];
      let confidence = 0;

      if (connectedDetections.length > 0 && notConnectedDetections.length === 0) {
        connectionStatus = 'connected';
        allDetections = connectedDetections;
        confidence = Math.max(...connectedDetections.map(d => d.confidence));
      } else if (notConnectedDetections.length > 0 && connectedDetections.length === 0) {
        connectionStatus = 'not_connected';
        allDetections = notConnectedDetections;
        confidence = Math.max(...notConnectedDetections.map(d => d.confidence));
      } else if (connectedDetections.length > 0 && notConnectedDetections.length > 0) {
        // Both detected, use higher confidence
        const connectedConf = Math.max(...connectedDetections.map(d => d.confidence));
        const notConnectedConf = Math.max(...notConnectedDetections.map(d => d.confidence));
        
        if (connectedConf > notConnectedConf) {
          connectionStatus = 'connected';
          allDetections = connectedDetections;
          confidence = connectedConf;
        } else {
          connectionStatus = 'not_connected';
          allDetections = notConnectedDetections;
          confidence = notConnectedConf;
        }
      }

      const result: MotorAnalysis = {
        detections: allDetections,
        confidence,
        processingTime: totalTime,
        connectionStatus,
        performance: {
          preprocessing: preprocessTime,
          inference: inferenceTime,
          postprocessing: postprocessTime
        }
      };

      // iOS PWA: Adaptive performance monitoring
      this.adjustPerformanceMode(totalTime);

      return result;

    } catch (error) {
      console.error('❌ Motor Detection failed:', error);
      
      // iOS PWA: Handle WebGL context loss
      if (this.isWebGLContextLost(error)) {
        await this.handleWebGLContextLoss();
      }
      
      throw error;
    } finally {
      // Clean up tensors
      if (inputTensor) inputTensor.dispose();
      if (connectedPredictions) connectedPredictions.dispose();
      if (notConnectedPredictions) notConnectedPredictions.dispose();
      this.cleanupTempTensors();
    }
  }

  async detectBreadboard(canvas: HTMLCanvasElement): Promise<ESP32Analysis> {
    if (!this.modelsInitialized.has('breadboard') || !this.breadboardModel) {
      await this.initializeModel('breadboard');
    }

    // iOS PWA: Frame rate limiting
    if (!this.shouldRunInference()) {
      return this.getEmptyESP32Analysis();
    }

    // Check memory before inference
    if (!this.checkMemoryHealth()) {
      console.warn('⚠️ Memory threshold exceeded, skipping Breadboard detection');
      return this.getEmptyESP32Analysis();
    }

    const startTime = performance.now();
    let inputTensor: tf.Tensor | null = null;
    let predictions: tf.Tensor | null = null;

    try {
      // 1. Preprocess image (iOS PWA optimized)
      const preprocessStart = performance.now();
      inputTensor = tf.tidy(() => {
        const targetSize = 640;
        return tf.browser.fromPixels(canvas)
          .resizeNearestNeighbor([targetSize, targetSize])
          .expandDims(0)
          .div(255.0);
      });
      
      const preprocessTime = performance.now() - preprocessStart;

      // 2. Run inference with iOS optimizations
      const inferenceStart = performance.now();
      predictions = await this.breadboardModel!.predict(inputTensor) as tf.Tensor;
      const inferenceTime = performance.now() - inferenceStart;

      // 3. Process YOLO output
      const postprocessStart = performance.now();
      const detections = this.processYOLOOutput(predictions, canvas.width, canvas.height, 'Breadboard');
      const postprocessTime = performance.now() - postprocessStart;

      const totalTime = performance.now() - startTime;
      
      const result: ESP32Analysis = {
        detections,
        confidence: detections.length > 0 ? Math.max(...detections.map(d => d.confidence)) : 0,
        processingTime: totalTime,
        performance: {
          preprocessing: preprocessTime,
          inference: inferenceTime,
          postprocessing: postprocessTime
        }
      };

      // iOS PWA: Adaptive performance monitoring
      this.adjustPerformanceMode(totalTime);

      return result;

    } catch (error) {
      console.error('❌ Breadboard detection failed:', error);
      
      // iOS PWA: Handle WebGL context loss
      if (this.isWebGLContextLost(error)) {
        await this.handleWebGLContextLoss();
      }
      
      throw error;
    } finally {
      // Clean up tensors
      if (inputTensor) inputTensor.dispose();
      if (predictions) predictions.dispose();
      this.cleanupTempTensors();
    }
  }

  // iOS PWA: Frame rate limiting for battery optimization
  private shouldRunInference(): boolean {
    const now = performance.now();
    const timeSinceLastInference = now - this.lastInferenceTime;
    const minInterval = this.deviceCapabilities.minInferenceInterval;

    // Skip frames based on performance mode
    if (this.performanceMode === 'power_save') {
      this.frameSkipCounter++;
      if (this.frameSkipCounter % 3 !== 0) { // Skip 2 out of 3 frames
        return false;
      }
    }

    // Respect minimum inference interval
    if (timeSinceLastInference < minInterval) {
      return false;
    }

    return true;
  }

  // iOS PWA: Adaptive performance management
  private adjustPerformanceMode(inferenceTime: number): void {
    if (this.deviceCapabilities.isIOSPWA) {
      if (inferenceTime > 200) {
        this.performanceMode = 'power_save';
      } else if (inferenceTime > 100) {
        this.performanceMode = 'balanced';
      } else {
        this.performanceMode = 'high';
      }
    }
  }

  // iOS PWA: WebGL context loss handling
  private isWebGLContextLost(error: any): boolean {
    return error && (
      error.message?.includes('context') ||
      error.message?.includes('WebGL') ||
      error.message?.includes('CONTEXT_LOST')
    );
  }

  private async handleWebGLContextLoss(): Promise<void> {
    console.warn('🔥 WebGL context lost - attempting recovery...');
    
    try {
      // Clear all models and reinitialize
      this.esp32Model?.dispose();
      this.breadboardModel?.dispose();
      this.motorConnectedModel?.dispose();
      this.motorNotConnectedModel?.dispose();
      this.esp32Model = null;
      this.breadboardModel = null;
      this.motorConnectedModel = null;
      this.motorNotConnectedModel = null;
      this.modelsInitialized.clear();
      
      // Force cleanup
      this.forceMemoryCleanup();
      
      // Wait a bit before reinitializing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to reinitialize WebGL
      await tf.setBackend('webgl');
      
      console.log('✅ WebGL context recovery successful');
    } catch (error) {
      console.error('❌ WebGL context recovery failed:', error);
      // Fall back to CPU
      await tf.setBackend('cpu');
    }
  }

  // iOS PWA: Low memory handling
  private handleLowMemory(): void {
    console.warn('📱 iOS low memory warning - aggressive cleanup');
    
    // Immediately cleanup all tensors
    this.forceMemoryCleanup();
    
    // Switch to power save mode
    this.performanceMode = 'power_save';
    
    // Reduce model precision temporarily
    if (this.deviceCapabilities.isIOSPWA) {
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
    }
  }

  private getEmptyESP32Analysis(): ESP32Analysis {
    return {
      detections: [],
      confidence: 0,
      processingTime: 0,
      performance: { preprocessing: 0, inference: 0, postprocessing: 0 }
    };
  }



  private getEmptyMotorAnalysis(): MotorAnalysis {
    return {
      detections: [],
      confidence: 0,
      processingTime: 0,
      connectionStatus: 'unknown',
      performance: { preprocessing: 0, inference: 0, postprocessing: 0 }
    };
  }

  // Legacy method for backward compatibility
  async detectESP32(canvas: HTMLCanvasElement): Promise<ESP32Analysis> {
    return this.detectESP32Assembly(canvas);
  }

  private processYOLOOutput(predictions: tf.Tensor, originalWidth: number, originalHeight: number, objectType: string = 'ESP32'): DetectionResult[] {
    const data = predictions.dataSync() as Float32Array;
    const detections: DetectionResult[] = [];
    
    // YOLO output format: [batch, 84, 8400] where 84 = 4 (bbox) + 80 (classes)
    const confThreshold = objectType === 'ESP32' ? 0.25 : 0.3;
    const numBoxes = 8400;
    
    for (let i = 0; i < numBoxes; i++) {
      // Get confidence (assuming class 0 for ESP32, or best class for deep inspection)
      const confidence = data[4 * numBoxes + i]; // First class confidence
      
      if (confidence > confThreshold) {
        // Raw coordinate values
        const rawCx = data[0 * numBoxes + i];
        const rawCy = data[1 * numBoxes + i];
        const rawW = data[2 * numBoxes + i];
        const rawH = data[3 * numBoxes + i];
        
        // Scale from model size to original canvas size
        const modelSize = this.deviceCapabilities.hasLimitedMemory ? 416 : 640;
        const scaleX = originalWidth / modelSize;
        const scaleY = originalHeight / modelSize;
        
        const cx = rawCx * scaleX;
        const cy = rawCy * scaleY;
        const w = rawW * scaleX;
        const h = rawH * scaleY;
        
        // Convert center format to corner format
        const x1 = Math.max(0, cx - w/2);
        const y1 = Math.max(0, cy - h/2);
        const x2 = Math.min(originalWidth, cx + w/2);
        const y2 = Math.min(originalHeight, cy + h/2);
        
        // Size filtering
        const minWidth = objectType === 'ESP32' ? 30 : 20;
        const minHeight = objectType === 'ESP32' ? 30 : 20;
        const boxWidth = x2 - x1;
        const boxHeight = y2 - y1;
        
        // Aspect ratio filtering
        const aspectRatio = boxWidth / boxHeight;
        const isValidAspectRatio = objectType === 'ESP32' 
          ? (aspectRatio > 0.3 && aspectRatio < 3.0)
          : (aspectRatio > 0.1 && aspectRatio < 10.0); // More flexible for general objects
        
        if (boxWidth > minWidth && boxHeight > minHeight && isValidAspectRatio) {
          detections.push({
            class: objectType,
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
    const finalThreshold = objectType === 'ESP32' ? 0.45 : 0.35;
    const finalResults = nmsResults.filter(detection => detection.confidence >= finalThreshold);
    
    return finalResults;
  }





  private applyNMS(detections: DetectionResult[], threshold: number): DetectionResult[] {
    if (detections.length === 0) return [];
    
    // Sort by confidence (highest first)
    const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
    const keep: DetectionResult[] = [];
    
    while (sorted.length > 0) {
      const current = sorted.shift()!;
      keep.push(current);
      
      // Remove overlapping boxes
      for (let i = sorted.length - 1; i >= 0; i--) {
        const iou = this.calculateIoU(current.bbox, sorted[i].bbox);
        if (iou > threshold) {
          sorted.splice(i, 1);
        }
      }
    }
    
    return keep;
  }

  private calculateIoU(box1: number[], box2: number[]): number {
    const [x1_1, y1_1, x2_1, y2_1] = box1;
    const [x1_2, y1_2, x2_2, y2_2] = box2;
    
    const x1 = Math.max(x1_1, x1_2);
    const y1 = Math.max(y1_1, y1_2);
    const x2 = Math.min(x2_1, x2_2);
    const y2 = Math.min(y2_1, y2_2);
    
    if (x2 <= x1 || y2 <= y1) return 0;
    
    const intersection = (x2 - x1) * (y2 - y1);
    const area1 = (x2_1 - x1_1) * (y2_1 - y1_1);
    const area2 = (x2_2 - x1_2) * (y2_2 - y1_2);
    const union = area1 + area2 - intersection;
    
    return intersection / union;
  }

  private checkMemoryHealth(): boolean {
    const memoryInfo = tf.memory();
    const memoryMB = memoryInfo.numBytes / (1024 * 1024);
    const limit = this.deviceCapabilities.maxMemoryMB;
    
    if (memoryMB > limit) {
      const now = Date.now();
      if (now - this.lastMemoryWarning > 5000) { // Warn every 5 seconds max
        console.warn(`⚠️ High memory usage: ${memoryMB.toFixed(1)}MB / ${limit}MB`);
        this.lastMemoryWarning = now;
      }
      return false;
    }
    
    return true;
  }

  private cleanupTempTensors(): void {
    this.tempTensors.forEach(tensor => {
      if (!tensor.isDisposed) {
        tensor.dispose();
      }
    });
    this.tempTensors = [];
  }

  private forceMemoryCleanup(): void {
    // Clean up temp tensors
    this.cleanupTempTensors();
    
    // Force TensorFlow.js garbage collection
    tf.disposeVariables();
    
    // iOS PWA: Force browser garbage collection if available
    if (typeof window !== 'undefined' && 'gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
    
    console.log('🧹 Forced memory cleanup completed');
  }

  private performMemoryCleanup(): void {
    try {
      this.cleanupTempTensors();
      
      // Periodic cleanup every 20 inferences
      if (this.inferenceCount % 20 === 0) {
        this.forceMemoryCleanup();
      }
    } catch (error) {
      console.error('❌ Memory cleanup error:', error);
    }
  }

  private startMemoryMonitoring(): void {
    if (this.memoryCheckInterval) return;
    
    // iOS PWA: More frequent monitoring for better memory management
    const checkInterval = this.deviceCapabilities.isIOSPWA ? 5000 : 10000;
    
    this.memoryCheckInterval = window.setInterval(() => {
      const memoryInfo = tf.memory();
      const memoryMB = memoryInfo.numBytes / (1024 * 1024);
      const limit = this.deviceCapabilities.maxMemoryMB;
      
      if (memoryMB > limit * 0.8) {
        console.log(`🧠 Memory usage: ${memoryMB.toFixed(1)}MB (${memoryInfo.numTensors} tensors)`);
        
        // iOS PWA: Preemptive cleanup at 80% memory usage
        if (this.deviceCapabilities.isIOSPWA && memoryMB > limit * 0.8) {
          this.performMemoryCleanup();
        }
        
        // Force garbage collection if available
        if (typeof window !== 'undefined' && 'gc' in window && typeof (window as any).gc === 'function') {
          (window as any).gc();
        }
      }
    }, checkInterval);
  }

  getPerformanceStats() {
    const memoryInfo = tf.memory();
    return {
      device: {
        isIOSPWA: this.deviceCapabilities.isIOSPWA,
        isIOSDevice: this.deviceCapabilities.isIOSDevice,
        maxMemoryMB: this.deviceCapabilities.maxMemoryMB,
        maxFPS: this.deviceCapabilities.maxFPS,
        performanceMode: this.performanceMode
      },
      memory: {
        numTensors: memoryInfo.numTensors,
        numDataBuffers: memoryInfo.numDataBuffers,
        memoryMB: Math.round(memoryInfo.numBytes / (1024 * 1024) * 100) / 100,
        isHealthy: memoryInfo.numBytes / (1024 * 1024) < this.deviceCapabilities.maxMemoryMB
      },
      inference: {
        totalInferences: this.inferenceCount,
        modelsLoaded: Array.from(this.modelsInitialized),
        lastInferenceTime: this.lastInferenceTime
      }
    };
  }

  dispose(): void {
    // Clean up models
    if (this.esp32Model) {
      this.esp32Model.dispose();
      this.esp32Model = null;
    }
    
    if (this.breadboardModel) {
      this.breadboardModel.dispose();
      this.breadboardModel = null;
    }
    
    if (this.motorConnectedModel) {
      this.motorConnectedModel.dispose();
      this.motorConnectedModel = null;
    }
    
    if (this.motorNotConnectedModel) {
      this.motorNotConnectedModel.dispose();
      this.motorNotConnectedModel = null;
    }
    
    // Clean up temp tensors
    this.cleanupTempTensors();
    
    // Clear memory monitoring
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    
    this.modelsInitialized.clear();
    console.log('🧹 ML Service disposed');
  }
}

export const mlService = new MLService();