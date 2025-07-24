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
        
        // Load with optimizations and validation
        const modelUrl = '/models/esp32/model.json';
        this.esp32Model = await this.loadModelWithOptimization(modelUrl, 'esp32');
      
        // Test ESP32 model with iOS-optimized input
        console.log('🔍 Testing ESP32 Assembly model...');
        await this.testModelInference(this.esp32Model, 'ESP32');
        
      } else if (modelType === 'breadboard') {
        // Load Breadboard model (optimized)
        console.log('📦 Loading Breadboard model...');
        
        const modelUrl = '/models/breadboard_new/model.json';
        this.breadboardModel = await this.loadModelWithOptimization(modelUrl, 'breadboard');
        
        // Test Breadboard model
        console.log('🔍 Testing Breadboard model...');
        await this.testModelInference(this.breadboardModel, 'Breadboard');
        
      } else if (modelType === 'motor_connected') {
        // Load Motor Connected model
        console.log('📦 Loading Motor Connected model...');
        
        const modelUrl = '/models/motor_connected/model.json';
        this.motorConnectedModel = await this.loadModelWithOptimization(modelUrl, 'motor_connected');
        
        // Test Motor Connected model
        console.log('🔍 Testing Motor Connected model...');
        await this.testModelInference(this.motorConnectedModel, 'MotorConnected');
        
      } else if (modelType === 'motor_not_connected') {
        // Load Motor Not Connected model
        console.log('📦 Loading Motor Not Connected model...');
        
        const modelUrl = '/models/motor_not_connected/model.json';
        this.motorNotConnectedModel = await this.loadModelWithOptimization(modelUrl, 'motor_not_connected');
        
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
      // 1. Advanced preprocessing with dynamic optimization
      const preprocessStart = performance.now();
      
      inputTensor = tf.tidy(() => {
        // Dynamic input size based on device capabilities and performance mode
        let targetSize = 640; // Default high quality
        
        if (this.deviceCapabilities.hasLimitedMemory) {
          targetSize = 416; // Reduce for memory-constrained devices
        } else if (this.performanceMode === 'power_save') {
          targetSize = 480; // Balance quality and performance
        } else if (this.performanceMode === 'balanced' && this.deviceCapabilities.isLowEndDevice) {
          targetSize = 512; // Slightly reduced for low-end devices
        }
        
        console.log(`🔧 ESP32 preprocessing: ${targetSize}x${targetSize} (${this.performanceMode} mode)`);
        
        // Smart preprocessing with image quality optimization
        const rawImage = tf.browser.fromPixels(canvas);
        
        // Apply slight sharpening for better edge detection on compressed images
        const resized = rawImage.resizeNearestNeighbor([targetSize, targetSize]);
        
        // Enhanced normalization for better model performance
        const normalized = resized.div(255.0);
        
        // Cleanup intermediate tensors
        rawImage.dispose();
        resized.dispose();
        
        return normalized.expandDims(0);
      });
      
      const preprocessTime = performance.now() - preprocessStart;

      // 2. Run inference with iOS optimizations
      const inferenceStart = performance.now();
      predictions = await this.esp32Model!.predict(inputTensor) as tf.Tensor;
      const inferenceTime = performance.now() - inferenceStart;

      // 3. Process results
      const postprocessStart = performance.now();
      const detections = this.processESP32Output(predictions, canvas.width, canvas.height);
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
          // Intelligent model loading - load only what's needed based on context
      const modelsToLoad = ['motor_connected', 'motor_not_connected'];
      const loadPromises = modelsToLoad
        .filter(model => !this.modelsInitialized.has(model as ModelType))
        .map(model => this.initializeModel(model as ModelType));
      
      if (loadPromises.length > 0) {
        console.log(`🚀 Loading ${loadPromises.length} motor detection models in parallel...`);
        await Promise.all(loadPromises);
        
        // Apply advanced optimizations after models are loaded
        await this.optimizeMotorModels();
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
      // 1. Preprocess image
      const preprocessStart = performance.now();
      inputTensor = tf.tidy(() => {
        const targetSize = 640;
        return tf.browser.fromPixels(canvas)
          .resizeNearestNeighbor([targetSize, targetSize])
          .expandDims(0)
          .div(255.0);
      });
      
      const preprocessTime = performance.now() - preprocessStart;
      console.log('📸 Input tensor created:', inputTensor.shape);

      // 2. Run inference on both motor models
      const inferenceStart = performance.now();
      console.log('🔌 Running both motor models...');
      connectedPredictions = this.motorConnectedModel!.predict(inputTensor) as tf.Tensor;
      notConnectedPredictions = this.motorNotConnectedModel!.predict(inputTensor) as tf.Tensor;
      const inferenceTime = performance.now() - inferenceStart;

      // 3. Process results from both models
      const postprocessStart = performance.now();
      const connectedDetections = this.processMotorConnectedOutput(connectedPredictions, canvas.width, canvas.height);
      const notConnectedDetections = this.processMotorNotConnectedOutput(notConnectedPredictions, canvas.width, canvas.height);
      const postprocessTime = performance.now() - postprocessStart;
      
      console.log('🎯 Motor detection results:', {
        connected: connectedDetections.length,
        notConnected: notConnectedDetections.length,
        motorCount: connectedDetections.filter(d => d.class === 'motor').length
      });

      const totalTime = performance.now() - startTime;

      // Determine connection status based on both models
      let connectionStatus: 'connected' | 'not_connected' | 'unknown' = 'unknown';
      let allDetections: DetectionResult[] = [];
      let confidence = 0;

      // Count motors specifically
      const motorDetections = connectedDetections.filter(d => d.class === 'motor');
      const motorCount = motorDetections.length;

      if (motorDetections.length > 0) {
        connectionStatus = 'connected';
        allDetections = connectedDetections;
        confidence = Math.max(...connectedDetections.map(d => d.confidence));
        
        if (motorCount === 4) {
          console.log('✅ ALL 4 MOTORS DETECTED - Assembly Complete!');
        } else {
          console.log(`⚠️ ${motorCount}/4 MOTORS DETECTED - ${4 - motorCount} motors missing`);
        }
      } else if (notConnectedDetections.length > 0) {
        connectionStatus = 'not_connected';
        allDetections = notConnectedDetections;
        confidence = Math.max(...notConnectedDetections.map(d => d.confidence));
        console.log('🔌 ASSEMBLY STEP 1: Connection points detected');
      } else {
        console.log('❓ No motor connections detected');
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
      const detections = this.processBreadboardOutput(predictions, canvas.width, canvas.height);
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

  // Enhanced iOS PWA: Intelligent frame rate limiting with predictive optimization
  private shouldRunInference(): boolean {
    const now = performance.now();
    const timeSinceLastInference = now - this.lastInferenceTime;
    const minInterval = this.deviceCapabilities.minInferenceInterval;

    // Advanced frame skipping based on performance mode and battery level
    if (this.performanceMode === 'power_save') {
      this.frameSkipCounter++;
      // More aggressive skipping for power save - skip 3 out of 4 frames
      if (this.frameSkipCounter % 4 !== 0) {
        return false;
      }
    } else if (this.performanceMode === 'balanced') {
      this.frameSkipCounter++;
      // Moderate skipping for balanced mode - skip 1 out of 3 frames
      if (this.frameSkipCounter % 3 === 0) {
        return false;
      }
    }

    // Respect minimum inference interval with adaptive timing
    const adaptiveMinInterval = this.performanceMode === 'power_save' ? minInterval * 2 : minInterval;
    if (timeSinceLastInference < adaptiveMinInterval) {
      return false;
    }

    // Battery-aware optimization (if available)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level && battery.level < 0.2) { // Battery below 20%
          this.performanceMode = 'power_save';
        }
      }).catch(() => {}); // Silently fail if battery API not available
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

  // SIMPLIFIED MODEL-SPECIFIC DETECTION FUNCTIONS
  // Each model gets its own optimized detection logic
  
  // ESP32 Detection - Single class, optimized for circuit boards
  private processESP32Output(predictions: tf.Tensor, originalWidth: number, originalHeight: number): DetectionResult[] {
    const data = predictions.dataSync() as Float32Array;
    const detections: DetectionResult[] = [];
    
    // ESP32 model: single class at index 0, simplified processing
    const confThreshold = 0.3;
    const numBoxes = 8400;
    
    console.log('🔧 ESP32 Detection - Processing output...');
    
    for (let i = 0; i < numBoxes; i++) {
      // ESP32 confidence at index 4 (after 4 bbox coordinates)
      const confidence = data[4 * numBoxes + i];
      
      if (confidence > confThreshold) {
        // Get bbox coordinates (center format)
        const cx = data[0 * numBoxes + i] * originalWidth / 640;
        const cy = data[1 * numBoxes + i] * originalHeight / 640;
        const w = data[2 * numBoxes + i] * originalWidth / 640;
        const h = data[3 * numBoxes + i] * originalHeight / 640;
        
        // Convert to corner format
        const x1 = Math.max(0, cx - w/2);
        const y1 = Math.max(0, cy - h/2);
        const x2 = Math.min(originalWidth, cx + w/2);
        const y2 = Math.min(originalHeight, cy + h/2);
        
        // Validate box size (ESP32 boards have reasonable size constraints)
        if (w > 40 && h > 30 && w < originalWidth * 0.8 && h < originalHeight * 0.8) {
          detections.push({
            class: 'ESP32',
            confidence: confidence,
            bbox: [x1, y1, x2, y2],
            score: confidence
          });
        }
      }
    }
    
    console.log(`✅ ESP32: Found ${detections.length} detections`);
    return this.applyNMS(detections, 0.4);
  }
  
  // Motor Connected Detection - 2 classes: ["connected", "motor"]
  private processMotorConnectedOutput(predictions: tf.Tensor, originalWidth: number, originalHeight: number): DetectionResult[] {
    const data = predictions.dataSync() as Float32Array;
    const detections: DetectionResult[] = [];
    const classes = ['connected', 'motor'];
    
    const confThreshold = 0.25;
    const numBoxes = 8400;
    
    console.log('⚡ Motor Connected - Processing output...');
    
    for (let i = 0; i < numBoxes; i++) {
      // Check both classes (connected at index 4, motor at index 5)
      for (let c = 0; c < classes.length; c++) {
        const confidence = data[(4 + c) * numBoxes + i];
        
        if (confidence > confThreshold) {
          // Get bbox coordinates
          const cx = data[0 * numBoxes + i] * originalWidth / 640;
          const cy = data[1 * numBoxes + i] * originalHeight / 640;
          const w = data[2 * numBoxes + i] * originalWidth / 640;
          const h = data[3 * numBoxes + i] * originalHeight / 640;
          
          const x1 = Math.max(0, cx - w/2);
          const y1 = Math.max(0, cy - h/2);
          const x2 = Math.min(originalWidth, cx + w/2);
          const y2 = Math.min(originalHeight, cy + h/2);
          
          // Validate detection
          if (w > 20 && h > 20 && w < originalWidth && h < originalHeight) {
            detections.push({
              class: classes[c],
              confidence: confidence,
              bbox: [x1, y1, x2, y2],
              score: confidence
            });
          }
        }
      }
    }
    
    console.log(`✅ Motor Connected: Found ${detections.length} detections`);
    return this.applyNMS(detections, 0.3);
  }
  
  // Motor Not Connected Detection - 1 class: ["connect_here"]
  private processMotorNotConnectedOutput(predictions: tf.Tensor, originalWidth: number, originalHeight: number): DetectionResult[] {
    const data = predictions.dataSync() as Float32Array;
    const detections: DetectionResult[] = [];
    
    const confThreshold = 0.25;
    const numBoxes = 8400;
    
    console.log('🔌 Motor Not Connected - Processing output...');
    
    for (let i = 0; i < numBoxes; i++) {
      // Single class "connect_here" at index 4
      const confidence = data[4 * numBoxes + i];
      
      if (confidence > confThreshold) {
        // Get bbox coordinates
        const cx = data[0 * numBoxes + i] * originalWidth / 640;
        const cy = data[1 * numBoxes + i] * originalHeight / 640;
        const w = data[2 * numBoxes + i] * originalWidth / 640;
        const h = data[3 * numBoxes + i] * originalHeight / 640;
        
        const x1 = Math.max(0, cx - w/2);
        const y1 = Math.max(0, cy - h/2);
        const x2 = Math.min(originalWidth, cx + w/2);
        const y2 = Math.min(originalHeight, cy + h/2);
        
        // Validate detection
        if (w > 15 && h > 15 && w < originalWidth && h < originalHeight) {
          detections.push({
            class: 'connect_here',
            confidence: confidence,
            bbox: [x1, y1, x2, y2],
            score: confidence
          });
        }
      }
    }
    
    console.log(`✅ Motor Not Connected: Found ${detections.length} detections`);
    return this.applyNMS(detections, 0.3);
  }
  
  // Breadboard Detection - 1 class: ["breadboard"]
  private processBreadboardOutput(predictions: tf.Tensor, originalWidth: number, originalHeight: number): DetectionResult[] {
    const data = predictions.dataSync() as Float32Array;
    const detections: DetectionResult[] = [];
    
    const confThreshold = 0.3;
    const numBoxes = 8400;
    
    console.log('🍞 Breadboard - Processing output...');
    
    for (let i = 0; i < numBoxes; i++) {
      // Single class "breadboard" at index 4
      const confidence = data[4 * numBoxes + i];
      
      if (confidence > confThreshold) {
        // Get bbox coordinates
        const cx = data[0 * numBoxes + i] * originalWidth / 640;
        const cy = data[1 * numBoxes + i] * originalHeight / 640;
        const w = data[2 * numBoxes + i] * originalWidth / 640;
        const h = data[3 * numBoxes + i] * originalHeight / 640;
        
        const x1 = Math.max(0, cx - w/2);
        const y1 = Math.max(0, cy - h/2);
        const x2 = Math.min(originalWidth, cx + w/2);
        const y2 = Math.min(originalHeight, cy + h/2);
        
        // Breadboards are typically rectangular with specific size constraints
        if (w > 50 && h > 30 && w < originalWidth * 0.9 && h < originalHeight * 0.9) {
          detections.push({
            class: 'breadboard',
            confidence: confidence,
            bbox: [x1, y1, x2, y2],
            score: confidence
          });
        }
      }
    }
    
    console.log(`✅ Breadboard: Found ${detections.length} detections`);
    return this.applyNMS(detections, 0.4);
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

  // Advanced Motor Model Optimization for iOS PWA
  private async optimizeMotorModels(): Promise<void> {
    console.log('🔧 Applying advanced motor model optimizations...');
    
    try {
      // Model-specific optimizations for motor detection
      if (this.motorConnectedModel && this.motorNotConnectedModel) {
        
        // 1. Model Warm-up: Run dummy inference to optimize GPU kernel compilation
        console.log('🔥 Warming up motor models for optimal performance...');
        const dummyInput = tf.zeros([1, 640, 640, 3]);
        
        // Parallel warm-up for both models
        const warmupPromises = [
          this.motorConnectedModel.predict(dummyInput),
          this.motorNotConnectedModel.predict(dummyInput)
        ];
        
        const warmupResults = await Promise.all(warmupPromises);
        
                 // Cleanup warmup tensors
         dummyInput.dispose();
         warmupResults.forEach(result => {
           if (Array.isArray(result)) {
             result.forEach(tensor => {
               if (tensor && typeof tensor.dispose === 'function') {
                 tensor.dispose();
               }
             });
           } else if (result && typeof result.dispose === 'function') {
             result.dispose();
           }
         });
        
        console.log('✅ Motor models warmed up successfully');
        
        // 2. Performance Profiling
        await this.profileModelPerformance();
        
        // 3. Memory Optimization
        this.optimizeModelMemoryUsage();
        
        // 4. iOS-specific WebGL optimizations for motor detection
        this.applyMotorModelWebGLOptimizations();
      }
    } catch (error) {
      console.warn('⚠️ Motor model optimization failed (non-critical):', error);
    }
  }

  private async profileModelPerformance(): Promise<void> {
    if (!this.motorConnectedModel || !this.motorNotConnectedModel) return;
    
    console.log('📊 Profiling motor model performance...');
    
    const testInput = tf.zeros([1, 640, 640, 3]);
    const iterations = 3;
    
    // Profile motor_connected model
    let connectedTotal = 0;
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
             const result = await this.motorConnectedModel.predict(testInput);
       const end = performance.now();
       connectedTotal += (end - start);
       
       if (Array.isArray(result)) {
         result.forEach(tensor => {
           if (tensor && typeof tensor.dispose === 'function') {
             tensor.dispose();
           }
         });
       } else if (result && typeof result.dispose === 'function') {
         result.dispose();
       }
    }
    
    // Profile motor_not_connected model
    let notConnectedTotal = 0;
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
             const result = await this.motorNotConnectedModel.predict(testInput);
       const end = performance.now();
       notConnectedTotal += (end - start);
       
       if (Array.isArray(result)) {
         result.forEach(tensor => {
           if (tensor && typeof tensor.dispose === 'function') {
             tensor.dispose();
           }
         });
       } else if (result && typeof result.dispose === 'function') {
         result.dispose();
       }
    }
    
    testInput.dispose();
    
    const avgConnected = connectedTotal / iterations;
    const avgNotConnected = notConnectedTotal / iterations;
    
    console.log(`📈 Motor Model Performance Profile:
    • Motor Connected: ${avgConnected.toFixed(1)}ms avg
    • Motor Not Connected: ${avgNotConnected.toFixed(1)}ms avg
    • Total Models Memory: ${tf.memory().numBytes / (1024 * 1024)}MB`);
    
    // Adjust performance mode based on profiling results
    if (avgConnected > 150 || avgNotConnected > 150) {
      console.log('🔄 Adjusting to power_save mode due to slow inference');
      this.performanceMode = 'power_save';
    }
  }

  private optimizeModelMemoryUsage(): void {
    console.log('🧠 Optimizing motor model memory usage...');
    
    // Force tensor cleanup
    this.performMemoryCleanup();
    
    // Set iOS-specific memory optimizations
    if (this.deviceCapabilities.isIOSDevice) {
      // Reduce texture cache size for motor models
      tf.env().set('WEBGL_MAX_TEXTURE_SIZE', 2048);
      tf.env().set('WEBGL_SIZE_UPLOAD_UNIFORM', 2);
      
      // Enable aggressive memory recycling
      tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', -1);
      
      console.log('✅ iOS motor model memory optimizations applied');
    }
  }

  private applyMotorModelWebGLOptimizations(): void {
    if (!this.deviceCapabilities.isIOSDevice) return;
    
    console.log('🔧 Applying iOS WebGL optimizations for motor detection...');
    
    // Motor detection specific WebGL settings
    tf.env().set('WEBGL_PACK', true); // Enable texture packing for better performance
    tf.env().set('WEBGL_LAZILY_UNPACK', true); // Lazy unpacking for memory efficiency
    tf.env().set('WEBGL_CONV_IM2COL', true); // Optimize convolution operations
    
    // iPhone-specific optimizations
    if (/iPhone/.test(navigator.userAgent)) {
      tf.env().set('WEBGL_DOWNLOAD_FLOAT_ENABLED', false); // Disable for stability
      tf.env().set('WEBGL_FENCE_API_ENABLED', true); // Enable for better synchronization
    }
    
    console.log('✅ Motor model WebGL optimizations applied');
  }

     // Enhanced model caching with compression (reserved for future use)
   /* private async cacheOptimizedModel(modelType: ModelType, model: tf.GraphModel): Promise<void> {
    if (!('caches' in window)) return;
    
    try {
      const cacheKey = `optimized-model-${modelType}-v2`;
      const cache = await caches.open('ml-models-optimized');
      
      // Create model metadata for caching
      const modelData = {
        type: modelType,
        optimized: true,
        timestamp: Date.now(),
        deviceCapabilities: this.deviceCapabilities,
        performanceProfile: {
          averageInferenceTime: 0, // Will be updated after profiling
          memoryUsage: tf.memory().numBytes
        }
      };
      
      const response = new Response(JSON.stringify(modelData), {
        headers: { 'Content-Type': 'application/json' }
      });
      
      await cache.put(cacheKey, response);
      console.log(`💾 Cached optimized model metadata: ${modelType}`);
         } catch (error) {
       console.warn('⚠️ Model caching failed (non-critical):', error);
     }
   } */

  // ENHANCED MODEL VALIDATION & DEBUGGING
  private async validateModelOutput(model: tf.GraphModel, modelName: string): Promise<boolean> {
    try {
      console.log(`🔍 Validating ${modelName} model output format...`);
      
      const testInput = tf.zeros([1, 640, 640, 3]);
      const output = model.predict(testInput) as tf.Tensor;
      
      console.log(`📊 ${modelName} output shape:`, output.shape);
      console.log(`📊 ${modelName} output dtype:`, output.dtype);
      
      // Validate expected YOLO format: [1, 84, 8400] or similar
      const expectedNumBoxes = 8400;
      const shape = output.shape;
      
      if (shape.length !== 3) {
        console.error(`❌ ${modelName}: Expected 3D output, got ${shape.length}D`);
        return false;
      }
      
      if (shape[2] !== expectedNumBoxes) {
        console.warn(`⚠️ ${modelName}: Expected ${expectedNumBoxes} boxes, got ${shape[2]}`);
      }
      
      // Quick data sanity check
      const data = output.dataSync() as Float32Array;
      const hasValidData = !isNaN(data[0]) && isFinite(data[0]);
      
      if (!hasValidData) {
        console.error(`❌ ${modelName}: Output contains invalid data`);
        return false;
      }
      
      console.log(`✅ ${modelName} model output validation passed`);
      
      // Cleanup
      testInput.dispose();
      output.dispose();
      
      return true;
      
    } catch (error) {
      console.error(`❌ ${modelName} validation failed:`, error);
      return false;
    }
  }

  // OPTIMIZED MODEL LOADING WITH COMPRESSION DETECTION
  private async loadModelWithOptimization(url: string, modelType: ModelType): Promise<tf.GraphModel> {
    console.log(`🚀 Loading ${modelType} model with optimizations...`);
    
    try {
      // Add model-specific loading optimizations
      const loadOptions: tf.io.LoadOptions = {
        requestInit: {
          cache: this.deviceCapabilities.isIOSPWA ? 'no-cache' : 'default',
          mode: 'cors'
        }
      };
      
      // iOS PWA cache-busting for problematic models
      const cacheBuster = this.deviceCapabilities.isIOSPWA ? `?v=${Date.now()}` : '';
      const modelUrl = `${url}${cacheBuster}`;
      
      const startTime = performance.now();
      const model = await tf.loadGraphModel(modelUrl, loadOptions);
      const loadTime = performance.now() - startTime;
      
      console.log(`⏱️ ${modelType} loaded in ${loadTime.toFixed(1)}ms`);
      
      // Validate model output format
      const isValid = await this.validateModelOutput(model, modelType);
      if (!isValid) {
        throw new Error(`${modelType} model validation failed`);
      }
      
      return model;
      
    } catch (error) {
      console.error(`❌ Failed to load ${modelType} model:`, error);
      throw error;
    }
  }

  // SMART MODEL PRELOADING (load most commonly used models first)
  async preloadEssentialModels(): Promise<void> {
    console.log('🔥 Preloading essential models for faster startup...');
    
    try {
      // Load ESP32 first (most commonly used)
      if (!this.modelsInitialized.has('esp32')) {
        await this.initializeModel('esp32');
      }
      
      // Preload motor models in background if memory allows
      if (!this.deviceCapabilities.hasLimitedMemory) {
        const backgroundLoads = [
          this.initializeModel('motor_connected'),
          this.initializeModel('motor_not_connected')
        ];
        
        // Don't wait for these, load in background
        Promise.all(backgroundLoads).then(() => {
          console.log('✅ Background model preloading complete');
        }).catch(error => {
          console.warn('⚠️ Background preloading failed (non-critical):', error);
        });
      }
      
    } catch (error) {
      console.warn('⚠️ Essential model preloading failed:', error);
    }
  }
}

export const mlService = new MLService();