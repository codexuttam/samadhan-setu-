import React, { useState, useEffect } from 'react';
import {
  Camera,
  MapPin,
  Building2,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  Mic,
  MessageSquare,
  Sparkles,
  Phone,
  ThumbsUp,
  FileCheck2,
} from 'lucide-react';

interface CarouselStep {
  id: number;
  badge: string;
  hindiBadge: string;
  title: string;
  hindiTitle: string;
  subtitle: string;
  description: string;
  accentColor: string;
  bgGradient: string;
  pillColor: string;
  imageUrl: string;
  icon: React.ReactNode;
  renderGraphic: () => React.ReactNode;
}

const steps: CarouselStep[] = [
  {
    id: 1,
    badge: 'STEP 1 • REPORT IN SECONDS',
    hindiBadge: 'चरण 1 • सबसे आसान',
    title: 'Snap a Photo or Just Speak',
    hindiTitle: 'बस फ़ोटो खींचें या बोलकर बताएं',
    subtitle: 'No Complicated Forms • कोई लंबा फ़ॉर्म नहीं',
    description:
      'सड़क का गड्ढा, बंद स्ट्रीटलाइट या गंदा पानी—बस मोबाइल से एक फ़ोटो लें या बोलकर बताएं। बुजुर्गों और हर उम्र के लोगों के लिए बेहद आसान।',
    accentColor: '#F4511E',
    bgGradient: 'from-orange-500 to-amber-600',
    pillColor: 'bg-orange-50 text-orange-700 border-orange-200',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
    icon: <Camera className="w-5 h-5 text-white" />,
    renderGraphic: () => (
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 select-none overflow-hidden">
        {/* Background photo with clean subtle gradient */}
        <img
          src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80"
          alt="Citizen capturing community issue"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1B2D]/90 via-[#0F1B2D]/40 to-[#0F1B2D]/60" />

        {/* Friendly High-Legibility Card */}
        <div className="relative z-10 w-full max-w-[360px] bg-white/95 rounded-2xl border border-white/40 shadow-2xl p-4 sm:p-5 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-extrabold text-[#0F1B2D] uppercase tracking-wider">
                सरल शिकायत दर्ज करें • 100% Free
              </span>
            </div>
            <span className="bg-orange-100 text-[#F4511E] text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
              3 विकल्प उपलब्ध
            </span>
          </div>

          {/* 3 Large Accessible Options */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-orange-50/80 border border-orange-200/80 rounded-xl flex flex-col items-center justify-center gap-1 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-[#F4511E] text-white flex items-center justify-center shadow-xs">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">फ़ोटो लें</span>
              <span className="text-[9px] text-slate-500 font-medium">Take Photo</span>
            </div>

            <div className="p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex flex-col items-center justify-center gap-1 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Mic className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">बोलें</span>
              <span className="text-[9px] text-slate-500 font-medium">Voice Note</span>
            </div>

            <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex flex-col items-center justify-center gap-1 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 leading-tight">व्हाट्सएप</span>
              <span className="text-[9px] text-slate-500 font-medium">WhatsApp</span>
            </div>
          </div>

          {/* Location auto-detected badge */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700">
              <MapPin className="w-4 h-4 text-[#F4511E] shrink-0" />
              <div>
                <p className="font-bold text-[11px] text-[#0F1B2D]">पता अपने आप दर्ज होता है</p>
                <p className="text-[10px] text-slate-500">द्वारका सेक्टर 10, नई दिल्ली</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              ✓ पता मिल गया
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    badge: 'STEP 2 • DIRECT GOVERNMENT ROUTING',
    hindiBadge: 'चरण 2 • सीधा विभाग को',
    title: 'No Office Visits Needed',
    hindiTitle: 'बिना दफ्तर के चक्कर काटे',
    subtitle: 'Directly Assigned to Local Ward Officer • सीधे वार्ड अफ़सर को',
    description:
      'आपकी शिकायत किसी बिचौलिए के बिना सीधे नगर निगम (MCD), दिल्ली जल बोर्ड या PWD के वार्ड अधिकारी के पास पहुंचती है। 48 घंटे में समाधान का पक्का लक्ष्य।',
    accentColor: '#2563EB',
    bgGradient: 'from-blue-600 to-indigo-600',
    pillColor: 'bg-blue-50 text-blue-700 border-blue-200',
    imageUrl: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=800&auto=format&fit=crop&q=80',
    icon: <Building2 className="w-5 h-5 text-white" />,
    renderGraphic: () => (
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 select-none overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=800&auto=format&fit=crop&q=80"
          alt="Civic department team at work"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.65] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1B2D]/90 via-[#0F1B2D]/40 to-[#0F1B2D]/60" />

        <div className="relative z-10 w-full max-w-[360px] bg-white/95 rounded-2xl border border-white/40 shadow-2xl p-4 sm:p-5 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-extrabold text-[#0F1B2D]">
                संबंधित विभाग को तुरंत सूचना
              </span>
            </div>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
              MCD • DJB • PWD
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                शिकायत नंबर (Tracking ID)
              </span>
              <span className="font-mono font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 text-xs">
                SS-2026-004921
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                JE
              </div>
              <div>
                <p className="font-extrabold text-[#0F1B2D] text-[11px]">
                  वार्ड इंजीनियर: राजेश पाटिल
                </p>
                <p className="text-[10px] text-slate-500">वार्ड 12, नगर निगम क्षेत्र</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-800">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold text-[11px] text-amber-900">48 घंटे में समाधान गारंटी</p>
                <p className="text-[9px] text-amber-700">Citizen Charter SLA Target Active</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-300">
              48 घंटे
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    badge: 'STEP 3 • ON-GROUND RESOLUTION',
    hindiBadge: 'चरण 3 • पक्की मरम्मत',
    title: 'Fast Action & On-Site Repair',
    hindiTitle: 'मौके पर पहुंचकर तुरंत मरम्मत',
    subtitle: 'Quality Inspected with Real Photo Proof • फ़ोटो सबूत के साथ',
    description:
      'सड़क की मरम्मत, नया स्ट्रीटलाइट बल्ब या पानी की पाइपलाइन—इंजीनियर टीम मौके पर काम पूरा करती है और काम पूरा होने की नई फ़ोटो अपलोड करती है।',
    accentColor: '#16A34A',
    bgGradient: 'from-emerald-600 to-teal-600',
    pillColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
    icon: <Wrench className="w-5 h-5 text-white" />,
    renderGraphic: () => (
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 select-none overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80"
          alt="Clean newly repaired road and neighborhood"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1B2D]/90 via-[#0F1B2D]/40 to-[#0F1B2D]/60" />

        <div className="relative z-10 w-full max-w-[360px] bg-white/95 rounded-2xl border border-white/40 shadow-2xl p-4 sm:p-5 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-extrabold text-[#0F1B2D]">
                मरम्मत कार्य पूरा हुआ (Repaired)
              </span>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
              ✓ जांच में पास
            </span>
          </div>

          {/* Simple Before & After Visual comparison */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wide block">
                पहले: समस्या
              </span>
              <p className="font-extrabold text-slate-800 text-[11px]">खतरनाक गड्ढा</p>
              <span className="text-[9px] text-slate-500 block">12 अक्टूबर • फ़ोटो दर्ज</span>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide block">
                अब: समाधान
              </span>
              <p className="font-extrabold text-emerald-800 text-[11px]">पक्की सड़क तैयार</p>
              <span className="text-[9px] text-emerald-600 font-bold block">14 अक्टूबर • काम पूर्ण</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-slate-700">
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              सड़क सुरक्षा मानकों के अनुरूप
            </span>
            <span className="text-[10px] font-mono text-slate-500">वार्ड 12, दिल्ली</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    badge: 'STEP 4 • COMPLETE SATISFACTION',
    hindiBadge: 'चरण 4 • आपकी संतुष्टि',
    title: 'Notification & Final Sign-Off',
    hindiTitle: 'आपके मोबाइल पर पक्का मैसेज',
    subtitle: 'Nothing Closes Until You Are Happy • आपकी अनुमति के बिना फाइल बंद नहीं होगी',
    description:
      'काम पूरा होने पर आपके WhatsApp और SMS पर फ़ोटो के साथ मैसेज आता है। जब आप संतुष्ट होंगे, तभी शिकायत बंद मानी जाएगी। नहीं तो 1 क्लिक में दोबारा जांच होगी।',
    accentColor: '#D97706',
    bgGradient: 'from-amber-600 to-orange-600',
    pillColor: 'bg-amber-50 text-amber-700 border-amber-200',
    imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80',
    icon: <CheckCircle2 className="w-5 h-5 text-white" />,
    renderGraphic: () => (
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 select-none overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80"
          alt="Clean happy public park and community"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1B2D]/90 via-[#0F1B2D]/40 to-[#0F1B2D]/60" />

        <div className="relative z-10 w-full max-w-[360px] bg-white/95 rounded-2xl border border-white/40 shadow-2xl p-4 sm:p-5 backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#0F1B2D]">
                क्या आप काम से संतुष्ट हैं?
              </h4>
              <p className="text-[10px] text-slate-500">
                Are you satisfied with this repair work?
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1 text-xs">
            <p className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp / SMS पर पावती भेजी गई
            </p>
            <p className="text-[10px] text-slate-600">
              "शिकायत #SS-2026-004921 का समाधान नगर निगम द्वारा कर दिया गया है।"
            </p>
          </div>

          {/* Two large friendly citizen action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>हाँ, काम हो गया ✓</span>
            </div>
            <div className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-300">
              <span>दोबारा दिखाएं ↺</span>
            </div>
          </div>

          <p className="text-[9px] text-slate-400 text-center font-medium">
            जनता की संतुष्टि ही सरकार का संकल्प है • Transparent Redressal
          </p>
        </div>
      </div>
    ),
  },
];

export default function DynamicCarousel() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const current = steps[activeStep];

  return (
    <div
      className="w-full h-full flex flex-col bg-white overflow-hidden select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. TOP GRAPHIC PREVIEW CANVAS (Flex-1) */}
      <div className="relative flex-1 min-h-[230px] overflow-hidden bg-slate-900">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              idx === activeStep
                ? 'opacity-100 scale-100 pointer-events-auto'
                : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            {step.renderGraphic()}
          </div>
        ))}

        {/* Floating Quick Step Indicators on Canvas */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg text-[11px] font-extrabold tracking-wide bg-black/70 backdrop-blur-md text-white border border-white/20 shadow-md flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: current.accentColor }}
            />
            <span>{current.hindiBadge}</span>
            <span className="text-slate-300 font-normal">| {current.badge}</span>
          </span>
        </div>

        {/* Prev / Next Overlay Arrows */}
        <div className="absolute inset-y-0 left-2 right-2 flex items-center justify-between pointer-events-none z-20">
          <button
            onClick={() => setActiveStep((prev) => (prev - 1 + steps.length) % steps.length)}
            aria-label="Previous step"
            className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 pointer-events-auto border border-white/20 shadow-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveStep((prev) => (prev + 1) % steps.length)}
            aria-label="Next step"
            className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 pointer-events-auto border border-white/20 shadow-md"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. BOTTOM DETAILS & ACCESSIBLE TAB BAR */}
      <div className="bg-white border-t border-slate-100 p-4 sm:p-5 flex flex-col justify-between shrink-0 relative">
        {/* Animated Progress Line */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-100">
          <div
            className={`h-full bg-gradient-to-r ${current.bgGradient} transition-all duration-500 ease-out`}
            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step description */}
        <div className="flex items-start gap-3.5 mb-3">
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${current.bgGradient} flex items-center justify-center shrink-0 shadow-md text-white`}
          >
            {current.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0F1B2D]">
                {current.hindiTitle}
              </h3>
              <span className="text-xs font-bold text-slate-500">
                • {current.title}
              </span>
            </div>
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {current.description}
            </p>
          </div>
        </div>

        {/* Accessible Step Switcher Tabs */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  idx === activeStep
                    ? 'bg-[#0F1B2D] text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{step.id}.</span>
                <span className="font-semibold text-[11px]">
                  {step.hindiTitle.split(' ')[1] || step.title.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>

          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{isPaused ? 'रुका हुआ (Paused)' : 'ऑटो-प्ले (Auto)'}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
