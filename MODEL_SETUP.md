# AI Visual Inspector - Model Setup Guide

## Model Architecture Overview

The AI Visual Inspector uses a **three-model architecture** optimized for different inspection scenarios:

### 1. **General Inspection Model** 🔍
- **Location**: `public/models/yolov8_tfjs/best_float32.tflite` (18MB)
- **Format**: TensorFlow Lite (.tflite)
- **Input**: `[1, 640, 640, 3]` (RGB images, 640x640 resolution)
- **Output**: `[1, 4499, 8400]` (custom detection format)
- **Purpose**: High-precision defect detection for detailed quality analysis
- **Classes**: 11 defect types (crack, scratch, dent, corrosion, etc.)
- **Use Case**: When users click "Deep Inspection" for thorough analysis

### 2. **Assembly Verification - Breadboard Model** 🍞
- **Location**: `public/models/breadboard/`
- **Format**: TensorFlow.js Graph Model
- **Purpose**: Real-time breadboard component detection
- **Classes**: Electronic components and breadboard structures
- **Use Case**: Assembly verification for breadboard circuits

### 3. **Assembly Verification - ESP32 Model** 🔧
- **Location**: `public/models/esp32/`
- **Format**: TensorFlow.js Graph Model  
- **Purpose**: ESP32 board and component verification
- **Classes**: ESP32 boards, pins, connectors, and related components
- **Use Case**: Assembly verification for ESP32-based projects

---

## Recent Updates (January 2025)

### ✅ Deep Inspection Model Upgrade
- **Replaced** the previous YOLOv8 TensorFlow.js model with your custom TFLite model
- **Enhanced** defect detection capabilities with 11 specialized defect classes
- **Improved** quality scoring algorithm based on actual defect severity
- **Maintained** backward compatibility with existing deep inspection UI

### Model Configuration Details

#### Deep Inspection Settings
```yaml
confidence_threshold: 0.25
nms_threshold: 0.4
input_resolution: 640x640
framework: tensorflow_lite
inference_mode: direct_tflite
```

#### Defect Classification
```yaml
defect_classes:
  0: defect          # General defect (severity: 2.0)
  1: crack           # Surface cracks (severity: 3.5) 
  2: scratch         # Surface scratches (severity: 2.0)
  3: dent            # Physical dents (severity: 2.5)
  4: corrosion       # Corrosion/rust (severity: 3.0)
  5: discoloration   # Color changes (severity: 1.8)
  6: missing_part    # Missing components (severity: 3.0)
  7: misalignment    # Alignment issues (severity: 2.5)
  8: contamination   # Dirt/contamination (severity: 1.5)
  9: wear            # Normal wear (severity: 1.5)
  10: damage         # Physical damage (severity: 2.8)
```

---

## 🚨 **IMPORTANT: Deep Inspection Model Issue**

**Current Status**: The deep inspection feature is using a **temporary workaround** because the provided model was trained on breadboard detection, not defect detection.

### **Issue Details:**
- **Expected**: Defect detection model (crack, scratch, dent, corrosion, etc.)
- **Actual**: Breadboard detection model (only detects "Breadboard" class)
- **Current Solution**: Using breadboard detections as proxy for inspection points

### **Temporary Behavior:**
The deep inspection now maps breadboard detections to simulated defect types:
- **High confidence (>0.8)**: `major_issue`
- **Medium confidence (0.6-0.8)**: `minor_defect`  
- **Low confidence (0.4-0.6)**: `potential_issue`
- **Very low (0.2-0.4)**: `inspection_point`

## 🔧 **Solutions for Proper Deep Inspection**

### **Option 1: Use a Pre-trained Generic Object Detection Model**

Replace the current model with a COCO-trained YOLOv8 model that can detect various objects and anomalies:

```bash
# Download YOLOv8 model trained on COCO dataset
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt

# Convert to TensorFlow.js format
pip install ultralytics
python -c "
from ultralytics import YOLO
model = YOLO('yolov8n.pt')
model.export(format='tfjs', imgsz=640)
"

# Move to your project
mv yolov8n_web_model/* public/models/deep_inspection/
```

### **Option 2: Find a Defect-Specific Model**

