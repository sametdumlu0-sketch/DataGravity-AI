import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Code2,
  Terminal,
  Database,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Play,
  Layers,
  Wand2,
  RotateCcw,
  Undo2,
  CheckCircle2,
  AlertCircle,
  Filter,
  FlaskConical,
  Plus,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { DatasetAnalysisContext } from '../types/data';
import { DataDoctorView } from './DataDoctorView';
import { MlModelApiDeployer } from './MlModelApiDeployer';




interface DataTableStatsViewProps {
  context: DatasetAnalysisContext;
}

export const DataTableStatsView: React.FC<DataTableStatsViewProps> = ({ context }) => {
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'describe' | 'codegen' | 'synthetic'>('preview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Code Generation State
  const [pythonTask, setPythonTask] = useState<string>(
    'Veri temizleme, eksik veri doldurma, Seaborn korelasyon görselleştirmesi ve Scikit-learn ML modeli eğitimi'
  );
  const [pythonCodeOutput, setPythonCodeOutput] = useState<string | null>(null);
  const [isPythonLoading, setIsPythonLoading] = useState<boolean>(false);
  const [pythonError, setPythonError] = useState<string | null>(null);

  const [sqlQueryInput, setSqlQueryInput] = useState<string>(
    "Satışları 1000'den büyük olan kayıtları getir ve kâr marjına göre sırala"
  );
  const [sqlCodeOutput, setSqlCodeOutput] = useState<string | null>(null);
  const [isSqlLoading, setIsSqlLoading] = useState<boolean>(false);
  const [sqlError, setSqlError] = useState<string | null>(null);

  const [copiedPython, setCopiedPython] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Natural Language Data Transformer State
  const [dataRows, setDataRows] = useState<Record<string, any>[]>(context.allData);
  const [transformHistory, setTransformHistory] = useState<Record<string, any>[][]>([]);
  const [transformCommand, setTransformCommand] = useState<string>('');
  const [isTransforming, setIsTransforming] = useState<boolean>(false);
  const [transformSuccess, setTransformSuccess] = useState<string | null>(null);
  const [transformError, setTransformError] = useState<string | null>(null);
  const [lastJsCode, setLastJsCode] = useState<string | null>(null);

  useEffect(() => {
    setDataRows(context.allData);
    setTransformHistory([]);
    setTransformSuccess(null);
    setTransformError(null);
    setLastJsCode(null);
  }, [context.filename, context.allData]);

  const allColumns = context.columns.map((c) => c.name);

  // Natural Language Data Transformation API Call
  const handleTransformData = async (presetCmd?: string) => {
    const cmd = presetCmd || transformCommand;
    if (!cmd.trim()) return;

    setIsTransforming(true);
    setTransformError(null);
    setTransformSuccess(null);

    try {
      const response = await fetch('/api/transform-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmd,
          dataContext: context.contextMarkdown,
          sampleRows: dataRows.slice(0, 5),
          columns: context.columns,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Veri dönüştürme işlemi başarısız.');
      }

      if (!data.jsFunctionCode) {
        throw new Error('Gemini geçerli bir dönüştürme fonksiyonu üretemedi.');
      }

      setLastJsCode(data.jsFunctionCode);

      // Execute JavaScript code safely on current dataRows
      const transformFn = new Function('rows', data.jsFunctionCode);
      const transformed = transformFn(dataRows);

      if (!Array.isArray(transformed)) {
        throw new Error('Dönüştürme kodunun çıktısı geçerli bir satır dizisi olmadı.');
      }

      // Save history for Undo
      setTransformHistory((prev) => [...prev, dataRows]);

      const prevCount = dataRows.length;
      const newCount = transformed.length;
      const countDiff = newCount - prevCount;

      setDataRows(transformed);
      setCurrentPage(1);

      let msg = data.explanation || 'Veri başarıyla dönüştürüldü.';
      if (countDiff !== 0) {
        msg += ` (${prevCount} satırdan ${newCount} satıra güncellendi, fark: ${countDiff > 0 ? '+' : ''}${countDiff})`;
      } else {
        msg += ` (${newCount} satır başarıyla güncellendi)`;
      }

      setTransformSuccess(msg);
    } catch (err: any) {
      console.error('Transform data error:', err);
      setTransformError(err.message || 'Veri dönüştürme işlemi gerçekleştirilirken bir sorun yaşandı.');
    } finally {
      setIsTransforming(false);
    }
  };

  const handleUndoTransform = () => {
    if (transformHistory.length === 0) return;
    const previous = transformHistory[transformHistory.length - 1];
    setDataRows(previous);
    setTransformHistory((prev) => prev.slice(0, -1));
    setTransformSuccess('Son yapılan veri dönüştürme işlemi geri alındı.');
  };

  const handleResetData = () => {
    setDataRows(context.allData);
    setTransformHistory([]);
    setTransformSuccess('Veriler orijinal haline başarıyla sıfırlandı.');
    setTransformError(null);
    setLastJsCode(null);
  };

  // Synthetic Data Generator State & Handlers
  const [syntheticTargetCount, setSyntheticTargetCount] = useState<number>(100);
  const [isSyntheticLoading, setIsSyntheticLoading] = useState<boolean>(false);
  const [syntheticRows, setSyntheticRows] = useState<Record<string, any>[] | null>(null);
  const [syntheticSuccessMsg, setSyntheticSuccessMsg] = useState<string | null>(null);
  const [syntheticErrorMsg, setSyntheticErrorMsg] = useState<string | null>(null);

  const handleGenerateSynthetic = async () => {
    setIsSyntheticLoading(true);
    setSyntheticErrorMsg(null);
    setSyntheticSuccessMsg(null);
    setSyntheticRows(null);

    try {
      const response = await fetch('/api/generate-synthetic-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataContext: context.contextMarkdown,
          count: syntheticTargetCount,
          columns: context.columns,
          sampleRows: dataRows.slice(0, 5),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Sentetik veri üretilemedi.');
      }

      if (Array.isArray(data.syntheticRows) && data.syntheticRows.length > 0) {
        setSyntheticRows(data.syntheticRows);
        setSyntheticSuccessMsg(`✨ ${data.syntheticRows.length} adet gerçekçi sentetik kayıt başarıyla üretildi.`);
      } else {
        throw new Error('Geçerli sentetik satırlar üretilemedi.');
      }
    } catch (err: any) {
      console.error('Synthetic data generation error:', err);
      setSyntheticErrorMsg(err.message || 'Sentetik veri üretilirken bir hata oluştu.');
    } finally {
      setIsSyntheticLoading(false);
    }
  };

  const handleAppendSyntheticToTable = () => {
    if (!syntheticRows || syntheticRows.length === 0) return;
    setTransformHistory((prev) => [...prev, dataRows]);
    setDataRows((prev) => [...prev, ...syntheticRows]);
    setTransformSuccess(`➕ ${syntheticRows.length} adet sentetik kayıt mevcut tabloya eklendi.`);
    setActiveSubTab('preview');
  };

  const handleDownloadSyntheticCSV = () => {
    if (!syntheticRows || syntheticRows.length === 0) return;
    const keys = Object.keys(syntheticRows[0]);
    const csvRows = [keys.join(',')];
    syntheticRows.forEach((row) => {
      const values = keys.map((key) => {
        const val = row[key] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentetik_veri_${syntheticRows.length}_satir.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  // Search & Filter Data
  const filteredData = dataRows.filter((row) => {

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return allColumns.some((col) => {
      const val = row[col];
      return val !== null && val !== undefined && String(val).toLowerCase().includes(term);
    });
  });

  // Sort Data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    const valA = a[sortColumn];
    const valB = b[sortColumn];

    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    let comparison = 0;
    if (typeof valA === 'number' && typeof valB === 'number') {
      comparison = valA - valB;
    } else {
      comparison = String(valA).localeCompare(String(valB));
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (colName: string) => {
    if (sortColumn === colName) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(colName);
      setSortDirection('asc');
    }
  };

  // Generate Python Code API call
  const handleGeneratePython = async () => {
    setIsPythonLoading(true);
    setPythonError(null);
    setPythonCodeOutput(null);

    try {
      const response = await fetch('/api/generate-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataContext: context.contextMarkdown,
          taskDescription: pythonTask,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Python kodu oluşturulamadı.');
      }

      setPythonCodeOutput(data.code);
    } catch (err: any) {
      setPythonError(err.message || 'Python kodu üretilirken bir hata oluştu.');
    } finally {
      setIsPythonLoading(false);
    }
  };

  // Generate SQL Query API call
  const handleGenerateSql = async (overrideQuery?: string) => {
    const targetQuery = overrideQuery || sqlQueryInput;
    if (!targetQuery.trim()) return;

    setIsSqlLoading(true);
    setSqlError(null);
    setSqlCodeOutput(null);

    try {
      const response = await fetch('/api/generate-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataContext: context.contextMarkdown,
          query: targetQuery,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'SQL sorgusu üretilemedi.');
      }

      setSqlCodeOutput(data.sql);
    } catch (err: any) {
      setSqlError(err.message || 'SQL sorgusu üretilirken bir hata oluştu.');
    } finally {
      setIsSqlLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'python' | 'sql') => {
    navigator.clipboard.writeText(text);
    if (type === 'python') {
      setCopiedPython(true);
      setTimeout(() => setCopiedPython(false), 2000);
    } else {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Autonomous Data Doctor (Sihirli Veri İyileştirici) */}
      <DataDoctorView
        context={context}
        currentRows={dataRows}
        onApplyCleanedData={(cleanedRows, summary) => {
          setTransformHistory((prev) => [...prev, dataRows]);
          setDataRows(cleanedRows);
          setTransformSuccess(`🩺 Veri Doktoru Düzeltmesi Uygulandı: ${summary}`);
        }}
      />

      {/* Sub-tab Navigation */}

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('preview')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            📋 Veri Tablosu ({context.rowCount} Kayıt)
          </button>
          <button
            onClick={() => setActiveSubTab('describe')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'describe'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            📊 İstatistik Özet (`describe()`)
          </button>
          <button
            onClick={() => setActiveSubTab('codegen')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSubTab === 'codegen'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-300" />
            <span>⚡ AI Python & SQL Üretici</span>
          </button>

          <button
            onClick={() => setActiveSubTab('synthetic')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSubTab === 'synthetic'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-purple-300" />
            <span>🧪 Sentetik Veri Çoğaltıcı</span>
          </button>
        </div>


        {activeSubTab === 'preview' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tabloda ara..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* SubTab 1: Interactive Data Table */}
      {activeSubTab === 'preview' && (
        <div className="space-y-4">
          {/* Natural Language Data Transformer Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-500/15 border border-indigo-500/30 rounded-xl text-indigo-400">
                  <Wand2 className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    💬 Doğal Dille Veri Düzenleyici
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                      Gemini 3.6 Flash
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tablo verilerini doğal dilde komut vererek anında filtreleyin, temizleyin veya dönüştürün.
                  </p>
                </div>
              </div>

              {/* Undo & Reset Controls */}
              <div className="flex items-center space-x-2">
                {transformHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUndoTransform}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center space-x-1.5"
                    title="Son Dönüştürmeyi Geri Al"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Geri Al ({transformHistory.length})</span>
                  </button>
                )}

                {dataRows.length !== context.allData.length && (
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center space-x-1.5"
                    title="Orijinal Veriye Dön"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Veriyi Sıfırla</span>
                  </button>
                )}
              </div>
            </div>

            {/* Command Input & Submit */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={transformCommand}
                  onChange={(e) => setTransformCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTransformData();
                  }}
                  placeholder='Örn: "Fiyatı 500`den küçük satırları sil", "Bölge sütununu büyük harf yap"'
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <button
                type="button"
                onClick={() => handleTransformData()}
                disabled={isTransforming || !transformCommand.trim()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isTransforming ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uygulanıyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>✨ Komutu Çalıştır & Tabloyu Güncelle</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Filter className="w-3 h-3 text-indigo-400" /> Hızlı Komutlar:
              </span>
              {[
                "Fiyatı 500'den küçük satırları sil",
                "Eksik (null) değer içeren satırları temizle",
                "Metin sütunlarındaki değerleri büyük harfe çevir",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setTransformCommand(preset);
                    handleTransformData(preset);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-[11px] transition"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Success Banner */}
            {transformSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{transformSuccess}</span>
                </div>
                {lastJsCode && (
                  <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-400 truncate max-w-xs" title={lastJsCode}>
                    {lastJsCode}
                  </span>
                )}
              </div>
            )}

            {/* Error Banner */}
            {transformError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{transformError}</span>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md overflow-hidden flex flex-col">

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="py-3 px-4 w-12 text-center border-r border-slate-800">#</th>
                  {context.columns.map((col) => (
                    <th
                      key={col.name}
                      onClick={() => handleSort(col.name)}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-800/80 transition whitespace-nowrap border-r border-slate-800/60"
                    >
                      <div className="flex items-center justify-between space-x-1">
                        <span>{col.name}</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-800/40 transition font-sans text-xs"
                  >
                    <td className="py-2.5 px-4 text-center font-mono text-slate-500 text-[11px] border-r border-slate-800/60">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    {allColumns.map((col) => (
                      <td key={col} className="py-2.5 px-4 whitespace-nowrap border-r border-slate-800/40 text-slate-200">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-slate-600 italic">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}

                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={allColumns.length + 1} className="py-8 text-center text-slate-500 text-xs">
                      Aramanıza uygun veri kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <span>
              Toplam {sortedData.length} kayıttan {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, sortedData.length)} arası gösteriliyor
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-slate-300">
                Sayfa {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      )}


      {/* SubTab 2: Technical Summary describe() Tables */}
      {activeSubTab === 'describe' && (
        <div className="space-y-6">
          {/* Numeric Columns Stats Table */}
          {context.numericStats.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Sayısal Sütun İstatistik Özeti (`df.describe()`)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] font-mono uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Sütun Adı</th>
                      <th className="py-2.5 px-3">Sayı</th>
                      <th className="py-2.5 px-3">Ortalama (Mean)</th>
                      <th className="py-2.5 px-3">Std Sapma</th>
                      <th className="py-2.5 px-3">Min</th>
                      <th className="py-2.5 px-3">%25 (Q1)</th>
                      <th className="py-2.5 px-3">Medyan (%50)</th>
                      <th className="py-2.5 px-3">%75 (Q3)</th>
                      <th className="py-2.5 px-3">Max</th>
                      <th className="py-2.5 px-3">Eksik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {context.numericStats.map((stat) => (
                      <tr key={stat.columnName} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-semibold text-indigo-300">
                          {stat.columnName}
                        </td>
                        <td className="py-2.5 px-3">{stat.count}</td>
                        <td className="py-2.5 px-3 text-slate-100 font-bold">{stat.mean}</td>
                        <td className="py-2.5 px-3 text-slate-400">{stat.std}</td>
                        <td className="py-2.5 px-3 text-rose-300">{stat.min}</td>
                        <td className="py-2.5 px-3 text-slate-400">{stat.q25}</td>
                        <td className="py-2.5 px-3 text-emerald-300">{stat.median}</td>
                        <td className="py-2.5 px-3 text-slate-400">{stat.q75}</td>
                        <td className="py-2.5 px-3 text-blue-300">{stat.max}</td>
                        <td className="py-2.5 px-3">
                          {stat.nullCount > 0 ? (
                            <span className="text-amber-400">{stat.nullCount}</span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Categorical Columns Stats Table */}
          {context.categoricalStats.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                Kategorik Sütun Özeti
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] font-mono uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Sütun Adı</th>
                      <th className="py-2.5 px-3">Geçerli Sayı</th>
                      <th className="py-2.5 px-3">Benzersiz (Unique)</th>
                      <th className="py-2.5 px-3">En Sık Değer (Top)</th>
                      <th className="py-2.5 px-3">En Sık Frekans (Freq)</th>
                      <th className="py-2.5 px-3">Eksik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {context.categoricalStats.map((stat) => (
                      <tr key={stat.columnName} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-semibold text-teal-300">
                          {stat.columnName}
                        </td>
                        <td className="py-2.5 px-3">{stat.count}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-100">{stat.unique}</td>
                        <td className="py-2.5 px-3 text-amber-300">{stat.topValue}</td>
                        <td className="py-2.5 px-3 text-slate-400">{stat.topFreq}</td>
                        <td className="py-2.5 px-3">
                          {stat.nullCount > 0 ? (
                            <span className="text-amber-400">{stat.nullCount}</span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SubTab 3: AI Python & SQL Code Generator */}
      {activeSubTab === 'codegen' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Python Code Generator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">🐍 Python & Pandas Kod Üretici</h3>
                  <p className="text-xs text-slate-400">Gemini 3.6 Flash ile veri analizi ve ML kodu</p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <label className="block text-xs font-medium text-slate-300">
                  Analiz Görevi / Model Hedefi:
                </label>
                <textarea
                  rows={3}
                  value={pythonTask}
                  onChange={(e) => setPythonTask(e.target.value)}
                  placeholder="Örn: Veriyi Pandas ile temizle, Seaborn ile korelasyon çizdir ve Random Forest modeli eğit..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />

                <button
                  type="button"
                  onClick={handleGeneratePython}
                  disabled={isPythonLoading}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isPythonLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Python Kodu Üretiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-emerald-300" />
                      <span>🐍 Python Kodu Oluştur (`/api/generate-python`)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {pythonError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                ⚠️ {pythonError}
              </div>
            )}

            {pythonCodeOutput && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400">Üretilen Python Betiği:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(pythonCodeOutput, 'python')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  >
                    {copiedPython ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPython ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-96 overflow-y-auto text-xs font-mono text-slate-200 prose prose-invert prose-xs max-w-none">
                  <ReactMarkdown>{pythonCodeOutput}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: SQL Query Generator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2.5 bg-blue-500/15 border border-blue-500/30 rounded-xl text-blue-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">🗄️ Doğal Dilden SQL Üretici</h3>
                  <p className="text-xs text-slate-400">PostgreSQL / MySQL ANSI SQL Sorgu Dönüştürücü</p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <label className="block text-xs font-medium text-slate-300">
                  Doğal Dilde Sorgu İsteğiniz:
                </label>
                <input
                  type="text"
                  value={sqlQueryInput}
                  onChange={(e) => setSqlQueryInput(e.target.value)}
                  placeholder="Örn: Satışları 1000'den büyük olan kayıtları getir..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Hızlı Sorular:
                  </span>
                  {[
                    "Satışları 1000'den büyük olanları getir",
                    'En yüksek kâra sahip ilk 5 kaydı listele',
                    'Kategori bazında ortalama değerleri hesapla',
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setSqlQueryInput(q);
                        handleGenerateSql(q);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateSql()}
                  disabled={isSqlLoading}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSqlLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>SQL Sorgusu Üretiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-blue-300" />
                      <span>🗄️ SQL Sorgusu Üret (`/api/generate-sql`)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {sqlError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                ⚠️ {sqlError}
              </div>
            )}

            {sqlCodeOutput && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-400">Üretilen SQL Sorgusu ve Açıklama:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(sqlCodeOutput, 'sql')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Kopyalandı!' : 'Sorguyu Kopyala'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-96 overflow-y-auto text-xs font-mono text-slate-200 prose prose-invert prose-xs max-w-none">
                  <ReactMarkdown>{sqlCodeOutput}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Canlı ML Model & REST API Üretici (MLOps Workbench) */}
          <div className="lg:col-span-2">
            <MlModelApiDeployer context={context} />
          </div>
        </div>
      )}

      {/* SubTab 4: Synthetic Data Generator */}

      {activeSubTab === 'synthetic' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="p-3 bg-purple-500/15 border border-purple-500/30 rounded-2xl text-purple-400">
              <FlaskConical className="w-7 h-7 animate-pulse text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100">
                  🧪 Sentetik Veri Çoğaltıcı (Synthetic Data Multiplier)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                  Gemini 3.6 Flash Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Veri setinizin istatistiksel dağılımını, sütun tiplerini ve korelasyonlarını koruyan gerçekçi yeni sentetik satırlar üretin.
              </p>
            </div>
          </div>

          {/* Target Count Selection & Generate Button */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-4">
            <label className="block text-xs font-bold text-slate-200">
              Kaç Satır Sentetik Veri Üretilsin?
            </label>

            <div className="flex flex-wrap items-center gap-3">
              {[50, 100, 500, 1000].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSyntheticTargetCount(c)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition border ${
                    syntheticTargetCount === c
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  +{c} Satır
                </button>
              ))}

              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-400">Özel Adet:</span>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={syntheticTargetCount}
                  onChange={(e) => setSyntheticTargetCount(Math.max(10, Math.min(5000, Number(e.target.value))))}
                  className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono text-center focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateSynthetic}
              disabled={isSyntheticLoading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSyntheticLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Sentetik Veri Üretiliyor ({syntheticTargetCount} Satır)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>✨ {syntheticTargetCount} Satır Sentetik Veri Üret</span>
                </>
              )}
            </button>
          </div>

          {syntheticErrorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{syntheticErrorMsg}</span>
            </div>
          )}

          {syntheticSuccessMsg && (
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>{syntheticSuccessMsg}</span>
              </div>
            </div>
          )}

          {/* Actions: Append to Table & Download CSV */}
          {syntheticRows && syntheticRows.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleAppendSyntheticToTable}
                  className="w-full sm:w-auto flex-1 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>➕ Mevcut Tabloya Ekle (+{syntheticRows.length} Satır)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSyntheticCSV}
                  className="w-full sm:w-auto flex-1 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>📥 Sentetik CSV İndir (.csv)</span>
                </button>
              </div>

              {/* Preview Table of Generated Synthetic Data */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>Önizleme: Üretilen Sentetik Satırlar ({syntheticRows.length} Kayıt)</span>
                  <span className="text-[10px] text-slate-500 font-mono">İlk 5 Satır Gösteriliyor</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300 border-collapse">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] font-mono uppercase">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        {Object.keys(syntheticRows[0]).map((col) => (
                          <th key={col} className="py-2 px-3 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans text-[11px]">
                      {syntheticRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60">
                          <td className="py-2 px-3 font-mono text-purple-400 font-bold">{idx + 1}</td>
                          {Object.keys(row).map((col) => (
                            <td key={col} className="py-2 px-3 whitespace-nowrap text-slate-200">
                              {String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

