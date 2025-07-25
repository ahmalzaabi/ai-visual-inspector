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

// Enhanced ML Service with ESP32 Detection
class MLService {
  private esp32Model: tf.GraphModel | null = null;
  private isInitialized = false;
  private deviceCapabilities = getDeviceCapabilities();

  constructor() {
    console.log('🔧 ML Service initialized with ESP32 detection');
  }

  // Initialize TensorFlow backend
  async initializeTensorFlow(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing TensorFlow...');
    
    try {
      await tf.ready();
      
      if (this.deviceCapabilities.isIOSDevice) {
        try {
          await tf.setBackend('webgl');
          tf.env().set('WEBGL_VERSION', 1);
          tf.env().set('WEBGL_FORCE_F16_TEXTURES', false);
        } catch (webglError) {
          await tf.setBackend('cpu');
        }
      } else {
        await tf.setBackend('webgl');
      }
      
      this.isInitialized = true;
      console.log('✅ TensorFlow backend ready');
      
    } catch (error) {
      console.error('❌ TensorFlow initialization failed:', error);
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
      console.log('Loading model from:', modelUrl);
      
      this.esp32Model = await tf.loadGraphModel(modelUrl);
      
      // Warm up the model with a test input
      console.log('Warming up model...');
      const testInput = tf.zeros([1, 640, 640, 3]);
      const output = this.esp32Model.predict(testInput);
      
      // Handle both single tensor and array of tensors
      let outputTensor: tf.Tensor;
      if (Array.isArray(output)) {
        outputTensor = output[0];
        console.log('Model output shape (array):', output.map(t => t.shape));
      } else {
        outputTensor = output as tf.Tensor;
        console.log('Model output shape (single):', outputTensor.shape);
      }
      
      testInput.dispose();
      if (Array.isArray(output)) {
        output.forEach(t => t.dispose());
      } else {
        (output as tf.Tensor).dispose();
      }
      
      console.log('✅ ESP32 model ready');
      
    } catch (error) {
      console.error('❌ ESP32 model loading failed:', error);
      this.esp32Model = null;
      throw error;
    }
  }

  // ESP32 Detection Function
  async detectESP32(canvas: HTMLCanvasElement, videoElement?: HTMLVideoElement): Promise<ESP32Analysis> {
    if (!this.esp32Model) {
      await this.initializeESP32Model();
    }

    if (!this.esp32Model) {
      console.error('Model failed to initialize');
      return {
        detections: [],
        esp32Detected: false,
        confidenceScore: 0,
        status: 'unknown'
      };
    }

    try {
      // Prepare input tensor
      let inputTensor: tf.Tensor4D;
      if (videoElement) {
        // Create temporary canvas for video frame
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) throw new Error('Cannot get canvas context');
        
        tempCanvas.width = 640;
        tempCanvas.height = 640;
        tempCtx.drawImage(videoElement, 0, 0, 640, 640);
        
        inputTensor = tf.browser.fromPixels(tempCanvas)
          .toFloat()
          .div(255.0)
          .expandDims(0) as tf.Tensor4D;
      } else {
        inputTensor = tf.browser.fromPixels(canvas)
          .resizeBilinear([640, 640])
          .toFloat()
          .div(255.0)
          .expandDims(0) as tf.Tensor4D;
      }

      console.log('Input tensor shape:', inputTensor.shape);

      // Run inference
      const predictions = this.esp32Model.predict(inputTensor);
      
      // Handle different output formats
      let predictionTensor: tf.Tensor;
      if (Array.isArray(predictions)) {
        predictionTensor = predictions[0];
        console.log('Prediction shapes (array):', predictions.map(p => p.shape));
      } else {
        predictionTensor = predictions as tf.Tensor;
        console.log('Prediction shape (single):', predictionTensor.shape);
      }
      
      // Parse YOLOv8 output
      const analysis = await this.parseYOLOv8Output(
        predictionTensor, 
        canvas.width, 
        canvas.height
      );

      // Cleanup
      inputTensor.dispose();
      if (Array.isArray(predictions)) {
        predictions.forEach(p => p.dispose());
      } else {
        (predictions as tf.Tensor).dispose();
      }

      return analysis;

    } catch (error) {
      console.error('ESP32 detection failed:', error);
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
    
    console.log('Model output shape:', shape);
    console.log('First 20 values:', Array.from(data.slice(0, 20)));
    
    const detections: ESP32Detection[] = [];
    const confThreshold = 0.3; // Lower threshold for better detection
    
    // Handle different YOLOv8 output formats
    if (shape.length === 3 && shape[0] === 1) {
      // Format: [1, features, anchors]
      if (shape[1] === 5 && shape[2] === 8400) {
        // Format: [1, 5, 8400] - [x, y, w, h, conf]
        const numAnchors = shape[2];
        
        for (let i = 0; i < numAnchors; i++) {
          const x = data[i];                    // x center (normalized 0-1)
          const y = data[numAnchors + i];       // y center (normalized 0-1)  
          const w = data[2 * numAnchors + i];   // width (normalized 0-1)
          const h = data[3 * numAnchors + i];   // height (normalized 0-1)
          const conf = data[4 * numAnchors + i]; // confidence
          
          // Apply sigmoid if needed (check if confidence is already sigmoid)
          const confidence = conf > 1 ? 1 / (1 + Math.exp(-conf)) : Math.max(0, Math.min(1, conf));
          
          if (confidence > confThreshold) {
            // Convert normalized coordinates to pixel coordinates
            const centerX = x * originalWidth;
            const centerY = y * originalHeight;
            const width = w * originalWidth;
            const height = h * originalHeight;
            
            // Convert center coordinates to top-left coordinates
            const left = Math.max(0, centerX - width / 2);
            const top = Math.max(0, centerY - height / 2);
            
            // Validate detection
            if (width > 20 && height > 20 && 
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
      } else if (shape[1] === 8400 && shape[2] === 5) {
        // Format: [1, 8400, 5] - transposed
        const numAnchors = shape[1];
        
        for (let i = 0; i < numAnchors; i++) {
          const x = data[i * 5];       // x center
          const y = data[i * 5 + 1];   // y center
          const w = data[i * 5 + 2];   // width
          const h = data[i * 5 + 3];   // height
          const conf = data[i * 5 + 4]; // confidence
          
          const confidence = conf > 1 ? 1 / (1 + Math.exp(-conf)) : Math.max(0, Math.min(1, conf));
          
          if (confidence > confThreshold) {
            const centerX = x * originalWidth;
            const centerY = y * originalHeight;
            const width = w * originalWidth;
            const height = h * originalHeight;
            
            const left = Math.max(0, centerX - width / 2);
            const top = Math.max(0, centerY - height / 2);
            
            if (width > 20 && height > 20 && 
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
    }

    console.log(`Found ${detections.length} ESP32 detections`);
    
    // Apply Non-Maximum Suppression
    const finalDetections = this.applyNMS(detections, 0.4);
    
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

  // Get device capabilities
  getDeviceCapabilities(): DeviceCapabilities {
    return this.deviceCapabilities;
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