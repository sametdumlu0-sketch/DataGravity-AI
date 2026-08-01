import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  FileText,
  Bot,
  Download,
  Printer,
  Globe,
  FileType,
  ChevronDown,
  Presentation,
  Mic,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Radio,
  Share2,
  Video,
} from 'lucide-react';
import {
  downloadMarkdownFile,
  downloadHTMLFile,
  triggerPrintOrPDF,
  downloadPPTXPresentation,
} from '../utils/exportUtils';
import { DatasetAnalysisContext } from '../types/data';
import { MultiAgentCouncilView } from './MultiAgentCouncilView';
import { SmartAiLoader } from './SmartAiLoader';
import { ReportDispatcherModal } from './ReportDispatcherModal';
import { DataReelModal } from './DataReelModal';
import { SleekErrorCard } from './SleekErrorCard';


interface ExecutiveReportViewProps {
  context: DatasetAnalysisContext;
  reportText: string | null;
  reportError?: string | null;
  audioScript?: string | null;
  isLoading: boolean;
  onGenerateReport: (focusArea?: string) => void;
  onGenerateOfflineReport?: () => void;
  onAskQuestionAboutSection?: (sectionTitle: string) => void;
  isOfflineReport?: boolean;
}



const FOCUS_AREAS = [
  { id: 'Tümü', label: '🎯 Genel Analiz', desc: 'Dengeli ve tam veri değerlendirmesi' },
  { id: 'Maliyet & Karlılık', label: '💰 Karlılık & Maliyet', desc: 'Marjlar, indirimler ve finansal verimlilik' },
  { id: 'Müşteri Kayıp (Churn)', label: '⚠️ Risk & Müşteri Kaybı', desc: 'Abonelik süreleri ve sadakat faktörleri' },
  { id: 'Büyüme & Satış', label: '📈 Satış & Büyüme Trendleri', desc: 'Kategoriler, bölgeler ve hacim potansiyeli' },
  { id: 'Makine Öğrenmesi & Tahminleme', label: '🤖 ML & Yapay Zeka Odaklı', desc: 'Modelleme, hedef değişken ve feature engineering' },
];