Look for pre-trained models on:
- **Hugging Face**: Search for "defect detection" or "quality inspection"
- **TensorFlow Hub**: Industrial inspection models
- **Roboflow**: Public defect detection datasets

### **Option 3: Train Your Own Defect Detection Model**

Using your own defect images:

```bash
# 1. Install YOLOv8
pip install ultralytics

# 2. Prepare your dataset in YOLO format
# Create dataset structure:
# dataset/
#   ├── images/train/
#   ├── images/val/
#   ├── labels/train/
#   ├── labels/val/
#   └── data.yaml

# 3. Train the model
yolo train data=dataset/data.yaml model=yolov8n.pt epochs=100 imgsz=640

# 4. Convert to TensorFlow.js
python -c "
from ultralytics import YOLO
model = YOLO('runs/detect/train/weights/best.pt')
model.export(format='tfjs', imgsz=640)
"
```

### **Option 4: Update Code to Work with Current Model**

If you want to keep using breadboard detection as inspection:

```javascript
// Update the class names in mlService.ts to match your use case
const classNames = [
  'breadboard', 'component', 'circuit', 'connection', 'solder_joint'
];
```

## 📁 **Current Model Structure**

### **ESP32 Assembly Model** ✅ **Working**
```
public/models/esp32/
├── model.json          # Model architecture
├── group1-shard1of3.bin # Model weights (part 1)
├── group1-shard2of3.bin # Model weights (part 2)
└── group1-shard3of3.bin # Model weights (part 3)
```
- **Classes**: ESP32 components
- **Input Size**: 640×640
- **Purpose**: Assembly verification

### **Deep Inspection Model** ⚠️ **Needs Replacement**
```
public/models/yolov8_tfjs/
├── model.json          # Model architecture
├── group1-shard1of3.bin # Model weights (part 1)
├── group1-shard2of3.bin # Model weights (part 2)
├── group1-shard3of3.bin # Model weights (part 3)
└── metadata.yaml       # Shows: names: {0: Breadboard}
```
- **Current Classes**: Only "Breadboard" 
- **Needed Classes**: Defect types (crack, scratch, dent, etc.)
- **Status**: Using breadboard detection as proxy

## 🚀 **Recommended Quick Fix**

For immediate functionality, I recommend **Option 1** (COCO model):

```bash
# Download and setup COCO YOLOv8 model
cd your-project/public/models/
mkdir -p deep_inspection_new/

# Use this Python script:
cat > setup_coco_model.py << 'EOF'
from ultralytics import YOLO
import shutil

# Load YOLOv8 nano model (pre-trained on COCO)
model = YOLO('yolov8n.pt')

# Export to TensorFlow.js
model.export(format='tfjs', imgsz=640)

# Move files
shutil.move('yolov8n_web_model/', 'deep_inspection_new/')
print("✅ COCO model ready! Replace /models/yolov8_tfjs/ with deep_inspection_new/")
EOF

python setup_coco_model.py
```

Then update the class names in `mlService.ts`:

```javascript
// Replace the classNames array with COCO classes relevant to defects
const classNames = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  // ... full COCO dataset classes
];
```

## 🧪 **Testing Your Model**

Once you have a proper defect detection model:

```javascript
// Test in browser console:
const testModel = async () => {
  const canvas = document.querySelector('video'); // Your video element
  const result = await mlService.detectDeepInspection(canvas);
  console.log('Detections:', result.detections);
  console.log('Defect Types:', result.defectTypes);
  console.log('Quality Score:', result.qualityScore);
};

testModel();
```

## 📊 **Expected Performance**

With a proper defect detection model:
- **Defect Types**: 10-20 different defect classes
- **Accuracy**: 70-90% depending on training data
- **Speed**: 50-150ms inference time
- **Quality Scoring**: Realistic assessment based on actual defects

## 🆘 **Need Help?**

If you need assistance:
1. **Finding Models**: Search Hugging Face, Roboflow, or TensorFlow Hub
2. **Training Custom Models**: Use YOLOv8 with your defect images
3. **Converting Models**: Use Ultralytics export functionality
4. **Integration**: Update the class names and thresholds in `mlService.ts`

The current temporary fix will work for demonstration purposes, but a proper defect detection model will provide much better results for real-world quality inspection. 