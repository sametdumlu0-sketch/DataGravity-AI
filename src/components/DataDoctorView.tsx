import React, { useState } from 'react';
import {
  Stethoscope,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Activity,
  FileCheck,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { DatasetAnalysisContext } from '../types/data';

interface AuditLog {
  id: number;
  type: 'spelling_fix' | 'missing_fill' | 'format_normalize' | 'outlier_fix';
  column: string;
  originalValue: string;
  correctedValue: string;
  reason: string;
}

interface DataDoctorResponse {
  healthScore: number;
  summary: string;
  auditLogs: AuditLog[];
  cleanedRows: Record<string, any>[];
}

interface DataDoctorViewProps {
  context: DatasetAnalysisContext;
  currentRows: Record<string, any>[];
  onApplyCleanedData: (cleanedRows: Record<string, any>[], summary: string) => void;
}

export const DataDoctorView: React.FC<DataDoctorViewProps> = ({
  context,
  currentRows,
  onApplyCleanedData,
}) => {
  const [healthResult, setHealthResult] = useState<DataDoctorResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState<boolean>(false);

  const runDataDoctor = async () => {
    setIsLoading(true);
    setError(null);
    setIsApplied(false);

    try {
      const response = await fetch('/api/data-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataContext: context.contextMarkdown,
          sampleRows: currentRows.slice(0, 15),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Veri doktoru analizi gerçekleştirilemedi.');
      }

      if (typeof data.healthScore === 'number') {
        setHealthResult(data);
      } else {
        throw new Error('Geçerli sağlık skoru ve teşhis verisi alınamadı.');
      }
    } catch (err: any) {
      console.error('Data Doctor Error:', err);
      setError(err.message || 'Veri İyileştirici çalıştırılırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!healthResult || !healthResult.cleanedRows) return;

    // Merge cleaned sample rows into full table rows while preserving un-cleaned rows
    const newFullRows = [...currentRows];
    healthResult.cleanedRows.forEach((cleanedRow, idx) => {
      if (idx < newFullRows.length) {
        newFullRows[idx] = { ...newFullRows[idx], ...cleanedRow };
      }
    });

    onApplyCleanedData(newFullRows, healthResult.summary);
    setIsApplied(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'from-emerald-500 to-teal-400 text-emerald-400 border-emerald-500/40';
    if (score >= 65) return 'from-amber-500 to-yellow-400 text-amber-400 border-amber-500/40';
    return 'from-rose-500 to-pink-500 text-rose-400 border-rose-500/40';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-teal-950/30 to-slate-950 border border-teal-800/40 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-teal-500/15 border border-teal-500/30 rounded-2xl text-teal-300 shadow-inner">
            <Stethoscope className="w-7 h-7 animate-pulse text-teal-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-extrabold text-slate-100">
                🩺 Autonomous Data Doctor (Sihirli Veri İyileştirici)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
                Gemini 3.6 Flash Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Verinizdeki format bozukluklarını, imla/yazım hatalarını (Örn: "İstnbul" → "İstanbul") ve mantıksal düzensizlikleri otonom teşhis edip düzeltir.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={runDataDoctor}
          disabled={isLoading}
          className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-teal-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Veri Teşhis Ediliyor...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{healthResult ? 'Teşhisi Yenile' : '✨ Veri Sağlık Teşhisini Çalıştır'}</span>
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

      {/* Health Score Gauge & Diagnosis Summary */}
      {healthResult && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-inner space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Gauge Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-400" /> Veri Sağlık Skoru
                </span>
                <span className="font-extrabold font-mono text-sm text-slate-100">
                  %{healthResult.healthScore} / 100
                </span>
              </div>

              <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${getScoreColor(
                    healthResult.healthScore
                  )}`}
                  style={{ width: `${healthResult.healthScore}%` }}
                />
              </div>

              <span className="text-[10px] text-slate-500 block">
                {healthResult.healthScore >= 85
                  ? '🟢 Mükemmel Kalitede Veri Seti'
                  : healthResult.healthScore >= 65
                  ? '🟡 Orta Derece İyileştirme Gerekebilir'
                  : '🔴 Yüksek Oranda Format/İmla Düzeltmesi Gerekli'}
              </span>
            </div>

            {/* Diagnosis Summary Text */}
            <div className="md:col-span-2 space-y-2 border-l border-slate-800 pl-0 md:pl-6">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Teşhis & İyileştirme Özeti
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                {healthResult.summary}
              </p>
            </div>
          </div>

          {/* Action Button: Apply Cleaned Data */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80">
            <div className="text-xs text-slate-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Düzeltmeler orijinal veri yapısı korunarak uygulanır.</span>
            </div>

            <button
              type="button"
              onClick={handleApply}
              disabled={isApplied}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition flex items-center space-x-2 ${
                isApplied
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
              }`}
            >
              {isApplied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>✅ İyileştirilmiş Veri Canlıda!</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>✨ Veriyi Otomatik İyileştir ve Canlıya Al</span>
                </>
              )}
            </button>
          </div>

          {/* Audit Logs Table */}
          {healthResult.auditLogs && healthResult.auditLogs.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-400" />
                Yapılan Değişikliklerin Denetim Kaydı (Audit Log)
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] font-mono uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Tür</th>
                      <th className="py-2.5 px-3">Sütun</th>
                      <th className="py-2.5 px-3">Orijinal Değer</th>
                      <th className="py-2.5 px-3">Düzeltilmiş Değer</th>
                      <th className="py-2.5 px-3">Açıklama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans text-[11px]">
                    {healthResult.auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/60">
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[10px] font-semibold">
                            {log.type === 'spelling_fix'
                              ? 'İmla Düzeltmesi'
                              : log.type === 'format_normalize'
                              ? 'Format Standardizasyonu'
                              : 'Eksik Veri Tamamlama'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-indigo-300">
                          {log.column}
                        </td>
                        <td className="py-2 px-3 text-rose-300 font-mono line-through">
                          {log.originalValue}
                        </td>
                        <td className="py-2 px-3 text-emerald-300 font-mono font-bold flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          {log.correctedValue}
                        </td>
                        <td className="py-2 px-3 text-slate-400">{log.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
