import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileText,
  Presentation,
  Globe,
  Sparkles,
  Stethoscope,
  FlaskConical,
  MessageSquare,
  Upload,
  Command,
  ArrowRight,
  X,
  Bot,
  Zap,
} from 'lucide-react';

export type TabType = 'report' | 'chat' | 'charts' | 'table';

interface CommandItem {

  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  badge?: string;
  action: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: TabType) => void;
  onTriggerPPTXExport?: () => void;
  onResetDataset?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onTriggerPPTXExport,
  onResetDataset,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands: CommandItem[] = [
    {
      id: 'report',
      title: 'Yönetici AI Raporu ve 45s Podcast Gör',
      category: 'Raporlama',
      icon: FileText,
      badge: 'Gemini 3.6',
      action: () => {
        onSelectTab('report');
        onClose();
      },
    },
    {
      id: 'pptx',
      title: 'PowerPoint (.pptx) Kurumsal Sunumu İndir',
      category: 'Dışa Aktar',
      icon: Presentation,
      badge: '4 Slayt',
      action: () => {
        if (onTriggerPPTXExport) onTriggerPPTXExport();
        onClose();
      },
    },
    {
      id: '3d-universe',
      title: '3D Spatial Data Universe (Üç Boyutlu Veri Evreni)',
      category: 'Görselleştirme',
      icon: Globe,
      badge: 'Three.js WebGL',
      action: () => {
        onSelectTab('charts');
        onClose();
      },
    },
    {
      id: 'what-if',
      title: '🔮 What-If (Ya Şöyle Olursa?) Senaryo Simülatörü',
      category: 'Simülasyon',
      icon: Sparkles,
      action: () => {
        onSelectTab('charts');
        onClose();
      },
    },
    {
      id: 'root-cause',
      title: '🕵️‍♂️ Kök Neden & Anomali Analisti (Etki Ağacı)',
      category: 'Analitik',
      icon: Zap,
      action: () => {
        onSelectTab('charts');
        onClose();
      },
    },
    {
      id: 'data-doctor',
      title: '🩺 Autonomous Data Doctor (Sihirli Veri İyileştirici)',
      category: 'Veri Kalitesi',
      icon: Stethoscope,
      badge: '% Health Score',
      action: () => {
        onSelectTab('table');
        onClose();
      },
    },
    {
      id: 'synthetic',
      title: '🧪 Sentetik Veri Çoğaltıcı (100 - 1000 Satır)',
      category: 'Veri Üretimi',
      icon: FlaskConical,
      action: () => {
        onSelectTab('table');
        onClose();
      },
    },
    {
      id: 'chat',
      title: '💬 Etkileşimli AI Veri Danışmanına Soru Sor',
      category: 'Danışmanlık',
      icon: MessageSquare,
      action: () => {
        onSelectTab('chat');
        onClose();
      },
    },
    {
      id: 'new-dataset',
      title: '🔄 Yeni Veri Kümesi Yükle / Dosya Değiştir',
      category: 'Veri Seti',
      icon: Upload,
      action: () => {
        if (onResetDataset) onResetDataset();
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-[#0B0F19] border border-white/10 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden"
        >
          {/* Command Search Input Bar */}
          <div className="p-4 border-b border-white/10 flex items-center space-x-3 bg-white/[0.02]">
            <Search className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Bir komut yazın veya arayın (Örn: Rapor, 3D, PowerPoint, Temizle)..."
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
            />
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Items List */}
          <div className="p-2 max-h-96 overflow-y-auto space-y-1">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Eşleşen komut bulunamadı.
              </div>
            ) : (
              filteredCommands.map((cmd) => {
                const IconComp = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className="w-full p-3 rounded-xl text-left flex items-center justify-between hover:bg-white/[0.05] border border-transparent hover:border-indigo-500/30 transition group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:text-white group-hover:bg-indigo-600 transition">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-white block">
                          {cmd.title}
                        </span>
                        <span className="text-[10px] text-slate-500">{cmd.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {cmd.badge && (
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px] font-mono">
                          {cmd.badge}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Keyboard Footer */}
          <div className="p-3 border-t border-white/10 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <Command className="w-3.5 h-3.5 text-indigo-400" /> Vercel / Linear Command Palette
            </span>
            <span>ESC ile Kapat</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
