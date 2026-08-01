import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  History,
  FileSpreadsheet,
  Calendar,
  ChevronRight,
  Sparkles,
  FileText,
  Clock,
} from 'lucide-react';

interface HistoryItem {
  id: string;
  filename: string;
  rowCount: number;
  columnCount: number;
  report: string;
  createdAt: string;
}

interface AnalysisHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
}

export const AnalysisHistoryModal: React.FC<AnalysisHistoryModalProps> = ({
  isOpen,
  onClose,
  historyList,
  onSelectHistoryItem,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      <div className="bg-[#0B0F19] border border-white/15 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative overflow-hidden text-slate-100 glow-indigo">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">📜 Geçmiş Analiz Kayıtları</h3>
            <p className="text-xs text-slate-400">
              Daha önce Gemini 3.6 Flash ile analiz ettiğiniz veri kümeleri ve raporlarınız.
            </p>
          </div>
        </div>

        {/* History Items List */}
        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
          {historyList.length === 0 ? (
            <div className="p-10 text-center space-y-2 text-slate-500 text-xs">
              <FileText className="w-8 h-8 mx-auto text-slate-600" />
              <p>Henüz kaydedilmiş geçmiş bir analiziniz bulunmuyor.</p>
            </div>
          ) : (
            historyList.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHistoryItem(item);
                  onClose();
                }}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 hover:bg-white/[0.06] transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-100 group-hover:text-white block">
                      {item.filename}
                    </span>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                      <span>{item.rowCount} Satır x {item.columnCount} Sütun</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-semibold hidden sm:inline">
                    Raporu Yükle
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
