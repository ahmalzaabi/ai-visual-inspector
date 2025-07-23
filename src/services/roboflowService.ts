// Roboflow API Service for Enhanced Object Detection
// Using cloud-based models for better accuracy

import axios from 'axios';

export interface RoboflowDetection {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoboflowResponse {
  predictions: RoboflowDetection[];
  image: {
    width: number;
    height: number;
  };
}

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

class RoboflowService {
  private readonly BREADBOARD_API_URL = "https://serverless.roboflow.com/breadboard-bpar1/2";
  private readonly API_KEY = "PNboNv5WUAhPDmsqnNqZ";

  async detectBreadboard(canvas: HTMLCanvasElement): Promise<BreadboardAnalysis> {
    console.log('🚀 Starting Roboflow breadboard detection...');
    const startTime = performance.now();

    try {
      // 1. Convert canvas to base64
      const preprocessStart = performance.now();
      console.log('📸 Converting canvas to base64...');
      const base64Image = this.canvasToBase64(canvas);
      console.log(`📊 Image size: ${canvas.width}x${canvas.height}`);
      const preprocessTime = performance.now() - preprocessStart;

      // 2. Call Roboflow API
      const inferenceStart = performance.now();
      console.log('🌐 Calling Roboflow API...');
      
      const response = await axios({
        method: "POST",
        url: this.BREADBOARD_API_URL,
        params: {
          api_key: this.API_KEY
        },
        data: base64Image,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        timeout: 10000 // 10 second timeout
      });

      const inferenceTime = performance.now() - inferenceStart;
      console.log('✅ Roboflow API response received!');

      // 3. Process results
      const postprocessStart = performance.now();
      console.log('🔍 Processing Roboflow response...');
      console.log('📊 Raw response:', response.data);
      
      const detections = this.convertRoboflowToDetections(
        response.data as RoboflowResponse, 
        canvas.width, 
        canvas.height
      );
      const postprocessTime = performance.now() - postprocessStart;

      const totalTime = performance.now() - startTime;

      const result: BreadboardAnalysis = {
        detections,
        confidence: detections.length > 0 ? 
          detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length : 0,
        processingTime: totalTime,
        performance: {
          preprocessing: preprocessTime,
          inference: inferenceTime,
          postprocessing: postprocessTime
        }
      };

      console.log(`🍞 Roboflow detected ${detections.length} breadboard(s)!`);
      if (detections.length > 0) {
        console.log(`📈 Average confidence: ${(result.confidence * 100).toFixed(1)}%`);
        detections.forEach((det, i) => {
          console.log(`   ${i + 1}. ${det.class}: ${(det.confidence * 100).toFixed(1)}% at [${det.bbox.join(', ')}]`);
        });
      }

      return result;

    } catch (error: unknown) {
      console.error('❌ Roboflow API error:', error);
      
      // Provide more detailed error info
      if (axios.isAxiosError(error)) {
        console.error('🌐 API Error Details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
      }

      return {
        detections: [],
        confidence: 0,
        processingTime: performance.now() - startTime,
        performance: { preprocessing: 0, inference: 0, postprocessing: 0 }
      };
    }
  }

  private canvasToBase64(canvas: HTMLCanvasElement): string {
    // Convert canvas to base64 image (JPEG format for smaller size)
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    // Remove the data:image/jpeg;base64, prefix
    return dataURL.split(',')[1];
  }

  private convertRoboflowToDetections(
    response: RoboflowResponse, 
    canvasWidth: number, 
    canvasHeight: number
  ): DetectionResult[] {
    if (!response.predictions || response.predictions.length === 0) {
      console.log('📭 No predictions from Roboflow');
      return [];
    }

    console.log(`🔍 Converting ${response.predictions.length} Roboflow predictions...`);
    
    const detections: DetectionResult[] = response.predictions.map((pred, index) => {
      // Roboflow returns center coordinates and dimensions
      // Convert to corner coordinates [x1, y1, x2, y2]
      const centerX = pred.x;
      const centerY = pred.y;
      const width = pred.width;
      const height = pred.height;

      const x1 = Math.max(0, centerX - width / 2);
      const y1 = Math.max(0, centerY - height / 2);
      const x2 = Math.min(canvasWidth, centerX + width / 2);
      const y2 = Math.min(canvasHeight, centerY + height / 2);

      console.log(`   🎯 Detection ${index + 1}: ${pred.class} (${(pred.confidence * 100).toFixed(1)}%) at center(${centerX.toFixed(1)}, ${centerY.toFixed(1)}) size(${width.toFixed(1)}×${height.toFixed(1)})`);

      return {
        class: pred.class,
        confidence: pred.confidence,
        bbox: [x1, y1, x2, y2] as [number, number, number, number],
        score: pred.confidence
      };
    });

    // Filter by minimum confidence (Roboflow usually returns high-quality results)
    const minConfidence = 0.3; // Lower threshold since Roboflow is more accurate
    const filteredDetections = detections.filter(det => det.confidence >= minConfidence);
    
    console.log(`✅ Filtered detections (>=${minConfidence}): ${filteredDetections.length}/${detections.length}`);
    
    return filteredDetections;
  }

  // Health check method
  async checkHealth(): Promise<boolean> {
    try {
      console.log('🔍 Checking Roboflow API health...');
      // Create a small test canvas
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(0, 0, 100, 100);
      }
      
      const testImage = this.canvasToBase64(canvas);
      
      const response = await axios({
        method: "POST",
        url: this.BREADBOARD_API_URL,
        params: { api_key: this.API_KEY },
        data: testImage,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 5000
      });
      
      console.log('✅ Roboflow API is healthy!', response.status);
      return true;
    } catch (error: unknown) {
      console.error('❌ Roboflow API health check failed:', error);
      return false;
    }
  }
}

export const roboflowService = new RoboflowService(); 