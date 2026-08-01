import React, { useState } from 'react';
import {
  SearchCode,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  GitCommit,
  GitBranch,
  ShieldAlert,
  Info,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { DatasetAnalysisContext } from '../types/data';

interface CauseFactor {
  factor: string;
  impactPercentage: number;
  description: string;
}

interface AnomalyItem {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  causes: CauseFactor[];
}

interface RootCauseAnalystViewProps {
  context: DatasetAnalysisContext;
}

export const RootCauseAnalystView: React.FC<RootCauseAnalystViewProps> = ({ context }) => {
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [overallSummary, setOverallSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRootCauseAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/root-cause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataContext: context.contextMarkdown,
          numericStats: context.numericStats,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Kök neden analizi gerçekleştirilemedi.');
      }

      if (Array.isArray(data.anomalies) && data.anomalies.length > 0) {
        setAnomalies(data.anomalies);
        setOverallSummary(data.overallRootCauseSummary || null);
      } else {
        throw new Error('Geçerli anomali ve kök neden verisi alınamadı.');
      }
    } catch (err: any) {
      console.error('Root Cause Analysis error:', err);
      setError(err.message || 'Gemini kök neden analizi sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityBadge = (severity: 'high' | 'medium' | 'low') => {
    if (severity === 'high') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Yüksek Anomali
        </span>
      );
    }
    if (severity === 'medium') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Orta Derece Sapma
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-1">
        <Info className="w-3.5 h-3.5 text-blue-400" /> Hafif Aykırı Değer
      </span>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-rose-950/30 to-slate-950 border border-rose-800/30 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-400 shadow-inner">
            <SearchCode className="w-7 h-7 animate-pulse text-rose-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-extrabold text-slate-100">
                🕵️‍♂️ Kök Neden (Root Cause) & Anomali Analisti
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Veri setindeki aykırı değerleri (Outlier) otomatik tespit edin ve kök neden faktörlerini % etki oranlarıyla Etki Ağacı (Impact Tree) üzerinde görün.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchRootCauseAnalysis}
          disabled={isLoading}
          className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Anomaliler Analiz Ediliyor...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{anomalies.length > 0 ? 'Analizi Yenile' : '✨ Kök Neden & Anomali Analizini Çalıştır'}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overall Root Cause Summary */}
      {overallSummary && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-200 flex items-start space-x-3 shadow-md">
          <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-rose-300 font-bold block mb-1">Genel Kök Neden Özeti:</strong>
            <p className="leading-relaxed">{overallSummary}</p>
          </div>
        </div>
      )}

      {/* Anomalies List & Impact Tree Visualizations */}
      {anomalies.length > 0 && (
        <div className="space-y-6">
          {anomalies.map((anom, aIdx) => (
            <div
              key={anom.id || aIdx}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-inner space-y-5"
            >
              {/* Anomaly Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <h4 className="text-sm font-bold text-slate-100">{anom.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{anom.description}</p>
                </div>
                <div>{getSeverityBadge(anom.severity)}</div>
              </div>

              {/* Etki Ağacı (Impact Tree) Header */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pt-1">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <GitBranch className="w-4 h-4" /> Kök Neden Faktörleri Etki Ağacı (Impact Tree)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">% Etki Dağılımı</span>
              </div>

              {/* Impact Tree Nodes & Progress Bars */}
              <div className="space-y-4 pl-2 sm:pl-4 border-l-2 border-slate-800">
                {anom.causes.map((cause, cIdx) => {
                  const impact = cause.impactPercentage || 0;
                  const isHighImpact = impact >= 50;

                  return (
                    <div key={cIdx} className="relative space-y-2 group">
                      {/* Tree Branch Node Circle */}
                      <div className="absolute -left-[21px] sm:-left-[29px] top-1.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-indigo-500 group-hover:border-rose-400 transition" />

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200 flex items-center gap-2">
                          <GitCommit className="w-3.5 h-3.5 text-slate-500" />
                          {cause.factor}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-mono font-extrabold ${
                            isHighImpact
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          %{impact} Etki
                        </span>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isHighImpact
                              ? 'bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-500'
                              : 'bg-gradient-to-r from-indigo-600 to-teal-500'
                          }`}
                          style={{ width: `${impact}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-slate-400 pl-5 leading-relaxed">
                        {cause.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
