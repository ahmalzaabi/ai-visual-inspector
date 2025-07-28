import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      title: "AI Computer Vision System",
      subtitle: "AI-powered visual inspection platform",
      
      main: {
        navigation: {
          missions: "Missions",
          analytics: "Analytics"
        }
      },
      
      features: {
        assembly: "Assembly Verification",
        inspection: "Deep Inspection",
        repair: "Fixing & Repair Procedures",
        maintenance: "Visual Predictive Maintenance",
        quality: "Quality Control",
        title: "Features"
      },
      
      descriptions: {
        assembly: "Automated verification of assembly processes and components",
        inspection: "Advanced AI-powered deep visual inspection and analysis",
        repair: "Step-by-step guided repair and fixing procedure verification",
        maintenance: "Predictive maintenance through advanced visual analysis",
        quality: "Automated quality control and defect detection systems"
      },
      
      navigation: {
        missions: "Missions",
        analytics: "Analytics"
      },
      
      common: {
        back: "Back",
        close: "Close",
        save: "Save",
        cancel: "Cancel",
        confirm: "Confirm",
        loading: "Loading...",
        error: "Error",
        success: "Success"
      },
      
      actions: {
        back: "Back",
        next: "Next Step",
        previous: "Previous",
        continue: "Continue",
        complete: "Complete",
        start: "Start",
        stop: "Stop",
        startCamera: "Start Camera",
        stopCamera: "Stop Camera",
        startDetection: "Start Detection",
        stopDetection: "Stop Detection"
      },
      
      analytics: {
        title: "Analytics Dashboard",
        comingSoon: "Analytics Coming Soon",
        placeholder: "Advanced analytics and insights coming soon. Track model performance, detection accuracy, and system metrics."
      },
      
      assembly: {
        progressTitle: "Assembly Progress",
        detectionLabel: "ESP32 Detected",
        motorWire: {
          connected: "Connected",
          notConnected: "Not Connected"
        },
        steps: {
          step1: {
            title: "Place ESP32 Boards",
            description: "Position 2 ESP32 development boards in the camera view",
            requirement: "2 ESP32 boards detected"
          },
          step2: {
            title: "Connect Wires to Electronic Board",
            description: "Connect all required wires to the electronic board properly",
            requirement: "All wire connections verified"
          },
          step3: {
            title: "Wear Wrist Strap",
            description: "Put on anti-static wrist strap for safety",
            requirement: "Anti-static strap detected"
          },
          step4: {
            title: "AR Technology Showcase",
            description: "Advanced AR visualization and reporting",
            requirement: "AR demonstration complete"
          }
        },
        status: {
          step1Complete: "Step 1 Complete - {{count}} ESP32 boards detected",
          step2Complete: "Step 2 Complete - {{connected}} connections verified",
          step3Complete: "Step 3 Complete - Wrist strap detected",
          anotherEsp32Needed: "Place another ESP32 board",
          place2Boards: "Place 2 ESP32 boards in view",
          oneMoreRequired: "One more ESP32 board required",
          partialConnection: "Partial connection: {{connected}}/{{total}} wires connected",
          noConnections: "No wire connections detected",
          detectingConnections: "Detecting wire connections",
          checkingWristStrap: "Checking for wrist strap",
          noWristStrap: "Wrist strap not detected",
          detectingWristStrap: "Detecting wrist strap",
          scanningESP32: "Scanning for ESP32 boards",
          loadingARShowcase: "Loading AR showcase"
        },
        wristStrap: {
          detected: "Wrist Strap Detected",
          notDetected: "Wrist Strap Missing"
        },
        arShowcase: {
          startShowcase: "Start AR Showcase",
          hologramActive: "AR Hologram Active",
          dataStreamActive: "Data Stream Active",
          generateReport: "Generate Assembly Report",
          generatingReport: "Generating Report...",
          waitingForDetection: "Waiting for Detection"
        },
        completion: {
          allStepsComplete: "Assembly Verification Complete",
          reportGenerated: "Assembly Report Generated"
        }
      }
    }
  },
  ar: {
    translation: {
      title: "نظام الرؤية الحاسوبية بالذكاء الاصطناعي",
      subtitle: "منصة فحص بصري مدعومة بالذكاء الاصطناعي",
      
      main: {
        navigation: {
          missions: "المهام",
          analytics: "التحليلات"
        }
      },
      
      features: {
        assembly: "التحقق من التركيب والتجميع",
        inspection: "الفحص العميق",
        repair: "التحقق من إجراءات الإصلاح والصيانة",
        maintenance: "الصيانة التنبؤية البصرية",
        quality: "مراقبة الجودة",
        title: "الميزات"
      },
      
      descriptions: {
        assembly: "التحقق الآلي من عمليات التجميع والمكونات",
        inspection: "الفحص البصري العميق المتقدم بالذكاء الاصطناعي",
        repair: "التحقق من إجراءات الإصلاح المُوجهة خطوة بخطوة",
        maintenance: "الصيانة التنبؤية من خلال التحليل البصري المتقدم",
        quality: "أنظمة مراقبة الجودة الآلية وكشف العيوب"
      },
      
      navigation: {
        missions: "المهام",
        analytics: "التحليلات"
      },
      
      common: {
        back: "رجوع",
        close: "إغلاق",
        save: "حفظ",
        cancel: "إلغاء",
        confirm: "تأكيد",
        loading: "جاري التحميل...",
        error: "خطأ",
        success: "نجح"
      },
      
      actions: {
        back: "رجوع",
        next: "الخطوة التالية",
        previous: "السابق",
        continue: "متابعة",
        complete: "إكمال",
        start: "بدء",
        stop: "إيقاف",
        startCamera: "تشغيل الكاميرا",
        stopCamera: "إيقاف الكاميرا",
        startDetection: "بدء الكشف",
        stopDetection: "إيقاف الكشف"
      },
      
      analytics: {
        title: "لوحة التحليلات",
        comingSoon: "التحليلات قريباً",
        placeholder: "التحليلات والرؤى المتقدمة قريباً. تتبع أداء النماذج ودقة الكشف ومقاييس النظام."
      },
      
      assembly: {
        progressTitle: "تتبع إنجاز المهمة",
        detectionLabel: "تم اكتشاف ESP32",
        motorWire: {
          connected: "متصل",
          notConnected: "غير متصل"
        },
        steps: {
          step1: {
            title: "وضع لوحات ESP32",
            description: "ضع لوحتين من ESP32 في مجال رؤية الكاميرا",
            requirement: "اكتشاف لوحتين ESP32"
          },
          step2: {
            title: "توصيل الأسلاك باللوحة الإلكترونية",
            description: "قم بتوصيل جميع الأسلاك المطلوبة باللوحة الإلكترونية بشكل صحيح",
            requirement: "تم التحقق من جميع اتصالات الأسلاك"
          },
          step3: {
            title: "ارتداء السوار",
            description: "ارتد سوار المضاد للكهرباء الساكنة للأمان",
            requirement: "تم اكتشاف السوار المضاد للكهرباء الساكنة"
          },
          step4: {
            title: "عرض تقنية الواقع المعزز",
            description: "تصور وتقارير الواقع المعزز المتقدمة",
            requirement: "اكتمال عرض الواقع المعزز"
          }
        },
        status: {
          step1Complete: "اكتملت الخطوة 1 - تم اكتشاف {{count}} لوحة ESP32",
          step2Complete: "اكتملت الخطوة 2 - تم التحقق من {{connected}} اتصال",
          step3Complete: "اكتملت الخطوة 3 - تم اكتشاف سوار المعصم",
          anotherEsp32Needed: "ضع لوحة ESP32 أخرى",
          place2Boards: "ضع لوحتين ESP32 في المجال",
          oneMoreRequired: "مطلوب لوحة ESP32 إضافية واحدة",
          partialConnection: "اتصال جزئي: {{connected}}/{{total}} أسلاك متصلة",
          noConnections: "لم يتم اكتشاف اتصالات أسلاك",
          detectingConnections: "كشف اتصالات الأسلاك",
          checkingWristStrap: "فحص سوار المعصم",
          noWristStrap: "لم يتم اكتشاف سوار المعصم",
          detectingWristStrap: "كشف سوار المعصم",
          scanningESP32: "مسح لوحات ESP32",
          loadingARShowcase: "تحميل عرض الواقع المعزز"
        },
        wristStrap: {
          detected: "تم اكتشاف سوار المعصم",
          notDetected: "سوار المعصم مفقود"
        },
        arShowcase: {
          startShowcase: "بدء عرض الواقع المعزز",
          hologramActive: "الهولوجرام نشط",
          dataStreamActive: "تدفق البيانات نشط",
          generateReport: "إنشاء تقرير التجميع",
          generatingReport: "جاري إنشاء التقرير...",
          waitingForDetection: "في انتظار الكشف"
        },
        completion: {
          allStepsComplete: "اكتمل التحقق من التجميع",
          reportGenerated: "تم إنشاء تقرير التجميع"
        }
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