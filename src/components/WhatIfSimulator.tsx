import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Sliders,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Zap,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { DatasetAnalysisContext, SimulatorResponse, SimulatorCoefficient } from '../types/data';

interface WhatIfSimulatorProps {
  context: DatasetAnalysisContext;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ context }) => {
  const numericStats = context.numericStats;
  const numericCols = numericStats.map((s) => s.columnName);

  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  const [simData, setSimData] = useState<SimulatorResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize slider values to 0 for all numeric columns
  useEffect(() => {
    const initialSliders: Record<string, number> = {};
    numericCols.forEach((col) => {
      initialSliders[col] = 0;
    });
    setSliderValues(initialSliders);
  }, [context.filename]);

  // Fetch simulation coefficients from Gemini 3.6 Flash
  const fetchSimulationCoefficients = async () => {
    if (numericCols.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataContext: context.contextMarkdown,
          numericStats: context.numericStats,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Simülasyon katsayıları alınamadı.');
      }

      setSimData(data);
    } catch (err: any) {
      console.error('Simulation API error:', err);
      setError(err.message || 'Gemini simülasyon matrisi çıkarılırken bir sorun yaşandı.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSliderChange = (colName: string, val: number) => {
    setSliderValues((prev) => ({
      ...prev,
      [colName]: val,
    }));
  };

  const handleResetSliders = () => {
    const resetSliders: Record<string, number> = {};
    numericCols.forEach((col) => {
      resetSliders[col] = 0;
    });
    setSliderValues(resetSliders);
  };

  // Compute calculated baseline & simulated values
  const getSimulatedMetrics = () => {
    return numericStats.map((stat) => {
      const col = stat.columnName;
      // Get baseline from Gemini response or fallback to column mean
      const baseline =
        simData?.baselineStats && typeof simData.baselineStats[col] === 'number'
          ? simData.baselineStats[col]
          : stat.mean;

      // Direct slider value for this column
      const directChangePct = sliderValues[col] || 0;

      // Induced change from other drivers based on elasticity coefficients
      let inducedChangePct = 0;
      if (simData?.coefficients && Array.isArray(simData.coefficients)) {
        simData.coefficients.forEach((coeff: SimulatorCoefficient) => {
          if (coeff.target === col && coeff.driver !== col) {
            const driverSliderVal = sliderValues[coeff.driver] || 0;
            inducedChangePct += driverSliderVal * coeff.elasticity;
          }
        });
      }

      const totalPctChange = directChangePct + inducedChangePct;
      const simulatedVal = baseline * (1 + totalPctChange / 100);
      const absDiff = simulatedVal - baseline;

      return {
        column: col,
        baseline: Number(baseline.toFixed(2)),
        simulated: Number(simulatedVal.toFixed(2)),
        directPct: directChangePct,
        inducedPct: Number(inducedChangePct.toFixed(1)),
        totalPct: Number(totalPctChange.toFixed(1)),
        absDiff: Number(absDiff.toFixed(2)),
      };
    });
  };

  const simulatedMetrics = getSimulatedMetrics();

  // Prepare data for Recharts Comparison Chart
  const chartData = simulatedMetrics.map((m) => ({
    name: m.column.length > 15 ? m.column.substring(0, 13) + '..' : m.column,
    fullName: m.column,
    Mevcut: m.baseline,
    Simüle: m.simulated,
    Değişim: m.totalPct,
  }));

  if (numericCols.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        Bu veri setinde simüle edilebilecek sayısal sütun bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-800/40 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start space-x-4">
          <div className="p-3.5 bg-purple-500/15 border border-purple-500/30 rounded-2xl text-purple-400 shadow-inner">
            <Zap className="w-8 h-8 animate-pulse text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-100">
                🔮 What-If (Ya Şöyle Olursa?) Senaryo Simülatörü
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-300" /> Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Değişkenleri %-50 ile %+50 arasında kaydırarak iş sonuçlarındaki anlık etkileri Recharts grafikleriyle canlı simüle edin.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            type="button"
            onClick={fetchSimulationCoefficients}
            disabled={isLoading}
            className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>AI Matrisi Çıkarılıyor...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{simData ? 'AI Katsayılarını Yenile' : '🤖 AI Etki Matrisini Çıkar'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResetSliders}
            title="Tüm Slider'ları Sıfırla"
            className="px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Sıfırla</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Gemini AI Insight Summary */}
      {simData?.insightSummary && (
        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-purple-200 text-xs sm:text-sm flex items-start space-x-3 shadow-md">
          <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-purple-300 font-bold block mb-1">Gemini Senaryo Değerlendirmesi:</strong>
            <p className="leading-relaxed">{simData.insightSummary}</p>
          </div>
        </div>
      )}

      {/* Sliders Grid Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-100">
              Dinamik Değişken Kaydırıcıları (%-50 ile %+50)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {numericCols.length} Sayısal Değişken Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {numericCols.map((col) => {
            const currentVal = sliderValues[col] || 0;
            const stat = numericStats.find((s) => s.columnName === col);

            return (
              <div
                key={col}
                className={`p-4 rounded-xl border transition-all ${
                  currentVal !== 0
                    ? 'bg-slate-950/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950/40 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[170px]" title={col}>
                    {col}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-extrabold font-mono ${
                      currentVal > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : currentVal < 0
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {currentVal > 0 ? `+${currentVal}%` : `${currentVal}%`}
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={currentVal}
                  onChange={(e) => handleSliderChange(col, Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                />

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>-50%</span>
                  <span>0%</span>
                  <span>+50%</span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-[10px]">
                  <span className="text-slate-500">Ort: {stat?.mean ? stat.mean.toFixed(1) : '-'}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleSliderChange(col, -25)}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    >
                      -25%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSliderChange(col, 0)}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSliderChange(col, 25)}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    >
                      +25%
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulated Metrics Cards & Live Recharts Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Recharts Chart */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Anlık Simülasyon Karşılaştırması (Mevcut vs Simüle)
            </h3>
            <span className="text-xs text-slate-400">Canlı Recharts Güncellemesi</span>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
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
                <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                <Bar dataKey="Mevcut" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Simüle" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Detailed Metric Impacts */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Metrik Bazlı Değişim Detayları
          </h3>

          <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {simulatedMetrics.map((m) => {
              const isPositive = m.totalPct > 0;
              const isNegative = m.totalPct < 0;

              return (
                <div
                  key={m.column}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-200 block truncate max-w-[130px]">
                      {m.column}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      <span className="line-through text-slate-500 mr-1">{m.baseline}</span>
                      <span className="font-semibold text-slate-200">{m.simulated}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${
                        isPositive
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : isNegative
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isPositive && <TrendingUp className="w-3 h-3 mr-1" />}
                      {isNegative && <TrendingDown className="w-3 h-3 mr-1" />}
                      {m.totalPct > 0 ? `+${m.totalPct}%` : `${m.totalPct}%`}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      {m.absDiff > 0 ? `+${m.absDiff}` : m.absDiff}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Elasticity relationships extracted by Gemini */}
          {simData?.coefficients && simData.coefficients.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80">
              <h4 className="text-xs font-bold text-purple-300 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Gemini Tarafından Çıkarılan İlişkiler
              </h4>
              <div className="space-y-1.5 text-[11px] text-slate-400 max-h-[120px] overflow-y-auto pr-1">
                {simData.coefficients.map((c, i) => (
                  <div key={i} className="p-2 rounded bg-slate-950/60 border border-slate-800/60">
                    <span className="text-indigo-300 font-semibold">{c.driver}</span> ➔{' '}
                    <span className="text-teal-300 font-semibold">{c.target}</span>{' '}
                    <span className="text-slate-400 font-mono">(Katsayı: {c.elasticity})</span>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
