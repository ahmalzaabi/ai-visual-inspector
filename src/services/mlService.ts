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

// ML Service with TensorFlow.js for multiple models
class MLService {
  public esp32Model: tf.GraphModel | null = null;
  public motorWireModel: tf.GraphModel | null = null;
  private isInitialized = false;
  private currentActiveModel: 'esp32' | 'motor_wire' | null = null;

  constructor() {
    console.log('🔧 ESP32 ML Service initialized');
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
      console.log('🔍 Starting ESP32 detection...');
      
      // Get source element and dimensions
      const sourceElement = videoElement && videoElement.readyState >= 2 ? videoElement : canvas;
      const imageWidth = videoElement?.videoWidth || canvas.width;
      const imageHeight = videoElement?.videoHeight || canvas.height;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      console.log(`Processing image: ${imageWidth} x ${imageHeight}, canvas: ${canvasWidth} x ${canvasHeight}`);
      
      // Preprocess image
      const inputTensor = this.preprocessImage(sourceElement);

      // Run inference
      const startTime = performance.now();
      const predictions = this.esp32Model.predict(inputTensor) as tf.Tensor;
      const inferenceTime = performance.now() - startTime;
      
      console.log(`⚡ ESP32 inference time: ${inferenceTime.toFixed(1)}ms`);
      console.log('📊 Predictions shape:', predictions.shape);
      
      // Parse ESP32 output
      const analysis = await this.parseESP32Output(predictions, imageWidth, imageHeight, canvasWidth, canvasHeight);

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
  
  // Image preprocessing
  private preprocessImage(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): tf.Tensor4D {
    return tf.tidy(() => {
      // Convert image to tensor
      let tensor = tf.browser.fromPixels(imageElement);
      
      // Resize to model input size (640x640)
      tensor = tf.image.resizeBilinear(tensor, [640, 640]);
      
      // Normalize to [0, 1]
      tensor = tensor.div(255.0);
      
      // Add batch dimension
      const tensor4d = tensor.expandDims(0);
      
      return tensor4d as tf.Tensor4D;
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
    
    const confidenceThreshold = 0.5;
    const iouThreshold = 0.4;
    const inputSize = 640;
    
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

      const modelUrl = '/models/motor_wire_model_web/model.json';
      console.log('📥 Loading motor wire model from:', modelUrl);
      
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

      // Cleanup
      inputTensor.dispose();
      predictions.dispose();

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
    
    const confidenceThreshold = 0.5;
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

  // Performance optimization: Switch between models
  async switchToModel(modelType: 'esp32' | 'motor_wire'): Promise<void> {
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
    }

    // Load new model
    if (modelType === 'esp32') {
      await this.initializeESP32Model();
    } else if (modelType === 'motor_wire') {
      await this.initializeMotorWireModel();
    }

    this.currentActiveModel = modelType;
    console.log(`✅ Successfully switched to ${modelType} model`);
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
    this.currentActiveModel = null;
    this.isInitialized = false;
  }

  // Status check
  isReady(modelType?: 'esp32' | 'motor_wire'): boolean {
    if (!modelType) {
      return this.isInitialized && (this.esp32Model !== null || this.motorWireModel !== null);
    }
    return this.isInitialized && (
      (modelType === 'esp32' && this.esp32Model !== null) ||
      (modelType === 'motor_wire' && this.motorWireModel !== null)
    );
  }
}

// Export singleton instance
export const mlService = new MLService();