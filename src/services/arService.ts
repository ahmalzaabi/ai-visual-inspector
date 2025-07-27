// Lightweight AR without Three.js - using Canvas 2D for AR effects

// Lightweight AR Detection and Overlay Types
export interface ARDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  id: string;
  type: 'esp32' | 'connector' | 'assembly';
}

export interface AROverlay {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  animation?: string;
}

export interface ESP32Info {
  chipModel: string;
  connectivity: string;
  frequency: string;
  status: 'active' | 'detected' | 'ready';
  voltage: string;
  temperature: string;
}

export interface ARShowcaseAnalysis {
  detections: ARDetection[];
  overlays: AROverlay[];
  esp32Info: ESP32Info[];
  isActive: boolean;
  showcaseEffects: {
    particles: boolean;
    hologram: boolean;
    dataStream: boolean;
  };
}

  // Lightweight AR Service using Canvas 2D
class ARService {
  private isInitialized: boolean = false;
  private animationFrame: number | null = null;
  private currentLanguage: string = 'en';
  
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Lightweight AR Showcase...');
    
    try {
      this.isInitialized = true;
      console.log('✅ Lightweight AR ready - using optimized Canvas 2D rendering');
      
    } catch (error) {
      console.error('❌ AR initialization failed:', error);
      throw error;
    }
  }
  
  // Lightweight AR drawing using Canvas 2D
  private drawLightweightAR(ctx: CanvasRenderingContext2D, detections: ARDetection[], esp32Info: ESP32Info[], effects: any): void {
    const time = Date.now() * 0.001;
    
    detections.forEach((detection, index) => {
      // Draw holographic-style bounding box
      this.drawHolographicBox(ctx, detection, time + index);
      
      // Draw amazing ESP32 info display
      this.drawESP32InfoDisplay(ctx, detection, esp32Info[index] || this.getDefaultESP32Info(), time + index);
      
      // Draw unified color particle effects
      if (effects.particles) {
        this.drawUnifiedParticles(ctx, detection, time);
      }
      
      // Draw animated data streams
      if (effects.dataStream) {
        this.drawDataStreams(ctx, detection, time + index);
      }
    });
  }
  
  // Draw holographic-style bounding box
  private drawHolographicBox(ctx: CanvasRenderingContext2D, detection: ARDetection, time: number): void {
    const { x, y, width, height } = detection;
    
    // Animated colors
    const hue1 = (time * 30) % 360;
    const hue2 = (time * 30 + 180) % 360;
    
    // Gradient border
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, `hsl(${hue1}, 100%, 50%)`);
    gradient.addColorStop(1, `hsl(${hue2}, 100%, 50%)`);
    
    // Glowing effect
    ctx.shadowColor = `hsl(${hue1}, 100%, 50%)`;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    
    // Animated corner brackets
    const cornerSize = 20;
    const offset = Math.sin(time * 2) * 3;
    
    ctx.beginPath();
    // Top-left corner
    ctx.moveTo(x - offset, y + cornerSize);
    ctx.lineTo(x - offset, y - offset);
    ctx.lineTo(x + cornerSize, y - offset);
    
    // Top-right corner
    ctx.moveTo(x + width - cornerSize, y - offset);
    ctx.lineTo(x + width + offset, y - offset);
    ctx.lineTo(x + width + offset, y + cornerSize);
    
    // Bottom-right corner
    ctx.moveTo(x + width + offset, y + height - cornerSize);
    ctx.lineTo(x + width + offset, y + height + offset);
    ctx.lineTo(x + width - cornerSize, y + height + offset);
    
    // Bottom-left corner  
    ctx.moveTo(x + cornerSize, y + height + offset);
    ctx.lineTo(x - offset, y + height + offset);
    ctx.lineTo(x - offset, y + height - cornerSize);
    
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  
  // Draw amazing ESP32 info display
  private drawESP32InfoDisplay(ctx: CanvasRenderingContext2D, detection: ARDetection, esp32Info: ESP32Info, time: number): void {
    const { x, y, width } = detection;
    
    // Main holographic info card floating above ESP32
    const cardWidth = 180;
    const cardHeight = 120;
    const cardX = x + width / 2 - cardWidth / 2;
    const cardY = y - cardHeight - 20 + Math.sin(time) * 8;
    
    // Holographic card background with gradient
    const gradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.15)');
    gradient.addColorStop(0.5, 'rgba(0, 150, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(100, 0, 255, 0.15)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
    
    // Animated border
    const borderGlow = Math.sin(time * 2) * 0.3 + 0.7;
    ctx.strokeStyle = `rgba(0, 255, 255, ${borderGlow})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
    
    // Corner indicators
    this.drawCornerIndicators(ctx, cardX, cardY, cardWidth, cardHeight, time);
    
    // ESP32 Technical Info (Bilingual)
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'left';
    
    const isArabic = this.currentLanguage === 'ar';
    const lineHeight = 16;
    let currentY = cardY + 20;
    
    // Chip Model
    const chipText = isArabic ? 'معالج: ESP32-WROOM' : 'CHIP: ESP32-WROOM';
    ctx.fillText(chipText, cardX + 10, currentY);
    currentY += lineHeight;
    
    // Connectivity
    const connectText = isArabic ? 'الاتصال: WiFi + BT' : 'CONN: WiFi + BT';
    ctx.fillText(connectText, cardX + 10, currentY);
    currentY += lineHeight;
    
    // Frequency
    const freqText = isArabic ? 'التردد: ٢٤٠ ميجا' : 'FREQ: 240MHz';
    ctx.fillText(freqText, cardX + 10, currentY);
    currentY += lineHeight;
    
    // Status with animated indicator
    const statusColor = this.getStatusColor(esp32Info.status);
    ctx.fillStyle = statusColor;
    const statusText = isArabic ? this.getArabicStatus(esp32Info.status) : esp32Info.status.toUpperCase();
    ctx.fillText(`${isArabic ? 'الحالة:' : 'STATUS:'} ${statusText}`, cardX + 10, currentY);
    
    // Animated status indicator
    const indicatorX = cardX + cardWidth - 20;
    const indicatorY = cardY + 15;
    const pulseSize = 3 + Math.sin(time * 4) * 2;
    
    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, pulseSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Connection line from card to ESP32
    this.drawConnectionLine(ctx, cardX + cardWidth / 2, cardY + cardHeight, x + width / 2, y, time);
  }
  
  // Draw corner indicators for holographic effect
  private drawCornerIndicators(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, time: number): void {
    const cornerSize = 12;
    const glow = Math.sin(time * 3) * 0.5 + 0.5;
    
    ctx.strokeStyle = `rgba(0, 255, 255, ${glow})`;
    ctx.lineWidth = 3;
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(x, y + cornerSize);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cornerSize, y);
    ctx.stroke();
    
    // Top-right
    ctx.beginPath();
    ctx.moveTo(x + width - cornerSize, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + cornerSize);
    ctx.stroke();
    
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(x + width, y + height - cornerSize);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width - cornerSize, y + height);
    ctx.stroke();
    
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(x + cornerSize, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + height - cornerSize);
    ctx.stroke();
  }
  
  // Draw connection line from info card to ESP32
  private drawConnectionLine(ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number, time: number): void {
    const segments = 8;
    const amplitude = 10;
    
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;
      
      // Add wave effect
      const wave = Math.sin(time * 2 + t * Math.PI * 2) * amplitude * Math.sin(t * Math.PI);
      const waveX = x + wave * Math.cos(Math.PI / 2);
      
      if (i === 0) {
        ctx.moveTo(waveX, y);
      } else {
        ctx.lineTo(waveX, y);
      }
    }
    ctx.stroke();
    
    // Animated dots along the line
    for (let i = 0; i < 3; i++) {
      const progress = (time * 0.5 + i * 0.3) % 1;
      const dotX = startX + (endX - startX) * progress;
      const dotY = startY + (endY - startY) * progress;
      const wave = Math.sin(time * 2 + progress * Math.PI * 2) * amplitude * Math.sin(progress * Math.PI);
      
      ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(dotX + wave * Math.cos(Math.PI / 2), dotY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Get status color based on ESP32 status
  private getStatusColor(status: string): string {
    switch (status) {
      case 'active': return '#00ff00';
      case 'ready': return '#00ffff'; 
      case 'detected': return '#ffff00';
      default: return '#ff6600';
    }
  }
  
  // Get Arabic status text
  private getArabicStatus(status: string): string {
    switch (status) {
      case 'active': return 'نشط';
      case 'ready': return 'جاهز';
      case 'detected': return 'مكتشف';
      default: return 'غير معروف';
    }
  }
  
  // Draw unified color particle effects
  private drawUnifiedParticles(ctx: CanvasRenderingContext2D, detection: ARDetection, time: number): void {
    const { x, y, width, height } = detection;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    // Unified cyan particle burst
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 25 + Math.sin(time * 2) * 8;
      const particleX = centerX + Math.cos(angle + time * 0.5) * radius;
      const particleY = centerY + Math.sin(angle + time * 0.5) * radius;
      
      // Unified cyan color with varying opacity
      const opacity = 0.5 + Math.sin(time * 3 + i) * 0.3;
      ctx.fillStyle = `rgba(0, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Draw animated data streams
  private drawDataStreams(ctx: CanvasRenderingContext2D, detection: ARDetection, time: number): void {
    const { x, y, width, height } = detection;
    
    // Vertical data streams on sides
    for (let side = 0; side < 2; side++) {
      const streamX = side === 0 ? x - 15 : x + width + 15;
      
      for (let i = 0; i < 6; i++) {
        const streamY = y + (i * height / 5) + Math.sin(time * 2 + i) * 5;
        const alpha = Math.sin(time * 3 + i + side) * 0.5 + 0.5;
        
        ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.fillRect(streamX, streamY, 8, 2);
      }
    }
  }
  
  // Get default ESP32 info
  private getDefaultESP32Info(): ESP32Info {
    return {
      chipModel: 'ESP32-WROOM-32',
      connectivity: 'WiFi + Bluetooth',
      frequency: '240MHz',
      status: 'detected',
      voltage: '3.3V',
      temperature: '45°C'
    };
  }
  
  // Lightweight AR detection and overlay function
  async detectAndOverlay(canvas: HTMLCanvasElement, _videoElement: HTMLVideoElement, detections: any[]): Promise<ARShowcaseAnalysis> {
    if (!this.isInitialized) {
      throw new Error('AR system not initialized');
    }
    
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Process detections
      const arDetections = this.processDetections(detections);
      const overlays = this.createLightweightOverlays(arDetections);
      
      // Generate ESP32 info for each detection
      const esp32Info = this.generateESP32Info(arDetections);
      
      // Determine effects
      const showcaseEffects = {
        particles: arDetections.length > 0,
        hologram: arDetections.length > 0,
        dataStream: arDetections.length > 1 // Data streams when multiple ESP32s
      };
      
      // Draw lightweight AR effects
      this.drawLightweightAR(ctx, arDetections, esp32Info, showcaseEffects);
      
      return {
        detections: arDetections,
        overlays,
        esp32Info,
        isActive: arDetections.length > 0,
        showcaseEffects
      };
      
    } catch (error) {
      console.error('❌ AR detection and overlay failed:', error);
      throw error;
    }
  }
  
  // Create lightweight overlays
  private createLightweightOverlays(detections: ARDetection[]): AROverlay[] {
    return detections.map(detection => ({
      x: detection.x,
      y: detection.y,
      width: detection.width,
      height: detection.height,
      visible: true,
      animation: 'float'
    }));
  }
  
  // Process 2D detections into AR detections
  private processDetections(detections: any[]): ARDetection[] {
    return detections.map((detection, index) => ({
      x: detection.x,
      y: detection.y,
      width: detection.width,
      height: detection.height,
      confidence: detection.confidence || 0.8,
      id: `esp32_${index}`,
      type: 'esp32' as const
    }));
  }
  
  // Generate ESP32 info for each detection
  private generateESP32Info(detections: ARDetection[]): ESP32Info[] {
    return detections.map((_detection, index) => ({
      chipModel: 'ESP32-WROOM-32',
      connectivity: 'WiFi + BT',
      frequency: '240MHz',
      status: index === 0 ? 'active' : 'ready',
      voltage: '3.3V',
      temperature: `${42 + index * 3}°C`
    }));
  }
  
  // Set language for bilingual support
  setLanguage(language: string): void {
    this.currentLanguage = language;
  }
  
  // Generate ESP32 AR analysis report
  generateESP32Report(esp32Info: ESP32Info[]): string {
    return `
🚀 ESP32 AR ANALYSIS REPORT
═══════════════════════════════════════

📊 DETECTED COMPONENTS:
• ESP32 Boards Found: ${esp32Info.length}
• Model: ${esp32Info[0]?.chipModel || 'ESP32-WROOM-32'}
• Connectivity: ${esp32Info[0]?.connectivity || 'WiFi + BT'}
• Operating Frequency: ${esp32Info[0]?.frequency || '240MHz'}

🔍 AR TECHNOLOGY FEATURES:
• Holographic Info Cards: ✅ ACTIVE
• Bilingual Display: ✅ EN/AR
• Real-time Tracking: ✅ STABLE
• Data Streams: ✅ ANIMATED

📅 Analysis: ${new Date().toLocaleString()}
🎯 AR Showcase: SUCCESSFULLY DEMONSTRATED
    `;
  }
  
  // Cleanup lightweight AR resources
  dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    this.isInitialized = false;
    console.log('🧹 Lightweight AR Service cleaned up');
  }
}

// Export singleton instance
export const arService = new ARService(); 