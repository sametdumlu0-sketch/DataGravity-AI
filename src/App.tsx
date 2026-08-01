import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { FileUploadSection } from './components/FileUploadSection';
import { DatasetOverviewCards } from './components/DatasetOverviewCards';
import { ExecutiveReportView } from './components/ExecutiveReportView';
import { DataChatView } from './components/DataChatView';
import { DataVisualizerView } from './components/DataVisualizerView';
import { DataTableStatsView } from './components/DataTableStatsView';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { JarvisVoiceAssistantModal } from './components/JarvisVoiceAssistantModal';
import { AuthModal } from './components/AuthModal';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { AnalysisHistoryModal } from './components/AnalysisHistoryModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, useToast } from './components/ToastContainer';
import { ApiKeyWarningBanner } from './components/ApiKeyWarningBanner';
import { DatasetAnalysisContext, ChatMessage } from './types/data';
import { downloadPPTXPresentation, downloadMarkdownFile, downloadHTMLFile } from './utils/exportUtils';
import { formatErrorMessage } from './utils/errorMapper';

function MainApp() {
  const [datasetContext, setDatasetContext] = useState<DatasetAnalysisContext | null>(null);
  const [activeTab, setActiveTab] = useState<'report' | 'chat' | 'charts' | 'table'>('report');

  const [executiveReport, setExecutiveReport] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [audioScript, setAudioScript] = useState<string | null>(null);
  const [isReportLoading, setIsReportLoading] = useState<boolean>(false);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isJarvisOpen, setIsJarvisOpen] = useState<boolean>(false);

  // Auth & Tier Modals State
  const [currentUser, setCurrentUser] = useState<{ id?: string; name: string; email: string; plan?: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch (e) {
          // ignore
        }
      }
    }
    return null;
  });
  const [authToken, setAuthToken] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [userHistoryList, setUserHistoryList] = useState<any[]>([]);

  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const { addToast } = useToast();

  // Load user profile & history on mount if token exists
  useEffect(() => {
    if (authToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            fetchUserHistory(authToken);
          }
        })
        .catch(() => {});
    }
  }, [authToken]);

  const fetchUserHistory = async (token: string) => {
    try {
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.history) {
        setUserHistoryList(data.history);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleLoginSuccess = (user: any, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    addToast('success', 'Giriş Başarılı', `Hoş geldiniz, ${user.name}`);
    fetchUserHistory(token);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserHistoryList([]);
  };


  const handleUpgradeToProSuccess = async () => {
    if (authToken) {
      try {
        const res = await fetch('/api/auth/upgrade-pro', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          addToast('success', 'Pro Tier Aktif!', 'Tüm gelişmiş özelliklerin kilidi açıldı. ⚡');
        }
      } catch (e) {
        // ignore
      }
    }
  };



  // Listen for Ctrl+K or Cmd+K keyboard shortcuts globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const checkApiKeyStatus = async () => {
    try {
      const response = await fetch('/api/check-key');
      const data = await response.json();
      setHasApiKey(data.hasKey);
      if (!data.hasKey) {
        addToast('warning', 'API Anahtarı Eksik', 'GEMINI_API_KEY yapılandırması tanımlı değil.');
      }
    } catch (e) {
      // Ignore check error
    }
  };

  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const handleDatasetLoaded = (context: DatasetAnalysisContext) => {
    setDatasetContext(context);
    setExecutiveReport(null);
    setReportError(null);
    setChatHistory([]);
    setActiveTab('report');
    generateExecutiveReport(context);
  };

  const generateExecutiveReport = async (
    ctxOverride?: DatasetAnalysisContext,
    focusArea?: string
  ) => {
    const ctx = ctxOverride || datasetContext;
    if (!ctx) return;

    setIsReportLoading(true);
    setReportError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataContext: ctx.contextMarkdown,
          focusArea,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          // 429: Show friendly toast — server already retries with exponential backoff
          addToast('warning', 'Yapay Zeka Analisti Yoğun', 'İstek kuyruğa alındı, lütfen birkaç saniye bekleyin...');
        } else if (response.status === 401) {
          addToast('error', 'Geçersiz API Anahtarı', 'GEMINI_API_KEY doğrulanamadı.');
          setHasApiKey(false);
        } else {
          addToast('error', 'Rapor Hatası', data.error || 'Yönetici raporu oluşturulamadı.');
        }
        throw new Error(data.error || 'Rapor üretilemedi.');
      }

      setExecutiveReport(data.report);
      setReportError(null);
      setAudioScript(data.audioScript || null);
      addToast('success', 'Rapor Hazır', 'Yönetici özeti başarıyla oluşturuldu.');

      // Auto-save to user history if logged in
      if (authToken && ctx) {
        fetch('/api/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            filename: ctx.filename,
            rowCount: ctx.rowCount,
            columnCount: ctx.columnCount,
            report: data.report,
          }),
        })
          .then(() => fetchUserHistory(authToken))
          .catch(() => {});
      }

    } catch (err: any) {
      console.error('Report error:', err);
      // Store error separately — never pollute the report markdown string
      setReportError(err.message || 'Analiz raporu oluşturulurken bir sorun yaşandı.');
      setAudioScript(null);
    } finally {
      setIsReportLoading(false);
    }
  };


  const handleSendMessage = async (question: string) => {
    if (!datasetContext) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataContext: datasetContext.contextMarkdown,
          question,
          chatHistory: chatHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          addToast('warning', 'Kota Aşımı (429)', 'API istek sınırı aşıldı.');
        } else if (response.status === 401) {
          addToast('error', 'Yetkisiz İstek', 'API Anahtarı doğrulanamadı.');
          setHasApiKey(false);
        }
        throw new Error(data.error || 'Soru yanıtlanamadı.');
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const formatted = formatErrorMessage(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `🚨 **${formatted.title}:** ${formatted.message}`,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleReset = () => {
    setDatasetContext(null);
    setExecutiveReport(null);
    setReportError(null);
    setChatHistory([]);
    setActiveTab('report');
  };

  const handleAskQuestionFromReport = (questionText: string) => {
    setActiveTab('chat');
    handleSendMessage(questionText);
  };


  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentFilename={datasetContext?.filename}
        rowCount={datasetContext?.rowCount}
        columnCount={datasetContext?.columnCount}
        onReset={handleReset}
        onExportReport={executiveReport ? () => window.print() : undefined}
        onExportPPTX={executiveReport ? () => downloadPPTXPresentation(executiveReport, `${datasetContext?.filename || 'rapor'}_sunum.pptx`, datasetContext?.filename) : undefined}
        onExportMarkdown={executiveReport ? () => downloadMarkdownFile(executiveReport, `${datasetContext?.filename || 'rapor'}_rapor.md`) : undefined}
        onExportHTML={executiveReport ? () => downloadHTMLFile(executiveReport, `${datasetContext?.filename || 'rapor'}_rapor.html`) : undefined}
        hasReport={!!executiveReport}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenJarvis={() => {
          if (currentUser?.plan !== 'pro') {
            setIsProModalOpen(true);
          } else {
            setIsJarvisOpen(true);
          }
        }}
        user={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onOpenProModal={() => setIsProModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Command Palette Modal (Ctrl + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={setActiveTab}
        onResetDataset={handleReset}
      />

      {/* Jarvis Voice Assistant Modal */}
      <JarvisVoiceAssistantModal
        isOpen={isJarvisOpen}
        onClose={() => setIsJarvisOpen(false)}
        context={datasetContext}
        onSelectTab={setActiveTab}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        onUpgradeSuccess={handleUpgradeToProSuccess}
      />

      {/* Analysis History Modal */}
      <AnalysisHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        historyList={userHistoryList}
        onSelectHistoryItem={(item) => {
          setExecutiveReport(item.report);
          setActiveTab('report');
          addToast('success', 'Geçmiş Rapor Yüklendi', item.filename);
        }}
      />



      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ApiKeyWarningBanner hasKey={hasApiKey} onRefreshKeyStatus={checkApiKeyStatus} />

        {!datasetContext ? (
          <FileUploadSection
            onDatasetLoaded={handleDatasetLoaded}
            isLoading={isReportLoading}
            setIsLoading={setIsReportLoading}
          />
        ) : (
          <div className="space-y-6">
            {/* Top Stat Overview Cards (Bento Grid) */}
            <DatasetOverviewCards context={datasetContext} />

            {/* Framer Motion Tab Views */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {activeTab === 'report' && (
                  <ExecutiveReportView
                    context={datasetContext}
                    reportText={executiveReport}
                    reportError={reportError}
                    audioScript={audioScript}
                    isLoading={isReportLoading}
                    onGenerateReport={(focus) => generateExecutiveReport(datasetContext, focus)}
                    onAskQuestionAboutSection={handleAskQuestionFromReport}
                  />
                )}


                {activeTab === 'chat' && (
                  <DataChatView
                    context={datasetContext}
                    chatHistory={chatHistory}
                    onSendMessage={handleSendMessage}
                    onClearHistory={() => setChatHistory([])}
                    isLoading={isChatLoading}
                  />
                )}

                {activeTab === 'charts' && <DataVisualizerView context={datasetContext} />}

                {activeTab === 'table' && <DataTableStatsView context={datasetContext} />}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-white/10 bg-[#07090E] text-center text-xs text-slate-500">
        <span>DataGravity Analyst • Professional Data Analytics & Gemini 3.6 Flash</span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </ErrorBoundary>
  );
}

