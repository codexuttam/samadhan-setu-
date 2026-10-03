import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Globe, Sparkles, MapPin, Minimize2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export default function GeminiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      parts: [
        {
          text: "Namaskar! 🙏 I am your Samadhan Setu AI Assistant. I can help you understand how to file reports, track statuses, find local municipal contacts in Amravati, or lookup locations with Google Maps. What would you like to ask?",
        },
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [useMapsGrounding, setUseMapsGrounding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue('');

    // Append to message history
    const newHistory: ChatMessage[] = [
      ...messages,
      { role: 'user', parts: [{ text: userText }] },
    ];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const endpoint = useMapsGrounding ? '/api/maps-grounding' : '/api/chat';
      const payload = useMapsGrounding
        ? { prompt: userText }
        : { messages: newHistory };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        { role: 'model', parts: [{ text: data.text || "Sorry, I couldn't process that query." }] },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'model', parts: [{ text: '⚠️ Connection error. Please verify process.env.GEMINI_API_KEY in the Secrets panel.' }] },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none text-xs font-sans">
      
      {/* 1. Floating Collapsed Icon Trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-[#F4511E] hover:bg-[#FF6A2A] text-white p-4 rounded-full shadow-2xl transition-all hover:scale-105 duration-200 group"
          title="Open AI Assistant"
        >
          <MessageSquare className="w-6 h-6 animate-pulse" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-extrabold uppercase text-[10px] tracking-widest whitespace-nowrap">
            Ask AI support
          </span>
        </button>
      )}

      {/* 2. Expanded Chat Drawer Panel */}
      {isOpen && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl w-[350px] sm:w-[380px] h-[500px] shadow-2xl flex flex-col justify-between overflow-hidden">
          
          {/* Header */}
          <div className="bg-[#0F1B2D] text-white p-4 flex justify-between items-center border-b-2 border-[#F4511E]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/10 rounded-lg text-[#FF6A2A]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm leading-none">Samadhan AI Support</h4>
                <p className="text-[9px] text-gray-400 font-medium mt-0.5">Powered by Google Gemini</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed Area */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((m, idx) => {
              const isAi = m.role === 'model';
              return (
                <div
                  key={idx}
                  className={`flex ${isAi ? 'justify-start' : 'justify-end'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[80%] p-3.5 rounded-2xl text-[11px] leading-relaxed font-medium shadow-2xs ${
                      isAi
                        ? 'bg-white border border-slate-100 text-[#0F172A]'
                        : 'bg-[#F4511E] text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.parts[0].text}</p>
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-3 rounded-2xl flex items-center gap-2 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200" />
                </div>
              </div>
            )}
          </div>

          {/* Grounding Tool Toggles & Form Footer */}
          <div className="p-3 bg-white border-t border-slate-100 space-y-3">
            {/* Maps Grounding checkbox trigger */}
            <div className="flex items-center justify-between px-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setUseMapsGrounding(!useMapsGrounding)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border font-extrabold uppercase transition-all ${
                  useMapsGrounding
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span>Google Maps Grounding: {useMapsGrounding ? 'ON' : 'OFF'}</span>
              </button>
              <span className="text-[9px] text-[#64748B] uppercase tracking-wide">Amravati Zone</span>
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={useMapsGrounding ? "Ask maps about locations..." : "Type message..."}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#F4511E] focus:bg-white text-[#0F172A] font-semibold text-xs"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#0F1B2D] hover:bg-slate-800 text-white p-2.5 rounded-xl transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
