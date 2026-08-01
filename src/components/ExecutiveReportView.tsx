import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  FileText,
  Target,
  Bot,
  Lightbulb,
  Search,
  TrendingUp,
  Brain,
  MessageSquare,
} from 'lucide-react';

interface ExecutiveReportViewProps {
  reportText: string | null;
  isLoading: boolean;
  onGenerateReport: (focusArea?: string) => void;
  onAskQuestionAboutSection?: (sectionTitle: string) => void;
}

const FOCUS_AREAS = [
  { id: 'Tümü', label: '🎯 Genel Analiz', desc: 'Dengeli ve tam veri değerlendirmesi' },
  { id: 'Maliyet & Karlılık', label: '💰 Karlılık & Maliyet', desc: 'Marjlar, indirimler ve finansal verimlilik' },
  { id: 'Müşteri Kayıp (Churn)', label: '⚠️ Risk & Müşteri Kaybı', desc: 'Abonelik süreleri ve sadakat faktörleri' },
  { id: 'Büyüme & Satış', label: '📈 Satış & Büyüme Trendleri', desc: 'Kategoriler, bölgeler ve hacim potansiyeli' },
  { id: 'Makine Öğrenmesi & Tahminleme', label: '🤖 ML & Yapay Zeka Odaklı', desc: 'Modelleme, hedef değişken ve feature engineering' },
];

export const ExecutiveReportView: React.FC<ExecutiveReportViewProps> = ({
  reportText,
  isLoading,
  onGenerateReport,
  onAskQuestionAboutSection,
}) => {
  const [selectedFocus, setSelectedFocus] = useState<string>('Tümü');
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Top Banner & Focus Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Otomatik Yönetici Raporu (Executive Summary)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gemini 3.6 Flash tarafından oluşturulan teknik ve stratejik iş analizi raporu.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {reportText && (
              <button
                id="copy-report-text-btn"
                onClick={handleCopy}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Kopyalandı!' : 'Raporu Kopyala'}</span>
              </button>
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
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-200">
              Yapay Zeka Raporu Hazırlanıyor...
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Veri kümesi özet istatistikleri, dağılımlar ve eksik veriler Gemini 3.6 Flash modeline iletiliyor.
            </p>
          </div>
        </div>
      )}

      {/* Report Output */}
      {!isLoading && reportText && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="prose prose-invert max-w-none prose-headings:text-slate-100 prose-headings:font-bold prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-300 prose-strong:text-indigo-300 prose-code:text-emerald-300 prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
            <ReactMarkdown>{reportText}</ReactMarkdown>
          </div>

          {/* Prompt to ask questions on chat */}
          {onAskQuestionAboutSection && (
            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-indigo-950/20 p-4 rounded-xl border-indigo-500/20">
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
    </div>
  );
};
