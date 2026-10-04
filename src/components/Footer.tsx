import React from 'react';
import Logo from './Logo';
import { Mail, Phone, Clock, Linkedin, Twitter, Instagram, Youtube } from 'lucide-react';

interface FooterProps {
  setPage: (page: string) => void;
}

export default function Footer({ setPage }: FooterProps) {
  const quickLinks = [
    { id: 'home', label: 'Home' },
    { id: 'raise', label: 'Raise a Complaint' },
    { id: 'track', label: 'Track Complaint' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'help', label: 'Help & Support' },
  ];

  return (
    <footer className="bg-[#0F1B2D] text-white py-16 px-4 sm:px-6 lg:px-8 border-t-4 border-[#F4511E] select-none">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          
          {/* Column 1: Brand description (spanning 5 columns) */}
          <div className="md:col-span-5 space-y-6">
            <Logo inverted={true} className="h-12" />
            <p className="text-gray-300 text-sm leading-relaxed max-w-md">
              Samadhan Setu is a community-driven civic infrastructure platform. We empower citizens to report, track, and verify local issues, collaborating closely with municipal departments for cleaner, safer, and better-managed neighborhoods.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.linkedin.com/in/samadhan-setu-751021441/" target="_blank" rel="noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-[#FF6A2A] transition-all" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-[#FF6A2A] transition-all" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-[#FF6A2A] transition-all" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-[#FF6A2A] transition-all" aria-label="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links (spanning 3 columns) */}
          <div className="md:col-span-3 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF6A2A]">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => setPage(link.id)}
                    className="text-gray-300 hover:text-[#FF8A50] transition-colors text-left font-medium"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support Contact (spanning 4 columns) */}
          <div className="md:col-span-4 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF6A2A]">Emergency Support</h3>
            <div className="space-y-4 text-sm text-gray-300">
              <a href="mailto:supportsamadhansetu@gmail.com" className="flex items-center gap-3 group">
                <span className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 text-[#FF6A2A] transition-colors">
                  <Mail className="w-4 h-4" />
                </span>
                <span className="group-hover:text-white transition-colors">supportsamadhansetu@gmail.com</span>
              </a>
              
              <a href="tel:+918318768905" className="flex items-center gap-3 group">
                <span className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 text-[#FF6A2A] transition-colors">
                  <Phone className="w-4 h-4" />
                </span>
                <span className="group-hover:text-white transition-colors">+91 83187 68905</span>
              </a>

              <div className="flex items-start gap-3">
                <span className="p-2 rounded-lg bg-white/5 text-slate-400">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <p className="font-semibold text-white">Citizen Helpdesk Hours</p>
                  <p className="text-xs text-gray-400 mt-0.5">Mon – Sat, 9:00 AM – 6:00 PM IST</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright & legal banner */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400 font-sans">
          <p>© 2026 Samadhan Setu. Municipal Corporation Redressal Infrastructure.</p>
          <div className="flex gap-6">
            <button onClick={() => setPage('help')} className="hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={() => setPage('help')} className="hover:text-white transition-colors">Terms of Use</button>
            <button onClick={() => setPage('help')} className="hover:text-white transition-colors">Accessibility Guidelines</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
