import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { HelpCircle, ChevronDown, Mail, Phone, Calendar, ArrowRight } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export default function HelpPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');

  const faqs: FaqItem[] = [
    {
      question: 'How do I raise a civic complaint?',
      answer: 'Simply click on the "Raise a Complaint" button in the top navigation or hero section. Select your issue category (e.g., Roads, Street Lights), write a clear title and description, pin the location on our interactive map, upload photo evidence if available, and verify your mobile number via OTP. Your ticket will be logged instantly.',
    },
    {
      question: 'Can I track a complaint without logging in?',
      answer: 'Yes! Anyone can track complaints without an account. On the homepage or the "Track Complaint" page, enter your 12-character Complaint Tracking ID (e.g., SS2025012343) to instantly view the live status timeline, assigned engineer details, and full repair history.',
    },
    {
      question: 'What happens after I submit a complaint?',
      answer: 'The system automatically categorizes and routes your ticket to the responsible department and ward. A department administrator reviews the queue to designate a Field Engineer. Once assigned, you will receive SMS and Email notifications as the status moves to "In Progress" and "Resolved".',
    },
    {
      question: 'How long does it take to resolve an issue?',
      answer: 'Resolution times depend on the selected priority of the complaint: Critical issues (e.g. major sewer flooding, open electrical wires) have a 6-hour SLA. High priority is 24 hours, Medium is 48 hours, and Low is 72 hours. Tickets that exceed these limits are automatically flagged as "SLA Breached" and escalated to department heads.',
    },
    {
      question: 'What if the complaint is marked resolved but the issue is not fixed?',
      answer: 'If the assigned field officer marks a complaint as "Resolved", you will see a prominent gate asking for verification on the tracking page. If you are not satisfied, click "Reopen Issue" within 48 hours. This moves the ticket back to "In Progress" and triggers an urgent audit flag for department heads.',
    },
  ];

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) return;
    toast(`✉️ Message received! Our helpdesk support team will get back to you at ${contactEmail} shortly.`);
    setContactName('');
    setContactEmail('');
    setContactMsg('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 select-none text-xs">
      
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-[10px] font-extrabold tracking-widest text-[#F4511E] bg-orange-50 px-3 py-1.5 rounded-md border border-orange-100 uppercase">
          CITIZEN HELP & FAQ
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F1B2D] mt-2">
          How can we help you today?
        </h1>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Find answers to frequently asked questions about tracking timelines, SLA priorities, or reach out to our emergency support desks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Faq accordions (7 columns) */}
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-base font-extrabold uppercase tracking-widest text-[#0F1B2D] mb-4 flex items-center gap-1.5">
            <HelpCircle className="w-5 h-5 text-[#F4511E]" /> Frequently Asked Questions
          </h2>

          <div className="space-y-2">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden transition-all">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 font-bold text-sm text-[#0F1B2D] flex justify-between items-center gap-4 hover:bg-slate-50/50"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${isOpen ? 'transform rotate-180 text-[#F4511E]' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="p-5 border-t border-slate-100 text-xs text-[#475569] leading-relaxed font-medium bg-slate-50/20 whitespace-pre-line">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Contact Support Form (5 columns) */}
        <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-sm text-[#0F172A]">Direct Support Helpdesk</h3>
            <p className="text-slate-500 text-xs mt-1">Can't find what you need? Send a message directly to our citizen support team.</p>
          </div>

          <form onSubmit={handleSupportSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Your Name *</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Email Address *</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Message *</label>
              <textarea
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                placeholder="Write your issue description here..."
                rows={4}
                className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0F1B2D] hover:bg-slate-800 text-white py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px]"
            >
              Send Support Ticket
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
