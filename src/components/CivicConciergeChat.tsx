import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Mic,
  Square,
  Volume2,
  VolumeX,
  FileEdit,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface ConciergePrefill {
  title?: string;
  description?: string;
  categoryId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  department?: string;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  prefill?: ConciergePrefill;
  suggestions?: string[];
}

interface CivicConciergeChatProps {
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  onPrefillGrievance?: (prefill: ConciergePrefill) => void;
  currentLanguage?: 'en' | 'hi' | 'mr';
}

export default function CivicConciergeChat({
  isOpen: controlledIsOpen,
  onToggle,
  onPrefillGrievance,
  currentLanguage = 'en',
}: CivicConciergeChatProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const toggleOpen = (openState: boolean) => {
    if (onToggle) {
      onToggle(openState);
    } else {
      setInternalIsOpen(openState);
    }
  };

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      content:
        'Namaste! I am Samadhan Sahayak (समाधान सहायक), your AI civic guide. Tell me about any civic grievance—such as road potholes, water cuts, dark streetlights, or garbage heaps—and I will route it to the exact municipal department and pre-fill your complaint ticket.',
      timestamp: new Date().toISOString(),
      suggestions: [
        'Dangerous pothole near main market',
        'Dirty drinking water / contaminated tap',
        'Streetlight not working for 3 nights',
        'Uncollected garbage dump outside colony',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Voice dictate via /api/transcribe
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          try {
            toast.loading('Transcribing voice with Gemini...', { id: 'voice-trans' });
            const res = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioData: base64Audio, mimeType: 'audio/webm' }),
            });
            toast.dismiss('voice-trans');
            if (res.ok) {
              const data = await res.json();
              if (data.text) {
                setInput(data.text);
                toast.success('🎙️ Speech captured!');
              }
            } else {
              toast.error('Could not transcribe audio.');
            }
          } catch {
            toast.dismiss('voice-trans');
            toast.error('Voice transcription network error.');
          } finally {
            stream.getTracks().forEach((track) => track.stop());
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast('Listening... Speak your civic complaint', { icon: '🎙️' });
    } catch {
      toast.error('Microphone access denied.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Text to speech readout
  const speakText = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          message: userMessage.content,
          language: currentLanguage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMessage: ChatMessage = {
          id: `ast_${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'I have noted your concern.',
          timestamp: new Date().toISOString(),
          prefill: data.prefill,
          suggestions: data.suggestions || [],
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (speechEnabled) {
          speakText(assistantMessage.content);
        }
      } else {
        toast.error('Assistant service temporarily busy.');
      }
    } catch {
      toast.error('Failed to communicate with AI Concierge.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrefillClick = (prefill: ConciergePrefill) => {
    if (onPrefillGrievance) {
      onPrefillGrievance(prefill);
      toast.success('Form pre-filled! Please review and confirm your complaint.', {
        icon: '📝',
        duration: 4000,
      });
      toggleOpen(false);
    }
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="bg-[#0F1B2D] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/10 flex items-center gap-1.5 animate-bounce">
              <Sparkles className="w-3 h-3 text-[#FF6A2A]" />
              Need help filing? Ask Sahayak
            </span>
          </div>
          <button
            onClick={() => toggleOpen(true)}
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#0F1B2D] to-[#1E293B] text-white shadow-2xl hover:scale-105 active:scale-95 transition-all border-2 border-[#FF6A2A]/40 hover:border-[#FF6A2A]"
            aria-label="Open AI Civic Concierge"
          >
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
            <Bot className="w-7 h-7 text-[#FF6A2A] group-hover:rotate-6 transition-transform" />
          </button>
        </div>
      )}

      {/* CHAT PANEL MODAL / DRAWER */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[640px] h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* HEADER */}
          <div className="bg-[#0F1B2D] text-white px-4 py-3.5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF6A2A] to-amber-400 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Samadhan Sahayak
                  </h3>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                    AI Active
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">
                  समाधान सहायक • Civic Concierge & Department Guide
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setSpeechEnabled(!speechEnabled);
                  if (speechEnabled && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }
                }}
                className={`p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors ${
                  speechEnabled ? 'text-[#FF6A2A]' : 'opacity-40'
                }`}
                title={speechEnabled ? 'Mute AI voice' : 'Enable voice readout'}
              >
                {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setMessages([
                    {
                      id: `welcome_${Date.now()}`,
                      role: 'assistant',
                      content: 'Conversation reset. How can I help resolve your civic grievance today?',
                      timestamp: new Date().toISOString(),
                      suggestions: [
                        'Road potholes near me',
                        'Contaminated tap water',
                        'Broken streetlight',
                        'Garbage pileup',
                      ],
                    },
                  ]);
                  toast('Chat refreshed');
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Restart chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  toggleOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES BODY */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#0F1B2D] text-white flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5">
                    <Bot className="w-4 h-4 text-[#FF6A2A]" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-[#0F1B2D] text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* PREFILL ACTION CARD */}
                  {msg.prefill && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 text-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1">
                          <FileEdit className="w-3 h-3 text-orange-600" /> Auto-Routing Prepared
                        </span>
                        {msg.prefill.priority && (
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono font-bold uppercase text-[9px] ${
                              msg.prefill.priority === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : msg.prefill.priority === 'high'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {msg.prefill.priority} Priority
                          </span>
                        )}
                      </div>

                      {msg.prefill.title && (
                        <p className="font-bold text-slate-900 text-xs">{msg.prefill.title}</p>
                      )}

                      {msg.prefill.department && (
                        <p className="text-[11px] text-slate-600 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold text-slate-700">Authority:</span>{' '}
                          {msg.prefill.department}
                        </p>
                      )}

                      <button
                        onClick={() => handlePrefillClick(msg.prefill!)}
                        className="w-full mt-2 bg-[#FF6A2A] hover:bg-[#E55A1F] active:scale-[0.98] text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        Pre-fill & File Grievance Now
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* QUICK SUGGESTIONS PILLS */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(sug)}
                          className="bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-slate-200 text-slate-700 text-[10px] font-medium px-2 py-1 rounded-full transition-all text-left"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="block text-[8px] opacity-40 text-right mt-1 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-full bg-[#0F1B2D] text-white flex items-center justify-center shrink-0 text-xs shadow-sm">
                  <Bot className="w-4 h-4 text-[#FF6A2A]" />
                </div>
                <div className="bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-[#FF6A2A] animate-ping" />
                  <span>Sahayak is analyzing civic database...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`p-2 rounded-xl transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title={isRecording ? 'Stop voice recording' : 'Speak grievance in Hindi/English'}
              >
                {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type or speak in Hindi/English..."
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6A2A]/30 focus:border-[#FF6A2A]"
                disabled={loading}
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-[#0F1B2D] hover:bg-slate-800 disabled:opacity-40 text-white p-2 rounded-xl transition-all flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4 text-[#FF6A2A]" />
              </button>
            </form>

            <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 px-1 font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                MCD • DJB • PWD • BSES Routing
              </span>
              <span>Gemini 2.5 Flash</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
