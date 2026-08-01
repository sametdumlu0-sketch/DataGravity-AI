import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { FileUploadSection } from './components/FileUploadSection';
import { DatasetOverviewCards } from './components/DatasetOverviewCards';
import { ExecutiveReportView } from './components/ExecutiveReportView';
import { DataChatView } from './components/DataChatView';
import { DataVisualizerView } from './components/DataVisualizerView';
import { DataTableStatsView } from './components/DataTableStatsView';
import { DatasetAnalysisContext, ChatMessage } from './types/data';

export default function App() {
  const [datasetContext, setDatasetContext] = useState<DatasetAnalysisContext | null>(null);
  const [activeTab, setActiveTab] = useState<'report' | 'chat' | 'charts' | 'table'>('report');
  
  const [executiveReport, setExecutiveReport] = useState<string | null>(null);
  const [isReportLoading, setIsReportLoading] = useState<boolean>(false);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Trigger automated AI executive report generation when a new dataset is loaded
  const handleDatasetLoaded = (context: DatasetAnalysisContext) => {
    setDatasetContext(context);
    setExecutiveReport(null);
    setChatHistory([]);
    setActiveTab('report');
    generateExecutiveReport(context);
  };

  // Call Server endpoint /api/analyze
  const generateExecutiveReport = async (
    ctxOverride?: DatasetAnalysisContext,
    focusArea?: string
  ) => {
    const ctx = ctxOverride || datasetContext;
    if (!ctx) return;

    setIsReportLoading(true);
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
        throw new Error(data.error || 'Rapor üretilemedi.');
      }

      setExecutiveReport(data.report);
    } catch (err: any) {
      console.error('Report error:', err);
      setExecutiveReport(
        `⚠️ **Hata:** Analiz raporu oluşturulurken bir sorun yaşandı: ${err.message}`
      );
    } finally {
      setIsReportLoading(false);
    }
  };

  // Call Server endpoint /api/ask
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
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ **Soru Yanıtlanamadı:** ${err.message}`,
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
    setChatHistory([]);
    setActiveTab('report');
  };

  const handleExportReport = () => {
    window.print();
  };

  const handleAskQuestionFromReport = (questionText: string) => {
    setActiveTab('chat');
    handleSendMessage(questionText);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentFilename={datasetContext?.filename}
        rowCount={datasetContext?.rowCount}
        columnCount={datasetContext?.columnCount}
        onReset={handleReset}
        onExportReport={handleExportReport}
        hasReport={!!executiveReport}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!datasetContext ? (
          <FileUploadSection
            onDatasetLoaded={handleDatasetLoaded}
            isLoading={isReportLoading}
            setIsLoading={setIsReportLoading}
          />
        ) : (
          <div className="space-y-6">
            {/* Top Stat Overview Cards */}
            <DatasetOverviewCards context={datasetContext} />

            {/* Tab Views */}
            {activeTab === 'report' && (
              <ExecutiveReportView
                reportText={executiveReport}
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
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500">
        <span>Gemini Data Analyst • Google AI Studio & Gemini 3.6 Flash</span>
      </footer>
    </div>
  );
}
