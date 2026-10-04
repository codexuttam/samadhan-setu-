import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Sparkles,
  Bot,
  Truck,
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
  Zap,
} from 'lucide-react';

interface RealtimeWorkflowShowcaseProps {
  onRaiseClick: () => void;
  onTrackClick: () => void;
}

export default function RealtimeWorkflowShowcase({
  onRaiseClick,
  onTrackClick,
}: RealtimeWorkflowShowcaseProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const steps = [
    {
      id: 1,
      title: 'Real-Time Geo-Intake',
      badge: 'Step 1 · Citizen Action',
      tagline: 'Instant Satellite GPS & Media Evidence',
      icon: MapPin,
      color: '#F4511E', // Civic Orange
      bgGradient: 'from-orange-500/10 via-amber-500/5 to-transparent',
      borderColor: 'border-[#F4511E]',
      description:
        'Citizens lodge grievances in under 45 seconds using browser-based GPS locking, audio voice notes, and geotagged camera photos without visiting an office.',
      telemetry: [
        '📡 Satellite GPS Locked: Dwarka Sector 10 (28.5823° N, 77.0500° E)',
        '📸 Photo Evidence: Pothole depth ~8.5cm timestamped & encrypted',
        '🎙️ AI Speech-to-Text: Auto-transcribed Marathi/Hindi/English audio',
        '🔒 Cryptographic phone token issued for privacy preservation',
      ],
      mockMetric: { label: 'Avg Submission Speed', value: '42 seconds' },
    },
    {
      id: 2,
      title: 'AI Smart Triaging',
      badge: 'Step 2 · Automated SLA Routing',
      tagline: 'Zero Bureaucratic Bottlenecks',
      icon: Bot,
      color: '#2563EB', // Blue
      bgGradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
      borderColor: 'border-[#2563EB]',
      description:
        'Machine learning algorithms parse the grievance description, verify duplicate incidents within a 50m radius, calculate SLA deadlines, and direct-route to the ward department.',
      telemetry: [
        '⚡ NLP Category match: "Roads & Infrastructure" (99.4% confidence)',
        '🎯 Duplication check: 0 active tickets in 50m radius',
        '⏱️ Auto-SLA Computed: 48-Hour High-Priority Resolution Clock started',
        '🏢 Auto-routed directly to Ward 12 Junior Engineer (Rajesh Patil)',
      ],
      mockMetric: { label: 'Triage Latency', value: '< 1.2 seconds' },
    },
    {
      id: 3,
      title: 'Field Officer Dispatch',
      badge: 'Step 3 · On-Site Action',
      tagline: 'Live GPS Telemetry & Work Execution',
      icon: Truck,
      color: '#F59E0B', // Amber
      bgGradient: 'from-amber-500/10 via-yellow-500/5 to-transparent',
      borderColor: 'border-[#F59E0B]',
      description:
        'Field supervisors receive instant SMS/WhatsApp alerts, navigate to the exact pinned coordinates, and upload verifiable before-and-after work progress photos.',
      telemetry: [
        '📱 WhatsApp & Portal Alert dispatched to Ward 12 maintenance squad',
        '👷 Crew on-site: Asphalt cold-mix repair batch #DW-892 activated',
        '📍 Geo-fenced check-in verified within 15 meters of complaint pin',
        '📸 Post-repair proof photo uploaded with tamper-evident metadata',
      ],
      mockMetric: { label: 'Field Response Rate', value: '94.8% on-time' },
    },
    {
      id: 4,
      title: 'Citizen OTP Closure',
      badge: 'Step 4 · Digital Handshake',
      tagline: 'Power Stays in Citizen Hands',
      icon: ShieldCheck,
      color: '#16A34A', // Green
      bgGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      borderColor: 'border-[#16A34A]',
      description:
        'A complaint cannot be closed by municipal staff alone. The citizen receives an OTP and must personally verify work completion and provide feedback before ticket resolution.',
      telemetry: [
        '🔐 One-Time Password sent to registered citizen phone',
        '✅ Citizen verified physical work completion via Portal OTP',
        '⭐ Rating recorded: 5/5 Stars ("Smooth & rapid road repair")',
        '📜 Tamper-proof audit event appended to municipality public ledger',
      ],
      mockMetric: { label: 'Citizen Satisfaction', value: '4.8 / 5.0' },
    },
  ];

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalTime = 50; // smooth update every 50ms
    const stepDuration = 5000; // 5 seconds per step

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStep((s) => (s + 1) % steps.length);
          return 0;
        }
        return prev + (intervalTime / stepDuration) * 100;
      });
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, steps.length, activeStep]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    setProgress(0);
  };

  const handlePrev = () => {
    setActiveStep((prev) => (prev === 0 ? steps.length - 1 : prev - 1));
    setProgress(0);
  };

  const handleNext = () => {
    setActiveStep((prev) => (prev + 1) % steps.length);
    setProgress(0);
  };

  const current = steps[activeStep];
  const StepIcon = current.icon;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 relative overflow-hidden">
        {/* Subtle Ambient Backlight */}
        <div
          className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 bg-gradient-to-br ${current.bgGradient}`}
        />

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-[#F4511E] text-[11px] font-bold uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#F4511E]" />
              <span>Real-Time Civic Resolution Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F1B2D] tracking-tight">
              From Live Geotag to Verified Solution in 4 Stages
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Every civic issue follows an automated, transparent lifecycle tracked down to the second. Experience how your voice triggers immediate on-ground governance.
            </p>
          </div>

          {/* Player controls */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
              title={isPlaying ? 'Pause auto-play' : 'Resume auto-play'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-slate-600" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#F4511E]" />
                  <span>Autoplay</span>
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
          {steps.map((s, idx) => {
            const Icon = s.icon;
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
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-[#FF6A2A]' : 'text-slate-400'
                    }`}
                  />
                </div>

                <div className="relative z-10">
                  <p
                    className={`text-xs font-extrabold truncate ${
                      isActive ? 'text-white' : 'text-[#0F1B2D]'
                    }`}
                  >
                    {s.title}
                  </p>
                  <p
                    className={`text-[10px] mt-0.5 truncate ${
                      isActive ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {s.tagline}
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
                style={{ backgroundColor: current.color }}
              />
              <span
                className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-white shadow-2xs"
                style={{ borderColor: current.color, color: current.color }}
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
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
                  {current.mockMetric.label}
                </span>
                <span className="text-lg font-mono font-extrabold text-[#0F1B2D]">
                  {current.mockMetric.value}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
                  Active Coverage
                </span>
                <span className="text-lg font-mono font-extrabold text-[#16A34A]">
                  100% Dwarka Wards
                </span>
              </div>
            </div>

            {/* CTA action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={onRaiseClick}
                className="inline-flex items-center gap-2 bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-colors"
              >
                <span>Try Live Lodging</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onTrackClick}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 text-[#0F1B2D] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <span>Track Live Status</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Simulated Telemetry / Graphic Terminal */}
          <div className="lg:col-span-6 bg-[#0F1B2D] text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5 relative overflow-hidden font-mono">
            {/* Ambient Corner Glow */}
            <div
              className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-2xl opacity-20 pointer-events-none"
              style={{ backgroundColor: current.color }}
            />

            {/* Terminal Window Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] text-slate-400 font-sans font-semibold ml-2">
                  samadhan-engine.dwarka.gov
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE STREAM
              </div>
            </div>

            {/* Stage Visual Simulation Graphic */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-3 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <StepIcon className="w-4 h-4 text-[#F4511E]" />
                  <span>Stage Simulation: {current.title}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">SS-2026-LIVE</span>
              </div>

              {/* Dynamic Interactive Stage Content */}
              {activeStep === 0 && (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-800/70 rounded-lg flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#F4511E]" />
                      Sector 10 Dwarka, Delhi
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">GPS Acc: ±4m</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      📷 2 Photos Attached
                    </span>
                    <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      🎙️ Audio Transcribed
                    </span>
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 bg-blue-950/40 border border-blue-900/50 rounded-lg">
                    <span className="text-blue-200">Category: Roads & Infrastructure</span>
                    <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                      99.4% MATCH
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-300 px-1">
                    <span>Assigned SLA Window:</span>
                    <span className="font-mono text-amber-400 font-bold">48 Hours (High Priority)</span>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-amber-950/30 border border-amber-900/50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">
                        RP
                      </div>
                      <span className="text-amber-200 text-[11px]">Rajesh Patil (Ward 12 Squad)</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">On Field</span>
                  </div>
                  <div className="text-[11px] text-slate-400 px-1 flex justify-between">
                    <span>GPS Check-in:</span>
                    <span className="text-slate-200 font-mono">15m from coordinates</span>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-900/50 rounded-lg flex items-center justify-between">
                    <span className="text-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Tamper-proof OTP Verified
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                      CODE: 2026
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-300 px-1">
                    <span>Citizen Rating:</span>
                    <span className="text-amber-400">★★★★★ (5.0 / 5.0)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Event Ticker Stream */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-sans font-semibold">
                Real-Time Telemetry Stream:
              </span>
              <div className="space-y-1.5 text-xs text-slate-300 bg-black/40 p-3 rounded-xl border border-slate-800">
                {current.telemetry.map((line, i) => (
                  <div key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-emerald-400 shrink-0 text-[10px] mt-0.5">&gt;</span>
                    <span className="text-[11px] text-slate-300">{line}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Audit Footnote */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-sans pt-1">
              <span>Municipality Node: Dwarka Zone 1</span>
              <span>Updated: Real-time</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
