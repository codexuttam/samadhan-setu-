import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Sparkles,
  Building2,
  Wrench,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowRight,
  Camera,
  Smartphone,
  Radio,
  FileCheck2,
  ThumbsUp,
  Star,
  Users,
} from 'lucide-react';

interface RealtimeWorkflowShowcaseProps {
  language?: 'en' | 'hi';
  onRaiseClick: () => void;
  onTrackClick: () => void;
}

export default function RealtimeWorkflowShowcase({
  language = 'en',
  onRaiseClick,
  onTrackClick,
}: RealtimeWorkflowShowcaseProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Complete bilingual dictionary
  const t = {
    en: {
      tag: 'Real-Time Civic Resolution Engine',
      title: 'From Grievance to Verified Solution in 4 Simple Stages',
      subtitle:
        'Every civic issue follows an automated, transparent lifecycle tracked down to the second. Experience how your voice triggers immediate on-ground governance.',
      pause: 'Pause',
      autoPlay: 'Autoplay',
      btnRaise: 'File Complaint Now',
      btnTrack: 'Track Live Status',
      coverageLabel: 'Active Coverage',
      coverageVal: '100% Ward Coverage',
      steps: [
        {
          id: 1,
          navTitle: 'Citizen Report',
          navSubtitle: 'Photo, Voice & Auto-GPS',
          title: 'Easy Citizen Reporting',
          tagline: 'Instant Satellite Location & Photographic Proof',
          badge: 'Step 1 • Citizen Action',
          description:
            'Citizens lodge grievances in under 45 seconds using browser-based GPS locking, audio voice notes in Hindi/English, or WhatsApp photos without visiting any government office.',
          metricLabel: 'Average Filing Speed',
          metricVal: '42 seconds',
          cardHeader: 'Grievance Registered',
          cardSub: 'Complaint Profile #SS-2026-004921',
          loc: 'Dwarka Sector 10, New Delhi',
          features: [
            '📸 Photographic proof captured with real-time timestamp',
            '📍 GPS location locked automatically (No typing required)',
            '🎙️ Voice note analyzed in Hindi/English by AI',
            '🔒 Citizen mobile number securely verified',
          ],
          statusTag: '✓ Registered Successfully',
        },
        {
          id: 2,
          navTitle: 'Direct Routing',
          navSubtitle: 'No Bureaucratic Delay',
          title: 'Direct Municipal Ward Routing',
          tagline: 'Directly Dispatched to Local Ward Engineer',
          badge: 'Step 2 • Automated Routing',
          description:
            'Intelligent algorithms classify the grievance, check for duplicates in the area, compute a strict SLA resolution clock, and route the ticket directly to the ward junior engineer.',
          metricLabel: 'Dispatch Time',
          metricVal: '< 2 minutes',
          cardHeader: 'Assigned to Ward Authority',
          cardSub: 'Municipal Corporation (MCD) Division',
          loc: 'Ward 12, Municipal Zone',
          features: [
            '🏛️ Auto-routed directly to Ward Engineer: Rajesh Patil',
            '⏱️ 48-Hour High-Priority Resolution Target activated',
            '🏢 No middleman or desk-to-desk file transfers',
            '📱 Automatic SMS & WhatsApp dispatch sent to field supervisor',
          ],
          statusTag: '✓ Ward Team Dispatched',
        },
        {
          id: 3,
          navTitle: 'On-Site Repair',
          navSubtitle: 'Direct Action by Crew',
          title: 'Fast Action & On-Site Repair',
          tagline: 'Engineering Crew Resolves the Issue on Location',
          badge: 'Step 3 • On-Site Repair',
          description:
            'Municipal field teams and road repair crews arrive on site, complete repairs according to civic safety standards, and upload photographic evidence matching the GPS pin.',
          metricLabel: 'On-Time Resolution',
          metricVal: '96.4% on target',
          cardHeader: 'Field Repair Completed',
          cardSub: 'Road Maintenance & Asphalt Restoration',
          loc: 'Sector 10 Main Crossing, Delhi',
          features: [
            '👷 Field squad on-site with road repair equipment',
            '📍 Geotagged check-in verified within 10 meters of complaint',
            '📸 Quality-inspected before & after photo evidence submitted',
            '🛡️ Civil safety and bitumen density verified',
          ],
          statusTag: '✓ Repaired on Ground',
        },
        {
          id: 4,
          navTitle: 'Citizen Sign-Off',
          navSubtitle: 'Power in Citizen Hands',
          title: 'Citizen Verification & Closure',
          tagline: 'Nothing Closes Without Your 100% Satisfaction',
          badge: 'Step 4 • Citizen Approval',
          description:
            'A complaint cannot be quietly closed by officials. The citizen receives an SMS/WhatsApp notification with completion photos and must verify the resolution before the ticket is archived.',
          metricLabel: 'Citizen Satisfaction',
          metricVal: '4.9 / 5.0 Rating',
          cardHeader: 'Citizen Satisfaction Confirmed',
          cardSub: 'Official Redressal Verified',
          loc: 'Permanent Public Record',
          features: [
            '📲 SMS & WhatsApp notification delivered to citizen',
            '👍 Citizen signs off on resolution quality',
            '⭐ 5/5 Star rating recorded in public municipal scorecard',
            '↺ Option to 1-click reopen if repair is not satisfactory',
          ],
          statusTag: '✓ 100% Satisfied & Resolved',
        },
      ],
    },
    hi: {
      tag: 'नागरिक शिकायत समाधान प्रणाली • रीयल-टाइम',
      title: 'शिकायत दर्ज करने से पक्के समाधान तक • 4 सरल चरण',
      subtitle:
        'हर नागरिक समस्या का समाधान पूरी पारदर्शिता और तय समय सीमा में होता है। जानिए आपकी एक शिकायत पर नगर निगम और सरकार कैसे तुरंत कार्रवाई करती है।',
      pause: 'रोकें',
      autoPlay: 'ऑटो-प्ले',
      btnRaise: 'शिकायत दर्ज करें',
      btnTrack: 'लाइव स्थिति देखें',
      coverageLabel: 'सक्रिय कवरेज',
      coverageVal: '100% सभी वार्ड शामिल',
      steps: [
        {
          id: 1,
          navTitle: 'नागरिक रिपोर्ट',
          navSubtitle: 'फ़ोटो, आवाज़ व सीधा पता',
          title: 'आसान नागरिक रिपोर्टिंग',
          tagline: 'मोबाइल से फ़ोटो या बोलकर शिकायत दर्ज करें',
          badge: 'चरण 1 • नागरिक की पहल',
          description:
            'बिना किसी सरकारी दफ्तर के चक्कर काटे, नागरिक मात्र 45 सेकंड में अपने मोबाइल से फ़ोटो खींचकर या हिंदी/अंग्रेज़ी में बोलकर शिकायत दर्ज कर सकते हैं।',
          metricLabel: 'औसत दर्ज करने का समय',
          metricVal: '42 सेकंड',
          cardHeader: 'शिकायत दर्ज हुई',
          cardSub: 'शिकायत नंबर #SS-2026-004921',
          loc: 'द्वारका सेक्टर 10, नई दिल्ली',
          features: [
            '📸 समस्या की फ़ोटो समय और तारीख के साथ सुरक्षित',
            '📍 GPS पता अपने आप दर्ज (कोई टाइपिंग की जरूरत नहीं)',
            '🎙️ आवाज़ में बोली गई बात का तुरंत विश्लेषण',
            '🔒 नागरिक का मोबाइल नंबर पूरी तरह सुरक्षित व गोपनीय',
          ],
          statusTag: '✓ शिकायत सफलतापूर्वक दर्ज',
        },
        {
          id: 2,
          navTitle: 'सीधा विभाग को',
          navSubtitle: 'बिना किसी देरी के',
          title: 'वार्ड अधिकारी को सीधी सूचना',
          tagline: 'सीधे आपके क्षेत्र के जूनियर इंजीनियर को सुपुर्द',
          badge: 'चरण 2 • स्वचालित आवंटन',
          description:
            'शिकायत दर्ज होते ही सीधे नगर निगम (MCD), जल बोर्ड या PWD के संबंधित वार्ड अधिकारी को काम सौंप दिया जाता है। 48 घंटे में समाधान की घड़ी चालू!',
          metricLabel: 'अधिकारी को सूचना समय',
          metricVal: '< 2 मिनट',
          cardHeader: 'वार्ड अधिकारी नियुक्त',
          cardSub: 'नगर निगम सड़क व रखरखाव विभाग',
          loc: 'वार्ड 12, नगर निगम क्षेत्र',
          features: [
            '🏛️ सीधे वार्ड इंजीनियर राजेश पाटिल को काम सौंपा गया',
            '⏱️ 48 घंटे में समाधान का पक्का लक्ष्य सक्रिय',
            '🏢 किसी बिचौलिए या दफ्तर की टेबल पर फाइल अटकने का झंझट नहीं',
            '📱 फील्ड सुपरवाइजर को WhatsApp और SMS अलर्ट भेजा गया',
          ],
          statusTag: '✓ सरकारी टीम को आदेश जारी',
        },
        {
          id: 3,
          navTitle: 'मौके पर मरम्मत',
          navSubtitle: 'सरकारी टीम द्वारा कार्य',
          title: 'मौके पर पहुंचकर तुरंत मरम्मत',
          tagline: 'इंजीनियर और सफाई टीम द्वारा प्रत्यक्ष समाधान',
          badge: 'चरण 3 • मौके पर कार्रवाई',
          description:
            'नगर निगम की मरम्मत टीम तय जगह पर पहुंचती है, समस्या का पक्का समाधान करती है और काम पूरा होने की नई फ़ोटो पोर्टल पर अपलोड करती है।',
          metricLabel: 'समय पर समाधान दर',
          metricVal: '96.4% तय समय में',
          cardHeader: 'मरम्मत कार्य पूरा हुआ',
          cardSub: 'सड़क डामरीकरण व गड्ढा मरम्मत कार्य',
          loc: 'सेक्टर 10 मुख्य चौराहा, दिल्ली',
          features: [
            '👷 फील्ड मरम्मत दल आवश्यक सामग्री के साथ मौके पर पहुंचा',
            '📍 GPS स्थान पर मौजूदगी की डिजिटल पुष्टि',
            '📸 काम पूरा होने के बाद पहले और अब की फ़ोटो अपलोड',
            '🛡️ सड़क सुरक्षा और गुणवत्ता मानकों की जांच पूरी',
          ],
          statusTag: '✓ मौके पर पक्का समाधान',
        },
        {
          id: 4,
          navTitle: 'नागरिक संतुष्टि',
          navSubtitle: 'आपकी मंज़ूरी के बाद ही बंद',
          title: 'नागरिक सत्यापन और अंतिम क्लोजर',
          tagline: 'जब तक आप संतुष्ट न हों, केस बंद नहीं होगा',
          badge: 'चरण 4 • नागरिक का फैसला',
          description:
            'कोई भी सरकारी कर्मचारी अपनी मर्जी से शिकायत बंद नहीं कर सकता। काम पूरा होने पर नागरिक के फोन पर फ़ोटो सहित SMS/WhatsApp आता है। आपकी संतुष्टि के बाद ही शिकायत पूरी मानी जाती है।',
          metricLabel: 'नागरिक संतुष्टि रेटिंग',
          metricVal: '4.9 / 5.0 स्टार',
          cardHeader: 'नागरिक द्वारा संतुष्टि दर्ज',
          cardSub: 'शिकायत का सफल निवारण',
          loc: 'सार्वजनिक नागरिक रिकॉर्ड में दर्ज',
          features: [
            '📲 काम पूरा होने का SMS और WhatsApp नागरिक को भेजा गया',
            '👍 नागरिक ने कार्य की गुणवत्ता देखकर मंज़ूरी दी',
            '⭐ 5/5 स्टार संतुष्टि रेटिंग आधिकारिक रिकॉर्ड में दर्ज',
            '↺ असंतुष्ट होने पर 1-क्लिक में दोबारा जांच का पूरा अधिकार',
          ],
          statusTag: '✓ 100% संतुष्टि के साथ पूर्ण',
        },
      ],
    },
  }[language];

  const currentSteps = t.steps;
  const current = currentSteps[activeStep];

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalTime = 50;
    const stepDuration = 5500;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStep((s) => (s + 1) % currentSteps.length);
          return 0;
        }
        return prev + (intervalTime / stepDuration) * 100;
      });
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentSteps.length, activeStep]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    setProgress(0);
  };

  const handlePrev = () => {
    setActiveStep((prev) => (prev === 0 ? currentSteps.length - 1 : prev - 1));
    setProgress(0);
  };

  const handleNext = () => {
    setActiveStep((prev) => (prev + 1) % currentSteps.length);
    setProgress(0);
  };

  // Color mappings per step
  const stepColors = [
    { accent: '#F4511E', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    { accent: '#2563EB', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    { accent: '#16A34A', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { accent: '#D97706', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 relative overflow-hidden">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-[#F4511E] text-[11px] font-bold uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#F4511E]" />
              <span>{t.tag}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F1B2D] tracking-tight">
              {t.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          {/* Player controls */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
              title={isPlaying ? 'Pause' : 'Autoplay'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-slate-600" />
                  <span>{t.pause}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#F4511E]" />
                  <span>{t.autoPlay}</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrev}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
              aria-label="Previous step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
              aria-label="Next step"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4-Step Interactive Navigation Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {currentSteps.map((s, idx) => {
            const isActive = idx === activeStep;
            return (
              <button
                key={s.id}
                onClick={() => handleStepClick(idx)}
                className={`relative flex flex-col p-4 rounded-xl text-left border transition-all duration-300 group overflow-hidden ${
                  isActive
                    ? 'bg-[#0F1B2D] border-[#0F1B2D] text-white shadow-md'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100/60'
                }`}
              >
                {/* Active progress bar top strip */}
                {isActive && isPlaying && (
                  <div
                    className="absolute top-0 left-0 bottom-0 bg-[#F4511E]/20 transition-all duration-75 pointer-events-none"
                    style={{ width: `${progress}%` }}
                  />
                )}

                <div className="flex items-center justify-between w-full mb-2 relative z-10">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isActive ? 'bg-[#F4511E] text-white' : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    0{s.id}
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-[#FF6A2A]' : 'text-slate-400'}`}>
                    {idx + 1}/4
                  </span>
                </div>

                <div className="relative z-10">
                  <p className={`text-xs font-extrabold truncate ${isActive ? 'text-white' : 'text-[#0F1B2D]'}`}>
                    {s.navTitle}
                  </p>
                  <p className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                    {s.navSubtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Interactive Stage Showcase Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 sm:p-8 relative">
          
          {/* Left Column: Context & Explainer */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full animate-ping"
                style={{ backgroundColor: stepColors[activeStep].accent }}
              />
              <span
                className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-white shadow-2xs"
                style={{ borderColor: stepColors[activeStep].accent, color: stepColors[activeStep].accent }}
              >
                {current.badge}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F1B2D] tracking-tight leading-snug">
                {current.title}
              </h3>
              <p className="text-sm font-semibold text-slate-600">{current.tagline}</p>
            </div>

            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              {current.description}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
                  {current.metricLabel}
                </span>
                <span className="text-lg font-mono font-extrabold text-[#0F1B2D]">
                  {current.metricVal}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
                  {t.coverageLabel}
                </span>
                <span className="text-lg font-mono font-extrabold text-[#16A34A]">
                  {t.coverageVal}
                </span>
              </div>
            </div>

            {/* CTA action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onRaiseClick}
                className="inline-flex items-center gap-2 bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-colors"
              >
                <span>{t.btnRaise}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onTrackClick}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 text-[#0F1B2D] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <span>{t.btnTrack}</span>
              </button>
            </div>
          </div>

          {/* Right Column: User-Friendly Civic Card (Replaced Dark Terminal) */}
          <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden">
            {/* Header of Stage Preview Card */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F4511E]">
                  {activeStep === 0 && <Camera className="w-4 h-4" />}
                  {activeStep === 1 && <Building2 className="w-4 h-4 text-blue-600" />}
                  {activeStep === 2 && <Wrench className="w-4 h-4 text-emerald-600" />}
                  {activeStep === 3 && <ThumbsUp className="w-4 h-4 text-amber-600" />}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#0F1B2D]">
                    {current.cardHeader}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {current.cardSub}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {current.statusTag}
              </span>
            </div>

            {/* Location Pill */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-[#F4511E]" />
                {current.loc}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono">
                {language === 'hi' ? 'सत्यापित' : 'GPS Verified'}
              </span>
            </div>

            {/* Key Civic Indicators (User-Friendly Checklist) */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block font-sans">
                {language === 'hi' ? 'प्रमुख प्रक्रिया विशेषताएं' : 'Key Process Highlights'}
              </span>
              <div className="grid grid-cols-1 gap-2">
                {current.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-2 text-xs text-slate-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug font-medium text-[11px]">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Official Guarantee Seal */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {language === 'hi' ? 'नागरिक सेवा अधिकार अधिनियम' : 'Citizen Charter SLA Compliance'}
              </span>
              <span className="font-mono text-slate-400">
                Portal: SS-2026-NCT
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
