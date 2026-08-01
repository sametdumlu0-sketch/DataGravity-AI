import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Users,
  Sparkles,
  RefreshCw,
  FlaskConical,
  TrendingUp,
  ShieldCheck,
  Award,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface AgentAnalysis {
  id: 'data_scientist' | 'business_strategist' | 'data_auditor';
  name: string;
  role: string;
  avatar: string;
  color: string;
  analysis: string;
  keyFocus: string;
  qualityScore?: number;
}

interface MultiAgentCouncilViewProps {
  dataContextMarkdown: string;
}

export const MultiAgentCouncilView: React.FC<MultiAgentCouncilViewProps> = ({
  dataContextMarkdown,
}) => {
  const [agents, setAgents] = useState<AgentAnalysis[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string>('data_scientist');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [councilSummary, setCouncilSummary] = useState<string | null>(null);

  const fetchCouncilAnalysis = async () => {
    if (!dataContextMarkdown) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/multi-agent-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataContext: dataContextMarkdown }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Multi-Agent analizi gerçekleştirilemedi.');
      }

      if (Array.isArray(data.agents) && data.agents.length > 0) {
        setAgents(data.agents);
        setActiveAgentId(data.agents[0].id);
        setCouncilSummary(data.councilSummary || null);
      } else {
        throw new Error('Ajan yanıtları geçerli dizide alınamadı.');
      }
    } catch (err: any) {
      console.error('Multi-Agent Analysis error:', err);
      setError(err.message || 'Yapay Zeka Konseyi analizi sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeAgent = agents.find((a) => a.id === activeAgentId) || agents[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Top Banner & Trigger Button */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-800/40 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl text-indigo-400 shadow-inner">
            <Users className="w-7 h-7 animate-pulse text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-extrabold text-slate-100">
                🤖 Multi-Agent AI Veri Konseyi (3x Uzman Ajan)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Verinizi 3 farklı uzman yapay zeka ajanı (Veri Bilimci, İş Stratejisti, Veri Denetçisi) bağımsız perspektiflerden analiz eder ve ortak değerlendirme sunar.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchCouncilAnalysis}
          disabled={isLoading}
          className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>3 Ajan Analiz Ediyor...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{agents.length > 0 ? 'Konsey Değerlendirmesini Yenile' : '✨ AI Uzman Konseyini Topla'}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Placeholder */}
      {isLoading && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="p-3 bg-indigo-500/20 rounded-full animate-bounce">🧪</div>
            <div className="p-3 bg-teal-500/20 rounded-full animate-bounce delay-100">📈</div>
            <div className="p-3 bg-amber-500/20 rounded-full animate-bounce delay-200">🛡️</div>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-200">
              Uzman Ajanlar Veri Setinizi İnceliyor...
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Veri Bilimci istatistikleri, İş Stratejisti karlılığı, Veri Denetçisi güvenlik skorunu paralel değerlendiriyor.
            </p>
          </div>
        </div>
      )}

      {/* Agents Tabs & Content */}
      {!isLoading && agents.length > 0 && (
        <div className="space-y-5">
          {/* Agent Selection Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {agents.map((agent) => {
              const isActive = agent.id === activeAgentId;
              let IconComp = FlaskConical;
              if (agent.id === 'business_strategist') IconComp = TrendingUp;
              if (agent.id === 'data_auditor') IconComp = ShieldCheck;

              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setActiveAgentId(agent.id)}
                  className={`p-4 rounded-xl text-left border transition flex items-start space-x-3 ${
                    isActive
                      ? 'bg-slate-950 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                      : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div
                    className="p-2.5 rounded-xl text-xl flex-shrink-0 shadow-inner"
                    style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
                  >
                    {agent.avatar}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-100 truncate">{agent.name}</h4>
                      {agent.qualityScore !== undefined && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold font-mono">
                          % {agent.qualityScore}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-indigo-300 font-medium block truncate mt-0.5">
                      {agent.role}
                    </span>
                    <p className="text-[10px] text-slate-400 truncate mt-1">{agent.keyFocus}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Agent Report View */}
          {activeAgent && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-inner space-y-4">
              {/* Agent Title & Role Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                    {activeAgent.avatar}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      {activeAgent.name}
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
                        style={{
                          backgroundColor: `${activeAgent.color}20`,
                          color: activeAgent.color,
                          borderColor: `${activeAgent.color}40`,
                        }}
                      >
                        {activeAgent.role}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Odak: {activeAgent.keyFocus}</p>
                  </div>
                </div>

                {activeAgent.qualityScore !== undefined && (
                  <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-2 text-amber-300">
                    <Award className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Veri Güvenilirlik Skoru</span>
                      <span className="text-sm font-extrabold font-mono">% {activeAgent.qualityScore} / 100</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Agent Analysis Report Markdown */}
              <div className="prose prose-invert max-w-none text-xs text-slate-300 prose-headings:text-slate-100 prose-headings:font-bold prose-strong:text-indigo-300 prose-code:text-emerald-300 prose-code:bg-slate-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                <ReactMarkdown>{activeAgent.analysis}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Council Summary Banner */}
          {councilSummary && (
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 flex items-center space-x-3 shadow-md">
              <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <span>
                <strong>Konsey Ortak Bildirisi:</strong> {councilSummary}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
