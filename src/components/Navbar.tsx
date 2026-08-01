import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Bot,
  BrainCircuit,
  Search,
  Mic,
  User,
  History,
  LogOut,
  ChevronDown,
  Presentation,
  Printer,
  FileText,
  Globe,
} from 'lucide-react';

interface NavbarProps {
  currentFilename?: string;
  rowCount?: number;
  columnCount?: number;
  onReset: () => void;
  onExportReport?: () => void;
  onExportPPTX?: () => void;
  onExportMarkdown?: () => void;
  onExportHTML?: () => void;
  hasReport: boolean;
  activeTab: 'report' | 'chat' | 'charts' | 'table';
  setActiveTab: (tab: 'report' | 'chat' | 'charts' | 'table') => void;
  onOpenCommandPalette?: () => void;
  onOpenJarvis?: () => void;
  user?: { name: string; email: string; plan?: string } | null;
  onOpenAuthModal?: () => void;
  onOpenHistoryModal?: () => void;
  onOpenProModal?: () => void;
  onLogout?: () => void;
  engineMode: 'gemini' | 'python';
  setEngineMode: (mode: 'gemini' | 'python') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentFilename,
  rowCount,
  columnCount,
  onReset,
  onExportReport,
  onExportPPTX,
  onExportMarkdown,
  onExportHTML,
  hasReport,
  activeTab,
  setActiveTab,
  onOpenCommandPalette,
  onOpenJarvis,
  user,
  onOpenAuthModal,
  onOpenHistoryModal,
  onOpenProModal,
  onLogout,
  engineMode,
  setEngineMode,
}) => {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#07090E]/95 backdrop-blur-2xl text-slate-100 border-b border-white/10 shadow-2xl">
      {/* TIER 1: Top Global Bar (h-16) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* LEFT: Logo & Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 via-purple-600 to-teal-500 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  DataGravity
                </span>
                <span className="font-semibold text-xs text-indigo-300 tracking-wide hidden sm:inline">
                  Analyst
                </span>
              </div>
              <span
                onClick={onOpenProModal}
                className="cursor-pointer px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition"
              >
                v2.0 Pro
              </span>
            </div>
          </div>

          {/* CENTER: Expanded Command Search Bar (w-80 md:w-96) */}
          <div className="flex-1 max-w-md hidden sm:flex justify-center">
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="w-full h-10 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 text-slate-400 text-xs flex items-center justify-between transition group shadow-inner"
              title="Komut Paletini Aç (Ctrl + K)"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
                <span className="truncate">Komut veya analiz ara... (Ctrl + K)</span>
              </div>
              <kbd className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-300 border border-white/10">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* DUAL ENGINE MODE SWITCHER PILL */}
          <div className="flex items-center p-1 bg-slate-950/90 border border-slate-800 rounded-xl shadow-inner text-xs font-semibold">
            <button
              type="button"
              onClick={() => setEngineMode('gemini')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition duration-200 ${
                engineMode === 'gemini'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Gemini 2.0 AI Altyapısı (Zengin Rapor, Podcast, Strateji)"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>🤖 Gemini AI</span>
            </button>
            <button
              type="button"
              onClick={() => setEngineMode('python')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition duration-200 ${
                engineMode === 'python'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Lokal Python Motoru (Pandas/Scikit-Learn, Anomali Tespiti, Sınırsız)"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-300" />
              <span>⚡ Python ML</span>
            </button>
          </div>

          {/* RIGHT: Dataset Chip, Jarvis Icon Button, Auth Profile */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Minimal File Chip */}
            {currentFilename && (
              <div className="hidden lg:flex items-center gap-2 px-3 h-9 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="font-semibold text-slate-200 max-w-[140px] truncate">
                  {currentFilename}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-indigo-300">{rowCount}x{columnCount}</span>
              </div>
            )}

            {/* Minimal Jarvis Voice Assistant Button (Icon-only with glowing ring) */}
            <button
              type="button"
              onClick={onOpenJarvis}
              className="relative w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center transition shadow-sm group"
              title="Jarvis Sesli Asistan Modu"
            >
              <span className="absolute inset-0 rounded-xl bg-rose-500/20 animate-ping opacity-30" />
              <Mic className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
            </button>

            {/* Auth / User Profile */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenHistoryModal}
                  className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold transition"
                  title="Geçmiş Raporlarım"
                >
                  <History className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Geçmiş</span>
                </button>

                <div className="flex items-center gap-2 h-9 px-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-bold text-white max-w-[90px] truncate">{user.name}</span>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 flex items-center justify-center transition"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Giriş Yap / Kayıt</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TIER 2: Sub-Navbar Bar (h-12, bg-white/[0.02]) */}
      {currentFilename && (
        <div className="bg-white/[0.02] border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
            {/* LEFT: Page Navigation Tabs (Smooth bottom active indicator) */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none h-full pt-1">
              <button
                id="tab-report-btn"
                onClick={() => setActiveTab('report')}
                className={`h-full px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'report'
                    ? 'border-indigo-500 text-white bg-white/[0.04]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Yönetici AI Raporu</span>
              </button>

              <button
                id="tab-chat-btn"
                onClick={() => setActiveTab('chat')}
                className={`h-full px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'chat'
                    ? 'border-indigo-500 text-white bg-white/[0.04]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-teal-400" />
                <span>Veri Danışmanı</span>
              </button>

              <button
                id="tab-charts-btn"
                onClick={() => setActiveTab('charts')}
                className={`h-full px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'charts'
                    ? 'border-indigo-500 text-white bg-white/[0.04]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Görsel Keşif</span>
              </button>

              <button
                id="tab-table-btn"
                onClick={() => setActiveTab('table')}
                className={`h-full px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'table'
                    ? 'border-indigo-500 text-white bg-white/[0.04]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>Veri Tablosu</span>
              </button>
            </div>

            {/* RIGHT: Action Buttons Grouping */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Export Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="h-8 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>📥 Dışa Aktar</span>
                  <ChevronDown className="w-3 h-3 text-indigo-300" />
                </button>

                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#0B0F19] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 space-y-0.5 animate-fadeIn">
                    {onExportPPTX && (
                      <button
                        type="button"
                        onClick={() => { onExportPPTX(); setShowExportDropdown(false); }}
                        className="w-full px-3 py-2 text-left text-xs text-amber-200 hover:bg-white/[0.06] rounded-xl flex items-center gap-2 transition font-semibold"
                      >
                        <Presentation className="w-4 h-4 text-amber-400" />
                        <span>📊 PowerPoint (.pptx)</span>
                      </button>
                    )}
                    {onExportMarkdown && (
                      <button
                        type="button"
                        onClick={() => { onExportMarkdown(); setShowExportDropdown(false); }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] rounded-xl flex items-center gap-2 transition font-medium"
                      >
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span>📄 Markdown (.md)</span>
                      </button>
                    )}
                    {onExportHTML && (
                      <button
                        type="button"
                        onClick={() => { onExportHTML(); setShowExportDropdown(false); }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] rounded-xl flex items-center gap-2 transition font-medium"
                      >
                        <Globe className="w-4 h-4 text-teal-400" />
                        <span>🌐 HTML Paneli</span>
                      </button>
                    )}
                    {onExportReport && (
                      <button
                        type="button"
                        onClick={() => {
                          onExportReport();
                          setShowExportDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] rounded-xl flex items-center gap-2 transition font-medium border-t border-white/10 mt-1 pt-2"
                      >
                        <Printer className="w-4 h-4 text-amber-400" />
                        <span>🖨️ PDF / Yazdır</span>
                      </button>
                    )}
                    {!onExportPPTX && !onExportReport && (
                      <div className="px-3 py-2 text-xs text-slate-500 text-center">
                        Rapor oluşturulduktan sonra aktif olur
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reset Dataset Button */}
              <button
                type="button"
                onClick={onReset}
                className="h-8 px-3 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                title="Yeni Veri Seti Yükle"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Yeni Veri</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
