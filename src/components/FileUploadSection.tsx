import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Sparkles,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Layers,
  Languages,
  Zap,
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import {
  parseCSVString,
  parseCSVBuffer,
  getExcelSheetNames,
  parseExcelBuffer,
  parseJSONString,
} from '../utils/dataAnalyzer';
import { DatasetAnalysisContext, ExcelFileData } from '../types/data';
import { SmartAiLoader } from './SmartAiLoader';


interface FileUploadSectionProps {
  onDatasetLoaded: (context: DatasetAnalysisContext) => void;
  onDatasetsLoaded?: (contexts: DatasetAnalysisContext[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  engineMode: 'gemini' | 'python';
  setEngineMode: (mode: 'gemini' | 'python') => void;
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  onDatasetLoaded,
  onDatasetsLoaded,
  isLoading,
  setIsLoading,
  engineMode,
  setEngineMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Multi-sheet Excel state
  const [excelData, setExcelData] = useState<ExcelFileData | null>(null);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');

  const parseFileToContext = async (file: File): Promise<DatasetAnalysisContext> => {
    const fileName = file.name;
    const lowerName = fileName.toLowerCase();

    if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt')) {
      const buffer = await file.arrayBuffer();
      return parseCSVBuffer(buffer, fileName);
    } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      return parseExcelBuffer(buffer, fileName);
    } else if (lowerName.endsWith('.json')) {
      const text = await file.text();
      return parseJSONString(text, fileName);
    }
    throw new Error(`Desteklenmeyen dosya: ${fileName}`);
  };

  const handleMultipleFilesProcess = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const contexts: DatasetAnalysisContext[] = [];
      for (const f of files) {
        try {
          const ctx = await parseFileToContext(f);
          contexts.push(ctx);
        } catch (e) {
          console.warn('Failed to parse file:', f.name);
        }
      }

