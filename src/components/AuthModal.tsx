import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Lock,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  LogIn,
  UserPlus,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = activeTab === 'login' ? { email, password } : { name, email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const textResponse = await response.text();
      let data: any = {};

      if (textResponse && textResponse.trim()) {
        try {
          data = JSON.parse(textResponse);
        } catch (parseErr) {
          throw new Error('Sunucuya bağlanılamadı, lütfen tekrar deneyin.');
        }
      } else {
        throw new Error('Sunucudan geçerli bir yanıt alınamadı. Lütfen tekrar deneyin.');
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'E-posta veya şifre hatalı.');
      }

      const userObj = data.user || { name: name || email.split('@')[0], email };
      const tokenStr = data.token || 'mock-jwt-token-2026';

      onLoginSuccess(userObj, tokenStr);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Giriş işlemi gerçekleştirilemedi.');
    } finally {
      setIsLoading(false);
    }


  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      <div className="bg-[#0B0F19] border border-white/15 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 relative overflow-hidden text-slate-100 glow-indigo">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header Tabs */}
        <div className="flex items-center justify-center space-x-2 border-b border-white/10 pb-4">
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'login'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Giriş Yap</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'register'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Kayıt Ol</span>
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-1">
          <h3 className="text-xl font-extrabold text-white">
            {activeTab === 'login' ? 'Hoş Geldiniz' : 'DataGravity Hesabı Oluştur'}
          </h3>
          <p className="text-xs text-slate-400">
            {activeTab === 'login'
              ? 'Analiz geçmişinize erişmek ve sınırsız AI çıktıları üretmek için giriş yapın.'
              : 'Veri analizlerinizi bulutta saklayın ve ekip arkadaşlarınızla paylaşın.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Ad Soyad</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-500 absolute left-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ahsen Yılmaz"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">E-Posta Adresi</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@sirket.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Şifre</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-extrabold text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-500/30 transition flex items-center justify-center space-x-2"
          >
            <span>{isLoading ? 'İşleniyor...' : activeTab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
