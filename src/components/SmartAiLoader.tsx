import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Activity } from 'lucide-react';

interface SmartAiLoaderProps {
  title?: string;
  subtitle?: string;
}

const STEPPED_MESSAGES = [
  '1/4 Veri matrisi ve şeması okunuyor...',
  '2/4 Gemini 3.6 Flash anormallikleri ve kalıpları tespit ediyor...',
  '3/4 Kök nedenler ve etki katsayıları hesaplanıyor...',
  '4/4 Rapor ve görseller sentezleniyor...',
];

export const SmartAiLoader: React.FC<SmartAiLoaderProps> = ({
  title = 'Yapay Zeka Analizi İşleniyor',
  subtitle = 'Gemini 3.6 Flash veri kümenizi derinlemesine inceliyor',
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => (prev + 1) % STEPPED_MESSAGES.length);
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  const progressPercentage = ((currentStepIdx + 1) / STEPPED_MESSAGES.length) * 100;

  return (
    <div className="bg-[#0B0F19]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-10 sm:p-12 text-center space-y-6 shadow-2xl glow-indigo max-w-xl mx-auto">
      {/* Animated Glowing AI Orb */}
      <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 blur-xl opacity-60 animate-pulse" />
        <div className="relative w-16 h-16 rounded-full bg-[#07090E] border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
          <Brain className="w-8 h-8 animate-bounce text-indigo-300" />
        </div>
      </div>

      {/* Title & Subtitle */}
      <div className="space-y-1">
        <h3 className="text-lg font-extrabold text-slate-100 flex items-center justify-center gap-2">
          <span>{title}</span>
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">{subtitle}</p>
      </div>

      {/* Stepped Status Box & Progress Bar */}
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-[#07090E] border border-indigo-500/30 shadow-inner flex items-center justify-center space-x-2 text-xs font-mono text-indigo-300">
          <Activity className="w-4 h-4 text-teal-400 animate-pulse flex-shrink-0" />
          <span className="truncate">{STEPPED_MESSAGES[currentStepIdx]}</span>
        </div>

        {/* Framer Motion Progress Fill Bar */}
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 rounded-full"
            initial={{ width: '25%' }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  );
};
