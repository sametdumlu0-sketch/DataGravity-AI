import React, { useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { DatasetAnalysisContext } from '../types/data';

interface DataTableStatsViewProps {
  context: DatasetAnalysisContext;
}

export const DataTableStatsView: React.FC<DataTableStatsViewProps> = ({ context }) => {
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'describe'>('preview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const allColumns = context.columns.map((c) => c.name);

  // Search & Filter Data
  const filteredData = context.allData.filter((row) => {
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

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
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
            📊 Teknik İstatistik Özet (`describe()`)
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
    </div>
  );
};
