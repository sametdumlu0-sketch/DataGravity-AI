import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Send,
  Sparkles,
  RefreshCw,
  X,
  MessageSquare,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileText,
  Share2,
} from 'lucide-react';

interface ReportDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportText: string;
  filename?: string;
}

export const ReportDispatcherModal: React.FC<ReportDispatcherModalProps> = ({
  isOpen,
  onClose,
  reportText,
  filename,
}) => {
  const [targetType, setTargetType] = useState<'slack' | 'email'>('slack');
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formattedPayload, setFormattedPayload] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleDispatch = async () => {
    setIsDispatching(true);
    setError(null);
    setResultMessage(null);
    setFormattedPayload(null);

    try {
      const response = await fetch('/api/dispatch-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetUrl,
          reportText,
          filename,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Rapor gönderimi gerçekleştirilemedi.');
      }

      setResultMessage(data.message || 'Rapor başarıyla iletildi!');
      setFormattedPayload(data.dispatchPayload);

      // Trigger Celebration Confetti Animation!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#3b82f6'],
      });
    } catch (err: any) {
      console.error('Report dispatch error:', err);
      setError(err.message || 'Rapor iletilirken bir hata oluştu.');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="p-3 bg-purple-500/15 border border-purple-500/30 rounded-2xl text-purple-300">
            <Share2 className="w-6 h-6 animate-pulse text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              📢 Aksiyon & Rapor Dağıtıcı (Dispatcher)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Gemini 3.6 Flash raporunuzu Slack Markdown veya HTML e-postaya dönüştürüp ekibinize duyursun.
            </p>
          </div>
        </div>

        {/* Channel Type Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300">
            Dağıtım Kanalı Türü Seçin:
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTargetType('slack')}
              className={`p-3 rounded-xl border text-left flex items-center space-x-3 transition ${
                targetType === 'slack'
                  ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <div>
                <span className="text-xs font-bold block text-slate-100">💬 Slack Webhook</span>
                <span className="text-[10px] text-slate-400">Slack Kanalına Bildirim</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTargetType('email')}
              className={`p-3 rounded-xl border text-left flex items-center space-x-3 transition ${
                targetType === 'email'
                  ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <Mail className="w-5 h-5 text-teal-400" />
              <div>
                <span className="text-xs font-bold block text-slate-100">✉️ E-Posta / Webhook</span>
                <span className="text-[10px] text-slate-400">HTML E-Posta Şablonu</span>
              </div>
            </button>
          </div>
        </div>

        {/* Webhook / Email Target Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">
            {targetType === 'slack' ? 'Slack Webhook URL (Opsiyonel):' : 'Alıcı E-posta / Webhook URL:'}
          </label>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder={
              targetType === 'slack'
                ? 'https://hooks.slack.com/services/...'
                : 'yonetim@sirket.com veya Webhook URL...'
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
          />
          <p className="text-[10px] text-slate-500">
            *Boş bırakılırsa Gemini şık dağıtım formatını oluşturur ve ekran simülasyonu sunar.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {resultMessage && (
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>{resultMessage}</span>
          </div>
        )}

        {/* Formatted Message Payload Preview */}
        {formattedPayload && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
            <h4 className="text-[11px] font-bold text-indigo-300 font-mono">
              📋 Oluşturulan Dağıtım Mesajı Önizlemesi:
            </h4>
            <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
              {formattedPayload.formattedMessage}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Kapat
          </button>

          <button
            type="button"
            onClick={handleDispatch}
            disabled={isDispatching}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition flex items-center space-x-2 disabled:opacity-50"
          >
            {isDispatching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Rapor İletiliyor...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-white" />
                <span>🚀 Raporu İlet ve Ekibe Duyur</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
