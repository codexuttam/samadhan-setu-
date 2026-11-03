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
  ThumbsUp,
  FileCheck2,
} from 'lucide-react';

interface DynamicCarouselProps {
  language?: 'en' | 'hi';
}

export default function DynamicCarousel({ language = 'en' }: DynamicCarouselProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const t = {
    en: {
      step1: {
        title: 'Snap a Photo or Just Speak',
        subtitle: 'No Complicated Forms',
        description:
          'Potholes, broken streetlights, or sewage leaks—just take a photo or speak your grievance. Designed simply for every citizen and senior.',
        cardHeader: 'Simple Grievance • 100% Free',
        badge: '3 Easy Ways',
        photo: 'Photo',
        photoSub: 'Take Photo',
        voice: 'Voice',
        voiceSub: 'Voice Note',
        wa: 'WhatsApp',
        waSub: 'Direct Chat',
        locTitle: 'Address detected automatically',
        locSub: 'Dwarka Sector 10, New Delhi',
        locBadge: '✓ Located',
        tab: 'Photo',
      },
      step2: {
        title: 'Direct Municipal Routing',
        subtitle: 'No Office Visits Needed',
        description:
          'Your complaint is sent straight to the responsible ward engineer (MCD, Jal Board, or PWD). Guaranteed 48-hour resolution target.',
        cardHeader: 'Sent to Designated Authority',
        deptBadge: 'MCD • DJB • PWD',
        trackLabel: 'Tracking Reference ID',
        officer: 'Ward Engineer: Rajesh Patil',
        ward: 'Ward 12 Municipal Division',
        slaTitle: '48-Hour Resolution Guarantee',
        slaDesc: 'Citizen Charter SLA Clock Active',
        slaBadge: '48 Hours',
        tab: 'Routing',
      },
      step3: {
        title: 'Fast Action & On-Site Repair',
        subtitle: 'Quality Inspected with Photo Proof',
        description:
          'Municipal road crews and repair teams resolve the issue on the ground and upload photographic evidence before marking the job done.',
        cardHeader: 'Repair Work Completed',
        verifiedBadge: '✓ Verified',
        beforeTag: 'BEFORE',
        beforeText: 'Pothole Hazard',
        beforeDate: '12 Oct • Reported',
        afterTag: 'RESOLVED',
        afterText: 'Smooth Road Paved',
        afterDate: '14 Oct • Restored',
        compliance: 'Road safety standards met',
        location: 'Ward 12, Delhi',
        tab: 'Repair',
      },
      step4: {
        title: 'Notification & Final Sign-Off',
        subtitle: 'Nothing Closes Without Your Approval',
        description:
          'When work is done, you receive an SMS and WhatsApp alert with photos. The ticket is officially closed only when you are satisfied.',
        cardTitle: 'Are you satisfied with this repair?',
        cardSub: 'Your satisfaction is required for closure',
        receiptTitle: 'WhatsApp / SMS Receipt Delivered',
        receiptMsg: '"Grievance #SS-2026-004921 has been resolved by municipal team."',
        btnYes: 'Yes, Solved ✓',
        btnReopen: 'Reopen ↺',
        dutyNote: 'Citizen satisfaction is our highest duty',
        tab: 'Solved',
      },
      paused: 'Paused',
      autoPlaying: 'Auto-playing',
    },
    hi: {
      step1: {
        title: 'बस फ़ोटो खींचें या बोलकर बताएं',
        subtitle: 'कोई लंबा फ़ॉर्म नहीं',
        description:
          'सड़क का गड्ढा, बंद स्ट्रीटलाइट या गंदा पानी—बस मोबाइल से एक फ़ोटो लें या बोलकर बताएं। बुजुर्गों और हर नागरिक के लिए बेहद आसान।',
        cardHeader: 'सरल शिकायत दर्ज करें • 100% मुफ़्त',
        badge: '3 सरल तरीके',
        photo: 'फ़ोटो लें',
        photoSub: 'कैमरा',
        voice: 'बोलें',
        voiceSub: 'आवाज़ रिकॉर्ड',
        wa: 'व्हाट्सएप',
        waSub: 'सीधा चैट',
        locTitle: 'पता अपने आप दर्ज होता है',
        locSub: 'द्वारका सेक्टर 10, नई दिल्ली',
        locBadge: '✓ पता मिल गया',
        tab: 'फ़ोटो',
      },
      step2: {
        title: 'बिना दफ्तर के चक्कर काटे',
        subtitle: 'सीधे वार्ड अफ़सर को असाइन',
        description:
          'आपकी शिकायत सीधे आपके इलाके के संबंधित सरकारी अफ़सर (MCD, जल बोर्ड, PWD) के पास पहुंचती है। 48 घंटे में समाधान का पक्का लक्ष्य।',
        cardHeader: 'संबंधित विभाग को तुरंत सूचना',
        deptBadge: 'MCD • DJB • PWD',
        trackLabel: 'शिकायत नंबर (Tracking ID)',
        officer: 'वार्ड इंजीनियर: राजेश पाटिल',
        ward: 'वार्ड 12, नगर निगम क्षेत्र',
        slaTitle: '48 घंटे में समाधान गारंटी',
        slaDesc: 'सिटिजन चार्टर समय सीमा सक्रिय',
        slaBadge: '48 घंटे',
        tab: 'विभाग',
      },
      step3: {
        title: 'मौके पर पहुंचकर तुरंत मरम्मत',
        subtitle: 'पक्की फ़ोटो सबूत के साथ',
        description:
          'सड़क की मरम्मत, नया स्ट्रीटलाइट बल्ब या पानी की पाइपलाइन—इंजीनियर टीम मौके पर काम पूरा करती है और फ़ोटो अपलोड करती है।',
        cardHeader: 'मरम्मत कार्य पूरा हुआ',
        verifiedBadge: '✓ जांच में पास',
        beforeTag: 'पहले: समस्या',
        beforeText: 'खतरनाक गड्ढा',
        beforeDate: '12 अक्टूबर • दर्ज',
        afterTag: 'अब: समाधान',
        afterText: 'पक्की सड़क तैयार',
        afterDate: '14 अक्टूबर • पूर्ण',
        compliance: 'सड़क सुरक्षा मानकों के अनुरूप',
        location: 'वार्ड 12, दिल्ली',
        tab: 'मरम्मत',
      },
      step4: {
        title: 'आपके मोबाइल पर पक्का मैसेज',
        subtitle: 'आपकी अनुमति के बिना केस बंद नहीं होगा',
        description:
          'काम पूरा होने पर आपके WhatsApp और SMS पर फ़ोटो के साथ मैसेज आता है। जब आप संतुष्ट होंगे, तभी शिकायत बंद मानी जाएगी।',
        cardTitle: 'क्या आप काम से संतुष्ट हैं?',
        cardSub: 'संतुष्ट होने पर ही अंतिम रूप से बंद होगा',
        receiptTitle: 'WhatsApp / SMS पर पावती भेजी गई',
        receiptMsg: '"शिकायत #SS-2026-004921 का समाधान नगर निगम द्वारा कर दिया गया है।"',
        btnYes: 'हाँ, काम हो गया ✓',
        btnReopen: 'दोबारा दिखाएं ↺',
        dutyNote: 'नागरिकों की संतुष्टि ही सरकार का संकल्प है',
        tab: 'समाधान',
      },
      paused: 'रुका हुआ',
      autoPlaying: 'ऑटो-प्ले',
    },
  }[language];

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Step definition array
  const stepConfigs = [
    {
      id: 1,
      accentColor: '#F4511E',
      bgGradient: 'from-orange-500 to-amber-600',
      imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
      icon: <Camera className="w-5 h-5 text-white" />,
      info: t.step1,
      renderGraphic: () => (
        <div className="relative w-full h-full flex items-center justify-center p-3 select-none overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80"
            alt="Citizen capturing community issue"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1B2D]/90 via-[#0F1B2D]/40 to-[#0F1B2D]/60" />

          {/* Compact, perfectly proportioned floating card */}
          <div className="relative z-10 w-full max-w-[310px] bg-white/95 rounded-2xl border border-white/50 shadow-2xl p-3.5 backdrop-blur-md space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-extrabold text-[#0F1B2D] uppercase tracking-wide">
                  {t.step1.cardHeader}
                </span>
              </div>
              <span className="bg-orange-100 text-[#F4511E] text-[9px] font-bold px-1.5 py-0.5 rounded-full font-sans">
                {t.step1.badge}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-2 bg-orange-50/80 border border-orange-200/80 rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-xs">
                <div className="w-7 h-7 rounded-full bg-[#F4511E] text-white flex items-center justify-center shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-800 leading-tight">{t.step1.photo}</span>
                <span className="text-[8px] text-slate-500">{t.step1.photoSub}</span>
              </div>

              <div className="p-2 bg-blue-50/80 border border-blue-200/80 rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-xs">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-800 leading-tight">{t.step1.voice}</span>
                <span className="text-[8px] text-slate-500">{t.step1.voiceSub}</span>
              </div>

              <div className="p-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-xs">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-800 leading-tight">{t.step1.wa}</span>
                <span className="text-[8px] text-slate-500">{t.step1.waSub}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-[#F4511E] shrink-0" />
                <div>
                  <p className="font-bold text-[10px] text-[#0F1B2D] leading-tight">{t.step1.locTitle}</p>
                  <p className="text-[9px] text-slate-500 leading-tight">{t.step1.locSub}</p>
                </div>
              </div>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                {t.step1.locBadge}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      accentColor: '#2563EB',
      bgGradient: 'from-blue-600 to-indigo-600',
      imageUrl: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=800&auto=format&fit=crop&q=80',
      icon: <Building2 className="w-5 h-5 text-white" />,
      info: t.step2,
      renderGraphic: () => (
        <div className="relative w-full h-full flex items-center justify-center p-3 select-none overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=800&auto=format&fit=crop&q=80"
            alt="Civic department team at work"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.65] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1B2D]/90 via-[#0F1B2D]/40 to-[#0F1B2D]/60" />

          <div className="relative z-10 w-full max-w-[310px] bg-white/95 rounded-2xl border border-white/50 shadow-2xl p-3.5 backdrop-blur-md space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-extrabold text-[#0F1B2D]">
                  {t.step2.cardHeader}
                </span>
              </div>
              <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-blue-200">
                {t.step2.deptBadge}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.step2.trackLabel}
                </span>
                <span className="font-mono font-extrabold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200 text-[10px]">
                  SS-2026-004921
                </span>
              </div>

              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                  JE
                </div>
                <div>
                  <p className="font-extrabold text-[#0F1B2D] text-[10px] leading-tight">
                    {t.step2.officer}
                  </p>
                  <p className="text-[9px] text-slate-500 leading-tight">{t.step2.ward}</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 flex items-center justify-between">
              <div className="flex items-center gap-1 text-amber-800">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold text-[10px] text-amber-900 leading-tight">{t.step2.slaTitle}</p>
                  <p className="text-[8px] text-amber-700 leading-tight">{t.step2.slaDesc}</p>
                </div>
              </div>
              <span className="text-[9px] font-extrabold text-amber-800 bg-white px-1.5 py-0.5 rounded border border-amber-300">
                {t.step2.slaBadge}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      accentColor: '#16A34A',
      bgGradient: 'from-emerald-600 to-teal-600',
      imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
      icon: <Wrench className="w-5 h-5 text-white" />,
      info: t.step3,
      renderGraphic: () => (
        <div className="relative w-full h-full flex items-center justify-center p-3 select-none overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80"
            alt="Clean newly repaired road and neighborhood"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1B2D]/90 via-[#0F1B2D]/40 to-[#0F1B2D]/60" />

          <div className="relative z-10 w-full max-w-[310px] bg-white/95 rounded-2xl border border-white/50 shadow-2xl p-3.5 backdrop-blur-md space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-extrabold text-[#0F1B2D]">
                  {t.step3.cardHeader}
                </span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-300">
                {t.step3.verifiedBadge}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-center text-xs">
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl space-y-0.5">
                <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wide block">
                  {t.step3.beforeTag}
                </span>
                <p className="font-extrabold text-slate-800 text-[10px]">{t.step3.beforeText}</p>
                <span className="text-[8px] text-slate-500 block">{t.step3.beforeDate}</span>
              </div>

              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl space-y-0.5">
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide block">
                  {t.step3.afterTag}
                </span>
                <p className="font-extrabold text-emerald-800 text-[10px]">{t.step3.afterText}</p>
                <span className="text-[8px] text-emerald-600 font-bold block">{t.step3.afterDate}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-between text-[10px] text-slate-700">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3 h-3" />
                {t.step3.compliance}
              </span>
              <span className="font-mono text-slate-500 text-[9px]">{t.step3.location}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      accentColor: '#D97706',
      bgGradient: 'from-amber-600 to-orange-600',
      imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80',
      icon: <CheckCircle2 className="w-5 h-5 text-white" />,
      info: t.step4,
      renderGraphic: () => (
        <div className="relative w-full h-full flex items-center justify-center p-3 select-none overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80"
            alt="Clean happy public park and community"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1B2D]/90 via-[#0F1B2D]/40 to-[#0F1B2D]/60" />

          <div className="relative z-10 w-full max-w-[310px] bg-white/95 rounded-2xl border border-white/50 shadow-2xl p-3.5 backdrop-blur-md space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[11px] font-extrabold text-[#0F1B2D] leading-tight">
                  {t.step4.cardTitle}
                </h4>
                <p className="text-[9px] text-slate-500 leading-tight">
                  {t.step4.cardSub}
                </p>
              </div>
            </div>

            <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-0.5 text-xs">
              <p className="text-[10px] font-bold text-emerald-900 flex items-center gap-1">
                <FileCheck2 className="w-3 h-3 text-emerald-600" />
                {t.step4.receiptTitle}
              </p>
              <p className="text-[9px] text-slate-600 leading-tight">
                {t.step4.receiptMsg}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <div className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer">
                <ThumbsUp className="w-3 h-3" />
                <span>{t.step4.btnYes}</span>
              </div>
              <div className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-300">
                <span>{t.step4.btnReopen}</span>
              </div>
            </div>

            <p className="text-[8px] text-slate-400 text-center font-medium">
              {t.step4.dutyNote}
            </p>
          </div>
        </div>
      ),
    },
  ];

  const current = stepConfigs[activeStep];

  return (
    <div
      className="w-full h-full flex flex-col bg-white overflow-hidden select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. TOP GRAPHIC PREVIEW CANVAS (Clean without overlapping step text) */}
      <div className="relative flex-1 min-h-[235px] overflow-hidden bg-slate-900">
        {stepConfigs.map((step, idx) => (
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

        {/* Prev / Next Overlay Arrows */}
        <div className="absolute inset-y-0 left-2 right-2 flex items-center justify-between pointer-events-none z-20">
          <button
            onClick={() => setActiveStep((prev) => (prev - 1 + stepConfigs.length) % stepConfigs.length)}
            aria-label="Previous step"
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 pointer-events-auto border border-white/20 shadow-md"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveStep((prev) => (prev + 1) % stepConfigs.length)}
            aria-label="Next step"
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 pointer-events-auto border border-white/20 shadow-md"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. BOTTOM DETAILS & ACCESSIBLE TAB BAR */}
      <div className="bg-white border-t border-slate-100 p-3.5 sm:p-4 flex flex-col justify-between shrink-0 relative">
        {/* Animated Progress Line */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-100">
          <div
            className={`h-full bg-gradient-to-r ${current.bgGradient} transition-all duration-500 ease-out`}
            style={{ width: `${((activeStep + 1) / stepConfigs.length) * 100}%` }}
          />
        </div>

        {/* Step description */}
        <div className="flex items-start gap-3 mb-2.5">
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${current.bgGradient} flex items-center justify-center shrink-0 shadow-md text-white`}
          >
            {current.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5 mb-0.5">
              <h3 className="text-sm font-extrabold text-[#0F1B2D]">
                {current.info.title}
              </h3>
              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                • {current.info.subtitle}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
              {current.info.description}
            </p>
          </div>
        </div>

        {/* Clean Accessible Step Switcher Tabs */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {stepConfigs.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                  idx === activeStep
                    ? 'bg-[#0F1B2D] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{step.id}.</span>
                <span className="font-semibold text-[10px]">
                  {step.info.tab}
                </span>
              </button>
            ))}
          </div>

          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{isPaused ? t.paused : t.autoPlaying}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
