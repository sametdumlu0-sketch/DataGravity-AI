import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import { parseCSVString, parseExcelBuffer, parseJSONString } from '../utils/dataAnalyzer';
import { DatasetAnalysisContext } from '../types/data';

interface FileUploadSectionProps {
  onDatasetLoaded: (context: DatasetAnalysisContext) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  onDatasetLoaded,
  isLoading,
  setIsLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const fileName = file.name;
      const lowerName = fileName.toLowerCase();

      if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt')) {
        const text = await file.text();
        const context = parseCSVString(text, fileName);
        onDatasetLoaded(context);
      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const context = parseExcelBuffer(buffer, fileName);
        onDatasetLoaded(context);
      } else if (lowerName.endsWith('.json')) {
        const text = await file.text();
        const context = parseJSONString(text, fileName);
        onDatasetLoaded(context);
      } else {
        throw new Error('Desteklenmeyen dosya formatı. Lütfen .csv, .xlsx, .xls veya .json dosyası yükleyin.');
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage(err.message || 'Dosya okuma sırasında hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSampleClick = (sampleId: string) => {
    setErrorMessage(null);
    setIsLoading(true);
    setTimeout(() => {
      try {
        const sample = SAMPLE_DATASETS.find((s) => s.id === sampleId);
        if (sample) {
          const context = parseCSVString(sample.csvData, `${sample.id}_sample.csv`);
          onDatasetLoaded(context);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Örnek veri seti yüklenemedi.');
      } finally {
        setIsLoading(false);
      }
    }, 150);
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>Python GeminiDataAnalyst Motoru ile Çalışır</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
          Verilerinizi Yükleyin, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-teal-300 bg-clip-text text-transparent">
            Anında Yapay Zeka Raporu Alın
          </span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Gemini 3.6 Flash ile otomatik veri kalitesi kontrolü, kritik trendler, stratejik karar önerileri ve makine öğrenmesi modelleri keşfedin.
        </p>
      </div>

      {/* Main Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 border-2 border-dashed ${
          dragOver
            ? 'border-indigo-500 bg-indigo-500/10 shadow-2xl shadow-indigo-500/10 scale-[1.01]'
            : 'border-slate-700 bg-slate-900/60 hover:border-indigo-500/60 hover:bg-slate-800/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileProcess(e.target.files[0]);
            }
          }}
          accept=".csv,.xlsx,.xls,.json,.txt"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-indigo-600/15 border border-indigo-500/30 rounded-2xl text-indigo-400 shadow-inner">
            <Upload className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-200">
              Dosyanızı buraya sürükleyin veya tıklayarak seçin
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Desteklenen formatlar: <span className="text-indigo-300 font-mono">.CSV, .XLSX, .XLS, .JSON</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Otomatik Veri Tipi Tespiti
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> İstatistiksel Özet (`describe()`)
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> %100 Güvenli Sunucu İşleme
            </span>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-indigo-300">Veri seti inceleniyor ve özet istatistikler hesaplanıyor...</p>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Pre-loaded Sample Datasets Gallery */}
      <div className="mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-200">
              Veya Örnek İş Veri Setlerinden Birini Deneyin
            </h2>
          </div>
          <span className="text-xs text-slate-400">1 Tıkla Hazır Analiz</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE_DATASETS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => handleSampleClick(sample.id)}
              className="group cursor-pointer p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-indigo-400 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                    {sample.category}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
                </div>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition">
                  {sample.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>CSV Formatı</span>
                <span className="font-semibold text-slate-300 group-hover:text-indigo-400">
                  Analiz Et →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
