import * as tf from '@tensorflow/tfjs';

// Simple ESP32 Detection Types
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

// Device Capabilities Detection
interface DeviceCapabilities {
  isIOSDevice: boolean;
  isIOSPWA: boolean;
  hasLimitedMemory: boolean;
  maxMemoryMB: number;
  maxFPS: number;
  isLowEndDevice: boolean;
}

// iOS PWA Detection Functions
function isIOSPWA(): boolean {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = (window.navigator as any).standalone || 
                      window.matchMedia('(display-mode: standalone)').matches;
  return isIOS && isStandalone;
}

function getDeviceCapabilities(): DeviceCapabilities {
  const userAgent = navigator.userAgent;
  const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
  const estimatedMemory = (performance as any).memory?.usedJSHeapSize 
    ? Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
    : (isIOSDevice ? 512 : 1024);

  return {
    isIOSDevice,
    isIOSPWA: isIOSPWA(),
    hasLimitedMemory: estimatedMemory < 1024,
    maxMemoryMB: estimatedMemory,
    maxFPS: isIOSDevice ? 15 : 30,
    isLowEndDevice: estimatedMemory < 512
  };
}

// Simplified ML Service for ESP32 Only
class MLService {
  private esp32Model: tf.GraphModel | null = null;
  private isInitialized = false;
  private deviceCapabilities = getDeviceCapabilities();

  constructor() {
    console.log('🔧 ESP32 ML Service initialized for device:', {
      isIOSPWA: this.deviceCapabilities.isIOSPWA,
      isIOSDevice: this.deviceCapabilities.isIOSDevice,
      maxMemoryMB: this.deviceCapabilities.maxMemoryMB
    });
  }

  // Initialize ESP32 Model
  async initializeESP32Model(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Loading ESP32 detection model...');
    
    try {
      await tf.ready();
      
      // iOS Safari specific WebGL setup
      if (this.deviceCapabilities.isIOSDevice) {
        try {
          await tf.setBackend('webgl');
          // Conservative iOS WebGL settings
          tf.env().set('WEBGL_VERSION', 1);
          tf.env().set('WEBGL_FORCE_F16_TEXTURES', false);
          tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', -1);
          tf.env().set('WEBGL_MAX_TEXTURE_SIZE', 2048);
          console.log('🍎 iOS WebGL backend initialized');
        } catch (webglError) {
          console.warn('⚠️ WebGL failed on iOS, using CPU:', webglError);
          await tf.setBackend('cpu');
        }
      } else {
        await tf.setBackend('webgl');
      }

      // Load ESP32 model
      const modelUrl = '/models/esp32/model.json';
      this.esp32Model = await this.loadModelWithRetry(modelUrl);
      
      // Test model
      await this.testModel();
      
      this.isInitialized = true;
      console.log('✅ ESP32 model ready!');
      
    } catch (error) {
      console.error('❌ ESP32 model loading failed:', error);
      throw error;
    }
  }

  // Load model with retry logic
  private async loadModelWithRetry(url: string): Promise<tf.GraphModel> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📥 Loading ESP32 model (attempt ${attempt}/${maxRetries})...`);
        
        const loadOptions: tf.io.LoadOptions = {
          requestInit: {
            cache: 'default',
            mode: 'cors'
          }
        };

        const model = await tf.loadGraphModel(url, loadOptions);
        console.log(`✅ ESP32 model loaded successfully on attempt ${attempt}`);
        return model;
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Load attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError || new Error('Failed to load ESP32 model after all retries');
  }

  // Test model inference
  private async testModel(): Promise<void> {
    if (!this.esp32Model) throw new Error('ESP32 model not loaded');
    
    try {
      const inputSize = this.deviceCapabilities.isIOSDevice ? 416 : 640;
      const testInput = tf.zeros([1, inputSize, inputSize, 3]);
      const output = this.esp32Model.predict(testInput) as tf.Tensor;
      
      console.log('🧪 ESP32 model test - Output shape:', output.shape);
      
      // Cleanup
      testInput.dispose();
      output.dispose();
      
    } catch (error) {
      console.error('❌ ESP32 model test failed:', error);
      throw error;
    }
  }

  // Main ESP32 Detection Function
  async detectESP32(canvas: HTMLCanvasElement): Promise<ESP32Analysis> {
    if (!this.isInitialized || !this.esp32Model) {
      console.warn('⚠️ ESP32 model not initialized');
      return {
        detections: [],
        esp32Detected: false,
        confidenceScore: 0,
        status: 'unknown'
      };
    }

    try {
      // Prepare input with iOS-optimized size
      const inputSize = this.deviceCapabilities.isIOSDevice ? 416 : 640;
      const inputTensor = tf.tidy(() => {
        const rawImage = tf.browser.fromPixels(canvas);
        const resized = rawImage.resizeNearestNeighbor([inputSize, inputSize]);
        const normalized = resized.div(255.0);
        
        rawImage.dispose();
        resized.dispose();
        
        return normalized.expandDims(0);
      });

      // Run inference
      const predictions = this.esp32Model.predict(inputTensor) as tf.Tensor;
      
      // Process results
      const analysis = await this.processESP32Output(
        predictions,
        canvas.width,
        canvas.height,
        inputSize
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

  // Process ESP32 Detection Output
  private async processESP32Output(
    predictions: tf.Tensor,
    originalWidth: number,
    originalHeight: number,
    inputSize: number
  ): Promise<ESP32Analysis> {
    const data = await predictions.data();
    const detections: ESP32Detection[] = [];
    
    // YOLO output format: [x, y, w, h, confidence]
    const numBoxes = predictions.shape[1] || 0;
    const confThreshold = 0.5;

    if (numBoxes === 0) {
      return {
        detections: [],
        esp32Detected: false,
        confidenceScore: 0,
        status: 'not_detected'
      };
    }

    for (let i = 0; i < numBoxes; i++) {
      const confidence = data[4 * numBoxes + i];
      
      if (confidence > confThreshold) {
        // Get bbox coordinates with dynamic input size scaling
        const cx = data[0 * numBoxes + i] * originalWidth / inputSize;
        const cy = data[1 * numBoxes + i] * originalHeight / inputSize;
        const w = data[2 * numBoxes + i] * originalWidth / inputSize;
        const h = data[3 * numBoxes + i] * originalHeight / inputSize;
        
        // Convert to corner format
        const x = Math.max(0, cx - w/2);
        const y = Math.max(0, cy - h/2);
        const width = Math.min(originalWidth - x, w);
        const height = Math.min(originalHeight - y, h);

        detections.push({
          x,
          y,
          width,
          height,
          confidence,
          class: 'esp32'
        });
      }
    }

    // Analyze results
    const esp32Detected = detections.length > 0;
    const confidenceScore = esp32Detected 
      ? Math.max(...detections.map(d => d.confidence))
      : 0;

    return {
      detections,
      esp32Detected,
      confidenceScore,
      status: esp32Detected ? 'detected' : 'not_detected'
    };
  }

  // Cleanup
  dispose(): void {
    if (this.esp32Model) {
      this.esp32Model.dispose();
      this.esp32Model = null;
    }
    this.isInitialized = false;
    console.log('🧹 ESP32 ML Service disposed');
  }

  // Status check
  isReady(): boolean {
    return this.isInitialized && this.esp32Model !== null;
  }
}

// Export singleton instance
export const mlService = new MLService();