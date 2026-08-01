import React from 'react';
import {
  Rows,
  Columns,
  AlertTriangle,
  ShieldCheck,
  Globe,
  Layers,
  Zap,
  TrendingUp,
  Activity,
  Sparkles,
} from 'lucide-react';
import { DatasetAnalysisContext } from '../types/data';

interface DatasetOverviewCardsProps {
  context: DatasetAnalysisContext;
}

export const DatasetOverviewCards: React.FC<DatasetOverviewCardsProps> = ({ context }) => {
  const totalCells = context.rowCount * context.columnCount;
  const totalNulls = context.columns.reduce((acc, curr) => acc + curr.nullCount, 0);
  const nullPercentage = totalCells > 0 ? Number(((totalNulls / totalCells) * 100).toFixed(1)) : 0;

  const qualityScore = Math.max(0, Math.min(100, Math.round(100 - nullPercentage * 2.5)));

  const numericCount = context.numericStats.length;
  const categoricalCount = context.categoricalStats.length;

  return (
    <div className="space-y-4 mb-6">
      {/* Metadata Badges Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {context.detectedEncoding && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-indigo-300 font-medium shadow-sm">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kodlama: <strong>{context.detectedEncoding}</strong></span>
          </span>
        )}

        {context.activeSheetName && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-teal-300 font-medium shadow-sm">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>Aktif Sayfa: <strong>{context.activeSheetName}</strong></span>
          </span>
        )}

        {context.isSummarizedForLLM && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium shadow-sm">
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Akıllı Gemini API Özetleyici: <strong>Token Tasarrufu Aktif</strong></span>
          </span>
        )}
      </div>

      {/* Bento Grid Dashboard Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Bento Card 1 (Span 2): Total Records & Cell Matrix */}
        <div className="md:col-span-2 bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 hover:border-indigo-500/30 transition-all duration-300 rounded-2xl p-5 shadow-2xl flex flex-col justify-between space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500" />
          
          <div className="flex items-center justify-between text-slate-400 z-10">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                <Rows className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Toplam Veri Hacmi & Matris</span>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> +%100 Doğrulanmış
            </span>
          </div>

          <div className="flex items-baseline justify-between z-10 pt-2">
            <div>
              <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {context.rowCount.toLocaleString('tr-TR')}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5 font-medium">
                Toplam Kayıt Satırı
              </span>
            </div>

            <div className="text-right">
              <span className="text-lg font-bold text-indigo-300 font-mono">
                {totalCells.toLocaleString('tr-TR')}
              </span>
              <span className="text-[11px] text-slate-500 block font-medium">Veri Hücresi</span>
            </div>
          </div>
        </div>

        {/* Bento Card 2: Feature Distribution */}
        <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 hover:border-teal-500/30 transition-all duration-300 rounded-2xl p-5 shadow-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300">
                <Columns className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Sütun Dağılımı</span>
            </div>
            <span className="text-xs font-mono font-bold text-teal-300">{context.columnCount} Değişken</span>
          </div>

          <div className="pt-1 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-indigo-300">{numericCount} Sayısal</span>
              <span className="text-teal-300">{categoricalCount} Kategorik</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex border border-white/5">
              <div
                className="h-full bg-indigo-500"
                style={{
                  width: `${(numericCount / (context.columnCount || 1)) * 100}%`,
                }}
              />
              <div
                className="h-full bg-teal-400"
                style={{
                  width: `${(categoricalCount / (context.columnCount || 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Bento Card 3: Data Quality Score */}
        <div className="bg-[#0B0F19]/80 backdrop-blur-xl border border-white/10 hover:border-emerald-500/30 transition-all duration-300 rounded-2xl p-5 shadow-2xl flex flex-col justify-between space-y-3 glow-emerald">
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Kalite Skoru</span>
            </div>

            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
              Güvenilir
            </span>
          </div>

          <div className="pt-1 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
              %{qualityScore}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Veri Sağlık İndeksi</span>
          </div>
        </div>
      </div>
    </div>
  );
};
