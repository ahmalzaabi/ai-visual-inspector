# 🚀 Custom Model Training Setup

## 📊 **Roboflow Dataset Export Settings:**

### **Recommended Format: YOLOv8**
```
Image Format: JPEG (recommended for training)
Annotation Format: YOLOv8
Download Method: ZIP file (not notebook)
```

### **Export Configuration:**
```
✅ Image Size: 640x640 (optimal for YOLOv8)
✅ Augmentation: None (we'll handle this in training)
✅ Preprocessing: Auto-Orient, Resize
✅ Split: Train/Valid/Test (70/20/10)
```

### **In Roboflow Dashboard:**
1. **Go to your dataset**
2. **Click "Export Dataset"**
3. **Select Format: "YOLOv8"**
4. **Select: "show download code"** *(this gives you the download script)*
5. **Copy the download code (looks like this):**

```python
# Roboflow download code example:
from roboflow import Roboflow
rf = Roboflow(api_key="YOUR_API_KEY")
project = rf.workspace("your-workspace").project("your-project")
dataset = project.version(1).download("yolov8")
```

---

## 🛠️ **Training Environment Setup:**

### **1. Create Training Directory:**
```bash
mkdir model_training
cd model_training
```

### **2. Python Environment:**
```bash
# Create virtual environment
python3 -m venv training_env
source training_env/bin/activate  # On Mac/Linux
# training_env\Scripts\activate  # On Windows

# Install training dependencies
pip install ultralytics roboflow pillow matplotlib
```

### **3. Download Your Dataset:**
```bash
# Run the Roboflow download code
python -c "
from roboflow import Roboflow
rf = Roboflow(api_key='YOUR_API_KEY')
project = rf.workspace('your-workspace').project('your-project')
dataset = project.version(1).download('yolov8')
"
```

---

## 🏋️ **Training Pipeline:**

### **Basic Training Script (`train_model.py`):**
```python
from ultralytics import YOLO
import yaml
import os

def train_assembly_model():
    # Load a YOLOv8 model (nano for speed, small for balance, medium for accuracy)
    model = YOLO('yolov8n.pt')  # or yolov8s.pt, yolov8m.pt
    
    # Train the model
    results = model.train(
        data='path/to/your/dataset/data.yaml',  # Path to your dataset YAML
        epochs=100,                             # Number of training epochs
        imgsz=640,                             # Image size
        batch=16,                              # Batch size (adjust based on GPU memory)
        workers=4,                             # Number of data loading workers
        device=0,                              # GPU device (0 for first GPU, 'cpu' for CPU)
        patience=10,                           # Early stopping patience
        save_period=10,                        # Save checkpoint every N epochs
        project='assembly_training',           # Project name
        name='assembly_v1',                    # Experiment name
        
        # Augmentation settings
        hsv_h=0.015,      # HSV-Hue augmentation
        hsv_s=0.7,        # HSV-Saturation augmentation  
        hsv_v=0.4,        # HSV-Value augmentation
        degrees=10,       # Rotation degrees
        translate=0.1,    # Translation fraction
        scale=0.5,        # Scaling factor
        shear=0.0,        # Shear degrees
        perspective=0.0,  # Perspective transform
        flipud=0.0,       # Vertical flip probability
        fliplr=0.5,       # Horizontal flip probability
        mosaic=1.0,       # Mosaic probability
        mixup=0.0,        # MixUp probability
    )
    
    return results

if __name__ == "__main__":
    results = train_assembly_model()
    print("Training completed!")
```

### **Advanced Training Configuration:**
```python
# For assembly verification, consider these specialized settings:
assembly_config = {
    'model_size': 'yolov8s',      # Good balance of speed/accuracy for assembly
    'input_size': 640,            # Standard size for mobile deployment
    'batch_size': 16,             # Adjust based on your GPU memory
    'epochs': 150,                # More epochs for assembly precision
    'patience': 20,               # Assembly detection needs stability
    
    # Assembly-specific augmentations
    'augment_assembly': {
        'lighting_variation': True,    # Different lighting conditions
        'perspective_shifts': True,    # Different viewing angles
        'component_occlusion': False,  # Don't hide critical components
        'background_variation': True,  # Different work surfaces
    }
}
```

---

## 🎯 **Model Optimization for PWA:**

### **Export for Web Deployment:**
```python
# After training, export your model
def export_for_web(model_path):
    model = YOLO(model_path)
    
    # Export to ONNX for web deployment
    model.export(
        format='onnx',
        imgsz=640,
        half=False,        # Don't use FP16 for better web compatibility
        dynamic=False,     # Static shapes for better performance
        opset=11,          # ONNX opset version for web compatibility
        optimize=True      # Optimize for inference
    )
    
    # Also export to TensorFlow.js if needed
    model.export(format='tfjs')

# Usage after training:
export_for_web('assembly_training/assembly_v1/weights/best.pt')
```

