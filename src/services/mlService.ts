import * as tf from '@tensorflow/tfjs';
// Note: MediaPipe Hands will be loaded dynamically when needed

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

// Motor Wire Detection Types
export interface MotorWireDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: 'connected' | 'not_connected';
}

export interface MotorWireAnalysis {
  detections: MotorWireDetection[];
  connectedCount: number;
  notConnectedCount: number;
  totalConnections: number;
  isFullyConnected: boolean;
  confidenceScore: number;
  status: 'fully_connected' | 'partially_connected' | 'not_connected' | 'unknown';
}

// Anti-Static Wrist Strap Detection Types
export interface WristStrapDetection {
  handedness: 'Left' | 'Right';
  wristX: number;
  wristY: number;
  bluePixelPercentage: number;
  confidence: number;
  hasStrap: boolean;
}

export interface WristStrapAnalysis {
  detections: WristStrapDetection[];
  handsWithStraps: number;
  totalHands: number;
  isWearingStrap: boolean;
  averageConfidence: number;
  status: 'wearing_strap' | 'no_strap' | 'checking' | 'unknown';
}

// ML Service with TensorFlow.js for multiple models
class MLService {
  public esp32Model: tf.GraphModel | null = null;
  public motorWireModel: tf.GraphModel | null = null;
  public handsModel: any = null; // MediaPipe Hands model
  private isInitialized = false;
  private currentActiveModel: 'esp32' | 'motor_wire' | 'hands' | null = null;

  constructor() {
    console.log('🔧 ESP32 ML Service initialized');
  }

