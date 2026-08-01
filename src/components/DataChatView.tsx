import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  HelpCircle,
  Lightbulb,
  ArrowDown,
  Loader2,
} from 'lucide-react';
import { ChatMessage, DatasetAnalysisContext } from '../types/data';

interface DataChatViewProps {
  context: DatasetAnalysisContext;
  chatHistory: ChatMessage[];
  onSendMessage: (question: string) => Promise<void>;
  onClearHistory: () => void;
  isLoading: boolean;
}

export const DataChatView: React.FC<DataChatViewProps> = ({
  context,
  chatHistory,
  onSendMessage,
  onClearHistory,
  isLoading,
}) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;
    const q = inputQuestion.trim();
    setInputQuestion('');
    onSendMessage(q);
  };

  const handleChipClick = (chipText: string) => {
    if (isLoading) return;
    onSendMessage(chipText);
  };

  // Generate dataset-tailored suggested prompt chips
  const suggestedChips = [
    `Bu veri setinde aykırı (outlier) veya şüpheli değerler var mı?`,
    `Veri kalitesini ve eksik verileri iyileştirmek için ne önerirsin?`,
    `Sütunlar arasındaki en belirgin korelasyon ve ilişki nedir?`,
    `Bu verilerle en yüksek başarı sağlayacak ML modeli hangisidir?`,
  ];

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col h-[680px] shadow-2xl overflow-hidden">
      {/* Header */}

      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Etkileşimli Veri Danışmanı (ask_data_question)
            </h3>
            <p className="text-xs text-slate-400">
              <span className="text-emerald-400 font-mono">{context.filename}</span> bağlamına özel sorular sorabilirsiniz.
            </p>
          </div>
        </div>

        {chatHistory.length > 0 && (
          <button
            onClick={onClearHistory}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-800/80 rounded-lg transition"
            title="Sohbet Geçmişini Temizle"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sohbeti Temizle</span>
          </button>
        )}
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-950/40 overflow-x-auto scrollbar-none flex items-center gap-2 text-xs">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span className="text-slate-400 font-medium flex-shrink-0">Örnek Sorular:</span>
        <div className="flex items-center gap-2">
          {suggestedChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(chip)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-indigo-500/50 transition whitespace-nowrap text-xs flex-shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <HelpCircle className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-2">
              <h4 className="text-base font-bold text-slate-200">
                Veri Setiniz Hakkında İstediğinizi Sorun
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Yapay Zeka Danışmanınız, yüklenen verinin satır, sütun ve istatistiksel özetlerini değerlendirerek net ve rakamsal yanıtlar verir.
              </p>
            </div>
          </div>
        )}

        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-none'
              } ${msg.isError ? 'bg-rose-950/60 border-rose-500/50 text-rose-200' : ''}`}
            >
              <div className="prose prose-invert max-w-none text-xs sm:text-sm prose-p:my-1 prose-pre:bg-slate-900 prose-pre:p-2 prose-pre:rounded-lg">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              <span className="text-[10px] opacity-60 block text-right mt-1 font-mono">
                {msg.timestamp}
              </span>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800 border border-slate-700/80 rounded-2xl rounded-tl-none px-4 py-3 text-slate-300 text-xs flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Veriler inceleniyor ve yanıt hazırlanıyor...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Örn: En karlı kategori hangisidir? veya Eksik verileri nasıl doldurmalıyım?"
            disabled={isLoading}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-1"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Gönder</span>
          </button>
        </div>
      </form>
    </div>
  );
};
