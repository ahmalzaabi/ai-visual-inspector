import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      title: "AI Computer Vision System",
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
        back: "Back",
        next: "Next Step",
        previous: "Back",
        continue: "Continue to Step 2",
        complete: "Complete Assembly"
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
      assembly: {
        progressTitle: "Assembly Progress",
        detectionLabel: "ESP32 detected",
        manualStepIndicator: "Manual Step",
        motorWire: {
          connected: "Connected",
          notConnected: "Not Connected"
        },
        wristStrap: {
          detected: "Anti-Static Strap Detected",
          notDetected: "No Anti-Static Strap"
        },
        arShowcase: {
          qualityScore: "Quality: {score}%",
          startShowcase: "Start AR Showcase",
          generateCertificate: "Generate Certificate",
          awaitingCompletion: "Awaiting Completion",
          newDemonstration: "New Demonstration",
          certification: {
            bronze: "Bronze Certification",
            silver: "Silver Certification", 
            gold: "Gold Certification",
            platinum: "Platinum Certification"
          },
          effects: {
            active: "AR Effects Active"
          }
        },
        steps: {
          step1: {
            title: "Place ESP32 Boards",
            description: "Position both ESP32 development boards",
            requirement: "2 ESP32 boards detected"
          },
          step2: {
            title: "Connect Motor Wires",
            description: "Connect motor wires to ESP32 boards",
            requirement: "All motor wires connected"
          },
          step3: {
            title: "Wear Anti-Static Strap", 
            description: "Put on blue anti-static wrist strap for safety",
            requirement: "Anti-static strap detected"
          },
          step4: {
            title: "AR Technology Showcase",
            description: "Advanced AR visualization and certification",
            requirement: "AR demonstration complete"
          }
        },
        status: {
          step1Complete: "Step 1 Complete! {count} ESP32 boards detected",
          step2Complete: "Step 2 Complete! {connected} motor wires connected",
          step3Complete: "Step 3 Complete! Anti-static strap detected",
          anotherEsp32Needed: "Another ESP32 needed",
          oneMoreRequired: "(1 more required)",
          place2Boards: "Place 2 ESP32 boards to complete Step 1",
          partialConnection: "{connected} of {total} motor wires connected",
          noConnections: "No motor wire connections detected",
          detectingConnections: "Detecting motor wire connections...",
          noWristStrap: "Please put on blue anti-static wrist strap",
          checkingWristStrap: "Checking for anti-static strap...",
          detectingWristStrap: "Detecting anti-static wrist strap...",
          arShowcaseComplete: "AR Showcase Complete! {certification}",
          arShowcaseProgress: "AR Analysis: {score}% ({time}s)",
          initializingAR: "Initializing AR Technology...",
          loadingARShowcase: "Loading AR Showcase...",
          manualStep: "Manual step - Click \"Next\" when complete",
          completionMessage: "🎉 Complete Assembly"
        }
      },
      detection: {
        local_server: "Local Server",
        device_mode: "Device Mode"
      },
      main: {
        welcome: "Next-Generation AI Vision Platform",
        tagline: "Leveraging the immense power of artificial intelligence and machine learning, this software allows everyday users to create simple, world-class defect detection solutions for visual inspection.",
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
          missions: "Missions",
          missionsDesc: "Access and manage inspection missions with AI-powered computer vision tools for assembly verification, quality control, and predictive maintenance",
          admin: "Admin Panel",
          adminDesc: "Administrative dashboard for system configuration, user management, performance monitoring, and advanced settings"
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
          phase1Desc: "Basic computer vision features with real-time AI inference and analysis",
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
      title: "نظام الرؤية الحاسوبية المدعوم بالذكاء الاصطناعي",
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
        back: "رجوع",
        next: "الخطوة التالية",
        previous: "رجوع",
        continue: "المتابعة إلى الخطوة 2",
        complete: "إكمال التجميع"
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
      assembly: {
        progressTitle: "تقدم التجميع",
        detectionLabel: "ESP32 مكتشف",
        manualStepIndicator: "خطوة يدوية",
        motorWire: {
          connected: "متصل",
          notConnected: "غير متصل"
        },
        wristStrap: {
          detected: "تم اكتشاف سوار مضاد للكهرباء الساكنة",
          notDetected: "لا يوجد سوار مضاد للكهرباء الساكنة"
        },
        arShowcase: {
          qualityScore: "الجودة: {score}%",
          startShowcase: "بدء عرض الواقع المعزز",
          generateCertificate: "إنشاء الشهادة",
          awaitingCompletion: "في انتظار الاكتمال",
          newDemonstration: "عرض جديد",
          certification: {
            bronze: "شهادة برونزية",
            silver: "شهادة فضية",
            gold: "شهادة ذهبية",
            platinum: "شهادة بلاتينية"
          },
          effects: {
            active: "تأثيرات الواقع المعزز نشطة"
          }
        },
        steps: {
          step1: {
            title: "وضع لوحات ESP32",
            description: "ضع كلا لوحتي التطوير ESP32",
            requirement: "اكتشاف لوحتين ESP32"
          },
          step2: {
            title: "توصيل أسلاك المحرك",
            description: "وصل أسلاك المحرك إلى لوحات ESP32",
            requirement: "توصيل جميع أسلاك المحرك"
          },
          step3: {
            title: "ارتداء سوار مضاد للكهرباء الساكنة",
            description: "ارتدِ السوار الأزرق المضاد للكهرباء الساكنة للأمان",
            requirement: "اكتشاف السوار المضاد للكهرباء الساكنة"
          },
          step4: {
            title: "عرض تقنية الواقع المعزز",
            description: "تصور متقدم بالواقع المعزز وإصدار الشهادة",
            requirement: "اكتمال عرض الواقع المعزز"
          }
        },
        status: {
          step1Complete: "الخطوة الأولى مكتملة! تم اكتشاف {count} لوحة ESP32",
          step2Complete: "الخطوة الثانية مكتملة! تم توصيل {connected} سلك محرك",
          step3Complete: "الخطوة الثالثة مكتملة! تم اكتشاف السوار المضاد للكهرباء الساكنة",
          anotherEsp32Needed: "ESP32 آخر مطلوب",
          oneMoreRequired: "(واحد إضافي مطلوب)",
          place2Boards: "ضع لوحتين ESP32 لإكمال الخطوة الأولى",
          partialConnection: "تم توصيل {connected} من {total} أسلاك المحرك",
          noConnections: "لم يتم اكتشاف توصيلات أسلاك المحرك",
          detectingConnections: "جاري اكتشاف توصيلات أسلاك المحرك...",
          noWristStrap: "يرجى ارتداء السوار الأزرق المضاد للكهرباء الساكنة",
          checkingWristStrap: "جاري فحص السوار المضاد للكهرباء الساكنة...",
          detectingWristStrap: "جاري اكتشاف السوار المضاد للكهرباء الساكنة...",
          arShowcaseComplete: "اكتمل عرض الواقع المعزز! {certification}",
          arShowcaseProgress: "تحليل الواقع المعزز: {score}% ({time}ث)",
          initializingAR: "جاري تهيئة تقنية الواقع المعزز...",
          loadingARShowcase: "جاري تحميل عرض الواقع المعزز...",
          manualStep: "خطوة يدوية - اضغط \"التالي\" عند الانتهاء",
          completionMessage: "🎉 إكمال التجميع"
        }
      },
      detection: {
        local_server: "خادم محلي",
        device_mode: "وضع الجهاز"
      },
      main: {
        welcome: "منصة الرؤية الذكية للجيل القادم", 
        tagline: "باستخدام القوة الهائلة للذكاء الاصطناعي والتعلم الآلي، يتيح هذا البرنامج للمستخدمين العاديين إنشاء حلول بسيطة وعالمية المستوى لكشف العيوب في الفحص البصري.",
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
          missions: "المهام",
          missionsDesc: "الوصول إلى وإدارة مهام الفحص باستخدام أدوات الرؤية الحاسوبية المدعومة بالذكاء الاصطناعي للتحقق من التجميع ومراقبة الجودة والصيانة التنبؤية",
          admin: "الإدارة",
          adminDesc: "لوحة تحكم إدارية لتكوين النظام وإدارة المستخدمين ومراقبة الأداء والإعدادات المتقدمة"
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
          phase1Desc: "ميزات الرؤية الحاسوبية الأساسية مع الاستنتاج والتحليل الفوري للذكاء الاصطناعي",
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