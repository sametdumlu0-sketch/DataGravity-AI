import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Zap,
  CheckCircle2,
  Sparkles,
  Crown,
  ShieldCheck,
  Video,
  Globe,
  Brain,
} from 'lucide-react';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess?: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgradeSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fadeIn">
      <div className="bg-[#0B0F19] border border-indigo-500/40 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 relative overflow-hidden text-slate-100 glow-indigo text-center">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-extrabold">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Pro Plan Tier Upgrade</span>
          </div>

          <h3 className="text-2xl font-extrabold text-white">
            Sınırsız AI Veri Analizi ve İleri Özellikler
          </h3>
          <p className="text-xs text-slate-400">
            Pro plana yükselterek tüm gelişmiş yapay zeka araçlarının kilidini anında açın.
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-2.5 text-left text-xs relative z-10">
          {[
            'Sınırsız Günlük Veri Analizi ve Gemini 3.6 Flash İstekleri',
            'Jarvis Sesli Asistan Modu (Türkçe Web Speech API)',
            '3D Spatial Data Universe (Three.js WebGL Evreni)',
            '30s AI Data Reel (9:16 Dikey Hikaye Özetçisi)',
            'PowerPoint (.pptx) ve Slack Dispatcher Entegrasyonları',
            'Bulut Veri Geçmişi & Rapor Saklama',
          ].map((feature, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-slate-200 font-medium">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing CTA */}
        <div className="pt-2 space-y-3 relative z-10">
          <button
            type="button"
            onClick={() => {
              if (onUpgradeSuccess) onUpgradeSuccess();
              onClose();
            }}
            className="w-full py-3.5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white shadow-xl shadow-indigo-500/30 transition flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>⚡ Şimdi Pro Plan'a Yükselt (Ücretsiz Demo Aktivasyon)</span>
          </button>

          <span className="text-[11px] text-slate-500 block">
            İstediğiniz zaman iptal edebilirsiniz. 7/24 Teknik Destek Dahildir.
          </span>
        </div>
      </div>
    </div>
  );
};