export const ExecutiveReportView: React.FC<ExecutiveReportViewProps> = ({
  context,
  reportText,
  reportError,
  audioScript,
  isLoading,
  onGenerateReport,
  onGenerateOfflineReport,
  onAskQuestionAboutSection,
  isOfflineReport = false,
}) => {
  const [selectedFocus, setSelectedFocus] = useState<string>('Tümü');
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isDispatcherOpen, setIsDispatcherOpen] = useState(false);
  const [isReelOpen, setIsReelOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);



  // Web Speech API Audio Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);

  // Stop audio on unmount or report reset
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [reportText]);

  const getSpokenText = () => {
    if (audioScript && audioScript.trim().length > 10) {
      return audioScript;
    }
    if (!reportText) return '';
    return reportText
      .replace(/^#+\s*/gim, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[-*•]/g, '')
      .slice(0, 800);
  };

  const handlePlayAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Tarayıcınız sesli okuma özelliğini (Web Speech API) desteklememektedir.');
      return;
    }

    if (isPausedAudio) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
      setIsPlayingAudio(true);
      return;
    }

    window.speechSynthesis.cancel();

    const textToRead = getSpokenText();
    if (!textToRead) return;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'tr-TR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const trVoice = voices.find((v) => v.lang.includes('tr') || v.lang.includes('TR'));
    if (trVoice) {
      utterance.voice = trVoice;
    }

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setIsPausedAudio(false);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePauseAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPausedAudio(true);
      setIsPlayingAudio(false);
    }
  };

  const handleStopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    }
  };

  const handleCopy = () => {
    if (!reportText) return;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFocusClick = (focusId: string) => {
    setSelectedFocus(focusId);
    onGenerateReport(focusId === 'Tümü' ? undefined : focusId);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);

  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner & Focus Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  Otomatik Yönetici Raporu (Executive Summary)
                </h2>
                {isOfflineReport ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1">
                    ⚡ Python Çevrimdışı ML Motoru
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1">
                    🤖 Gemini 2.0 Flash AI
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isOfflineReport
                  ? 'Python (Pandas, SciPy, Scikit-Learn IsolationForest) ile %100 istatistiksel ve ML analizi.'
                  : 'Gemini AI ve hibrit Python istatistik motoru tarafından hazırlanan teknik rapor.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onGenerateOfflineReport && (
              <button
                type="button"
                onClick={onGenerateOfflineReport}
                disabled={isLoading}
                title="API kotasından harcamadan anında Python ile istatistiksel ve ML analizi yapar."
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 shadow-sm transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>⚡ Python Çevrimdışı Analiz Et</span>
              </button>
            )}

            {reportText && (
              <>
                <button
                  id="download-pptx-btn"
                  type="button"
                  onClick={() => downloadPPTXPresentation(reportText, 'yonetici_sunumu.pptx')}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white shadow-md transition"
                >
                  <Presentation className="w-3.5 h-3.5" />
                  <span>📊 PowerPoint (.pptx) Olarak İndir</span>
                </button>

                <button
                  id="copy-report-text-btn"
                  onClick={handleCopy}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copied ? 'Kopyalandı!' : 'Kopyala'}</span>
                </button>

                {/* Client-side Export Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Dışa Aktar</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-1.5 text-xs text-slate-200 animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => {
                          downloadPPTXPresentation(reportText, 'yonetici_sunumu.pptx');
                          setShowExportMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-800 flex items-center space-x-2 transition text-amber-300 font-semibold border-b border-slate-800/80 pb-2 mb-1"
                      >
                        <Presentation className="w-4 h-4 text-amber-400" />
                        <span>📊 PowerPoint (.pptx) İndir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          downloadMarkdownFile(reportText, 'yonetici_raporu.md');
                          setShowExportMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-800 flex items-center space-x-2 transition text-slate-300"
                      >
                        <FileType className="w-4 h-4 text-indigo-400" />
                        <span>📄 Markdown (.md) İndir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          downloadHTMLFile(reportText, 'yonetici_raporu.html');
                          setShowExportMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-800 flex items-center space-x-2 transition text-slate-300"
                      >
                        <Globe className="w-4 h-4 text-teal-400" />
                        <span>🌐 HTML Paneli (.html) İndir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerPrintOrPDF();
                          setShowExportMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-800 flex items-center space-x-2 transition text-slate-300 border-t border-slate-800/80 mt-1 pt-2"
                      >
                        <Printer className="w-4 h-4 text-amber-400" />
                        <span>🖨️ PDF / Yazdır (Print)</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsDispatcherOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 shadow-sm transition"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                  <span>📢 Ekibe Duyur (Dispatcher)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsReelOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/40 text-pink-200 shadow-sm transition"
                >
                  <Video className="w-3.5 h-3.5 text-pink-300 animate-pulse" />
                  <span>📱 30s Data Reel Oluştur</span>
                </button>
              </>
            )}




            <button
              id="regenerate-report-btn"
              onClick={() => onGenerateReport(selectedFocus === 'Tümü' ? undefined : selectedFocus)}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Analiz Ediliyor...' : 'Raporu Yenile'}</span>
            </button>
          </div>
        </div>

        {/* Focus Area Filter Chips */}
        <div className="pt-2 border-t border-slate-800/80">
          <span className="text-xs font-medium text-slate-400 block mb-2">
            Analiz Odağını Özelleştirin:
          </span>
          <div className="flex flex-wrap gap-2">
            {FOCUS_AREAS.map((focus) => (
              <button
                key={focus.id}
                onClick={() => handleFocusClick(focus.id)}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 border ${
                  selectedFocus === focus.id
                    ? 'bg-indigo-600/90 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                }`}
                title={focus.desc}
              >
                <span>{focus.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Content Loading State */}
      {isLoading && (
        <SmartAiLoader
          title="Yönetici Raporu & AI Podcast Sentezleniyor"
          subtitle="Gemini 3.6 Flash istatistikleri, eğilimleri ve stratejik önerileri hesaplıyor"
        />
      )}


      {/* AI Audio Podcast Player Bar */}
      {!isLoading && reportText && (
        <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-800/40 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 no-print">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-purple-500/15 border border-purple-500/30 rounded-2xl text-purple-300 shadow-inner">
              <Radio className="w-6 h-6 animate-pulse text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-100">
                  🎙️ AI Sesli Yönetici Özeti (Podcast Modu)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                  45 Saniye • Radyo/Podcast
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Gemini 3.6 Flash tarafından oluşturulan akıcı Türkçe sesli podcast özeti.
              </p>
            </div>
          </div>

          {/* Controls & Waveform */}
          <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
            {/* Dynamic Audio Waveform Animation */}
            <div className="flex items-center space-x-1 h-7 px-3 bg-slate-950/80 rounded-xl border border-slate-800">
              {[40, 75, 30, 90, 50, 85, 45, 95, 60, 35, 80, 50, 70, 40].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isPlayingAudio
                      ? 'bg-gradient-to-t from-purple-500 via-indigo-400 to-amber-400 animate-pulse'
                      : 'bg-slate-700'
                  }`}
                  style={{
                    height: isPlayingAudio ? `${Math.max(25, (h * (i % 2 === 0 ? 1 : 0.7)))}%` : '20%',
                    animationDelay: `${(i % 5) * 120}ms`,
                    animationDuration: `${350 + (i % 3) * 150}ms`,
                  }}
                />
              ))}
            </div>

            {/* Play / Pause / Stop Controls */}
            <div className="flex items-center space-x-2">
              {!isPlayingAudio ? (
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition flex items-center space-x-1.5"
                >
                  <Play className="w-4 h-4 fill-current text-white" />
                  <span>{isPausedAudio ? 'Devam Et' : '🎙️ Sesli Özeti Dinle'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePauseAudio}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Duraklat</span>
                </button>
              )}

              {(isPlayingAudio || isPausedAudio) && (
                <button
                  type="button"
                  onClick={handleStopAudio}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Sesi Durdur"
                >
                  <Square className="w-4 h-4 fill-current text-rose-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Error Card — friendly SleekErrorCard, no raw error strings */}
      {!isLoading && reportError && (
        <SleekErrorCard
          error={reportError}
          onRetry={() => onGenerateReport(selectedFocus === 'Tümü' ? undefined : selectedFocus)}
        />
      )}

      {/* Report Output */}
      {!isLoading && !reportError && reportText && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md print:bg-white print:border-none print:shadow-none print:text-black">
          <div className="prose prose-invert max-w-none prose-headings:text-slate-100 prose-headings:font-bold prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-300 prose-strong:text-indigo-300 prose-code:text-emerald-300 prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded print:prose-neutral">
            <ReactMarkdown>{reportText}</ReactMarkdown>
          </div>

          {/* Prompt to ask questions on chat */}
          {onAskQuestionAboutSection && (
            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-indigo-950/20 p-4 rounded-xl border-indigo-500/20 no-print">
              <div className="flex items-center space-x-3 text-xs text-slate-300">
                <Bot className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <span>Bu rapordaki bulgular hakkında daha detaylı soru sormak ister misiniz?</span>
              </div>
              <button
                onClick={() => onAskQuestionAboutSection('Bu rapordaki stratejik önerileri nasıl hayata geçirebilirim?')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition"
              >
                Danışmana Soru Sor →
              </button>
            </div>
          )}
        </div>
      )}


      {/* Multi-Agent AI Data Council Panel */}
      {!isLoading && reportText && (
        <MultiAgentCouncilView dataContextMarkdown={reportText} />
      )}


      {!isLoading && !reportText && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">Rapor Henüz Oluşturulmadı</h3>
          <p className="text-xs text-slate-400">
            Aşağıdaki butona tıklayarak Gemini AI ile veri setinizin yönetim özetini çıkarın.
          </p>
          <button
            onClick={() => onGenerateReport()}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Yapay Zeka Analizini Başlat</span>
          </button>
        </div>
      )}

      {/* Report Dispatcher Modal */}
      <ReportDispatcherModal
        isOpen={isDispatcherOpen}
        onClose={() => setIsDispatcherOpen(false)}
        reportText={reportText || ''}
      />

      {/* AI Data Reel Modal (9:16 Vertical Story) */}
      <DataReelModal
        isOpen={isReelOpen}
        onClose={() => setIsReelOpen(false)}
        context={context}
        reportText={reportText}
      />
    </div>
  );

};

