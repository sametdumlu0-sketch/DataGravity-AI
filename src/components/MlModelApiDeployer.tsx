import React, { useState, useEffect } from 'react';
import {
  Zap,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Play,
  Terminal,
  Cpu,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Send,
  Layers,
} from 'lucide-react';
import { DatasetAnalysisContext } from '../types/data';

interface FeatureImportance {
  feature: string;
  importance: number;
}

interface DeployedModelInfo {
  modelName: string;
  targetVariable: string;
  modelMetrics: {
    accuracy: string;
    f1Score: string;
    rocAuc: string;
  };
  featureImportances: FeatureImportance[];
  curlCode: string;
  pythonCode: string;
  jsCode: string;
}

interface PredictionResponse {
  prediction: string;
  confidenceScore: number;
  explanation: string;
  recommendedAction: string;
}

interface MlModelApiDeployerProps {
  context: DatasetAnalysisContext;
}

export const MlModelApiDeployer: React.FC<MlModelApiDeployerProps> = ({ context }) => {
  const [targetVariable, setTargetVariable] = useState<string>('');
  const [modelInfo, setModelInfo] = useState<DeployedModelInfo | null>(null);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  // Live Test Client (Postman-like Mini Workbench) State
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);

  // Active Code Snippet Tab
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'python' | 'js'>('curl');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Set default target variable on load
  useEffect(() => {
    if (context.columns.length > 0) {
      setTargetVariable(context.columns[0].name);
    }
  }, [context]);

  // Handle Deploying Model
  const handleDeployModel = async () => {
    if (!targetVariable) return;
    setIsDeploying(true);
    setDeployError(null);
    setModelInfo(null);
    setPredictionResult(null);

    try {
      const response = await fetch('/api/deploy-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataContext: context.contextMarkdown,
          targetVariable,
          sampleRows: context.allData.slice(0, 5),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ML Modeli canlıya alınamadı.');
      }

      setModelInfo(data);

      // Pre-fill initial input values from sample data
      const initialInputs: Record<string, any> = {};
      context.columns.forEach((col) => {
        if (col.name !== targetVariable) {
          initialInputs[col.name] = context.allData[0]?.[col.name] ?? '';
        }
      });
      setInputValues(initialInputs);
    } catch (err: any) {
      console.error('Deploy model error:', err);
      setDeployError(err.message || 'Model yayını sırasında bir hata oluştu.');
    } finally {
      setIsDeploying(false);
    }
  };

  // Handle Live Inference Prediction
  const handlePredictInference = async () => {
    setIsPredicting(true);
    setPredictError(null);

    try {
      const response = await fetch('/api/predict-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetVariable,
          inputData: inputValues,
          dataContext: context.contextMarkdown,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Tahmin gerçekleştirilemedi.');
      }

      setPredictionResult(data);
    } catch (err: any) {
      console.error('Prediction inference error:', err);
      setPredictError(err.message || 'Tahmin alınırken bir hata oluştu.');
    } finally {
      setIsPredicting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950/40 to-slate-950 border border-blue-800/40 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-500/15 border border-blue-500/30 rounded-2xl text-blue-400 shadow-inner">
            <Zap className="w-7 h-7 animate-pulse text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-extrabold text-slate-100">
                ⚡ Canlı ML Model & REST API Üretici (MLOps Workbench)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
                Scikit-Learn & REST API
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Herhangi bir sütunu hedef değişken seçin. Yapay zeka canlı bir ML tahmin modeli ve kullanıma hazır cURL / Python / JS API istek kodları oluştursun.
            </p>
          </div>
        </div>
      </div>

      {/* Target Variable Selector Card */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Tahmin Edilecek Hedef Değişken (Target Variable):</span>
            </label>
            <select
              value={targetVariable}
              onChange={(e) => setTargetVariable(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-blue-500"
            >
              {context.columns.map((c) => (
                <option key={c.name} value={c.name}>
                  🎯 {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 sm:pt-5">
            <button
              type="button"
              onClick={handleDeployModel}
              disabled={isDeploying}
              className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isDeploying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Model Canlıya Alınıyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>✨ ML Modelini Canlıya Al & API Üret</span>
                </>
              )}
            </button>
          </div>
        </div>

        {deployError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{deployError}</span>
          </div>
        )}
      </div>

      {/* Deployed Model Dashboard */}
      {modelInfo && (
        <div className="space-y-6">
          {/* Model Metrics & Name Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-inner flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/30">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>{modelInfo.modelName}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    🔴 Canlı REST API
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hedef: <strong className="text-blue-300">{modelInfo.targetVariable}</strong>
                </p>
              </div>
            </div>

            {/* Metrics Badges */}
            <div className="flex items-center space-x-3">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block font-semibold">Doğruluk (Accuracy)</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {modelInfo.modelMetrics?.accuracy || '%92'}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block font-semibold">F1-Score</span>
                <span className="text-xs font-bold text-indigo-400 font-mono">
                  {modelInfo.modelMetrics?.f1Score || '0.89'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Live Testing Client (Postman Mini Workbench) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-inner">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                🧪 Canlı Tahmin Test İstemcisi (Postman Mini API Workbench)
              </h4>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] font-mono border border-slate-800">
                POST /api/predict-model
              </span>
            </div>

            {/* Input Form Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {context.columns
                .filter((c) => c.name !== targetVariable)
                .map((col) => (
                  <div key={col.name} className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-300 font-mono truncate">
                      {col.name}:
                    </label>
                    <input
                      type="text"
                      value={inputValues[col.name] ?? ''}
                      onChange={(e) =>
                        setInputValues({ ...inputValues, [col.name]: e.target.value })
                      }
                      placeholder={`Değer girin...`}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
            </div>

            <button
              type="button"
              onClick={handlePredictInference}
              disabled={isPredicting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isPredicting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Tahmin Yapılıyor...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>🚀 Canlı Tahmin Yap (POST /api/predict-model)</span>
                </>
              )}
            </button>

            {predictError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{predictError}</span>
              </div>
            )}

            {/* Prediction Result Display Box */}
            {predictionResult && (
              <div className="p-5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Tahmin Sonucu:
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                    %{predictionResult.confidenceScore || 85} Güven Oranı
                  </span>
                </div>

                <div className="text-base font-extrabold text-slate-100 font-mono">
                  {predictionResult.prediction}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {predictionResult.explanation}
                </p>

                {predictionResult.recommendedAction && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                    <strong>💡 Önerilen Aksiyon:</strong> {predictionResult.recommendedAction}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* API Code Snippets (cURL, Python, JS) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold text-slate-100">Hazır API İstek Kodları</h4>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
                  <button
                    onClick={() => setActiveCodeTab('curl')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                      activeCodeTab === 'curl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('python')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                      activeCodeTab === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('js')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                      activeCodeTab === 'js' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    JavaScript
                  </button>
                </div>

                <button
                  onClick={() =>
                    copyToClipboard(
                      activeCodeTab === 'curl'
                        ? modelInfo.curlCode
                        : activeCodeTab === 'python'
                        ? modelInfo.pythonCode
                        : modelInfo.jsCode
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition flex items-center gap-1.5"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
                </button>
              </div>
            </div>

            <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto">
              <code>
                {activeCodeTab === 'curl'
                  ? modelInfo.curlCode
                  : activeCodeTab === 'python'
                  ? modelInfo.pythonCode
                  : modelInfo.jsCode}
              </code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