### **Model Size Optimization:**
```python
# For PWA deployment, optimize model size
optimization_settings = {
    'model_variant': 'yolov8n',    # Nano variant (6MB)
    'quantization': True,          # Reduce model precision
    'pruning': True,              # Remove less important weights
    'knowledge_distillation': True, # Learn from larger teacher model
}
```

---

## 📱 **PWA Integration Architecture:**

### **Model Service Architecture:**
```typescript
// src/services/customMLService.ts
export interface DetectionResult {
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface AssemblyAnalysis {
  components: DetectionResult[];
  stage: number;
  confidence: number;
  recommendations: string[];
}

class CustomAssemblyService {
  private model: any = null;
  private isLoaded = false;
  
  async loadModel() {
    console.log('🤖 Loading custom assembly model...');
    const ort = await import('onnxruntime-web');
    this.model = await ort.InferenceSession.create('/models/assembly_custom.onnx');
    this.isLoaded = true;
  }
  
  async detectAssembly(canvas: HTMLCanvasElement): Promise<AssemblyAnalysis> {
    if (!this.isLoaded) await this.loadModel();
    
    // Preprocess image
    const input = this.preprocessImage(canvas);
    
    // Run inference
    const outputs = await this.model.run({ images: input });
    
    // Post-process results
    const detections = this.postprocessOutputs(outputs);
    
    // Analyze assembly stage
    const analysis = this.analyzeAssemblyState(detections);
    
    return analysis;
  }
  
  private preprocessImage(canvas: HTMLCanvasElement) {
    // Convert canvas to tensor format expected by your model
    // This will be specific to your trained model
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, 640, 640);
    
    // Convert to float32 tensor [1, 3, 640, 640]
    const tensor = new Float32Array(3 * 640 * 640);
    // ... normalization and channel arrangement logic
    
    return tensor;
  }
  
  private postprocessOutputs(outputs: any): DetectionResult[] {
    // Parse YOLO outputs: [batch, 84, 8400] where 84 = 4 bbox + 80 classes
    // This will be specific to your model's output format
    const detections: DetectionResult[] = [];
    
    // Apply confidence filtering and NMS
    // ... detection parsing logic
    
    return detections;
  }
  
  private analyzeAssemblyState(detections: DetectionResult[]): AssemblyAnalysis {
    // Your custom assembly stage logic
    const componentCounts = this.countComponents(detections);
    const stage = this.determineStage(componentCounts);
    const confidence = this.calculateConfidence(detections);
    const recommendations = this.generateRecommendations(stage, componentCounts);
    
    return {
      components: detections,
      stage,
      confidence,
      recommendations
    };
  }
}

export const customAssemblyService = new CustomAssemblyService();
```

---

## 🎨 **Training Data Considerations:**

### **Data Quality Checklist:**
```
✅ Balanced classes (similar number of examples per component)
✅ Diverse lighting conditions (bright, dim, mixed shadows)  
✅ Multiple angles (top-down, 45°, side views)
✅ Various backgrounds (clean, cluttered, different colors)
✅ Different assembly states (empty, partial, complete, error states)
✅ High resolution images (at least 640x640)
✅ Clear, unblurred images
✅ Consistent annotation quality
```

### **Assembly-Specific Data Needs:**
```
🔧 Component States:
├── Individual components (separated)
├── Partially assembled states
├── Correctly assembled states  
├── Incorrectly assembled states (common mistakes)
└── Tools and hands in the scene

📊 Stage Progression:
├── Stage 0: Empty workspace
├── Stage 1: Base components placed
├── Stage 2: Secondary components added
├── Stage 3: Connections made
├── Stage 4: Fasteners/screws installed
└── Stage 5: Quality check complete
```

---

## 🚀 **Next Steps:**

1. **Export your dataset from Roboflow using the code snippet**
2. **Set up the training environment**
3. **Run the training script**
4. **Monitor training progress and adjust hyperparameters**
5. **Export the trained model to ONNX format**
6. **Integrate with your PWA using the custom service**

## 📊 **Training Monitoring:**

```python
# Monitor training progress
import wandb  # Optional: for advanced monitoring

def setup_monitoring():
    wandb.init(project="assembly-detection")
    
    # Monitor these metrics:
    metrics = [
        'train/box_loss',       # Bounding box accuracy
        'train/cls_loss',       # Classification accuracy  
        'val/box_loss',         # Validation box loss
        'val/cls_loss',         # Validation class loss
        'metrics/mAP50',        # Mean Average Precision at IoU=0.5
        'metrics/mAP50-95',     # Mean Average Precision at IoU=0.5-0.95
    ]
```

**Ready to start training? Download your dataset and let me know if you need help with any of these steps!** 🎯 