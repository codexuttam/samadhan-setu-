import React, { useState } from 'react';
import InteractiveMap from '../components/InteractiveMap';
import { CATEGORIES, Complaint, Ward } from '../data/mockData';
import {
  Search,
  ArrowRight,
  ShieldAlert,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  TrafficCone,
  Lightbulb,
  Droplet,
  Trash2,
  Shield,
  Grid,
  FileText,
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
  const [searchedCategoryResult, setSearchedCategoryResult] = useState<string | null>(null);

  // Localization strings
  const content = {
    en: {
      eyebrow: 'CLEANER CITIES. STRONGER COMMUNITIES.',
      heroLine1: 'Your complaint.',
      heroLine2: 'Our responsibility.',
      heroDesc: 'Report local civic issues in your area and help build a better, cleaner, and safer community. Raise a complaint, track its progress, and see real action.',
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
      trackInputPlaceholder: 'Enter Complaint ID (e.g. SS2025012343)',
      trackBtn: 'Track Status',
      statsRegistered: 'Complaints registered',
      statsResolved: 'Resolved',
      statsDepartments: 'Departments connected',
      statsResponse: 'Avg. response time',
    },
    hi: {
      eyebrow: 'स्वच्छ शहर। मजबूत समुदाय।',
      heroLine1: 'आपकी शिकायत।',
      heroLine2: 'हमारी जिम्मेदारी।',
      heroDesc: 'अपने क्षेत्र में स्थानीय नागरिक समस्याओं की रिपोर्ट करें और एक बेहतर, स्वच्छ और सुरक्षित समुदाय बनाने में मदद करें। शिकायत दर्ज करें, इसकी प्रगति को ट्रैक करें और वास्तविक कार्रवाई देखें।',
      btnRaise: 'शिकायत दर्ज करें',
      btnTrack: 'शिकायत ट्रैक करें',
      infoCardTitle: 'एक स्वच्छ कल की शुरुआत आपकी रिपोर्ट से होती है।',
      infoCardBody: 'वास्तविक मुद्दे।\nवास्तविक कार्रवाई।\nमजबूत समुदाय।',
      helpTitle: 'आपको किस सहायता की आवश्यकता है?',
      helpSubtitle: 'अपनी शिकायत दर्ज करने के लिए एक श्रेणी खोजें या चुनें।',
      searchPlaceholder: 'समस्या खोजें (जैसे गड्ढा, स्ट्रीट लाइट, जल निकासी...)',
      searchBtn: 'खोजें',
      trackTitle: 'अपनी शिकायत ट्रैक करें',
      trackSubtitle: 'नवीनतम स्थिति और अपडेट देखने के लिए अपनी शिकायत आईडी दर्ज करें।',
      trackInputPlaceholder: 'शिकायत आईडी दर्ज करें (जैसे SS2025012343)',
      trackBtn: 'स्थिति ट्रैक करें',
      statsRegistered: 'पंजीकृत शिकायतें',
      statsResolved: 'समाधान किया गया',
      statsDepartments: 'जुड़े विभाग',
      statsResponse: 'औसत प्रतिक्रिया समय',
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
      searchPlaceholder: 'समस्या शोधा (उदा. खड्डे, स्ट्रीट लाईट, पाणी गळती...)',
      searchBtn: 'शोधा',
      trackTitle: 'तुमच्या तक्रारीचा मागोवा घ्या',
      trackSubtitle: 'नवीनतम स्थिती आणि अपडेट्स पाहण्यासाठी तुमची तक्रार आयडी प्रविष्ट करा.',
      trackInputPlaceholder: 'तक्रार आयडी प्रविष्ट करा (उदा. SS2025012343)',
      trackBtn: 'मागोवा घ्या',
      statsRegistered: 'नोंदणीकृत तक्रारी',
      statsResolved: 'निवारण झाले',
      statsDepartments: 'कनेक्ट केलेले विभाग',
      statsResponse: 'सरासरी प्रतिसाद वेळ',
    },
  }[language];

  // Map category icon names to Lucide icons
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Road':
        return <TrafficCone className="w-6 h-6 shrink-0" />;
      case 'Lightbulb':
        return <Lightbulb className="w-6 h-6 shrink-0" />;
      case 'Droplet':
        return <Droplet className="w-6 h-6 shrink-0" />;
      case 'Trash':
        return <Trash2 className="w-6 h-6 shrink-0" />;
      case 'Shield':
        return <Shield className="w-6 h-6 shrink-0" />;
      default:
        return <Grid className="w-6 h-6 shrink-0" />;
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchedCategoryResult(null);
      return;
    }
    const query = searchQuery.toLowerCase();
    const matched = CATEGORIES.find(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.subcategories.some((s) => s.toLowerCase().includes(query))
    );
    if (matched) {
      setSearchedCategoryResult(matched.id);
    } else {
      setSearchedCategoryResult('other_issue');
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

  // Sample complaint for live showcase
  const showcaseComplaint = complaints.find((c) => c.id === 'SS2025012343') || complaints[0];

  return (
    <div className="space-y-12 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-white border-b border-[#E5E7EB] pt-8 pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[11px] font-extrabold tracking-widest text-[#F4511E] uppercase bg-orange-50 px-3 py-1.5 rounded-md border border-orange-100/50">
                {content.eyebrow}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F1B2D]">
                {content.heroLine1}
                <span className="block text-[#F4511E] mt-1">{content.heroLine2}</span>
              </h1>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                {content.heroDesc}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setPage('raise')}
                  className="flex items-center justify-center gap-2 bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-6 py-3.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                >
                  {content.btnRaise} <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('tracking-anchor');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center justify-center gap-2 border-2 border-[#0F1B2D] hover:bg-slate-50 text-[#0F1B2D] px-6 py-3.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <Search className="w-4 h-4" /> {content.btnTrack}
                </button>
              </div>
            </div>

            {/* Hero Right Visual: Vector Interactive Map & Brand Quote Card */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Map rendering */}
              <div className="md:col-span-8 h-[320px] sm:h-[380px] rounded-xl overflow-hidden shadow-xs border border-[#E5E7EB]">
                <InteractiveMap />
              </div>
              
              {/* Supporting information card */}
              <div className="md:col-span-4 bg-[#0F1B2D] text-white p-6 rounded-xl flex flex-col justify-between border-b-4 border-[#F4511E] shadow-xs">
                <div className="space-y-4">
                  <span className="text-[10px] font-extrabold tracking-widest text-[#FF8A50] uppercase">CIVIC ACTION</span>
                  <h3 className="text-base font-extrabold leading-snug">
                    {content.infoCardTitle}
                  </h3>
                </div>
                <div className="pt-6 border-t border-white/10">
                  <p className="text-xs text-gray-300 whitespace-pre-line font-medium leading-relaxed italic">
                    {content.infoCardBody}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. COMPLAINT CATEGORY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F1B2D]">
                {content.helpTitle}
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                {content.helpSubtitle}
              </p>
            </div>
            
            {/* Search Input Field */}
            <form onSubmit={handleSearch} className="w-full md:max-w-md flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={content.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E] focus:bg-white transition-all text-[#0F172A]"
                />
              </div>
              <button
                type="submit"
                className="bg-[#0F1B2D] hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
              >
                {content.searchBtn}
              </button>
            </form>
          </div>

          {/* Grid of Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((category) => {
              const isMatched = searchedCategoryResult === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    // Redirect to raise complaint with preselected category
                    sessionStorage.setItem('preselected_category_id', category.id);
                    setPage('raise');
                  }}
                  className={`flex items-start text-left p-5 rounded-xl border transition-all hover:scale-[1.01] hover:shadow-xs group ${
                    isMatched
                      ? 'border-[#F4511E] bg-orange-50/20 ring-1 ring-[#F4511E]'
                      : 'border-[#E5E7EB] bg-slate-50/50 hover:bg-white'
                  }`}
                >
                  <div className={`p-3 rounded-lg mr-4 border ${category.bgTint} group-hover:scale-105 transition-transform`}>
                    {getCategoryIcon(category.icon)}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-[#0F1B2D] text-sm flex items-center gap-1">
                      {category.name}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </h3>
                    <p className="text-xs text-[#64748B] leading-snug">{category.description}</p>
                    {/* Unboxed inline metadata subcategories list */}
                    <p className="text-[10px] text-slate-400 font-medium pt-1.5 truncate max-w-[200px]">
                      {category.subcategories.slice(0, 3).join(' · ')}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. TRACK COMPLAINT SECTION */}
      <section id="tracking-anchor" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F1B2D]">
              {content.trackTitle}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              {content.trackSubtitle}
            </p>
          </div>

          <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <input
              type="text"
              value={trackIdInput}
              onChange={(e) => setTrackIdInput(e.target.value)}
              placeholder={content.trackInputPlaceholder}
              className="flex-1 px-4 py-3 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E] focus:bg-white transition-all font-mono tracking-wider uppercase text-[#0F172A]"
            />
            <button
              type="submit"
              className="bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
            >
              {content.trackBtn}
            </button>
          </form>

          {/* Show a Sample Live Complaint to showcase status timeline */}
          {showcaseComplaint && (
            <div className="border border-slate-100 rounded-xl bg-slate-50/50 p-5 space-y-5">
              <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">SAMPLE COMPLAINT PROFILE</p>
                  <h4 className="font-mono text-sm font-bold text-[#0F1B2D] flex items-center gap-2">
                    {showcaseComplaint.id}
                    <span className="text-xs text-slate-300 font-normal">|</span>
                    <span className="text-xs text-[#64748B] font-sans font-medium">{showcaseComplaint.subcategory}</span>
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Last updated</p>
                    <p className="text-xs font-semibold text-[#0F1B2D]">14 Sep 2026, 10:24 AM</p>
                  </div>
                  <button
                    onClick={() => handleDirectTrack(showcaseComplaint.id)}
                    className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] hover:bg-[#0F1B2D] hover:text-white hover:border-[#0F1B2D] px-3.5 py-2 rounded-lg text-xs font-semibold text-[#0F172A] transition-all"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="py-2">
                <div className="grid grid-cols-4 relative">
                  {/* Progress Line */}
                  <div className="absolute top-3 left-0 right-0 h-0.5 bg-slate-200 -z-1" />
                  <div className="absolute top-3 left-0 w-2/3 h-0.5 bg-[#16A34A] -z-1" />

                  {/* Step 1: Submitted */}
                  <div className="flex flex-col items-center text-center space-y-1.5">
                    <div className="w-6.5 h-6.5 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-xs font-bold border-4 border-white shadow-xs">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F1B2D]">Submitted</p>
                      <p className="text-[10px] text-[#64748B] font-mono mt-0.5">12 Sep</p>
                    </div>
                  </div>

                  {/* Step 2: Assigned */}
                  <div className="flex flex-col items-center text-center space-y-1.5">
                    <div className="w-6.5 h-6.5 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-xs font-bold border-4 border-white shadow-xs">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F1B2D]">Assigned</p>
                      <p className="text-[10px] text-[#64748B] font-mono mt-0.5">13 Sep</p>
                    </div>
                  </div>

                  {/* Step 3: In Progress */}
                  <div className="flex flex-col items-center text-center space-y-1.5">
                    <div className="w-6.5 h-6.5 rounded-full bg-[#F59E0B] text-white flex items-center justify-center text-xs font-bold border-4 border-white shadow-xs animate-pulse">
                      ●
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F1B2D]">In Progress</p>
                      <p className="text-[10px] text-[#64748B] font-mono mt-0.5">14 Sep</p>
                    </div>
                  </div>

                  {/* Step 4: Resolved */}
                  <div className="flex flex-col items-center text-center space-y-1.5 opacity-40">
                    <div className="w-6.5 h-6.5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold border-4 border-white shadow-xs">
                      ○
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">Resolved</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Pending</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Details card information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div className="flex items-center gap-2 text-[#475569]">
                  <MapPin className="w-4 h-4 text-[#F4511E]" />
                  <span>Location: <strong className="text-[#0F172A]">Parvati Nagar, Amravati</strong></span>
                </div>
                <div className="flex items-center gap-2 text-[#475569] md:justify-end">
                  <ShieldAlert className="w-4 h-4 text-orange-500" />
                  <span>Assigned Officer: <strong className="text-[#0F172A]">Rajesh Patil (Field Engineer)</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. STATISTICS SECTION (Horizontal clean strip) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0F1B2D] text-white rounded-2xl p-6 sm:p-8 border-b-4 border-[#F4511E] shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 divide-y-2 md:divide-y-0 md:divide-x-2 divide-white/10">
            
            {/* Stat item 1 */}
            <div className="flex items-center gap-4 pt-4 md:pt-0 md:pl-6 first:pt-0 first:pl-0">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[#FF6A2A]">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold tracking-tight font-mono text-white">12,482</p>
                <p className="text-xs text-gray-400 font-medium">{content.statsRegistered}</p>
              </div>
            </div>

            {/* Stat item 2 */}
            <div className="flex items-center gap-4 pt-4 md:pt-0 md:pl-6">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold tracking-tight font-mono text-white">9,215</p>
                <p className="text-xs text-gray-400 font-medium">{content.statsResolved}</p>
              </div>
            </div>

            {/* Stat item 3 */}
            <div className="flex items-center gap-4 pt-4 md:pt-0 md:pl-6">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-blue-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold tracking-tight font-mono text-white">18</p>
                <p className="text-xs text-gray-400 font-medium">{content.statsDepartments}</p>
              </div>
            </div>

            {/* Stat item 4 */}
            <div className="flex items-center gap-4 pt-4 md:pt-0 md:pl-6">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold tracking-tight font-mono text-white">2.4 days</p>
                <p className="text-xs text-gray-400 font-medium">{content.statsResponse}</p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
