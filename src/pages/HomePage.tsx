import React, { useState } from 'react';
import InteractiveMap from '../components/InteractiveMap';
import RealtimeWorkflowShowcase from '../components/RealtimeWorkflowShowcase';
import { CATEGORIES, Complaint } from '../data/mockData';
import {
  Search,
  ArrowRight,
  MapPin,
  Clock,
  CheckCircle2,
  FileText,
  Building2,
  TrafficCone,
  Lightbulb,
  Droplet,
  Trash2,
  Shield,
  Grid,
  ChevronRight,
} from 'lucide-react';

interface HomePageProps {
  setPage: (page: string) => void;
  language: 'en' | 'hi' | 'mr';
  complaints: Complaint[];
  setTrackingInput: (id: string) => void;
  setSelectedTrackedId: (id: string) => void;
}

export default function HomePage({
  setPage,
  language,
  complaints,
  setTrackingInput,
  setSelectedTrackedId,
}: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [trackIdInput, setTrackIdInput] = useState('');

  // Localization strings
  const content = {
    en: {
      eyebrow: 'CLEANER CITIES. STRONGER COMMUNITIES.',
      heroLine1: 'Your complaint.',
      heroLine2: 'Our responsibility.',
      heroDesc: 'Report local civic issues in your area and help build a better, cleaner and safer community. Raise a complaint, track its progress and see real action.',
      btnRaise: 'Raise a Complaint',
      btnTrack: 'Track a Complaint',
      infoCardTitle: 'A cleaner tomorrow starts with your report.',
      infoCardBody: 'Real issues.\nReal action.\nStronger communities.',
      helpTitle: 'What do you need help with?',
      helpSubtitle: 'Search or choose a category to raise your complaint.',
      searchPlaceholder: 'Search for an issue (e.g. pothole, street light, drainage...)',
      searchBtn: 'Search',
      trackTitle: 'Track your complaint',
      trackSubtitle: 'Enter your complaint ID to see the latest status and updates.',
      trackInputPlaceholder: 'Enter Complaint ID (e.g. SS2025001234)',
      trackBtn: 'Track',
    },
    hi: {
      eyebrow: 'स्वच्छ शहर। मजबूत समुदाय।',
      heroLine1: 'आपकी शिकायत।',
      heroLine2: 'हमारी जिम्मेदारी।',
      heroDesc: 'अपने क्षेत्र में स्थानीय नागरिक समस्याओं की रिपोर्ट करें और एक बेहतर, स्वच्छ और सुरक्षित समुदाय बनाने में मदद करें। शिकायत दर्ज करें, इसकी प्रगति को ट्रैक करें और वास्तविक कार्रवाई देखें।',
      btnRaise: 'शिकायत दर्ज करें',
      btnTrack: 'तक्रार ट्रॅक करा',
      infoCardTitle: 'एक स्वच्छ कल की शुरुआत आपकी रिपोर्ट से होती है।',
      infoCardBody: 'वास्तविक मुद्दे।\nवास्तविक कार्रवाई।\nमजबूत समुदाय।',
      helpTitle: 'आपको किस सहायता की आवश्यकता है?',
      helpSubtitle: 'अपनी शिकायत दर्ज करने के लिए एक श्रेणी खोजें या चुनें।',
      searchPlaceholder: 'समस्या खोजें (जैसे गड्ढा, स्ट्रीट लाइट...)',
      searchBtn: 'खोजें',
      trackTitle: 'अपनी शिकायत ट्रैक करें',
      trackSubtitle: 'नवीनतम स्थिति देखने के लिए अपनी शिकायत आईडी दर्ज करें।',
      trackInputPlaceholder: 'शिकायत आईडी दर्ज करें',
      trackBtn: 'ट्रैक',
    },
    mr: {
      eyebrow: 'स्वच्छ शहरे। मजबूत समुदाय।',
      heroLine1: 'तुमची तक्रार।',
      heroLine2: 'आमची जबाबदारी।',
      heroDesc: 'तुमच्या भागातील स्थानिक नागरी समस्यांची नोंद करा आणि एक चांगला, स्वच्छ आणि सुरक्षित समुदाय तयार करण्यात मदत करा. तक्रार नोंदवा, तिच्या प्रगतीचा मागोवा घ्या आणि प्रत्यक्ष कारवाई पहा.',
      btnRaise: 'तक्रार नोंदवा',
      btnTrack: 'तक्रार ट्रॅक करा',
      infoCardTitle: 'उद्याची स्वच्छता आजच्या तुमच्या तक्रारीपासून सुरू होते.',
      infoCardBody: 'खऱ्या समस्या।\nखरी कारवाई।\nमजबूत समुदाय।',
      helpTitle: 'तुम्हाला कशाची मदत हवी आहे?',
      helpSubtitle: 'तक्रार नोंदवण्यासाठी एक श्रेणी शोधा किंवा निवडा.',
      searchPlaceholder: 'समस्या शोधा...',
      searchBtn: 'शोधा',
      trackTitle: 'तुमच्या तक्रारीचा मागोवा घ्या',
      trackSubtitle: 'नवीनतम स्थिती आणि अपडेट्स पाहण्यासाठी तुमची तक्रार आयडी प्रविष्ट करा.',
      trackInputPlaceholder: 'तक्रार आयडी प्रविष्ट करा',
      trackBtn: 'मागोवा घ्या',
    },
  }[language];

  // Map category icon names to Lucide icons
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Road':
        return <TrafficCone className="w-5 h-5 shrink-0" />;
      case 'Lightbulb':
        return <Lightbulb className="w-5 h-5 shrink-0" />;
      case 'Droplet':
        return <Droplet className="w-5 h-5 shrink-0" />;
      case 'Trash':
        return <Trash2 className="w-5 h-5 shrink-0" />;
      case 'Shield':
        return <Shield className="w-5 h-5 shrink-0" />;
      default:
        return <Grid className="w-5 h-5 shrink-0" />;
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();
    const matched = CATEGORIES.find(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.subcategories.some((s) => s.toLowerCase().includes(query))
    );
    if (matched) {
      sessionStorage.setItem('preselected_category_id', matched.id);
      setPage('raise');
    } else {
      sessionStorage.setItem('preselected_category_id', 'other_issue');
      setPage('raise');
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackIdInput.trim()) return;
    setTrackingInput(trackIdInput.trim());
    setSelectedTrackedId(trackIdInput.trim());
    setPage('track');
  };

  const handleDirectTrack = (id: string) => {
    setTrackingInput(id);
    setSelectedTrackedId(id);
    setPage('track');
  };

  return (
    <div className="space-y-10 pb-16 bg-[#F8FAFC]">
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-white border-b border-[#E5E7EB] pt-8 pb-14 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[10px] font-bold tracking-widest text-[#64748B] block uppercase">
                {content.eyebrow}
              </span>
              <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#0F1B2D] leading-[1.1]">
                {content.heroLine1}
                <span className="block text-[#F4511E] mt-1">{content.heroLine2}</span>
              </h1>
              <p className="text-[15px] text-[#64748B] leading-relaxed max-w-lg">
                {content.heroDesc}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={() => setPage('raise')}
                  className="flex items-center justify-center gap-2 bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-6 py-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {content.btnRaise} &rarr;
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('tracking-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center justify-center gap-2 border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#0F172A] px-6 py-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                >
                  <Search className="w-4 h-4 text-[#64748B]" />
                  {content.btnTrack}
                </button>
              </div>
            </div>

            {/* Hero Right Visual */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              <div className="md:col-span-8 h-[340px] rounded-xl overflow-hidden border border-[#E5E7EB] bg-slate-100">
                <InteractiveMap />
              </div>
              
              <div className="md:col-span-4 bg-gradient-to-br from-[#0F1B2D] to-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col justify-between shadow-xl relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F4511E] rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                
                <div className="space-y-4 relative z-10">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#FF6A2A]">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white leading-tight">
                    {content.infoCardTitle}
                  </h3>
                </div>
                
                <div className="pt-6 relative z-10">
                  <div className="w-10 h-1 bg-[#F4511E] mb-4 rounded-full" />
                  <p className="text-sm text-slate-300 whitespace-pre-line font-medium leading-relaxed">
                    {content.infoCardBody}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. REAL-TIME RESOLUTION WORKFLOW ENGINE SHOWCASE */}
      <RealtimeWorkflowShowcase
        onRaiseClick={() => setPage('raise')}
        onTrackClick={() => {
          const el = document.getElementById('tracking-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 3. COMPLAINT CATEGORY SECTION (Matches Reference proportions) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F1B2D]">
                {content.helpTitle}
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                {content.helpSubtitle}
              </p>
            </div>
            
            {/* Elegant Row-aligned Search for Desktop */}
            <form onSubmit={handleSearch} className="w-full lg:max-w-xl flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={content.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E] focus:bg-white transition-all text-[#0F172A]"
                />
              </div>
              <button
                type="submit"
                className="bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
              >
                {content.searchBtn}
              </button>
            </form>
          </div>

          {/* Grid of Categories matching exact reference colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((category) => {
              let categoryBg = 'bg-slate-50';
              let categoryText = 'text-slate-700';
              let categoryBorder = 'border-slate-200';

              if (category.id === 'roads_potholes') {
                categoryBg = 'bg-[#FFF8F6]';
                categoryText = 'text-[#F4511E]';
                categoryBorder = 'border-[#FFF0EC]';
              } else if (category.id === 'street_lights') {
                categoryBg = 'bg-[#FFFDF5]';
                categoryText = 'text-[#F59E0B]';
                categoryBorder = 'border-[#FFFBEB]';
              } else if (category.id === 'water_drainage') {
                categoryBg = 'bg-[#F5F8FF]';
                categoryText = 'text-[#2563EB]';
                categoryBorder = 'border-[#EEF2FF]';
              } else if (category.id === 'garbage_sanitation') {
                categoryBg = 'bg-[#F4FDF7]';
                categoryText = 'text-[#16A34A]';
                categoryBorder = 'border-[#ECFDF5]';
              } else if (category.id === 'public_safety') {
                categoryBg = 'bg-[#FFF5F5]';
                categoryText = 'text-[#DC2626]';
                categoryBorder = 'border-[#FEE2E2]';
              }

              return (
                <button
                  key={category.id}
                  onClick={() => {
                    sessionStorage.setItem('preselected_category_id', category.id);
                    setPage('raise');
                  }}
                  className={`flex flex-col justify-between text-left p-6 rounded-xl border bg-white hover:border-[#F4511E] hover:shadow-xs transition-all duration-150 group h-40`}
                >
                  <div className={`p-2 rounded-lg border ${categoryBg} ${categoryText} ${categoryBorder} w-fit`}>
                    {getCategoryIcon(category.icon)}
                  </div>
                  <div className="space-y-1 mt-4">
                    <h3 className="font-extrabold text-xs text-[#0F1B2D] leading-snug flex items-center justify-between w-full">
                      <span>{category.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#F4511E] group-hover:translate-x-0.5 transition-all" />
                    </h3>
                    <p className="text-[10px] text-[#64748B] leading-tight line-clamp-2">{category.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. TRACK COMPLAINT SECTION */}
      <section id="tracking-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F1B2D]">
                {content.trackTitle}
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                {content.trackSubtitle}
              </p>
            </div>

            <form onSubmit={handleTrackSubmit} className="w-full lg:max-w-xl flex gap-2">
              <div className="relative flex-1">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={trackIdInput}
                  onChange={(e) => setTrackIdInput(e.target.value)}
                  placeholder={content.trackInputPlaceholder}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs font-mono focus:outline-none focus:border-[#F4511E] text-[#0F172A]"
                />
              </div>
              <button
                type="submit"
                className="bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
              >
                {content.trackBtn}
              </button>
            </form>
          </div>

          {/* Exact Recreation of Sample Complaint Layout from Reference Image */}
          <div className="border border-slate-200 rounded-xl bg-[#FFFDFB]/40 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Col 1: Complaint ID (3 cols) */}
            <div className="lg:col-span-2 space-y-1">
              <span className="text-[10px] text-[#64748B] font-medium block">Complaint ID</span>
              <p className="font-mono text-sm font-extrabold text-[#0F172A] tracking-wider">SS2025007843</p>
              <span className="text-[10px] text-slate-400 block">Submitted on 12 Sep 2026</span>
            </div>

            {/* Col 2: Category (2 cols) */}
            <div className="lg:col-span-2 flex items-center gap-3">
              <div className="p-3 bg-[#FFF3EE] border border-[#FFE7DD] rounded-lg text-[#F4511E]">
                <TrafficCone className="w-5 h-5 shrink-0" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-xs text-[#0F1B2D]">Roads & Potholes</h4>
                <p className="text-[10px] text-[#64748B] font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#F4511E]" /> Parvati Nagar, Dwarka, Delhi
                </p>
              </div>
            </div>

            {/* Col 3: Status Timeline (5 cols) */}
            <div className="lg:col-span-5 py-2">
              <div className="grid grid-cols-4 relative items-center">
                {/* Horizontal progress connector lines */}
                <div className="absolute top-2.5 left-[12%] right-[12%] h-0.5 bg-slate-200 -z-1" />
                <div className="absolute top-2.5 left-[12%] w-[50%] h-0.5 bg-[#16A34A] -z-1" />

                {/* Submitted */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-xs">
                    ✓
                  </div>
                  <span className="text-[10px] font-bold text-[#0F1B2D] mt-1.5">Submitted</span>
                  <span className="text-[9px] text-slate-400 font-mono">12 Sep</span>
                </div>

                {/* Assigned */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-xs">
                    ✓
                  </div>
                  <span className="text-[10px] font-bold text-[#0F1B2D] mt-1.5">Assigned</span>
                  <span className="text-[9px] text-slate-400 font-mono">13 Sep</span>
                </div>

                {/* In Progress */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-5 h-5 rounded-full bg-white border-2 border-[#16A34A] flex items-center justify-center text-[9px] font-bold shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#0F1B2D] mt-1.5">In Progress</span>
                  <span className="text-[9px] text-slate-400 font-mono">14 Sep</span>
                </div>

                {/* Resolved */}
                <div className="flex flex-col items-center text-center opacity-40">
                  <div className="w-5 h-5 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold shadow-xs">
                    
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-1.5">Resolved</span>
                  <span className="text-[9px] text-slate-400 font-mono">Pending</span>
                </div>
              </div>
            </div>

            {/* Col 4: Status Indicator (2 cols) */}
            <div className="lg:col-span-2 flex flex-col items-start lg:items-end gap-1 text-left lg:text-right border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-4">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                In Progress
              </div>
              <span className="text-[9px] text-[#64748B]">Last updated</span>
              <span className="text-[10px] font-extrabold text-[#0F172A]">14 Sep 2026, 10:24 AM</span>
            </div>

            {/* Col 5: Action Button (1 col) */}
            <div className="lg:col-span-1 text-right">
              <button
                onClick={() => handleDirectTrack('SS2025012343')}
                className="w-full lg:w-auto inline-flex items-center justify-center gap-1.5 bg-white border border-[#E5E7EB] hover:bg-slate-50 px-4 py-2 rounded-lg text-xs font-bold text-[#0F172A] shadow-xs transition-colors"
              >
                View Details &rarr;
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 4. STATISTICS STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            
            {/* Stat Item 1 */}
            <div className="flex items-center gap-4 py-3 md:py-0 md:pl-6 first:pl-0">
              <div className="p-3 bg-[#FFF3EE] rounded-lg text-[#F4511E]">
                <FileText className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <p className="text-xl font-extrabold font-mono text-[#0F172A] tabular-nums leading-none">12,482</p>
                <p className="text-[11px] text-[#64748B] font-semibold mt-1">Complaints registered</p>
              </div>
            </div>

            {/* Stat Item 2 */}
            <div className="flex items-center gap-4 py-3 md:py-0 md:pl-6">
              <div className="p-3 bg-emerald-50 rounded-lg text-[#16A34A]">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <p className="text-xl font-extrabold font-mono text-[#0F172A] tabular-nums leading-none">9,215</p>
                <p className="text-[11px] text-[#64748B] font-semibold mt-1">Resolved</p>
              </div>
            </div>

            {/* Stat Item 3 */}
            <div className="flex items-center gap-4 py-3 md:py-0 md:pl-6">
              <div className="p-3 bg-blue-50 rounded-lg text-[#2563EB]">
                <Building2 className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <p className="text-xl font-extrabold font-mono text-[#0F172A] tabular-nums leading-none">18</p>
                <p className="text-[11px] text-[#64748B] font-semibold mt-1">Departments connected</p>
              </div>
            </div>

            {/* Stat Item 4 */}
            <div className="flex items-center gap-4 py-3 md:py-0 md:pl-6">
              <div className="p-3 bg-amber-50 rounded-lg text-[#F59E0B]">
                <Clock className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <p className="text-xl font-extrabold font-mono text-[#0F172A] tabular-nums leading-none">2.4 days</p>
                <p className="text-[11px] text-[#64748B] font-semibold mt-1">Avg. response time</p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
