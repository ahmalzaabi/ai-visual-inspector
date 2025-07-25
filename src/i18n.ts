import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      title: "AI Advanced Vision System",
      subtitle: "AI-powered visual inspection platform",
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
        maintenance: "Predictive maintenance through visual pattern recognition",
        quality: "Real-time quality control and defect detection"
      },
      actions: {
        start: "Start Inspection",
        capture: "Capture",
        analyze: "Analyze",
        stop: "Stop",
        clear: "Clear",
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
      common: {
        back: "Back",
        dismiss: "Dismiss",
        comingSoon: "Coming Soon"
      },
      detection: {
        local_server: "Local Server",
        device_mode: "Device Mode"
      },
      main: {
        welcome: "Next-Generation AI Vision Platform",
        tagline: "Experience the convergence of cutting-edge technologies - where Artificial Intelligence meets Computer Vision, Machine Learning fuses with Augmented Reality, and Deep Neural Networks power real-time industrial inspection. Built for the future of intelligent automation with precision that exceeds human capability.",
        description: "Advanced AI-powered visual inspection platform for industrial automation and quality control.",
        techHighlights: {
          ar: "Augmented Reality",
          ai: "AI",
          cv: "Computer Vision/Machine Learning"
        },
        badges: {
          realtime: "Real-time Inference",
          accurate: "High Precision",
          intelligent: "Neural Networks",
          vision: "Computer Vision"
        },
        navigation: {
          features: "AI Detection Features",
          featuresDesc: "Explore advanced computer vision tools powered by YOLO models for assembly verification, quality control, and predictive maintenance",
          analytics: "Performance Analytics",
          analyticsDesc: "Deep insights into model performance, inference metrics, and detection accuracy to optimize your AI workflows"
        },
        stats: {
          features: "Features",
          powered: "AI Powered",
          insights: "Insights", 
          monitoring: "Monitoring",
          inferenceTime: "Inference Time",
          accuracy: "Detection Accuracy",
          model: "AI Model",
          languages: "Languages"
        },
        tech: {
          title: "Powered by Advanced AI Technology",
          ai: "TensorFlow.js",
          realtime: "Real-time Processing",
          models: "YOLO Models",
          vision: "Computer Vision",
          precision: "High Precision",
          detection: "Object Detection"
        },
        footer: {
          text: "Built with cutting-edge computer vision and neural network technology for industrial inspection",
          poweredBy: "Powered by AI"
        },
        comingSoon: "Coming Soon"
      },
      analytics: {
        title: "Analytics Dashboard",
        comingSoon: "Analytics Coming Soon",
        placeholder: "Advanced analytics and insights coming soon. Track model performance, detection accuracy, and system metrics.",
        description: "Advanced analytics and insights will help you understand model performance patterns, optimize neural network parameters, and make data-driven decisions for your computer vision workflows.",
        features: {
          performance: "Model Performance",
          performanceDesc: "Track inference times, detection accuracy, and neural network performance metrics over time",
          accuracy: "Detection Analysis",
          accuracyDesc: "Detailed accuracy breakdowns by model type, object class, and confidence thresholds",
          efficiency: "Optimization Insights",
          efficiencyDesc: "Identify bottlenecks in your computer vision pipeline and optimize model performance",
          reports: "AI Reports",
          reportsDesc: "Generate detailed reports on detection performance and model accuracy for compliance",
          insights: "Neural Insights",
          insightsDesc: "Machine learning-powered recommendations for model optimization and performance improvement",
          export: "Data Export",
          exportDesc: "Export detection data and performance metrics in multiple formats for analysis"
        },
        roadmap: {
          title: "Development Roadmap",
          phase1: "Phase 1: Core AI Features",
          phase1Desc: "Basic computer vision features with ESP32 detection and real-time YOLO inference",
          phase2: "Phase 2: Enhanced Models", 
          phase2Desc: "Additional neural networks, improved accuracy, and performance optimizations",
          phase3: "Phase 3: Analytics Platform",
          phase3Desc: "Comprehensive analytics dashboard with AI insights and performance reporting",
          phase4: "Phase 4: Advanced Neural Networks",
          phase4Desc: "Predictive analytics, automated model optimization, and advanced computer vision algorithms",
          completed: "Completed",
          inProgress: "In Progress", 
          planned: "Planned",
          future: "Future"
        },
        contact: {
          title: "Get Early Access",
          description: "Interested in advanced analytics features? Contact us to join the beta program for AI performance insights.",
          email: "Contact Us",
          feedback: "Share Feedback"
        }
      }
    }
  },
  ar: {
    translation: {
      title: "نظام الرؤية المتقدم بالذكاء الاصطناعي",
      subtitle: "منصة الفحص البصري المدعومة بالذكاء الاصطناعي",
      features: {
        assembly: "التحقق من التجميع",
        inspection: "الفحص العميق",
        repair: "إجراءات الصيانة والتصليح",
        maintenance: "الصيانة التنبؤية البصرية",
        quality: "مراقبة الجودة",
        title: "الميزات"
      },
      descriptions: {
        assembly: "التحقق الآلي من عمليات التجميع والمكونات",
        inspection: "فحص بصري عميق متقدم مدعوم بالذكاء الاصطناعي",
        repair: "التحقق من إجراءات الصيانة والتصليح الموجهة خطوة بخطوة",
        maintenance: "الصيانة التنبؤية من خلال التعرف على الأنماط البصرية",
        quality: "مراقبة الجودة في الوقت الفعلي واكتشاف العيوب"
      },
      actions: {
        start: "بدء الفحص",
        capture: "التقاط",
        analyze: "تحليل",
        stop: "إيقاف",
        clear: "مسح",
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
      common: {
        back: "رجوع",
        dismiss: "إغلاق",
        comingSoon: "قريباً"
      },
      detection: {
        local_server: "خادم محلي",
        device_mode: "وضع الجهاز"
      },
      main: {
        welcome: "منصة الرؤية الذكية للجيل القادم", 
        tagline: "اختبر تلاقي التقنيات المتطورة - حيث يلتقي الذكاء الاصطناعي مع الرؤية الحاسوبية، ويندمج التعلم الآلي مع الواقع المعزز، وتُشغل الشبكات العصبية العميقة الفحص الصناعي الفوري. مُصمم لمستقبل الأتمتة الذكية بدقة تفوق القدرة البشرية.",
        description: "منصة فحص بصري متقدمة مدعومة بالذكاء الاصطناعي للأتمتة الصناعية ومراقبة الجودة.",
        techHighlights: {
          ar: "الواقع المعزز",
          ai: "الذكاء الاصطناعي",
          cv: "الرؤية الحاسوبية/التعلم الآلي"
        },
        badges: {
          realtime: "الاستنتاج الفوري",
          accurate: "دقة عالية",
          intelligent: "الشبكات العصبية",
          vision: "الرؤية الحاسوبية"
        },
        navigation: {
          features: "ميزات الكشف بالذكاء الاصطناعي",
          featuresDesc: "استكشف أدوات الرؤية الحاسوبية المتقدمة المدعومة بنماذج YOLO للتحقق من التجميع ومراقبة الجودة والصيانة التنبؤية",
          analytics: "تحليلات الأداء",
          analyticsDesc: "رؤى عميقة حول أداء النماذج ومقاييس الاستنتاج ودقة الكشف لتحسين سير عمل الذكاء الاصطناعي"
        },
        stats: {
          features: "الميزات",
          powered: "مدعوم بالذكاء الاصطناعي",
          insights: "الرؤى",
          monitoring: "المراقبة",
          inferenceTime: "وقت الاستنتاج",
          accuracy: "دقة الكشف", 
          model: "نموذج الذكاء الاصطناعي",
          languages: "اللغات"
        },
        tech: {
          title: "مدعوم بتكنولوجيا الذكاء الاصطناعي المتقدمة",
          ai: "تينسورفلو.جي اس",
          realtime: "المعالجة الفورية",
          models: "نماذج YOLO",
          vision: "الرؤية الحاسوبية",
          precision: "دقة عالية",
          detection: "كشف الكائنات"
        },
        footer: {
          text: "مبني بأحدث تقنيات الرؤية الحاسوبية والشبكات العصبية للفحص الصناعي",
          poweredBy: "مدعوم بالذكاء الاصطناعي"
        },
        comingSoon: "قريباً"
      },
      analytics: {
        title: "لوحة التحليلات",
        comingSoon: "التحليلات قريباً",
        placeholder: "التحليلات والرؤى المتقدمة قريباً. تتبع أداء النماذج ودقة الكشف ومقاييس النظام.",
        description: "ستساعدك التحليلات والرؤى المتقدمة في فهم أنماط أداء النماذج وتحسين معاملات الشبكة العصبية واتخاذ قرارات مبنية على البيانات لسير عمل الرؤية الحاسوبية.",
        features: {
          performance: "أداء النموذج",
          performanceDesc: "تتبع أوقات الاستنتاج ودقة الكشف ومقاييس أداء الشبكة العصبية عبر الزمن",
          accuracy: "تحليل الكشف",
          accuracyDesc: "تفصيل دقيق للدقة حسب نوع النموذج وفئة الكائن وحدود الثقة",
          efficiency: "رؤى التحسين",
          efficiencyDesc: "تحديد عقد الشبكة في خط أنابيب الرؤية الحاسوبية وتحسين أداء النموذج",
          reports: "تقارير الذكاء الاصطناعي",
          reportsDesc: "إنشاء تقارير مفصلة حول أداء الكشف ودقة النموذج للامتثال",
          insights: "رؤى الشبكة العصبية",
          insightsDesc: "توصيات مدعومة بتعلم الآلة لتحسين النموذج وتحسين الأداء",
          export: "تصدير البيانات",
          exportDesc: "تصدير بيانات الكشف ومقاييس الأداء بتنسيقات متعددة للتحليل"
        },
        roadmap: {
          title: "خارطة طريق التطوير",
          phase1: "المرحلة الأولى: ميزات الذكاء الاصطناعي الأساسية",
          phase1Desc: "ميزات الرؤية الحاسوبية الأساسية مع كشف ESP32 واستنتاج YOLO الفوري",
          phase2: "المرحلة الثانية: نماذج محسنة",
          phase2Desc: "شبكات عصبية إضافية ودقة محسنة وتحسينات الأداء",
          phase3: "المرحلة الثالثة: منصة التحليلات",
          phase3Desc: "لوحة تحليلات شاملة مع رؤى الذكاء الاصطناعي وتقارير الأداء",
          phase4: "المرحلة الرابعة: الشبكات العصبية المتقدمة",
          phase4Desc: "التحليلات التنبؤية وتحسين النماذج الآلي وخوارزميات الرؤية الحاسوبية المتقدمة",
          completed: "مكتمل",
          inProgress: "قيد التطوير",
          planned: "مخطط",
          future: "مستقبلي"
        },
        contact: {
          title: "احصل على الوصول المبكر",
          description: "مهتم بميزات التحليلات المتقدمة؟ تواصل معنا للانضمام إلى برنامج البيتا لرؤى أداء الذكاء الاصطناعي.",
          email: "تواصل معنا",
          feedback: "شارك الملاحظات"
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