  // Initialize TensorFlow backend
  async initializeTensorFlow(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing TensorFlow.js...');
    
    try {
      // SAFARI-IDENTICAL TENSORFLOW INITIALIZATION (PWA + Safari)
      const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                      (window.navigator as any).standalone === true;
      
      if (isIOSPWA) {
        console.log('🔄 PWA DETECTED: Using Safari-identical TensorFlow.js setup...');
      }
      
      // Use Safari browser settings for ALL iOS devices (no PWA differences)
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        console.log('📱 iOS Device: Using Safari-optimized TensorFlow.js settings...');
        
        // Safari-optimized WebGL settings (no PWA-specific changes)
        tf.env().set('WEBGL_VERSION', 2);
        tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
        tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
        tf.env().set('WEBGL_RENDER_FLOAT32_CAPABLE', false);
        tf.env().set('WEBGL_FLUSH_THRESHOLD', 1);
        tf.env().set('WEBGL_SIZE_UPLOAD_UNIFORM', 4);
        tf.env().set('WEBGL_MAX_TEXTURE_SIZE', 4096);
        tf.env().set('WEBGL_PACK_NORMALIZATION', true);
        tf.env().set('WEBGL_PACK_CLIP', true);
        tf.env().set('WEBGL_PACK_DEPTHWISECONV', true);
        tf.env().set('WEBGL_CONV_IM2COL', true);
        tf.env().set('WEBGL_LAZILY_UNPACK', true);
        tf.env().set('WEBGL_DOWNLOAD_FLOAT_ENABLED', false);
        
        console.log('✅ Safari-identical WebGL settings applied');
      }
      
      await tf.ready();
      
      // Set backend based on device capabilities - WebGPU > WebGL > CPU
      let backendSet = false;
      
      // Try WebGPU first (fastest for modern devices)
      if (!backendSet) {
        try {
          await tf.setBackend('webgpu');
          console.log('🚀 Using WebGPU backend - Maximum performance!');
          backendSet = true;
        } catch (webgpuError) {
          console.log('⚠️ WebGPU not available, trying WebGL...');
        }
      }
      
      // Try WebGL as fallback
      if (!backendSet) {
        try {
          await tf.setBackend('webgl');
          console.log('✅ Using WebGL backend for GPU acceleration');
          backendSet = true;
        } catch (webglError) {
          console.warn('⚠️ WebGL failed, falling back to CPU:', webglError);
        }
      }
      
      // CPU as final fallback
      if (!backendSet) {
        await tf.setBackend('cpu');
        console.log('📱 Using CPU backend');
        
        // iPhone PWA specific: If GPU backends fail, use conservative settings
        if (isIOSPWA) {
          console.log('📱 iPhone PWA using CPU backend - applying conservative settings');
          tf.env().set('CPU_HANDOFF_SIZE_THRESHOLD', 512); // Smaller threshold for iPhone
        }
      }
      
      this.isInitialized = true;
      console.log('✅ TensorFlow.js ready, backend:', tf.getBackend());
      
      // Memory cleanup for iPhone
      if (isIOSPWA) {
        this.startMemoryMonitoring();
      }
      
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

      // Enhanced model loading for PWA and regular browsers
      // SAFARI-IDENTICAL MODEL LOADING (PWA + Safari)
      const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                      (window.navigator as any).standalone === true;
      
      if (isIOSPWA) {
        console.log('📱 PWA MODE: Using Safari-identical model loading strategy...');
      }
      
      // Use IDENTICAL loading strategy for both PWA and Safari
      const modelUrl = '/models/esp32/model.json';
      console.log('🚀 LOADING ESP32 MODEL (PWA=Safari strategy):', modelUrl);
      
      // Load with Safari-identical approach (no PWA-specific handling)
      this.esp32Model = await tf.loadGraphModel(modelUrl);
      console.log('✅ ESP32 Model loaded successfully');
      
      // Get model info
      if (this.esp32Model.inputs && this.esp32Model.inputs[0]) {
        const inputShape = this.esp32Model.inputs[0].shape;
        console.log('📊 ESP32 Model input shape:', inputShape);
      }
      
      if (this.esp32Model.outputs && this.esp32Model.outputs[0]) {
        const outputShape = this.esp32Model.outputs[0].shape;
        console.log('📊 ESP32 Model output shape:', outputShape);
      }
      
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
      const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                      (window.navigator as any).standalone === true;
      
      console.log('🔍 Starting ESP32 detection...', {
        isPWA: isIOSPWA,
        hasVideo: !!videoElement,
                 videoReady: videoElement ? (videoElement.readyState ?? 0) >= 2 : false,
        canvasSize: `${canvas.width}x${canvas.height}`,
        videoSize: videoElement ? `${videoElement.videoWidth}x${videoElement.videoHeight}` : 'N/A'
      });
      
      // PWA-SAFE: Always use canvas as source for consistent behavior
      let sourceElement: HTMLCanvasElement | HTMLVideoElement;
      
             if (isIOSPWA) {
         // PWA MODE: Create separate processing canvas to avoid interfering with UI canvas
         console.log('📱 PWA MODE: Creating separate processing canvas for consistent pixel access');
         
         if (videoElement && videoElement.readyState && videoElement.readyState >= 2) {
           // Create temporary canvas for processing only
           const processingCanvas = document.createElement('canvas');
           const ctx = processingCanvas.getContext('2d');
           if (ctx) {
             processingCanvas.width = videoElement.videoWidth || 640;
             processingCanvas.height = videoElement.videoHeight || 480;
             ctx.drawImage(videoElement, 0, 0, processingCanvas.width, processingCanvas.height);
             console.log('📱 PWA: Created processing canvas', `${processingCanvas.width}x${processingCanvas.height}`);
             sourceElement = processingCanvas;
           } else {
             console.log('📱 PWA: Fallback to video element (no canvas context)');
             sourceElement = videoElement;
           }
         } else {
           console.log('📱 PWA: Using original canvas (no video available)');
           sourceElement = canvas;
         }
       } else {
         // SAFARI MODE: Use video directly if available
         sourceElement = videoElement && videoElement.readyState >= 2 ? videoElement : canvas;
         console.log('🌐 SAFARI MODE: Using', sourceElement === videoElement ? 'video' : 'canvas', 'as source');
       }
      
             // Calculate dimensions based on source element type
       let imageWidth: number, imageHeight: number;
       if (sourceElement === videoElement) {
         imageWidth = videoElement.videoWidth || canvas.width;
         imageHeight = videoElement.videoHeight || canvas.height;
       } else if (sourceElement !== canvas) {
         // Processing canvas case (PWA mode)
         imageWidth = sourceElement.width;
         imageHeight = sourceElement.height;
       } else {
         // Original canvas case
         imageWidth = canvas.width;
         imageHeight = canvas.height;
       }
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      console.log(`📐 Final processing: ${imageWidth} x ${imageHeight}, canvas: ${canvasWidth} x ${canvasHeight}`);
      
      // Preprocess image with enhanced debugging
      console.log('🔄 Starting image preprocessing...');
      const inputTensor = this.preprocessImage(sourceElement);
      console.log('✅ Image preprocessing completed, tensor shape:', inputTensor.shape);

      // Run inference
      console.log('🧠 Starting model inference...');
      const startTime = performance.now();
      const predictions = this.esp32Model.predict(inputTensor) as tf.Tensor;
      const inferenceTime = performance.now() - startTime;
      
      console.log(`⚡ ESP32 inference completed: ${inferenceTime.toFixed(1)}ms`);
      console.log('📊 Raw predictions shape:', predictions.shape);
      
      // Parse ESP32 output
      console.log('🔍 Parsing detection results...');
      const analysis = await this.parseESP32Output(predictions, imageWidth, imageHeight, canvasWidth, canvasHeight);
      console.log('📊 Detection analysis complete:', {
        detections: analysis.detections.length,
        esp32Detected: analysis.esp32Detected,
        avgConfidence: analysis.detections.length > 0 ? 
          (analysis.detections.reduce((sum, d) => sum + d.confidence, 0) / analysis.detections.length).toFixed(2) : '0'
      });

      // Aggressive cleanup for iPhone PWA
      inputTensor.dispose();
      predictions.dispose();
      
      if (isIOSPWA) {
        tf.disposeVariables(); // Cleanup orphaned tensors
      }

      return analysis;

    } catch (error) {
      console.error('❌ ESP32 detection failed:', error);
      const errorDetails = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : { message: String(error) };
      console.error('❌ Error details:', errorDetails);
      return {
        detections: [],
        esp32Detected: false,
        confidenceScore: 0,
        status: 'unknown'
      };
    }
  }
  
  // Image preprocessing (Safari-identical for PWA and Safari)
  private preprocessImage(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): tf.Tensor4D {
    return tf.tidy(() => {
      const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                      (window.navigator as any).standalone === true;
      
      console.log('🔄 Preprocessing image:', {
        elementType: imageElement.constructor.name,
        elementSize: `${imageElement.width || 0}x${imageElement.height || 0}`,
        isPWA: isIOSPWA
      });
      
      // Convert image to tensor with error handling
      let tensor: tf.Tensor3D;
      try {
        tensor = tf.browser.fromPixels(imageElement);
        console.log('✅ Successfully created tensor from pixels:', tensor.shape);
      } catch (error) {
        console.error('❌ Failed to create tensor from pixels:', error);
        throw new Error(`Failed to process image: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // SAFARI-IDENTICAL: Use same target size for both PWA and Safari (640x640)
      const targetSize = 640; // Consistent with Safari for identical behavior
      console.log('📐 Resizing to target size:', targetSize);
      
      // Resize to model input size
      tensor = tf.image.resizeBilinear(tensor, [targetSize, targetSize]) as tf.Tensor3D;
      console.log('✅ Resized tensor:', tensor.shape);
      
      // Normalize to [0, 1] using more efficient method
      tensor = tf.div(tensor, tf.scalar(255)) as tf.Tensor3D;
      console.log('✅ Normalized tensor values');
      
      // Add batch dimension
      const tensor4d = tensor.expandDims(0) as tf.Tensor4D;
      console.log('✅ Added batch dimension:', tensor4d.shape);
      
      return tensor4d;
    });
  }

  // Parse ESP32 model output
  private async parseESP32Output(
    predictions: tf.Tensor,
    imageWidth: number,
    imageHeight: number,
    canvasWidth: number,
    canvasHeight: number
  ): Promise<ESP32Analysis> {
    const predArray = await predictions.data();
    const detections: ESP32Detection[] = [];
    
    const outputShape = predictions.shape;
    console.log('📊 Model output shape:', outputShape);
    
    const confidenceThreshold = 0.6; // Balanced threshold - not too restrictive (was 0.85)
    const iouThreshold = 0.4;
    
    // SAFARI-IDENTICAL: Use consistent input size for both PWA and Safari
    const inputSize = 640; // Always use 640 for identical behavior
    
    const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                    (window.navigator as any).standalone === true;
    console.log('🔍 Parsing output with input size:', inputSize, 'isPWA:', isIOSPWA);
    
    let numDetections: number, numFeatures: number;
    
    if (outputShape.length === 3 && outputShape[0] === 1) {
      if (outputShape[1] === 5) {
        // Format: [1, 5, 8400] - features first
        numFeatures = outputShape[1];
        numDetections = outputShape[2];
        
        console.log(`🔍 Processing format [1, 5, 8400]: ${numDetections} detections, ${numFeatures} features`);
        
        for (let i = 0; i < numDetections; i++) {
          const centerX = predArray[i];
          const centerY = predArray[numDetections + i];
          const width = predArray[2 * numDetections + i];
          const height = predArray[3 * numDetections + i];
          const confidence = predArray[4 * numDetections + i];
          
          if (confidence > confidenceThreshold) {
            const detection = this.createDetection(
              centerX, centerY, width, height, confidence,
              imageWidth, imageHeight, canvasWidth, canvasHeight, inputSize
            );
            if (detection) {
              detections.push(detection);
            }
          }
        }
      } else if (outputShape[2] === 5) {
        // Format: [1, 8400, 5] - detections first
        numDetections = outputShape[1];
        numFeatures = outputShape[2];
        
        console.log(`🔍 Processing format [1, 8400, 5]: ${numDetections} detections, ${numFeatures} features`);
        
        for (let i = 0; i < numDetections; i++) {
          const baseIdx = i * numFeatures;
          const centerX = predArray[baseIdx];
          const centerY = predArray[baseIdx + 1];
          const width = predArray[baseIdx + 2];
          const height = predArray[baseIdx + 3];
          const confidence = predArray[baseIdx + 4];
          
          if (confidence > confidenceThreshold) {
            const detection = this.createDetection(
              centerX, centerY, width, height, confidence,
              imageWidth, imageHeight, canvasWidth, canvasHeight, inputSize
            );
            if (detection) {
              detections.push(detection);
            }
          }
        }
      }
    }
    
    console.log(`🎯 Found ${detections.length} raw ESP32 detections (threshold: ${confidenceThreshold})`);
    
    // Apply Non-Maximum Suppression
    const finalDetections = this.applyNMS(detections, iouThreshold);
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

  // Create detection from model output
  private createDetection(
    centerX: number, centerY: number, width: number, height: number, confidence: number,
    imageWidth: number, imageHeight: number, canvasWidth: number, canvasHeight: number, inputSize: number
  ): ESP32Detection | null {
    // Step 1: Convert model coordinates to original image coordinates
    const imgCenterX = (centerX / inputSize) * imageWidth;
    const imgCenterY = (centerY / inputSize) * imageHeight;
    const imgWidth = (width / inputSize) * imageWidth;
    const imgHeight = (height / inputSize) * imageHeight;
    
    // Step 2: Convert center/width/height to x1,y1,x2,y2
    const imgX1 = imgCenterX - imgWidth / 2;
    const imgY1 = imgCenterY - imgHeight / 2;
    const imgX2 = imgCenterX + imgWidth / 2;
    const imgY2 = imgCenterY + imgHeight / 2;
    
    // Step 3: Scale to canvas coordinates
    const scaleX = canvasWidth / imageWidth;
    const scaleY = canvasHeight / imageHeight;
    
    const x = Math.max(0, imgX1 * scaleX);
    const y = Math.max(0, imgY1 * scaleY);
    const detWidth = Math.abs(imgX2 - imgX1) * scaleX;
    const detHeight = Math.abs(imgY2 - imgY1) * scaleY;
    
    // Validate detection
    if (detWidth > 10 && detHeight > 10 && 
        x >= 0 && y >= 0 &&
        x + detWidth <= canvasWidth && 
        y + detHeight <= canvasHeight) {
      
      return {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(detWidth),
        height: Math.round(detHeight),
        confidence: confidence,
        class: 'ESP32'
      };
    }
    
    return null;
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
        
        const iou = this.calculateIoU(detections[i], detections[j]);
        if (iou > iouThreshold) {
          suppressed.add(j);
        }
      }
    }
    
    return keep;
  }

  // Calculate Intersection over Union
  private calculateIoU(det1: ESP32Detection, det2: ESP32Detection): number {
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

  // Initialize Motor Wire Detection Model
  async initializeMotorWireModel(): Promise<void> {
    if (this.motorWireModel) return;

    console.log('🔌 Loading Motor Wire detection model...');
    
    try {
      await this.initializeTensorFlow();

      // Enhanced model loading for PWA and regular browsers
      // SAFARI-IDENTICAL MODEL LOADING (PWA + Safari) - same as ESP32
      const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                      (window.navigator as any).standalone === true;
      
      if (isIOSPWA) {
        console.log('📱 PWA MODE (Motor Wire): Using Safari-identical model loading strategy...');
      }
      
      // Use IDENTICAL loading strategy for both PWA and Safari
      const modelUrl = '/models/motor_wire_model_web/model.json';
      console.log('🚀 LOADING MOTOR WIRE MODEL (PWA=Safari strategy):', modelUrl);
      
      // Load with Safari-identical approach (no PWA-specific handling)
      this.motorWireModel = await tf.loadGraphModel(modelUrl);
      console.log('✅ Motor Wire Model loaded successfully');
      
      // Get model info
      if (this.motorWireModel.inputs && this.motorWireModel.inputs[0]) {
        const inputShape = this.motorWireModel.inputs[0].shape;
        console.log('📊 Motor Wire Model input shape:', inputShape);
      }
      
      console.log('✅ Motor wire model ready for detection');
      
    } catch (error) {
      console.error('❌ Motor wire model loading failed:', error);
      this.motorWireModel = null;
      throw error;
    }
  }

  // Motor Wire Detection Function
  async detectMotorWires(canvas: HTMLCanvasElement, videoElement?: HTMLVideoElement): Promise<MotorWireAnalysis> {
    if (!this.motorWireModel) {
      console.log('🔄 Motor wire model not loaded, initializing...');
      await this.initializeMotorWireModel();
    }

    if (!this.motorWireModel) {
      console.error('❌ Motor wire model failed to initialize');
      return {
        detections: [],
        connectedCount: 0,
        notConnectedCount: 0,
        totalConnections: 0,
        isFullyConnected: false,
        confidenceScore: 0,
        status: 'unknown'
      };
    }

    try {
      console.log('🔍 Starting Motor Wire detection...');
      
      // Get source element and dimensions
      const sourceElement = videoElement && videoElement.readyState >= 2 ? videoElement : canvas;
      const imageWidth = videoElement?.videoWidth || canvas.width;
      const imageHeight = videoElement?.videoHeight || canvas.height;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      console.log(`Processing motor wire image: ${imageWidth} x ${imageHeight}, canvas: ${canvasWidth} x ${canvasHeight}`);
      
      // Preprocess image for motor wire model (416x416)
      const inputTensor = this.preprocessImageForMotorWire(sourceElement);

      // Run inference
      const startTime = performance.now();
      const predictions = this.motorWireModel.predict(inputTensor) as tf.Tensor;
      const inferenceTime = performance.now() - startTime;
      
      console.log(`⚡ Motor Wire inference time: ${inferenceTime.toFixed(1)}ms`);
      console.log('📊 Motor Wire Predictions shape:', predictions.shape);
      
      // Parse motor wire output
      const analysis = await this.parseMotorWireOutput(predictions, imageWidth, imageHeight, canvasWidth, canvasHeight);

      // Aggressive cleanup for iPhone PWA
      inputTensor.dispose();
      predictions.dispose();
      
      // Force garbage collection on iPhone
      const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                      (window.navigator as any).standalone === true;
      if (isIOSPWA) {
        tf.disposeVariables(); // Cleanup orphaned tensors
      }

      return analysis;

    } catch (error) {
      console.error('❌ Motor wire detection failed:', error);
      return {
        detections: [],
        connectedCount: 0,
        notConnectedCount: 0,
        totalConnections: 0,
        isFullyConnected: false,
        confidenceScore: 0,
        status: 'unknown'
      };
    }
  }

  // Image preprocessing for motor wire model (416x416)
  private preprocessImageForMotorWire(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): tf.Tensor4D {
    return tf.tidy(() => {
      // Convert image to tensor
      let tensor = tf.browser.fromPixels(imageElement);
      
      // Resize to motor wire model input size (416x416)
      tensor = tf.image.resizeBilinear(tensor, [416, 416]);
      
      // Normalize to [0, 1]
      tensor = tensor.div(255.0);
      
      // Add batch dimension
      const tensor4d = tensor.expandDims(0);
      
      return tensor4d as tf.Tensor4D;
    });
  }

  // Parse motor wire model output
  private async parseMotorWireOutput(
    predictions: tf.Tensor,
    imageWidth: number,
    imageHeight: number,
    canvasWidth: number,
    canvasHeight: number
  ): Promise<MotorWireAnalysis> {
    const predArray = await predictions.data();
    const detections: MotorWireDetection[] = [];
    
    const outputShape = predictions.shape;
    console.log('📊 Motor Wire Model output shape:', outputShape);
    
    const confidenceThreshold = 0.6; // Motor wire detection optimized threshold
    const iouThreshold = 0.4;
    const inputSize = 416;
    
    let numDetections: number, numFeatures: number;
    
    if (outputShape.length === 3 && outputShape[0] === 1) {
      if (outputShape[1] === 6) {
        // Format: [1, 6, 8400] - features first (including class predictions)
        numFeatures = outputShape[1];
        numDetections = outputShape[2];
        
        console.log(`🔍 Processing motor wire format [1, 6, 8400]: ${numDetections} detections, ${numFeatures} features`);
        
        for (let i = 0; i < numDetections; i++) {
          const centerX = predArray[i];
          const centerY = predArray[numDetections + i];
          const width = predArray[2 * numDetections + i];
          const height = predArray[3 * numDetections + i];
          const confidence1 = predArray[4 * numDetections + i]; // connected
          const confidence2 = predArray[5 * numDetections + i]; // not_connected
          
          // Get the class with higher confidence
          const isConnected = confidence1 > confidence2;
          const confidence = Math.max(confidence1, confidence2);
          const className = isConnected ? 'connected' : 'not_connected';
          
          if (confidence > confidenceThreshold) {
            const detection = this.createMotorWireDetection(
              centerX, centerY, width, height, confidence, className,
              imageWidth, imageHeight, canvasWidth, canvasHeight, inputSize
            );
            if (detection) {
              detections.push(detection);
            }
          }
        }
      } else if (outputShape[2] === 6) {
        // Format: [1, 8400, 6] - detections first
        numDetections = outputShape[1];
        numFeatures = outputShape[2];
        
        console.log(`🔍 Processing motor wire format [1, 8400, 6]: ${numDetections} detections, ${numFeatures} features`);
        
        for (let i = 0; i < numDetections; i++) {
          const baseIdx = i * numFeatures;
          const centerX = predArray[baseIdx];
          const centerY = predArray[baseIdx + 1];
          const width = predArray[baseIdx + 2];
          const height = predArray[baseIdx + 3];
          const confidence1 = predArray[baseIdx + 4]; // connected
          const confidence2 = predArray[baseIdx + 5]; // not_connected
          
          // Get the class with higher confidence
          const isConnected = confidence1 > confidence2;
          const confidence = Math.max(confidence1, confidence2);
          const className = isConnected ? 'connected' : 'not_connected';
          
          if (confidence > confidenceThreshold) {
            const detection = this.createMotorWireDetection(
              centerX, centerY, width, height, confidence, className,
              imageWidth, imageHeight, canvasWidth, canvasHeight, inputSize
            );
            if (detection) {
              detections.push(detection);
            }
          }
        }
      }
    }
    
    console.log(`🎯 Found ${detections.length} raw motor wire detections (threshold: ${confidenceThreshold})`);
    
    // Apply Non-Maximum Suppression
    const finalDetections = this.applyMotorWireNMS(detections, iouThreshold);
    console.log(`✅ After NMS: ${finalDetections.length} motor wire detections`);
    
    // Calculate statistics
    const connectedCount = finalDetections.filter(d => d.class === 'connected').length;
    const notConnectedCount = finalDetections.filter(d => d.class === 'not_connected').length;
    const totalConnections = finalDetections.length;
    const isFullyConnected = totalConnections > 0 && notConnectedCount === 0;
    
    const avgConfidence = finalDetections.length > 0 
      ? finalDetections.reduce((sum, det) => sum + det.confidence, 0) / finalDetections.length 
      : 0;

    let status: 'fully_connected' | 'partially_connected' | 'not_connected' | 'unknown';
    if (totalConnections === 0) {
      status = 'unknown';
    } else if (isFullyConnected) {
      status = 'fully_connected';
    } else if (connectedCount > 0) {
      status = 'partially_connected';
    } else {
      status = 'not_connected';
    }

    return {
      detections: finalDetections,
      connectedCount,
      notConnectedCount,
      totalConnections,
      isFullyConnected,
      confidenceScore: avgConfidence,
      status
    };
  }

  // Create motor wire detection from model output
  private createMotorWireDetection(
    centerX: number, centerY: number, width: number, height: number, confidence: number, className: string,
    imageWidth: number, imageHeight: number, canvasWidth: number, canvasHeight: number, inputSize: number
  ): MotorWireDetection | null {
    // Step 1: Convert model coordinates to original image coordinates
    const imgCenterX = (centerX / inputSize) * imageWidth;
    const imgCenterY = (centerY / inputSize) * imageHeight;
    const imgWidth = (width / inputSize) * imageWidth;
    const imgHeight = (height / inputSize) * imageHeight;
    
    // Step 2: Convert center/width/height to x1,y1,x2,y2
    const imgX1 = imgCenterX - imgWidth / 2;
    const imgY1 = imgCenterY - imgHeight / 2;
    const imgX2 = imgCenterX + imgWidth / 2;
    const imgY2 = imgCenterY + imgHeight / 2;
    
    // Step 3: Scale to canvas coordinates
    const scaleX = canvasWidth / imageWidth;
    const scaleY = canvasHeight / imageHeight;
    
    const x = Math.max(0, imgX1 * scaleX);
    const y = Math.max(0, imgY1 * scaleY);
    const detWidth = Math.abs(imgX2 - imgX1) * scaleX;
    const detHeight = Math.abs(imgY2 - imgY1) * scaleY;
    
    // Validate detection
    if (detWidth > 10 && detHeight > 10 && 
        x >= 0 && y >= 0 &&
        x + detWidth <= canvasWidth && 
        y + detHeight <= canvasHeight) {
      
      return {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(detWidth),
        height: Math.round(detHeight),
        confidence: confidence,
        class: className as 'connected' | 'not_connected'
      };
    }
    
    return null;
  }

  // Non-Maximum Suppression for motor wire detections
  private applyMotorWireNMS(detections: MotorWireDetection[], iouThreshold: number): MotorWireDetection[] {
    if (detections.length === 0) return [];
    
    // Sort by confidence (highest first)
    detections.sort((a, b) => b.confidence - a.confidence);
    
    const keep: MotorWireDetection[] = [];
    const suppressed = new Set<number>();
    
    for (let i = 0; i < detections.length; i++) {
      if (suppressed.has(i)) continue;
      
      keep.push(detections[i]);
      
      // Suppress overlapping detections
      for (let j = i + 1; j < detections.length; j++) {
        if (suppressed.has(j)) continue;
        
        const iou = this.calculateMotorWireIoU(detections[i], detections[j]);
        if (iou > iouThreshold) {
          suppressed.add(j);
        }
      }
    }
    
    return keep;
  }

  // Calculate Intersection over Union for motor wire detections
  private calculateMotorWireIoU(det1: MotorWireDetection, det2: MotorWireDetection): number {
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

  // Initialize Color-based Hands Detection for Anti-Static Strap Detection
  async initializeHandsModel(): Promise<void> {
    if (this.handsModel) return;

    console.log('👋 Initializing color-based wrist strap detection...');
    
    try {
      await this.initializeTensorFlow();

      // Set up color-based detection (no external dependencies needed)
      this.handsModel = {
        ready: true,
        type: 'color-based'
      };

      console.log('✅ Color-based wrist strap detection ready');
      
    } catch (error) {
      console.error('❌ Wrist strap detection initialization failed:', error);
      this.handsModel = null;
      throw error;
    }
  }

  // Anti-Static Wrist Strap Detection using Color Analysis
  async detectWristStrap(canvas: HTMLCanvasElement, videoElement?: HTMLVideoElement): Promise<WristStrapAnalysis> {
    try {
      console.log('🔍 Starting Anti-Static Wrist Strap detection...');
      
      // Get source element
      const sourceElement = videoElement && videoElement.readyState >= 2 ? videoElement : canvas;
      
      // Use advanced color-based detection
      console.log('🎨 Using color-based wrist strap detection');
      return await this.detectWristStrapByColor(canvas, sourceElement);

    } catch (error) {
      console.error('❌ Wrist strap detection failed:', error);
      return {
        detections: [],
        handsWithStraps: 0,
        totalHands: 0,
        isWearingStrap: false,
        averageConfidence: 0,
        status: 'unknown'
      };
    }
  }

  // Color-based Anti-Static Strap Detection (Blue Color Detection)
  private async detectWristStrapByColor(canvas: HTMLCanvasElement, sourceElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<WristStrapAnalysis> {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Draw the source to canvas for analysis
    ctx.drawImage(sourceElement, 0, 0, canvas.width, canvas.height);
    
    // Get image data for color analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Define blue color range for anti-static wrist straps (HSV converted to RGB ranges)
    const blueRanges = [
      // Primary blue range
      { rMin: 0, rMax: 100, gMin: 50, gMax: 150, bMin: 150, bMax: 255 },
      // Navy blue range  
      { rMin: 0, rMax: 80, gMin: 30, gMax: 120, bMin: 120, bMax: 200 },
      // Electric blue range
      { rMin: 0, rMax: 120, gMin: 80, gMax: 180, bMin: 180, bMax: 255 }
    ];

    // Analyze different regions of the image for blue pixels
    const regions = this.getWristRegions(canvas.width, canvas.height);
    const detections: WristStrapDetection[] = [];

    for (let regionIndex = 0; regionIndex < regions.length; regionIndex++) {
      const region = regions[regionIndex];
      let bluePixelCount = 0;
      let totalPixels = 0;

      // Analyze pixels in this region
      for (let y = region.y; y < region.y + region.height; y += 2) { // Skip pixels for performance
        for (let x = region.x; x < region.x + region.width; x += 2) {
          const pixelIndex = (y * canvas.width + x) * 4;
          const r = data[pixelIndex];
          const g = data[pixelIndex + 1];
          const b = data[pixelIndex + 2];

          totalPixels++;

          // Check if pixel matches any blue range
          for (const range of blueRanges) {
            if (r >= range.rMin && r <= range.rMax &&
                g >= range.gMin && g <= range.gMax &&
                b >= range.bMin && b <= range.bMax) {
              bluePixelCount++;
              break;
            }
          }
        }
      }

      const bluePercentage = totalPixels > 0 ? (bluePixelCount / totalPixels) * 100 : 0;
      const hasStrap = bluePercentage > 15; // Threshold for blue color presence
      const confidence = Math.min(bluePercentage / 30, 1); // Normalize to 0-1

      if (bluePercentage > 5) { // Only include regions with some blue
        detections.push({
          handedness: regionIndex === 0 ? 'Left' : 'Right',
          wristX: region.x + region.width / 2,
          wristY: region.y + region.height / 2,
          bluePixelPercentage: bluePercentage,
          confidence: confidence,
          hasStrap: hasStrap
        });
      }
    }

    // Calculate overall analysis
    const handsWithStraps = detections.filter(d => d.hasStrap).length;
    const totalHands = Math.max(detections.length, 1); // At least 1 to avoid division by zero
    const isWearingStrap = handsWithStraps > 0;
    const averageConfidence = detections.length > 0 
      ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length 
      : 0;

    let status: 'wearing_strap' | 'no_strap' | 'checking' | 'unknown';
    if (isWearingStrap && averageConfidence > 0.6) {
      status = 'wearing_strap';
    } else if (detections.length > 0 && !isWearingStrap) {
      status = 'no_strap';
    } else if (detections.length > 0) {
      status = 'checking';
    } else {
      status = 'unknown';
    }

    console.log(`🔍 Wrist strap analysis: ${handsWithStraps}/${totalHands} hands with straps, avg confidence: ${averageConfidence.toFixed(2)}`);

    return {
      detections,
      handsWithStraps,
      totalHands: detections.length,
      isWearingStrap,
      averageConfidence,
      status
    };
  }

  // Get potential wrist regions for analysis
  private getWristRegions(width: number, height: number) {
    // Define regions where wrists are likely to appear
    return [
      // Left wrist region (bottom-left area)
      { x: Math.floor(width * 0.1), y: Math.floor(height * 0.6), width: Math.floor(width * 0.3), height: Math.floor(height * 0.3) },
      // Right wrist region (bottom-right area)  
      { x: Math.floor(width * 0.6), y: Math.floor(height * 0.6), width: Math.floor(width * 0.3), height: Math.floor(height * 0.3) },
      // Center-bottom region (for hands working in center)
      { x: Math.floor(width * 0.3), y: Math.floor(height * 0.5), width: Math.floor(width * 0.4), height: Math.floor(height * 0.4) }
    ];
  }

  // Performance optimization: Switch between models
  async switchToModel(modelType: 'esp32' | 'motor_wire' | 'hands'): Promise<void> {
    if (this.currentActiveModel === modelType) return;

    console.log(`🔄 Switching to ${modelType} model for better performance...`);

    // Dispose previous model to free memory
    if (this.currentActiveModel === 'esp32' && this.esp32Model) {
      console.log('🗑️ Disposing ESP32 model to free memory');
      this.esp32Model.dispose();
      this.esp32Model = null;
    } else if (this.currentActiveModel === 'motor_wire' && this.motorWireModel) {
      console.log('🗑️ Disposing Motor Wire model to free memory');
      this.motorWireModel.dispose();
      this.motorWireModel = null;
    } else if (this.currentActiveModel === 'hands' && this.handsModel) {
      console.log('🗑️ Disposing Hands model to free memory');
      this.handsModel = null;
    }

    // Load new model
    if (modelType === 'esp32') {
      await this.initializeESP32Model();
    } else if (modelType === 'motor_wire') {
      await this.initializeMotorWireModel();
    } else if (modelType === 'hands') {
      await this.initializeHandsModel().catch(() => {
        console.log('📝 Hands model not available, will use color-based detection');
      });
    }

    this.currentActiveModel = modelType;
    console.log(`✅ Successfully switched to ${modelType} model`);
  }

  // iPhone PWA memory monitoring for aggressive cleanup
  private memoryMonitorInterval: NodeJS.Timeout | null = null;
  

  
  private startMemoryMonitoring(): void {
    if (this.memoryMonitorInterval) return;
    
    this.memoryMonitorInterval = setInterval(() => {
      const memInfo = tf.memory();
      const memoryMB = memInfo.numBytes / (1024 * 1024);
      
      // SUPER AGGRESSIVE cleanup to prevent iPhone heating
      if (memoryMB > 80) { // Lowered from 120MB to 80MB
        console.log(`🧹 AGGRESSIVE iPhone memory cleanup triggered: ${memoryMB.toFixed(1)}MB`);
        tf.disposeVariables();
        tf.engine().startScope();
        tf.engine().endScope();
        
        // Force garbage collection if available
        if (typeof (window as any).gc === 'function') {
          (window as any).gc();
        }
      }
      
      // Emergency cleanup if memory is very high (prevents crashes)
      if (memoryMB > 150) {
        console.log(`🚨 EMERGENCY memory cleanup: ${memoryMB.toFixed(1)}MB - disposing models`);
        this.dispose();
      }
    }, 2000); // Check every 2 seconds (more frequent)
  }

  // Cleanup
  dispose(): void {
    if (this.esp32Model) {
      this.esp32Model.dispose();
      this.esp32Model = null;
    }
    if (this.motorWireModel) {
      this.motorWireModel.dispose();
      this.motorWireModel = null;
    }
    if (this.handsModel) {
      this.handsModel = null;
    }
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = null;
    }
    this.currentActiveModel = null;
    this.isInitialized = false;
  }

  // Status check
  isReady(modelType?: 'esp32' | 'motor_wire' | 'hands'): boolean {
    if (!modelType) {
      return this.isInitialized && (this.esp32Model !== null || this.motorWireModel !== null || this.handsModel !== null);
    }
    return this.isInitialized && (
      (modelType === 'esp32' && this.esp32Model !== null) ||
      (modelType === 'motor_wire' && this.motorWireModel !== null) ||
      (modelType === 'hands') // Hands detection works with color analysis even without MediaPipe
    );
  }
}

// Export singleton instance
export const mlService = new MLService();