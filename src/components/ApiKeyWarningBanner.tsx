import React, { useState } from 'react';
import { Key, ExternalLink, Check, Copy, Info } from 'lucide-react';

interface ApiKeyWarningBannerProps {
  hasKey: boolean;
  onRefreshKeyStatus?: () => void;
}

export const ApiKeyWarningBanner: React.FC<ApiKeyWarningBannerProps> = ({
  hasKey,
  onRefreshKeyStatus,
}) => {
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (hasKey) return null;

  const envSample = `GEMINI_API_KEY=AIzaSyYourActualKeyHere`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border-2 border-amber-500/40 shadow-xl space-y-3 animate-fadeIn">
      <div className="flex items-start space-x-3">
        <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 flex-shrink-0">
          <Key className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
            <span>🔑 GEMINI_API_KEY Yapılandırması Eksik veya Bulunamadı</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Yapay zeka analiz raporları, grafik önerileri ve soru-cevap asistanını kullanabilmek için projenizde geçerli bir Google Gemini API anahtarı tanımlamalısınız.
          </p>
        </div>
      </div>

      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            Proje kökündeki <code className="text-amber-300 font-mono">.env</code> veya <code className="text-amber-300 font-mono">.streamlit/secrets.toml</code> dosyasına ekleyin:
          </span>
          <button
            type="button"
            onClick={handleCopyEnv}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
          >
            {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedEnv ? 'Kopyalandı' : 'Kopyala'}</span>
          </button>
        </div>

        <pre className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5 text-emerald-300 font-mono text-[11px] overflow-x-auto">
          {envSample}
        </pre>
      </div>

      <div className="flex items-center justify-between pt-1 text-xs">
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition"
        >
          <span>Google AI Studio'dan Ücretsiz API Anahtarı Al →</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {onRefreshKeyStatus && (
          <button
            type="button"
            onClick={onRefreshKeyStatus}
            className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
          >
            Durumu Yeniden Kontrol Et
          </button>
        )}
      </div>
    </div>
  );
};
