import React, { useState, useEffect } from 'react';
import {
  Camera,
  MapPin,
  Cpu,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Layers,
  FileCheck2,
  Building,
  AlertCircle
} from 'lucide-react';

interface CarouselStep {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  bgGradient: string;
  pillColor: string;
  icon: React.ReactNode;
  renderGraphic: () => React.ReactNode;
}

const steps: CarouselStep[] = [
  {
    id: 1,
    badge: 'STEP 1 • REPORT & GEOTAG',
    title: 'Snap & Geotag Proof',
    subtitle: 'Citizen Mobile Capture',
    description: 'Citizens snap a photo of the grievance. High-precision GPS coordinates, ward metadata, and timestamp are captured automatically.',
    accentColor: '#F4511E',
    bgGradient: 'from-orange-500 to-red-600',
    pillColor: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: <Camera className="w-5 h-5 text-white" />,
    renderGraphic: () => (
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 select-none overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415515_1px,transparent_1px),linear-gradient(to_bottom,#33415515_1px,transparent_1px)] bg-[size:16px_16px]" />
        
        {/* Simulated Camera Viewfinder */}
        <div className="relative w-full max-w-[340px] aspect-[16/10] bg-slate-950/80 rounded-2xl border border-slate-700/80 shadow-2xl p-4 flex flex-col justify-between overflow-hidden backdrop-blur-md">
          {/* Top Camera HUD */}
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono z-10">
            <span className="flex items-center gap-1.5 font-bold text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              LIVE REC
            </span>
            <span className="bg-slate-800/90 border border-slate-700 px-2 py-0.5 rounded text-[10px] text-slate-300">
              4K • 60FPS
            </span>
            <span className="text-slate-400 text-[10px]">ISO 160</span>
          </div>

          {/* Central AI Bounding Box */}
          <div className="relative my-auto self-center w-52 h-24 border-2 border-dashed border-[#F4511E] rounded-xl flex flex-col items-center justify-center bg-[#F4511E]/10 backdrop-blur-xs">
            {/* Viewfinder corner brackets */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#F4511E]" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#F4511E]" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#F4511E]" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#F4511E]" />

            <div className="flex items-center gap-1.5 bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#F4511E]/40 shadow-lg">
              <AlertCircle className="w-3.5 h-3.5 text-[#F4511E]" />
              <span>Deep Pothole Detected</span>
            </div>
            <span className="text-[10px] text-slate-300 font-mono mt-1">Confidence: 98.4%</span>
          </div>

          {/* Bottom GPS & Timestamp Overlay */}
          <div className="flex items-center justify-between z-10 pt-2 border-t border-slate-800/80 text-[10px]">
            <div className="flex items-center gap-1 text-slate-300 font-mono">
              <MapPin className="w-3 h-3 text-[#F4511E]" />
              <span>28.6139° N, 77.2090° E</span>
            </div>
            <span className="text-slate-400 font-mono">Ward 42 • Dwarka</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    badge: 'STEP 2 • AI TRIAGE & ROUTING',
    title: 'Instant SLA Dispatch',
    subtitle: 'Zero-Intermediary Triage',
    description: 'Computer vision and NLP classify the complaint severity, generate an SLA deadline, and instantly route the ticket to the designated ward authority.',
    accentColor: '#3B82F6',
    bgGradient: 'from-blue-500 to-indigo-600',
    pillColor: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Cpu className="w-5 h-5 text-white" />,
    renderGraphic: () => (
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#0B1528] to-slate-900 p-6 select-none overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-[360px] flex items-center justify-between gap-3">
          {/* Source Citizen Node */}
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Citizen Post</span>
            <span className="text-[9px] text-slate-500 font-mono">ID: #SS8432</span>
          </div>

          {/* Animated Stream Lines */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full h-0.5 bg-blue-500/30 relative">
              <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60A5FA] animate-ping" />
            </div>
          </div>

          {/* AI Core Engine Node */}
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 flex flex-col items-center justify-center shadow-lg shadow-blue-500/30">
              <Cpu className="w-7 h-7 text-white animate-pulse" />
              <span className="text-[8px] font-extrabold text-blue-100 tracking-wider uppercase mt-0.5">AI Engine</span>
            </div>
            <span className="text-[9px] font-bold text-blue-300">Auto-Assigned</span>
            <span className="text-[8px] text-emerald-400 font-semibold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
              SLA: 48h
            </span>
          </div>

          {/* Animated Stream Lines */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full h-0.5 bg-indigo-500/30 relative">
              <div className="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818CF8] animate-ping" />
            </div>
          </div>

          {/* Destination Officer Node */}
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shadow-md">
              <Building className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-300">PWD Road Div</span>
            <span className="text-[9px] text-slate-500 font-mono">Ward 42 Exec</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    badge: 'STEP 3 • FIELD RESOLUTION',
    title: 'Action & Proof Submission',
    subtitle: 'Mandatory Photographic Proof',
    description: 'Field engineers repair the infrastructure on site. Closing an active ticket requires geotagged photographic proof matching the original location coordinates.',
    accentColor: '#10B981',
    bgGradient: 'from-emerald-500 to-teal-600',
    pillColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <Wrench className="w-5 h-5 text-white" />,
    renderGraphic: () => (
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#0A2016] to-slate-900 p-6 select-none overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Resolution Inspection Card */}
        <div className="relative z-10 w-full max-w-[340px] bg-slate-950/90 rounded-2xl border border-emerald-500/40 p-4 shadow-xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-white">Repair Work Completed</p>
                <p className="text-[9px] text-slate-400 font-mono">By: Er. Vikram Sharma (JE-PWD)</p>
              </div>
            </div>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded text-[10px] font-bold">
              VERIFIED
            </span>
          </div>

          {/* Visual Before / After Split Proof */}
          <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-1">
              <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Before Report</span>
              <div className="h-10 bg-red-950/40 border border-red-800/40 rounded flex items-center justify-center text-red-300 font-mono text-[10px]">
                Damaged (12 Sep)
              </div>
            </div>

            <div className="bg-slate-900 border border-emerald-800/60 rounded-lg p-2.5 space-y-1">
              <span className="text-emerald-400 text-[9px] font-bold uppercase tracking-wider block">Resolved Proof</span>
              <div className="h-10 bg-emerald-950/40 border border-emerald-700/60 rounded flex items-center justify-center text-emerald-300 font-mono text-[10px]">
                Re-surfaced (14 Sep)
              </div>
            </div>
          </div>

          {/* Coordinates check */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Geotag Delta: 0.8m (Valid)
            </span>
            <span className="text-slate-500">14 Sep, 10:24 AM</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    badge: 'STEP 4 • CITIZEN VERIFICATION',
    title: 'Citizen Signs Off',
    subtitle: 'Transparent Civic Closure',
    description: 'Tickets cannot be quietly closed by officials. The citizen gets an automated alert with resolution proof to verify or request a reopening.',
    accentColor: '#F59E0B',
    bgGradient: 'from-amber-500 to-orange-600',
    pillColor: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <CheckCircle2 className="w-5 h-5 text-white" />,
    renderGraphic: () => (
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#221708] to-slate-900 p-6 select-none overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Citizen Sign-off Dialog */}
        <div className="relative z-10 w-full max-w-[320px] bg-slate-950/95 rounded-2xl border border-amber-500/40 p-4 shadow-xl backdrop-blur-md text-center space-y-3">
          <div className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <FileCheck2 className="w-6 h-6" />
          </div>

          <div>
            <h4 className="text-sm font-extrabold text-white">Are you satisfied with this work?</h4>
            <p className="text-[11px] text-slate-400 mt-1">Ticket #SS2025007843 has been marked complete by PWD.</p>
          </div>

          <div className="flex gap-2 pt-1">
            <div className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-1 cursor-pointer">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Yes, Close</span>
            </div>
            <div className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-700">
              <span>Reopen</span>
            </div>
          </div>

          <div className="text-[9px] text-slate-500 font-mono pt-1">
            Auto-closes in 72 hours if no dispute raised
          </div>
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
    }, 4500);
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
      <div className="relative flex-1 min-h-[220px] overflow-hidden bg-slate-950">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
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
          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-sm flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: current.accentColor }}
            />
            {current.badge}
          </span>
        </div>

        {/* Prev / Next Overlay Arrows */}
        <div className="absolute inset-y-0 left-2 right-2 flex items-center justify-between pointer-events-none z-20">
          <button
            onClick={() => setActiveStep((prev) => (prev - 1 + steps.length) % steps.length)}
            aria-label="Previous step"
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 pointer-events-auto border border-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveStep((prev) => (prev + 1) % steps.length)}
            aria-label="Next step"
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 pointer-events-auto border border-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. BOTTOM DETAILS & TAB BAR */}
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
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${current.bgGradient} flex items-center justify-center shrink-0 shadow-md shadow-slate-200`}
          >
            {current.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-extrabold text-[#0F1B2D] truncate">
                {current.title}
              </h3>
              <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                • {current.subtitle}
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {current.description}
            </p>
          </div>
        </div>

        {/* Interactive Step Switcher Tabs */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  idx === activeStep
                    ? 'bg-[#0F1B2D] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{step.id}</span>
                <span className="hidden sm:inline font-medium text-[10px]">
                  {step.title.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>

          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{isPaused ? 'Paused' : 'Auto-playing'}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
