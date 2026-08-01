import React from 'react';
import {
  Rows,
  Columns,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  ShieldCheck,
  Binary,
} from 'lucide-react';
import { DatasetAnalysisContext } from '../types/data';

interface DatasetOverviewCardsProps {
  context: DatasetAnalysisContext;
}

export const DatasetOverviewCards: React.FC<DatasetOverviewCardsProps> = ({ context }) => {
  const totalCells = context.rowCount * context.columnCount;
  const totalNulls = context.columns.reduce((acc, curr) => acc + curr.nullCount, 0);
  const nullPercentage = totalCells > 0 ? Number(((totalNulls / totalCells) * 100).toFixed(1)) : 0;

  // Calculate a heuristic Data Quality Score (0-100)
  const qualityScore = Math.max(0, Math.min(100, Math.round(100 - nullPercentage * 2.5)));

  const numericCount = context.numericStats.length;
  const categoricalCount = context.categoricalStats.length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {/* Card 1: Row Count */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Satır Sayısı</span>
          <Rows className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="mt-2">
          <span className="text-xl sm:text-2xl font-bold text-slate-100 font-mono">
            {context.rowCount.toLocaleString('tr-TR')}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">Toplam Kayıt</p>
        </div>
      </div>

      {/* Card 2: Column Count */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Sütun Sayısı</span>
          <Columns className="w-4 h-4 text-blue-400" />
        </div>
        <div className="mt-2">
          <span className="text-xl sm:text-2xl font-bold text-slate-100 font-mono">
            {context.columnCount}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {numericCount} Sayısal / {categoricalCount} Kategorik
          </p>
        </div>
      </div>

      {/* Card 3: Missing Values */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Eksik Veri Oranı</span>
          <AlertTriangle
            className={`w-4 h-4 ${nullPercentage > 5 ? 'text-amber-400' : 'text-emerald-400'}`}
          />
        </div>
        <div className="mt-2">
          <span
            className={`text-xl sm:text-2xl font-bold font-mono ${
              nullPercentage > 5 ? 'text-amber-300' : 'text-emerald-400'
            }`}
          >
            %{nullPercentage}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {totalNulls} hücre boş
          </p>
        </div>
      </div>

      {/* Card 4: Quality Score */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Veri Kalitesi</span>
          <ShieldCheck className="w-4 h-4 text-teal-400" />
        </div>
        <div className="mt-2">
          <span className="text-xl sm:text-2xl font-bold text-teal-300 font-mono">
            {qualityScore} / 100
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {qualityScore > 85 ? 'Mükemmel Tutarlılık' : 'Hafif Temizlik Gerekebilir'}
          </p>
        </div>
      </div>

      {/* Card 5: Type Distribution */}
      <div className="col-span-2 lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Sütun Dağılımı</span>
          <Binary className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="mt-2">
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
            <div
              className="bg-indigo-500 h-full"
              style={{
                width: `${(numericCount / (context.columnCount || 1)) * 100}%`,
              }}
              title={`Sayısal: ${numericCount}`}
            />
            <div
              className="bg-teal-400 h-full"
              style={{
                width: `${(categoricalCount / (context.columnCount || 1)) * 100}%`,
              }}
              title={`Kategorik: ${categoricalCount}`}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex justify-between">
            <span className="text-indigo-300">● {numericCount} Sayısal</span>
            <span className="text-teal-300">● {categoricalCount} Kategorik</span>
          </p>
        </div>
      </div>
    </div>
  );
};
