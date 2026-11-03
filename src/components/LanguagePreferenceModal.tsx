import React, { useState } from 'react';
import { Globe, Check, ArrowRight, Sparkles, X, ShieldCheck } from 'lucide-react';

interface LanguagePreferenceModalProps {
  currentLanguage: 'en' | 'hi';
  onSelectLanguage: (lang: 'en' | 'hi') => void;
  onClose: () => void;
}

export default function LanguagePreferenceModal({
  currentLanguage,
  onSelectLanguage,
  onClose,
}: LanguagePreferenceModalProps) {
  const [selected, setSelected] = useState<'en' | 'hi'>(currentLanguage);

  const options: Array<{
    id: 'en' | 'hi';
    name: string;
    englishName: string;
    description: string;
    badge: string;
    flag: string;
  }> = [
    {
      id: 'hi',
      name: 'हिंदी',
      englishName: 'Hindi',
      description: 'नागरिक सेवाएं, शिकायत दर्ज करना और लाइव ट्रैकिंग हिंदी में',
      badge: 'सबसे लोकप्रिय • Most Used',
      flag: '🇮🇳',
    },
    {
      id: 'en',
      name: 'English',
      englishName: 'English',
      description: 'Civic services, grievance filing, and status tracking in English',
      badge: 'Official',
      flag: '🌐',
    },
  ];

  const handleConfirm = () => {
    onSelectLanguage(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6">
        {/* TOP ACCENT HEADER */}
        <div className="bg-gradient-to-r from-[#0F1B2D] via-[#1E293B] to-[#0F1B2D] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6A2A] to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold block">
                SAMADHAN SETU • समाधान सेतु
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                अपनी पसंदीदा भाषा चुनें / Select Language
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Choose your preferred language for a smooth civic grievance experience.
          </p>
        </div>

        {/* 2 ACCESSIBLE LANGUAGE OPTIONS (HINDI & ENGLISH ONLY) */}
        <div className="p-6 space-y-3.5 bg-slate-50/60">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-white border-[#F4511E] shadow-md shadow-orange-500/10 scale-[1.01]'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-3xl select-none">{opt.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-[#0F1B2D]">
                        {opt.name}
                      </h3>
                      {opt.id !== 'en' && (
                        <span className="text-xs text-slate-500 font-medium">
                          ({opt.englishName})
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-orange-100 text-[#F4511E]'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-snug">
                      {opt.description}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#F4511E] border-[#F4511E] text-white shadow-xs'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-white p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>आप इसे बाद में कभी भी बदल सकते हैं (Change anytime from menu)</span>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full sm:w-auto bg-[#0F1B2D] hover:bg-slate-800 active:scale-[0.98] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-900/10"
          >
            <span>
              {selected === 'hi' ? 'पुष्टि करें और आगे बढ़ें' : 'Confirm & Continue'}
            </span>
            <ArrowRight className="w-4 h-4 text-[#FF6A2A]" />
          </button>
        </div>
      </div>
    </div>
  );
}
