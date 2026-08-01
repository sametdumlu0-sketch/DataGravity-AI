import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  Sliders,
  TrendingUp,
  Sparkles,
  Bot,
  RefreshCw,
  Lightbulb,
  BarChart2,
  LineChart as LineIcon,
  Activity,
} from 'lucide-react';
import { DatasetAnalysisContext, AIChartRecommendation, ChartType } from '../types/data';
import { WhatIfSimulator } from './WhatIfSimulator';
import { RootCauseAnalystView } from './RootCauseAnalystView';
import { ThreeDDataUniverseView } from './ThreeDDataUniverseView';
import { KnowledgeGraphView } from './KnowledgeGraphView';





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

  // AI Chart Assistant state
  const [aiRecommendations, setAiRecommendations] = useState<AIChartRecommendation[]>([]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [typeOverrides, setTypeOverrides] = useState<Record<string, ChartType>>({});

  // Fetch AI Chart Recommendations from Gemini 3.6 Flash endpoint
  const handleFetchAiRecommendations = async () => {
    setIsAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/recommend-charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataContext: context.contextMarkdown }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Grafik önerileri oluşturulamadı.');
      }

      if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        setAiRecommendations(data.recommendations);
      } else {
        throw new Error('Geçerli bir grafik önerisi listesi alınamadı.');
      }
    } catch (err: any) {
      console.error('AI Chart recommendations error:', err);
      setAiError(err.message || 'Yapay zeka grafik önerisi sırasında bir hata oluştu.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleOverrideChartType = (chartId: string, type: ChartType) => {
    setTypeOverrides((prev) => ({ ...prev, [chartId]: type }));
  };

  // Standard Manual Chart Data Calculations
  const currentCategoryStat = context.categoricalStats.find(
    (s) => s.columnName === selectedCategoryCol
  );
  const categoryChartData = currentCategoryStat?.topCategories.map((c) => ({
    name: c.value,
    sayi: c.count,
    yuzde: c.percentage,
  })) || [];

  const numericComparisonData = context.numericStats.map((s) => ({
    column: s.columnName.length > 14 ? s.columnName.substring(0, 12) + '..' : s.columnName,
    fullName: s.columnName,
    Ortalama: s.mean,
    Minimum: s.min,
    Maksimum: s.max,
    Medyan: s.median,
  }));

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

  // Render dynamic Recharts component based on chart item type
  const renderRechartComponent = (rec: AIChartRecommendation) => {
    const activeType = typeOverrides[rec.id] || rec.type || 'bar';
    const mainColor = rec.color || COLORS[Math.abs(rec.id.length * 7) % COLORS.length];

    if (activeType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rec.data} margin={{ top: 15, right: 15, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
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
            <Line type="monotone" dataKey="value" stroke={mainColor} strokeWidth={3} dot={{ r: 5, fill: mainColor }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (activeType === 'area') {
      const gradientId = `grad-${rec.id}`;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rec.data} margin={{ top: 15, right: 15, left: -10, bottom: 20 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={mainColor} stopOpacity={0.8} />
                <stop offset="95%" stopColor={mainColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
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
            <Area type="monotone" dataKey="value" stroke={mainColor} fillOpacity={1} fill={`url(#${gradientId})`} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (activeType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Pie
              data={rec.data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={35}
              paddingAngle={4}
              label={({ name, percent }) => `${name} (%${(percent * 100).toFixed(0)})`}
            >
              {rec.data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // Default: BarChart
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rec.data} margin={{ top: 15, right: 15, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
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
          <Bar dataKey="value" fill={mainColor} radius={[6, 6, 0, 0]}>
            {rec.data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card with AI Assistant Trigger */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start space-x-4">
          <div className="p-3.5 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl text-indigo-400 shadow-inner">
            <Bot className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-100">AI Grafik Asistanı</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Gemini 3.6 Flash & Recharts
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Yapay zeka veri setinizin sütun tiplerini ve ilişkilerini analiz ederek en açıklayıcı Bar, Line, Pie ve Area grafiklerini otomatik önerir.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFetchAiRecommendations}
          disabled={isAiLoading}
          className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isAiLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Grafikler Öneriliyor...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>✨ AI Grafik Önerilerini Getir</span>
            </>
          )}
        </button>
      </div>

      {aiError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center space-x-3">
          <Bot className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{aiError}</span>
        </div>
      )}

      {/* AI Recommendations Gallery */}
      {aiRecommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Yapay Zeka Tarafından Önerilen Recharts Grafikleri ({aiRecommendations.length})
            </h3>
            <span className="text-xs text-slate-400">Canlı Etkileşimli Görseller</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiRecommendations.map((rec) => {
              const activeType = typeOverrides[rec.id] || rec.type || 'bar';

              return (
                <div
                  key={rec.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition hover:border-indigo-500/40"
                >
                  {/* Card Header & Controls */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-base font-bold text-slate-100">{rec.title}</h4>

                      {/* Dynamic Chart Type Switcher Pills */}
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleOverrideChartType(rec.id, 'bar')}
                          title="Bar Grafiği"
                          className={`p-1.5 rounded text-xs transition ${
                            activeType === 'bar'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOverrideChartType(rec.id, 'line')}
                          title="Çizgi (Line) Grafiği"
                          className={`p-1.5 rounded text-xs transition ${
                            activeType === 'line'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <LineIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOverrideChartType(rec.id, 'area')}
                          title="Alan (Area) Grafiği"
                          className={`p-1.5 rounded text-xs transition ${
                            activeType === 'area'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOverrideChartType(rec.id, 'pie')}
                          title="Pasta (Pie) Grafiği"
                          className={`p-1.5 rounded text-xs transition ${
                            activeType === 'pie'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <PieIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
                  </div>

                  {/* AI Reasoning Box */}
                  {rec.reasoning && (
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start space-x-2">
                      <Lightbulb className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                      <span>
                        <strong>AI Neden Önerdi?</strong> {rec.reasoning}
                      </span>
                    </div>
                  )}

                  {/* Recharts Render Area */}
                  <div className="h-64 w-full pt-2">
                    {renderRechartComponent(rec)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Senaryo Simülatörü (What-If Simulator) */}
      <WhatIfSimulator context={context} />

      {/* Kök Neden & Anomali Analisti (Root Cause Analyst) */}
      <RootCauseAnalystView context={context} />

      {/* 3D Spatial Data Universe (Three.js WebGL) */}
      <ThreeDDataUniverseView context={context} />

      {/* Section Divider */}

      <div className="pt-4 border-t border-slate-900 flex items-center justify-between">

        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          Manuel Görsel Keşif ve Değişken Dağılımları
        </h3>
        <span className="text-xs text-slate-500">Sütun Bazlı Filtreleme</span>
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
                    {categoryChartData.map((_, index) => (
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

      {/* Knowledge Graph View */}
      <KnowledgeGraphView context={context} />
    </div>
  );
};