      if (contexts.length > 0) {
        if (onDatasetsLoaded) {
          onDatasetsLoaded(contexts);
        }
        onDatasetLoaded(contexts[0]);
      } else {
        throw new Error('Seçilen dosyalar işlenemedi.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Çoklu dosya yükleme hatası.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    setExcelData(null);
    setIsLoading(true);

    try {
      const fileName = file.name;
      const lowerName = fileName.toLowerCase();

      if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt')) {
        const buffer = await file.arrayBuffer();
        const context = parseCSVBuffer(buffer, fileName);
        onDatasetLoaded(context);
      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const sheetNames = getExcelSheetNames(buffer);

        if (sheetNames.length > 1) {
          // Store Excel file for sheet selection UI
          setExcelData({ filename: fileName, buffer, sheetNames });
          setSelectedSheetName(sheetNames[0]);
          setIsLoading(false);
          return;
        }

        // Single sheet Excel fallback
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

  const handleConfirmSheetSelection = () => {
    if (!excelData || !selectedSheetName) return;

    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      try {
        const context = parseExcelBuffer(excelData.buffer, excelData.filename, selectedSheetName);
        setExcelData(null);
        onDatasetLoaded(context);
      } catch (err: any) {
        setErrorMessage(err.message || 'Excel sayfası okunamadı.');
      } finally {
        setIsLoading(false);
      }
    }, 100);
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
    setExcelData(null);
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
      <div className="text-center max-w-4xl mx-auto mb-10 space-y-5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-teal-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-inner">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Gemini 3.6 Flash Enterprise Data Intelligence Engine</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
          Saniyeler İçinde <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-teal-300 bg-clip-text text-transparent">
            Verinizden Değer Üretin
          </span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Karmaşık veri kümelerinizi yükleyin; Yönetici Özetleri, PowerPoint Sunumları (.pptx), What-If Simülasyonları, Kök Neden Analizi ve Multi-Agent AI Konseyi raporlarını anında oluşturun.
        </p>

        {/* Live Feature Badges */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {[
            '🎙️ 45s AI Podcast Özeti',
            '📊 PowerPoint (.pptx) İndirme',
            '🔮 What-If Senaryo Simülatörü',
            '🤖 Multi-Agent AI Veri Konseyi',
            '🕵️‍♂️ Kök Neden Analisti',
            '💬 Doğal Dille Veri Düzenleyici',
            '🧪 Sentetik Veri Çoğaltıcı',
          ].map((badge) => (
            <span
              key={badge}
              className="px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 text-slate-300 text-[11px] font-medium shadow-sm transition hover:border-indigo-500/40"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Dual Engine Selection Cards */}
      <div className="mb-8 max-w-4xl mx-auto space-y-3">
        <div className="text-center">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            1. Analiz Motorunuzu Seçin
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Gemini AI Engine */}
          <div
            onClick={() => setEngineMode('gemini')}
            className={`cursor-pointer rounded-2xl p-5 transition-all duration-300 border flex flex-col justify-between space-y-3 relative overflow-hidden ${
              engineMode === 'gemini'
                ? 'bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/50'
                : 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/90'
            }`}
          >
            {engineMode === 'gemini' && (
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
                Aktif Seçim
              </span>
            )}
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-500/15 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                  🤖 Gemini 2.0 AI Motoru
                </h3>
                <span className="text-xs text-indigo-300 font-semibold">Büyük Dil Modeli Altyapısı</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zengin Türkçe Yönetici Raporları, 45s Sesli Podcast Özeti, Stratejik İş Önerileri ve Multi-Agent AI Konseyi analizi sunar.
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-indigo-400 font-medium">Doğal Dil & Akıllı Raporlama</span>
              <span className="text-slate-500">Gemini Flash</span>
            </div>
          </div>

          {/* Card 2: Python Data Science Engine */}
          <div
            onClick={() => setEngineMode('python')}
            className={`cursor-pointer rounded-2xl p-5 transition-all duration-300 border flex flex-col justify-between space-y-3 relative overflow-hidden ${
              engineMode === 'python'
                ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/50'
                : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900/90'
            }`}
          >
            {engineMode === 'python' && (
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
                Aktif Seçim
              </span>
            )}
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                  ⚡ Python Data Science Motoru
                </h3>
                <span className="text-xs text-emerald-300 font-semibold">Pandas, SciPy & Scikit-Learn</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lokal anomali tespiti (IsolationForest), K-Means kümeleme, korelasyon matrisi ve %100 istatistiksel kesinlik. Kota sınırı yoktur.
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-medium">Sınırsız & Sıfır API Kotası</span>
              <span className="text-slate-500">Lokal ML</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Sheet Excel Selector Card */}
      {excelData && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-indigo-500/40 shadow-2xl space-y-5 animate-fadeIn">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Çok Sayfalı Excel Dosyası Algılandı</span>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono">
                  {excelData.sheetNames.length} Sayfa
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                <span className="text-indigo-300 font-medium">{excelData.filename}</span> dosyasında birden fazla çalışma sayfası bulunmaktadır. Lütfen analiz etmek istediğiniz sayfayı seçin.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-2">
            <div className="sm:col-span-2">
              <label htmlFor="excel-sheet-select" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Analiz Edilecek Çalışma Sayfası (Sheet):</span>
              </label>
              <select
                id="excel-sheet-select"
                value={selectedSheetName}
                onChange={(e) => setSelectedSheetName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-indigo-500/40 text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              >
                {excelData.sheetNames.map((name) => (
                  <option key={name} value={name} className="bg-slate-900 text-slate-100">
                    📄 {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3 pt-4 sm:pt-5">
              <button
                type="button"
                onClick={handleConfirmSheetSelection}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition duration-200 flex items-center justify-center space-x-2"
              >
                <span>Sayfayı Analiz Et</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setExcelData(null)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

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
            : 'border-white/10 bg-slate-900/50 backdrop-blur-md hover:border-indigo-500/60 hover:bg-slate-900/70 shadow-2xl'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const filesArray = Array.from(e.target.files);
              handleMultipleFilesProcess(filesArray);
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300">
              <Languages className="w-3.5 h-3.5 text-indigo-400" /> Otomatik Türkçe Kodlama Tespiti (ISO-8859-9 / UTF-8)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-teal-400" /> Çok Sayfalı Excel Desteği
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Akıllı Gemini API Token Özetleyici
            </span>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md rounded-2xl flex items-center justify-center p-6 z-20">
            <SmartAiLoader
              title="Veri Kümesi İşleniyor & Analiz Ediliyor"
              subtitle="Gemini 3.6 Flash veri kümenizin istatistiklerini ve şemasını çözümlüyor"
            />
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
