import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Activity, Sparkles } from 'lucide-react';
import { formatErrorMessage } from '../utils/errorMapper';

interface SleekErrorCardProps {
  error: any;
  onRetry?: () => void;
  autoRetryCountdownSeconds?: number;
}

export const SleekErrorCard: React.FC<SleekErrorCardProps> = ({
  error,
  onRetry,
  autoRetryCountdownSeconds = 3,
}) => {
  const formatted = formatErrorMessage(error);
  const [countdown, setCountdown] = useState<number>(autoRetryCountdownSeconds);

  // Auto-countdown timer for 429 Rate Limit errors
  useEffect(() => {
    if (!formatted.isRateLimit || !onRetry) return;

    setCountdown(autoRetryCountdownSeconds);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onRetry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [error, formatted.isRateLimit]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-[#0B0F19]/90 backdrop-blur-xl border border-amber-500/30 text-slate-100 shadow-2xl space-y-4 max-w-xl mx-auto glow-indigo"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex-shrink-0 mt-0.5">
            {formatted.isRateLimit ? (
              <Activity className="w-5 h-5 animate-pulse" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-white tracking-tight">{formatted.title}</h4>
              {formatted.isRateLimit && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                  Otomatik Yeniden Deneme
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{formatted.message}</p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-xs font-bold transition flex items-center space-x-1.5 flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tekrar Dene</span>
          </button>
        )}
      </div>

      {/* Auto Countdown Progress Indicator for 429 */}
      {formatted.isRateLimit && onRetry && countdown > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400 animate-spin" /> İletişim sıraya alındı
            </span>
            <span className="text-amber-300 font-bold">{countdown} saniye sonra otomatik deneniyor</span>
          </div>

          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-teal-400 rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: autoRetryCountdownSeconds, ease: 'linear' }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};
