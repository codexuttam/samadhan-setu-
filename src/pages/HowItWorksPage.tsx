import React from 'react';
import { FileText, ArrowRight, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'REPORT',
      subtitle: 'Citizen reports a civic issue',
      desc: 'Using our digital platform, any resident can report local grievances in under 2 minutes. Attach visual photo evidence, pin coordinates on our vector map, and verify your mobile number securely.',
      icon: <FileText className="w-8 h-8 text-[#F4511E]" />,
    },
    {
      num: '02',
      title: 'ROUTE',
      subtitle: 'Automatic algorithmic routing',
      desc: 'Based on the chosen category, Samadhan Setu automatically routes the complaint to the appropriate municipal bureau and ward engineers. General administrators overlook queue dispatches and override bottlenecks.',
      icon: <RefreshCw className="w-8 h-8 text-blue-500 animate-spin-slow" />,
    },
    {
      num: '03',
      title: 'RESOLVE',
      subtitle: 'Officer repair & verification',
      desc: 'Designated field engineers receive a work order directly on their operational portal. Officers arrive on site, patch/repair the civic failure, and upload complete photo/document proof of resolution.',
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
    },
    {
      num: '04',
      title: 'VERIFY',
      subtitle: 'Citizen checks & closes',
      desc: 'The citizen receives an instant notification showing resolution logs. Residents can approve the repair to officially close the ticket or click "Reopen" within 48 hours to trigger secondary supervisor audits.',
      icon: <ShieldCheck className="w-8 h-8 text-indigo-500" />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 select-none text-xs">
      
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-[10px] font-extrabold tracking-widest text-[#F4511E] bg-orange-50 px-3 py-1.5 rounded-md border border-orange-100 uppercase">
          PROCESS TRANSPARENCY
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F1B2D] mt-2">
          From complaint to resolution.
        </h1>
        <p className="text-sm text-[#64748B] leading-relaxed">
          How Samadhan Setu connects residents directly with municipal engineers for real, transparent public-service actions.
        </p>
      </div>

      {/* Timeline steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
        {steps.map((step) => (
          <div key={step.num} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-5 shadow-xs relative flex flex-col justify-between">
            {/* Step number on top */}
            <div className="flex justify-between items-start">
              <span className="text-3xl font-mono font-extrabold text-[#F4511E]/20">{step.num}</span>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                {step.icon}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-[11px] font-extrabold tracking-wider text-[#F4511E] uppercase">{step.title}</h3>
              <h4 className="font-extrabold text-[#0F172A] text-sm leading-snug">{step.subtitle}</h4>
              <p className="text-[#64748B] text-xs leading-relaxed font-medium">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom confidence block */}
      <div className="bg-[#0F1B2D] text-white rounded-2xl p-8 max-w-4xl mx-auto border-b-4 border-[#F4511E] shadow-xs flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Need to report an issue now?</h3>
          <p className="text-xs text-gray-300">File a complaint in less than 2 minutes. No mandatory user sign-ups required to report.</p>
        </div>
        <a
          href="/raise"
          onClick={(e) => { e.preventDefault(); }}
          className="flex items-center gap-1.5 bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-xs shadow-xs transition-all"
        >
          Raise a Complaint <ArrowRight className="w-4 h-4" />
        </a>
      </div>

    </div>
  );
}
