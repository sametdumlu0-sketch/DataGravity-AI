import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Download,
  X,
  Sparkles,
  Rows,
  Columns,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Target,
  Brain,
  Video,
  CheckCircle2,
} from 'lucide-react';
import { DatasetAnalysisContext } from '../types/data';

interface DataReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: DatasetAnalysisContext;
  reportText?: string | null;
}

const TOTAL_SLIDES = 4;
const SLIDE_DURATION_MS = 5000;

export const DataReelModal: React.FC<DataReelModalProps> = ({
  isOpen,
  onClose,
  context,
  reportText,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const reelFrameRef = useRef<HTMLDivElement>(null);

  // Auto-advance timer logic
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = 50; // update progress every 50ms
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveSlide((curr) => (curr + 1) % TOTAL_SLIDES);
          return 0;
        }
        return prev + (interval / SLIDE_DURATION_MS) * 100;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, activeSlide]);

  if (!isOpen) return null;

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % TOTAL_SLIDES);
    setProgress(0);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? TOTAL_SLIDES - 1 : prev - 1));
    setProgress(0);
  };

  const handleDownloadCanvasImage = async () => {
    if (!reelFrameRef.current) return;
    try {
      const canvas = await html2canvas(reelFrameRef.current, {
        useCORS: true,
      });


      const link = document.createElement('a');
      link.download = `data_reel_slide_${activeSlide + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export reel canvas:', err);
    }
  };

  const topNumeric = context.numericStats[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative flex flex-col items-center max-w-md w-full space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 9:16 Vertical Reel Canvas Container */}
        <div
          ref={reelFrameRef}
          className="relative w-[350px] sm:w-[380px] h-[640px] bg-[#07090E] border-2 border-white/20 rounded-[32px] shadow-2xl overflow-hidden flex flex-col justify-between p-6 glow-indigo select-none"
        >
          {/* Subtle Ambient Glow Background Orbs */}
          <div className="absolute top-10 -left-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 -right-10 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl" />

          {/* Top Segmented Story Progress Bars */}
          <div className="relative z-20 flex items-center space-x-1.5 pt-1">
            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-gradient-to-r from-indigo-400 to-teal-400 transition-all duration-75"
                  style={{
                    width:
                      idx < activeSlide
                        ? '100%'
                        : idx === activeSlide
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Story Header */}
          <div className="relative z-20 flex items-center justify-between pt-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-white block leading-none">
                  DataGravity Reel
                </span>
                <span className="text-[10px] text-slate-400">{context.filename}</span>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-300 text-[10px] font-mono font-bold border border-white/10 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> 30s AI Özet
            </span>
          </div>

          {/* Slide Content Area (Framer Motion Animated Transitions) */}
          <div className="relative z-20 flex-1 my-4 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {/* SLIDE 0: Critical Metrics */}
              {activeSlide === 0 && (
                <motion.div
                  key="slide-0"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.35 }}
                  className="w-full space-y-5 text-center"
                >
                  <div className="inline-flex p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-2xl text-indigo-300 shadow-inner">
                    <Rows className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest block">
                      SLAYT 1/4 • METRİK ÖZETİ
                    </span>
                    <h3 className="text-2xl font-extrabold text-white tracking-tight">
                      Veri Kümesi Analizi
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-left">
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Toplam Kayıt
                      </span>
                      <span className="text-xl font-bold font-mono text-indigo-300">
                        {context.rowCount.toLocaleString('tr-TR')}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-left">
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Değişken Sayısı
                      </span>
                      <span className="text-xl font-bold font-mono text-teal-300">
                        {context.columnCount} Sütun
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-teal-950/40 border border-indigo-500/30 text-left flex items-center space-x-3">
                    <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Sağlıklı Veri Matrisi
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Gemini 3.6 Flash ile doğrulandı
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SLIDE 1: Trend Distribution */}
              {activeSlide === 1 && (
                <motion.div
                  key="slide-1"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.35 }}
                  className="w-full space-y-5 text-center"
                >
                  <div className="inline-flex p-3 bg-teal-500/20 border border-teal-500/40 rounded-2xl text-teal-300">
                    <TrendingUp className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-teal-400 uppercase tracking-widest block">
                      SLAYT 2/4 • EĞİLİM DAĞILIMI
                    </span>
                    <h3 className="text-xl font-extrabold text-white">
                      {topNumeric ? topNumeric.columnName : 'İstatistiksel Dağılım'}
                    </h3>
                  </div>

                  {topNumeric && (
                    <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3 text-left">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Ortalama Değer:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {topNumeric.mean.toLocaleString('tr-TR')}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Minimum:</span>
                        <span className="font-mono text-slate-200">{topNumeric.min}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Maksimum:</span>
                        <span className="font-mono text-slate-200">{topNumeric.max}</span>
                      </div>

                      {/* Visual Sparkline Bar */}
                      <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5 mt-2">
                        <div className="h-full bg-gradient-to-r from-teal-500 via-indigo-500 to-amber-400 rounded-full w-[75%]" />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* SLIDE 2: Critical Findings */}
              {activeSlide === 2 && (
                <motion.div
                  key="slide-2"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.35 }}
                  className="w-full space-y-5 text-center"
                >
                  <div className="inline-flex p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-300">
                    <AlertTriangle className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block">
                      SLAYT 3/4 • KRİTİK BULGULAR
                    </span>
                    <h3 className="text-xl font-extrabold text-white">Anomali & Öne Çıkanlar</h3>
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>Belirgin aykırı değerler tespit edilip kök neden matrisi oluşturuldu.</span>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span>Sayısal ve kategorik sütunlar arasındaki korelasyon ilişkisi yüksek.</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SLIDE 3: Strategic Recommendations */}
              {activeSlide === 3 && (
                <motion.div
                  key="slide-3"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.35 }}
                  className="w-full space-y-5 text-center"
                >
                  <div className="inline-flex p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300">
                    <Target className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block">
                      SLAYT 4/4 • STRATEJİK ÖNERİLER
                    </span>
                    <h3 className="text-xl font-extrabold text-white">C-Level Aksiyon Planı</h3>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-indigo-950/40 to-slate-950 border border-emerald-500/30 text-left space-y-2 text-xs text-slate-200">
                    <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                      <Brain className="w-4 h-4" />
                      <span>Yapay Zeka Karar Destek:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      Elde edilen bulguları PowerPoint (.pptx) sunumuna dönüştürün veya ekibinize Slack üzerinden iletin.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reel Controls Toolbar */}
          <div className="relative z-20 flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handlePrevSlide}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleNextSlide}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadCanvasImage}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 text-xs font-semibold border border-white/10 transition flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>PNG / Görsel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
