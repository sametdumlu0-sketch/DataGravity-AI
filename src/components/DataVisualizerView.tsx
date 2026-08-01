import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  Sliders,
  Maximize2,
  TrendingUp,
} from 'lucide-react';
import { DatasetAnalysisContext } from '../types/data';

interface DataVisualizerViewProps {
  context: DatasetAnalysisContext;
}

const COLORS = [
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#f97316', // Orange
];

export const DataVisualizerView: React.FC<DataVisualizerViewProps> = ({ context }) => {
  const categoricalCols = context.categoricalStats.map((s) => s.columnName);
  const numericCols = context.numericStats.map((s) => s.columnName);

  const [selectedCategoryCol, setSelectedCategoryCol] = useState<string>(
    categoricalCols[0] || ''
  );
  const [selectedNumericCol, setSelectedNumericCol] = useState<string>(
    numericCols[0] || ''
  );

  // Active Categorical distribution data
  const currentCategoryStat = context.categoricalStats.find(
    (s) => s.columnName === selectedCategoryCol
  );
  const categoryChartData = currentCategoryStat?.topCategories.map((c) => ({
    name: c.value,
    sayi: c.count,
    yuzde: c.percentage,
  })) || [];

  // Numeric Columns Min / Mean / Max Comparison Chart
  const numericComparisonData = context.numericStats.map((s) => ({
    column: s.columnName.length > 14 ? s.columnName.substring(0, 12) + '..' : s.columnName,
    fullName: s.columnName,
    Ortalama: s.mean,
    Minimum: s.min,
    Maksimum: s.max,
    Medyan: s.median,
  }));

  // Frequency distribution for selected numeric column (e.g. binned histogram simulation)
  const currentNumericStat = context.numericStats.find(
    (s) => s.columnName === selectedNumericCol
  );

  let numericBinsData: { binLabel: string; count: number }[] = [];
  if (currentNumericStat && context.allData.length > 0) {
    const rawVals = context.allData
      .map((r) => Number(r[selectedNumericCol]))
      .filter((n) => !isNaN(n));

    if (rawVals.length > 0) {
      const min = Math.min(...rawVals);
      const max = Math.max(...rawVals);
      const binCount = 6;
      const step = (max - min) / binCount || 1;

      const bins = Array(binCount).fill(0);
      rawVals.forEach((val) => {
        let idx = Math.floor((val - min) / step);
        if (idx >= binCount) idx = binCount - 1;
        bins[idx]++;
      });

      numericBinsData = bins.map((c, i) => {
        const start = Math.round(min + i * step);
        const end = Math.round(min + (i + 1) * step);
        return {
          binLabel: `${start} - ${end}`,
          count: c,
        };
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Görsel Veri Keşfi & Grafikler</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Veri setindeki kategorik ve sayısal değişkenlerin dağılım grafikleri.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Categorical Frequency Bar Chart */}
        {categoricalCols.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-indigo-400" />
                  Kategorik Dağılım Grafiği
                </h3>
                <p className="text-xs text-slate-400">
                  En sık tekrarlanan kategoriler ve yüzde oranları
                </p>
              </div>

              {/* Column selector */}
              <select
                value={selectedCategoryCol}
                onChange={(e) => setSelectedCategoryCol(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                {categoricalCols.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="sayi" radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart 2: Numeric Distribution Histogram simulation */}
        {numericCols.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  Sayısal Değişken Dağılımı (Histogram)
                </h3>
                <p className="text-xs text-slate-400">
                  Aralık frekansları ve kümelenme analizi
                </p>
              </div>

              {/* Column selector */}
              <select
                value={selectedNumericCol}
                onChange={(e) => setSelectedNumericCol(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                {numericCols.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={numericBinsData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="binLabel" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Chart 3: Numerical Summary Comparison across all numeric features */}
      {numericCols.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Sayısal Değişkenlerin Ortalama ve Aralık Karşılaştırması
            </h3>
            <p className="text-xs text-slate-400">
              Sayısal sütunların ortalama ve medyan değerlerinin toplu bakışı
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={numericComparisonData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="column" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                <Bar dataKey="Ortalama" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Medyan" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
