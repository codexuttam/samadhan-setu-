import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { HelpCircle, ChevronDown, Mail, Phone, Calendar, ArrowRight } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

interface HelpPageProps {
  language?: 'en' | 'hi';
}

export default function HelpPage({ language = 'en' }: HelpPageProps) {
  const isHi = language === 'hi';
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');

  const faqs: FaqItem[] = isHi
    ? [
        {
          question: 'मैं नागरिक शिकायत कैसे दर्ज करूँ?',
          answer:
            'ऊपर दिए गए नेविगेशन बार या मुख्य पृष्ठ पर "शिकायत दर्ज करें" बटन पर क्लिक करें। अपनी समस्या की श्रेणी (जैसे सड़कें, स्ट्रीट लाइट) चुनें, शीर्षक और विवरण लिखें, नक्शे पर स्थान पिन करें, फोटो साक्ष्य अपलोड करें और OTP द्वारा मोबाइल नंबर सत्यापित करें। आपकी शिकायत तुरंत दर्ज हो जाएगी।',
        },
        {
          question: 'क्या मैं बिना लॉगिन किए शिकायत ट्रैक कर सकता हूँ?',
          answer:
            'हाँ! कोई भी व्यक्ति बिना खाते के शिकायत ट्रैक कर सकता है। मुख्य पृष्ठ या "ट्रैक शिकायत" पृष्ठ पर अपनी शिकायत ट्रैकिंग आईडी (जैसे SS-2026-000184) दर्ज करके लाइव स्थिति, नियुक्त अधिकारी का विवरण और पूरा इतिहास देखें।',
        },
        {
          question: 'शिकायत दर्ज करने के बाद क्या होता है?',
          answer:
            'सिस्टम स्वतः आपकी शिकायत को संबंधित विभाग और वार्ड को भेजता है। विभाग प्रशासक फील्ड इंजीनियर की नियुक्ति करते हैं। कार्य आगे बढ़ने पर आपको व्हाट्सएप/एसएमएस द्वारा नियमित अपडेट प्राप्त होते हैं।',
        },
        {
          question: 'समस्या के समाधान में कितना समय लगता है?',
          answer:
            'समाधान का समय शिकायत की प्राथमिकता पर निर्भर करता है: अति आवश्यक (जैसे खुला मेनहोल, बिजली के तार) के लिए 6 घंटे, उच्च प्राथमिकता के लिए 24 घंटे, मध्यम के लिए 48 घंटे और कम प्राथमिकता के लिए 72 घंटे की SLA समय-सीमा तय है। समय-सीमा पार होने पर शिकायत स्वतः वरिष्ठ अधिकारियों को एस्केलेट हो जाती है।',
        },
        {
          question: 'यदि शिकायत को "समाधान पूर्ण" दिखाया जाए लेकिन काम अधूरा हो तो क्या करें?',
          answer:
            'जब फील्ड अधिकारी शिकायत को हल चिह्नित करते हैं, तो ट्रैकिंग पृष्ठ पर आपसे सत्यापन पूछा जाता है। यदि आप संतुष्ट नहीं हैं, तो 48 घंटे के भीतर "शिकायत पुनः खोलें" पर क्लिक करें। इससे मामला वापस "कार्य प्रगति पर" आ जाता है और वरिष्ठ अधिकारी को ऑडिट अलर्ट जाता है।',
        },
      ]
    : [
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
    toast(
      isHi
        ? `✉️ संदेश प्राप्त हुआ! हमारी हेल्पडेस्क टीम शीघ्र ही ${contactEmail} पर आपसे संपर्क करेगी।`
        : `✉️ Message received! Our helpdesk support team will get back to you at ${contactEmail} shortly.`,
    );
    setContactName('');
    setContactEmail('');
    setContactMsg('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 select-none text-xs">
      
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-[10px] font-extrabold tracking-widest text-[#F4511E] bg-orange-50 px-3 py-1.5 rounded-md border border-orange-100 uppercase">
          {isHi ? 'नागरिक सहायता एवं FAQ' : 'CITIZEN HELP & FAQ'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F1B2D] mt-2">
          {isHi ? 'आज हम आपकी क्या मदद कर सकते हैं?' : 'How can we help you today?'}
        </h1>
        <p className="text-sm text-[#64748B] leading-relaxed">
          {isHi
            ? 'ट्रैकिंग समय-सीमा, SLA प्राथमिकताओं के बारे में अक्सर पूछे जाने वाले प्रश्नों के उत्तर पाएँ या हमारे सहायता डेस्क से संपर्क करें।'
            : 'Find answers to frequently asked questions about tracking timelines, SLA priorities, or reach out to our emergency support desks.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Faq accordions (7 columns) */}
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-base font-extrabold uppercase tracking-widest text-[#0F1B2D] mb-4 flex items-center gap-1.5">
            <HelpCircle className="w-5 h-5 text-[#F4511E]" /> {isHi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
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
            <h3 className="font-extrabold text-sm text-[#0F172A]">
              {isHi ? 'प्रत्यक्ष सहायता हेल्पडेस्क' : 'Direct Support Helpdesk'}
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              {isHi
                ? 'क्या आपको अपना उत्तर नहीं मिला? सीधे हमारी नागरिक सहायता टीम को संदेश भेजें।'
                : "Can't find what you need? Send a message directly to our citizen support team."}
            </p>
          </div>

          <form onSubmit={handleSupportSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">
                {isHi ? 'आपका नाम *' : 'Your Name *'}
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={isHi ? 'पूरा नाम' : 'Full Name'}
                className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">
                {isHi ? 'ईमेल पता *' : 'Email Address *'}
              </label>
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
              <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">
                {isHi ? 'संदेश *' : 'Message *'}
              </label>
              <textarea
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                placeholder={isHi ? 'यहाँ अपनी समस्या का विवरण लिखें...' : 'Write your issue description here...'}
                rows={4}
                className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0F1B2D] hover:bg-slate-800 text-white py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px]"
            >
              {isHi ? 'सहायता संदेश भेजें' : 'Send Support Ticket'}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
