import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  X,
  Bot,
  Brain,
  Zap,
  CheckCircle2,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { DatasetAnalysisContext } from '../types/data';

interface JarvisVoiceAssistantModalProps {

  isOpen: boolean;
  onClose: () => void;
  context: DatasetAnalysisContext | null;
  onSelectTab: (tab: 'report' | 'chat' | 'charts' | 'table') => void;
}

export const JarvisVoiceAssistantModal: React.FC<JarvisVoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  context,
  onSelectTab,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech Recognition API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'tr-TR';

        recognition.onstart = () => {
          setIsListening(true);
          setErrorMsg(null);
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);

          // If final result, process query
          if (event.results[0].isFinal) {
            handleProcessVoiceCommand(currentTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setErrorMsg('Mikrofon erişim izni reddedildi. Lütfen tarayıcı iznini onaylayın.');
          } else {
            setErrorMsg('Ses algılanamadı veya dinleme zaman aşımına uğradı.');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setErrorMsg('Tarayıcınız Web Speech API ses tanıma özelliğini desteklemiyor.');
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setAiResponse(null);
      setErrorMsg(null);
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const speakResponseText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any dangling speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleProcessVoiceCommand = async (commandText: string) => {
    if (!commandText.trim()) return;

    setIsThinking(true);
    setErrorMsg(null);

    // Check UI Action Triggers
    const lowerCmd = commandText.toLowerCase();
    if (lowerCmd.includes('grafik') || lowerCmd.includes('görsel') || lowerCmd.includes('evren')) {
      onSelectTab('charts');
    } else if (lowerCmd.includes('tablo') || lowerCmd.includes('temizle') || lowerCmd.includes('sentetik')) {
      onSelectTab('table');
    } else if (lowerCmd.includes('rapor') || lowerCmd.includes('özet')) {
      onSelectTab('report');
    } else if (lowerCmd.includes('sohbet') || lowerCmd.includes('soru')) {
      onSelectTab('chat');
    }

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataContext: context?.contextMarkdown || 'Veri seti yüklü.',
          question: `Sesli Komut: ${commandText}. Kısaca yanıtla.`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Jarvis yanıt veremedi.');
      }

      const answer = data.answer || 'Sesli komutunuz işlendi.';
      setAiResponse(answer);

      // Speak answer in Turkish voice
      speakResponseText(answer.replace(/[*#`]/g, ''));
    } catch (err: any) {
      console.error('Jarvis voice query error:', err);
      setErrorMsg(err.message || 'Yanıt alınamadı.');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fadeIn">
      <div className="bg-[#0B0F19] border border-white/15 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 relative overflow-hidden text-center glow-indigo">
        {/* Close Button */}
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-inner">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Jarvis AI Voice Assistant Engine</span>
          </div>
          <h3 className="text-xl font-extrabold text-white">🎙️ Jarvis Sesli Asistan Modu</h3>
          <p className="text-xs text-slate-400">
            Sesli komut verin: "Grafikleri göster", "Veriyi temizle", "Raporu aç", "Satışlar nasıl?"
          </p>
        </div>

        {/* Siri / Jarvis Glowing Circular Sound Wave Orb */}
        <div className="relative w-44 h-44 mx-auto flex items-center justify-center py-4">
          {/* Concentric Pulsing Wave Rings */}
          <motion.div
            animate={
              isListening || isSpeaking
                ? { scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }
                : { scale: 1, opacity: 0.2 }
            }
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 blur-2xl"
          />

          <motion.div
            animate={
              isThinking
                ? { rotate: 360 }
                : isListening
                ? { scale: [1, 1.15, 1] }
                : {}
            }
            transition={isThinking ? { repeat: Infinity, duration: 2, ease: 'linear' } : { repeat: Infinity, duration: 1 }}
            className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-teal-500 p-1 shadow-2xl flex items-center justify-center cursor-pointer"
            onClick={toggleListening}
          >
            <div className="w-full h-full rounded-full bg-[#07090E] border border-white/20 flex flex-col items-center justify-center shadow-inner group hover:scale-105 transition">
              {isListening ? (
                <Mic className="w-10 h-10 text-rose-400 animate-pulse" />
              ) : isSpeaking ? (
                <Volume2 className="w-10 h-10 text-teal-400 animate-bounce" />
              ) : isThinking ? (
                <Brain className="w-10 h-10 text-indigo-400 animate-spin" />
              ) : (
                <Mic className="w-10 h-10 text-indigo-300 group-hover:text-white transition" />
              )}
            </div>
          </motion.div>
        </div>

        {/* Dynamic Voice Status Badge */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={toggleListening}
            className={`px-5 py-2.5 rounded-full font-bold text-xs shadow-lg transition flex items-center justify-center space-x-2 mx-auto ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
                : 'bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white shadow-indigo-500/30'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Dinlemeyi Durdur</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>🎙️ Konuşmak İçin Dokunun</span>
              </>
            )}
          </button>

          {/* Transcript Box */}
          {transcript && (
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-200 font-mono italic">
              "{transcript}"
            </div>
          )}

          {/* AI Response Display Box */}
          {aiResponse && (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 text-left space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between font-bold text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-emerald-400" /> Jarvis Yanıtı:
                </span>
                {isSpeaking && (
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] flex items-center gap-1">
                    <Volume2 className="w-3 h-3 animate-bounce" /> Sesli Okunuyor
                  </span>
                )}
              </div>
              <p className="leading-relaxed font-sans text-slate-200">{aiResponse}</p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
