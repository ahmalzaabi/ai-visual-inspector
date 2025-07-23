import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      title: "AI Visual Inspector",
      subtitle: "AI-powered visual inspection platform",
      features: {
        assembly: "Assembly Verification",
        inspection: "Deep Inspection",
        repair: "Fixing & Repair Procedures",
        maintenance: "Visual Predictive Maintenance",
        quality: "Quality Control",
        test: "AI Object Detection Test"
      },
      descriptions: {
        assembly: "Automated verification of assembly processes and components",
        inspection: "Advanced AI-powered deep visual inspection and analysis",
        repair: "Step-by-step guided repair and fixing procedure verification",
        maintenance: "Predictive maintenance through visual pattern recognition",
        quality: "Real-time quality control and defect detection",
        test: "Test AI object detection with pre-trained models"
      },
      actions: {
        start: "Start Inspection",
        capture: "Capture",
        analyze: "Analyze",
        stop: "Stop",
        clear: "Clear",
        test: "Test Detection",
        back: "Back"
      },
      status: {
        ready: "Ready",
        processing: "Processing...",
        complete: "Complete",
        error: "Error"
      },
      camera: {
        start: "Start Camera",
        placeholder: "Tap to start camera",
        error: "Camera Error"
      },
      detection: {
        local_server: "Local Server",
        device_mode: "Device Mode"
      }
    }
  },
  ar: {
    translation: {
      title: "مفتش الذكاء الاصطناعي البصري",
      subtitle: "منصة الفحص البصري المدعومة بالذكاء الاصطناعي",
      features: {
        assembly: "التحقق من التجميع",
        inspection: "الفحص العميق",
        repair: "إجراءات الإصلاح والتصليح",
        maintenance: "الصيانة التنبؤية البصرية",
        quality: "مراقبة الجودة",
        test: "اختبار الكشف بالذكاء الاصطناعي"
      },
      descriptions: {
        assembly: "التحقق الآلي من عمليات التجميع والمكونات",
        inspection: "فحص بصري عميق متقدم مدعوم بالذكاء الاصطناعي",
        repair: "التحقق من إجراءات الإصلاح والتصليح الموجهة خطوة بخطوة",
        maintenance: "الصيانة التنبؤية من خلال التعرف على الأنماط البصرية",
        quality: "مراقبة الجودة في الوقت الفعلي واكتشاف العيوب",
        test: "اختبار كشف الكائنات بالذكاء الاصطناعي باستخدام النماذج المدربة مسبقاً"
      },
      actions: {
        start: "بدء الفحص",
        capture: "التقاط",
        analyze: "تحليل",
        stop: "إيقاف",
        clear: "مسح",
        test: "اختبار الكشف",
        back: "رجوع"
      },
      status: {
        ready: "جاهز",
        processing: "جاري المعالجة...",
        complete: "مكتمل",
        error: "خطأ"
      },
      camera: {
        start: "تشغيل الكاميرا",
        placeholder: "اضغط لبدء تشغيل الكاميرا",
        error: "خطأ في الكاميرا"
      },
      detection: {
        local_server: "خادم محلي",
        device_mode: "وضع الجهاز"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 