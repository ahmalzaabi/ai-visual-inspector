// Test Object Detection Service using COCO-SSD
// For testing AI object detection with pre-trained models

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

export interface TestDetection {
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  score: number;
}

export interface TestDetectionResult {
  detections: TestDetection[];
  confidence: number;
  processingTime: number;
}

class TestDetectionService {
  private model: cocoSsd.ObjectDetection | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🧪 Loading COCO-SSD test model...');
    
    try {
      // Setup TensorFlow.js
      await tf.ready();
      await tf.setBackend('webgl');
      
      // Load COCO-SSD model
      this.model = await cocoSsd.load();
      
      console.log('✅ COCO-SSD model loaded successfully!');
      console.log('🎯 Ready to detect 80 different object types');
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('❌ COCO-SSD model loading failed:', error);
      throw error;
    }
  }

  async detectObjects(canvas: HTMLCanvasElement): Promise<TestDetectionResult> {
    if (!this.isInitialized || !this.model) {
      await this.initialize();
    }

    const startTime = performance.now();

    try {
      // Run detection
      const predictions = await this.model!.detect(canvas);
      
      // Convert predictions to our format
      const detections: TestDetection[] = predictions.map((prediction: any) => {
        const [x, y, width, height] = prediction.bbox;
        return {
          class: prediction.class,
          confidence: prediction.score,
          bbox: [x, y, x + width, y + height],
          score: prediction.score
        };
      });

      const processingTime = performance.now() - startTime;
      const confidence = detections.length > 0 ? 
        detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length : 0;

      if (detections.length > 0) {
        console.log(`🎯 COCO-SSD detected ${detections.length} objects!`);
        detections.forEach(det => {
          console.log(`  📍 ${det.class}: ${(det.confidence * 100).toFixed(1)}%`);
        });
      }

      return {
        detections,
        confidence,
        processingTime
      };

    } catch (error) {
      console.error('❌ COCO-SSD detection error:', error);
      return {
        detections: [],
        confidence: 0,
        processingTime: performance.now() - startTime
      };
    }
  }

  getPerformanceStats() {
    return {
      isModelLoaded: this.model !== null,
      backend: tf.getBackend(),
      memory: tf.memory(),
      modelType: 'COCO-SSD'
    };
  }
}

export const testDetectionService = new TestDetectionService(); 