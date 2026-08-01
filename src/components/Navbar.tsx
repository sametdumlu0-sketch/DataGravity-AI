import React from 'react';
import {
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Bot,
  BrainCircuit,
} from 'lucide-react';

interface NavbarProps {
  currentFilename?: string;
  rowCount?: number;
  columnCount?: number;
  onReset: () => void;
  onExportReport?: () => void;
  hasReport: boolean;
  activeTab: 'report' | 'chat' | 'charts' | 'table';
  setActiveTab: (tab: 'report' | 'chat' | 'charts' | 'table') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentFilename,
  rowCount,
  columnCount,
  onReset,
  onExportReport,
  hasReport,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Gemini Data Analyst
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Gemini 3.6 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Otomatik Yapay Zeka Veri Analiz & Danışmanlık Platformu
              </p>
            </div>
          </div>

          {/* Dataset Status Badge if loaded */}
          {currentFilename && (
            <div className="hidden md:flex items-center space-x-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-slate-200 max-w-[180px] truncate">
                {currentFilename}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300 font-semibold">{rowCount} satır</span>
              <span className="text-slate-500">x</span>
              <span className="text-slate-300 font-semibold">{columnCount} sütun</span>
            </div>
          )}

          {/* Top Actions */}
          <div className="flex items-center space-x-2">
            {currentFilename && (
              <>
                {hasReport && onExportReport && (
                  <button
                    id="export-report-btn"
                    onClick={onExportReport}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    title="Raporu Yazdır / PDF İndir"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Raporu İndir</span>
                  </button>
                )}
                <button
                  id="reset-dataset-btn"
                  onClick={onReset}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-300 border border-slate-700 transition"
                  title="Yeni Veri Seti Yükle"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Yeni Veri</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation if dataset loaded */}
        {currentFilename && (
          <div className="flex space-x-1 overflow-x-auto border-t border-slate-800 pt-1 pb-1 scrollbar-none">
            <button
              id="tab-report-btn"
              onClick={() => setActiveTab('report')}
              className={`inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                activeTab === 'report'
                  ? 'bg-indigo-600/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Yönetici AI Raporu</span>
            </button>

            <button
              id="tab-chat-btn"
              onClick={() => setActiveTab('chat')}
              className={`inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'bg-indigo-600/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-blue-400" />
              <span>Etkileşimli Veri Danışmanı (Soru Sor)</span>
            </button>

            <button
              id="tab-charts-btn"
              onClick={() => setActiveTab('charts')}
              className={`inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                activeTab === 'charts'
                  ? 'bg-indigo-600/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Görsel Keşif & Grafikler</span>
            </button>

            <button
              id="tab-table-btn"
              onClick={() => setActiveTab('table')}
              className={`inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                activeTab === 'table'
                  ? 'bg-indigo-600/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>Veri Tablosu & İstatistikler</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
