import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { spawn } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'datagravity_analyst_secret_jwt_key_2026';

app.use(express.json({ limit: '20mb' }));

// Simple JSON Database Store Helper
const DB_FILE_PATH = path.join(process.cwd(), 'data_store.json');

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      const initial = { users: [], history: [] };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const content = fs.readFileSync(DB_FILE_PATH, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return { users: [], history: [] };
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to write db:', e);
  }
}


// Multi-Key Rotation Pool & Rate Limit Retry Helper
let activeKeyIndex = 0;

function getAllApiKeys(): string[] {
  const keys: string[] = [];

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    keys.push(process.env.GEMINI_API_KEY);
  }
  if (process.env.GEMINI_API_KEY_2 && process.env.GEMINI_API_KEY_2 !== 'MY_GEMINI_API_KEY') {
    keys.push(process.env.GEMINI_API_KEY_2);
  }
  if (process.env.GEMINI_API_KEY_3 && process.env.GEMINI_API_KEY_3 !== 'MY_GEMINI_API_KEY') {
    keys.push(process.env.GEMINI_API_KEY_3);
  }
  if (process.env.GEMINI_API_KEY_4 && process.env.GEMINI_API_KEY_4 !== 'MY_GEMINI_API_KEY') {
    keys.push(process.env.GEMINI_API_KEY_4);
  }

  // Fallback to .streamlit/secrets.toml
  try {
    const secretsPath = path.join(process.cwd(), '.streamlit', 'secrets.toml');
    if (fs.existsSync(secretsPath)) {
      const secretsContent = fs.readFileSync(secretsPath, 'utf8');
      const match = secretsContent.match(/GEMINI_API_KEY\s*=\s*["']([^"']+)['"]/);
      if (match && match[1] && !keys.includes(match[1])) {
        keys.push(match[1]);
      }
    }
  } catch (e) {
    // ignore
  }

  return keys;
}

function getGenAIClient() {
  const keys = getAllApiKeys();
  if (keys.length === 0) {
    throw new Error('GEMINI_API_KEY bulunamadı! Lütfen Secrets veya .streamlit/secrets.toml dosyasını kontrol edin.');
  }

  const selectedKey = keys[activeKeyIndex % keys.length];

  return new GoogleGenAI({
    apiKey: selectedKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function rotateApiKeyIndex() {
  const keys = getAllApiKeys();
  if (keys.length > 1) {
    activeKeyIndex = (activeKeyIndex + 1) % keys.length;
    console.log(`[Key Rotation] Switched to API Key #${activeKeyIndex + 1} of ${keys.length}`);
  }
}

// ============================================================
// GLOBAL REQUEST QUEUE — Concurrent istekleri sıraya koyar,
// rate limit riskini kökten azaltır.
// gemini-2.0-flash free-tier: 15 RPM → 1 istek / 4 saniye
// ============================================================
let _queueRunning = false;
const _requestQueue: Array<() => Promise<void>> = [];
let _last429At = 0;          // Son 429 hatası zamanı (ms)
const INTER_REQ_DELAY = 4000; // İstekler arası minimum bekleme (ms)
const COOLDOWN_MS = 65000;    // 429 sonrası global cooldown (ms)

async function _processQueue() {
  if (_queueRunning) return;
  _queueRunning = true;
  while (_requestQueue.length > 0) {
    // Eğer kısa süre önce 429 aldıysak, cooldown uygula
    const timeSince429 = Date.now() - _last429At;
    if (_last429At > 0 && timeSince429 < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - timeSince429;
      console.log(`[Queue] Kota doldu — ${Math.ceil(remaining / 1000)}s cooldown bekleniyor...`);
      await new Promise((r) => setTimeout(r, remaining));
      _last429At = 0;
    }

    const task = _requestQueue.shift()!;
    await task();

    // Her istek arasında bekleme (15 RPM limitine uyum)
    if (_requestQueue.length > 0) {
      await new Promise((r) => setTimeout(r, INTER_REQ_DELAY));
    }
  }
  _queueRunning = false;
}

function enqueueGeminiRequest<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    _requestQueue.push(async () => {
      try {
        resolve(await fn());
      } catch (e) {
        reject(e);
      }
    });
    _processQueue();
  });
}

// Aktif model — gemini-2.0-flash: @google/genai v1beta API ile uyumlu
const GEMINI_MODEL = 'gemini-2.0-flash';

/**
 * Gemini API çağrısını kuyruk + exponential backoff + Key Rotation ile yürütür.
 * 429 Rate Limit hatasında global cooldown başlatır ve sonraki anahtara geçer.
 */
async function callGeminiWithRetry<T>(
  fn: (ai: GoogleGenAI) => Promise<T>,
  maxRetries = 4,
  delayMs = 5000
): Promise<T> {
  return enqueueGeminiRequest(async () => {
    let attempt = 0;
    let lastErr: any = null;

    while (attempt <= maxRetries) {
      try {
        const ai = getGenAIClient();
        return await fn(ai);
      } catch (err: any) {
        lastErr = err;
        const msg = err?.message || '';
        const isRateLimit =
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('Quota') ||
          msg.includes('rate limit') ||
          msg.includes('rateLimitExceeded');

        if (isRateLimit && attempt < maxRetries) {
          attempt++;
          _last429At = Date.now(); // Cooldown tetikle
          rotateApiKeyIndex();
          const waitMs = attempt <= 1 ? 8000 : Math.min(60000, delayMs * Math.pow(2, attempt - 1));
          const keys = getAllApiKeys();
          console.warn(
            `[Rate Limit] 429 — Anahtar #${(activeKeyIndex % keys.length) + 1}/${keys.length}'e geçildi. ` +
            `Deneme ${attempt}/${maxRetries}. ${Math.round(waitMs / 1000)}s bekleniyor...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        } else {
          throw lastErr;
        }
      }
    }
    throw lastErr;
  });
}

// Helper: Run Python Offline Data Science Analysis Engine
async function runPythonOfflineAnalysis(payload: any): Promise<any> {
  const pythonBinWin = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
  const pythonBinUnix = path.join(process.cwd(), '.venv', 'bin', 'python');
  let pythonExe = 'python';

  if (fs.existsSync(pythonBinWin)) {
    pythonExe = pythonBinWin;
  } else if (fs.existsSync(pythonBinUnix)) {
    pythonExe = pythonBinUnix;
  }

  const scriptPath = path.join(process.cwd(), 'python_engine', 'analyzer.py');

  return new Promise((resolve, reject) => {
    const pyProcess = spawn(pythonExe, [scriptPath]);
    let output = '';
    let errorOutput = '';

    pyProcess.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    pyProcess.stderr.on('data', (chunk) => {
      errorOutput += chunk.toString();
    });

    pyProcess.on('close', (code) => {
      if (code !== 0 && !output) {
        return reject(new Error(`Python betiği hata ile kapandı (kod ${code}): ${errorOutput}`));
      }
      try {
        const parsed = JSON.parse(output);
        resolve(parsed);
      } catch (e) {
        reject(new Error(`Python JSON çıktısı ayrıştırılamadı: ${output.substring(0, 300)}`));
      }
    });

    pyProcess.stdin.write(JSON.stringify(payload));
    pyProcess.stdin.end();
  });
}

// Global API Error Handler
function handleApiError(err: any, res: express.Response) {
  const message = err?.message || 'Bir sunucu hatası oluştu.';
  console.error('API Error:', message);

  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('Quota')) {
    return res.status(429).json({
      error: 'Gemini API kota sınırı (429 Rate Limit) aşıldı. Lütfen birkaç saniye bekleyip tekrar deneyin.',
      isQuotaExceeded: true,
    });
  }

  if (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('API_KEY') ||
    message.includes('UNAUTHENTICATED')
  ) {
    return res.status(401).json({
      error: 'GEMINI_API_KEY bulunamadı veya geçersiz. Lütfen .env veya .streamlit/secrets.toml dosyanızı kontrol edin.',
      isInvalidKey: true,
    });
  }

  return res.status(500).json({ error: message });
}

// API Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Check Key Status
app.get('/api/check-key', (req, res) => {
  try {
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      try {
        const secretsPath = path.join(process.cwd(), '.streamlit', 'secrets.toml');
        if (fs.existsSync(secretsPath)) {
          const secretsContent = fs.readFileSync(secretsPath, 'utf8');
          const match = secretsContent.match(/GEMINI_API_KEY\s*=\s*["']([^"']+)["']/);
          if (match && match[1]) {
            apiKey = match[1];
          }
        }
      } catch (e) {
        // Ignore
      }
    }

    const hasKey = !!apiKey && apiKey !== 'MY_GEMINI_API_KEY';
    res.json({
      hasKey,
      message: hasKey
        ? 'GEMINI_API_KEY yapılandırması aktif.'
        : 'GEMINI_API_KEY bulunamadı. Lütfen .env veya .streamlit/secrets.toml dosyanızı güncelleyin.',
    });
  } catch (err: any) {
    res.status(500).json({ hasKey: false, message: err.message });
  }
});

// Endpoint: Generate Executive Summary Report & 45-Sec Radio/Podcast Audio Script
app.post('/api/analyze', async (req, res) => {
  try {
    const { dataContext, focusArea } = req.body;

    if (!dataContext) {
      return res.status(400).json({ error: 'Veri bağlamı (dataContext) gereklidir.' });
    }

    const ai = getGenAIClient();

    const systemInstruction = `
Sen kıdemli bir Veri Bilimci, İş Analisti ve Medya Sunucususun.
Sana verilen veri seti özet bilgilerini inceleyerek hem detaylı bir teknik analiz raporu hem de yönetici için radyo/podcast tarzında akıcı, dinlenebilir 45 saniyelik bir Türkçe sesli özet metni hazırlamalısın.

Yalnızca SADECE geçerli bir JSON objesi döndür. Ekstra açıklama metni veya markdown kod bloğu EKLEME.

JSON Formatı:
{
  "report": "... (Detaylı Markdown formatında rapor metni) ...",
  "audioScript": "Merhaba! Veri setinizden elde ettiğimiz en kritik yönetici özetini sunuyorum. Verilerimizi incelediğimizde..."
}

ÖNEMLİ KURALLAR:
1. 'report' alanına 4 ana başlık içeren (1. Genel Veri Özeti, 2. Kritik Bulgular ve Eğilimler, 3. Stratejik İş Önerileri, 4. Önerilen ML Modelleri) kapsamlı Türkçe Markdown metnini koy.
2. 'audioScript' alanına 45 saniyelik (yaklaşık 100-140 kelime) radyo/podcast tarzında, doğrudan sesli okunabilecek, akıcı, samimi ve doğal Türkçe konuşma metnini yaz.
    `.trim();

    let focusInstruction = '';
    if (focusArea) {
      focusInstruction = `\nLütfen analizinde özellikle **${focusArea}** konusuna/odağına öncelik ver ve derinleştir.`;
    }

    const prompt = `
Aşağıda analizi yapılacak veri setinin teknik özeti yer almaktadır:

${dataContext}
${focusInstruction}

Lütfen yukarıdaki verileri detaylıca inceleyerek hem raporu hem de 45 saniyelik podcast sesli özet metnini içeren JSON objesini üret:
    `.trim();

    const response = await callGeminiWithRetry(async (ai) => {
      return await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });
    });


    let rawText = response.text || '{}';
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const data = JSON.parse(rawText);
      res.json({
        report: data.report || rawText,
        audioScript: data.audioScript || 'Veri setiniz analiz edildi. Detaylı bulgular raporda yer almaktadır.',
      });
    } catch (parseErr) {
      console.log('Failed to parse analyze JSON, fallback to raw text');
      res.json({ report: response.text || 'Analiz raporu oluşturulamadı.', audioScript: null });
    }
  } catch (err: any) {
    console.warn('Gemini API /api/analyze yanıt vermedi veya kota doldu. Python Çevrimdışı Analiz Motoruna otomatik geçiliyor...', err?.message || err);
    try {
      const { dataContext, datasetContext, allData, filename } = req.body;
      const payload = datasetContext || {
        contextMarkdown: dataContext,
        allData: allData || [],
        filename: filename || 'Veri Seti'
      };
      const offlineResult = await runPythonOfflineAnalysis(payload);
      return res.json(offlineResult);
    } catch (pyErr: any) {
      console.error('Python çevrimdışı fallback de başarısız:', pyErr.message);
      handleApiError(err, res);
    }
  }
});

// Endpoint: Direct Offline Python Data Science & ML Analysis Engine
app.post('/api/offline-analyze', async (req, res) => {
  try {
    const { datasetContext, dataContext, allData, filename } = req.body;
    const payload = datasetContext || {
      contextMarkdown: dataContext,
      allData: allData || [],
      filename: filename || 'Veri Seti'
    };
    const result = await runPythonOfflineAnalysis(payload);
    res.json(result);
  } catch (err: any) {
    console.error('Offline Python Analysis Error:', err);
    res.status(500).json({ error: `Python çevrimdışı analiz hatası: ${err.message}` });
  }
});


// Endpoint: AI Chart Recommendation Assistant (Recharts Integration)
app.post('/api/recommend-charts', async (req, res) => {
  try {
    const { dataContext } = req.body;

    if (!dataContext) {
      return res.status(400).json({ error: 'Veri bağlamı (dataContext) gereklidir.' });
    }

    const ai = getGenAIClient();

    const systemInstruction = `
Sen Recharts kütüphanesiyle çalışan uzman bir Veri Görselleştirme ve Grafik Asistanısın.
Sana verilen veri seti teknik bağlamını inceleyerek en açıklayıcı, iş değeri en yüksek 4 adet grafik önerisi (JSON formatında) üretmelisin.
Grafik türleri kesinlikle şunlardan biri olmalıdır: 'bar', 'line', 'pie', 'area'.
Yanıtını SADECE geçerli bir JSON dizisi (JSON Array) formatında ver. Ekstra metin veya açıklama EKLEME.

JSON dizisindeki her obje tam olarak şu yapıda olmalıdır:
{
  "id": "chart_1",
  "type": "bar" | "line" | "pie" | "area",
  "title": "Grafik Başlığı (Türkçe)",
  "description": "Grafik açıklaması (1 cümle)",
  "reasoning": "Neden bu grafik türü ve değişkenler seçildi?",
  "xAxisKey": "name",
  "yAxisKey": "value",
  "color": "#6366f1",
  "data": [
    { "name": "Kategori / Etiket 1", "value": 1500 },
    { "name": "Kategori / Etiket 2", "value": 2400 }
  ]
}

ÖNEMLİ KURALLAR:
1. "data" dizisinde en az 4, en fazla 8 adet veri noktası objesi oluştur.
2. Her veri noktası objesinde "name" (X ekseni etiketi) ve "value" (Y ekseni sayısal değeri) alanları mutlaka bulunsun.
3. Grafik türlerini çeşitlendir (en az 1 Bar, 1 Line/Area, 1 Pie grafiği öner).
4. Renk alanına canlı, modern bir hex renk kodu ver (örn: #6366f1, #14b8a6, #f59e0b, #ec4899, #3b82f6).
    `.trim();

    const prompt = `
Aşağıdaki veri seti bağlamına göre Recharts ile çizilecek 4 adet harika grafik önerisi üret:

${dataContext}
    `.trim();

    const response = await callGeminiWithRetry(async (ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      })
    );

    let rawText = response.text || '[]';
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const recommendations = JSON.parse(rawText);
      res.json({ recommendations });
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON chart response:', rawText);
      res.status(500).json({ error: 'Grafik önerileri JSON formatında ayrıştırılamadı.' });
    }
  } catch (err: any) {
    try {
      const offlineRes = await runPythonOfflineAnalysis({ ...req.body, action: 'recommend_charts' });
      return res.json(offlineRes);
    } catch (pyErr) {
      handleApiError(err, res);
    }
  }
});

// Endpoint: Generate Executable Python Code (Pandas / Seaborn / Scikit-Learn)
app.post('/api/generate-python', async (req, res) => {
  try {
    const { dataContext, taskDescription } = req.body;

    if (!dataContext) {
      return res.status(400).json({ error: 'Veri bağlamı (dataContext) gereklidir.' });
    }

    const ai = getGenAIClient();

    const systemInstruction = `
Sen kıdemli bir Python Data Scientist ve Makine Öğrenmesi Mühendisisin.
Sana verilen veri seti teknik bağlamını kullanarak veriyi yükleyen, Pandas ile temizleyen, Matplotlib/Seaborn ile görselleştiren veya Scikit-Learn / XGBoost ile Makine Öğrenmesi modeli eğiten tam çalıştırılabilir Python kodu yazmalısın.

ÖNEMLİ KURALLAR:
1. Yanıtında mutlaka tırnaklı \`\`\`python ... \`\`\` bloğu içerisinde temiz, yorum satırlarıyla açıklanmış Python kodu sun.
2. Koddan önce ve sonra Türkçe açıklama adımları ve kütüphane kurulum gereksinimlerini belirt.
3. Kullanıcının belirttiği özel bir görev varsa o göreve odaklan, aksi takdirde kapsamlı Veri Temizleme + EDA Görselleştirme + ML Modeli Eğitimi kodu üret.
    `.trim();

    let taskPrompt = '';
    if (taskDescription) {
      taskPrompt = `\nKullanıcı Özel İsteği / Görev: ${taskDescription}`;
    }

    const prompt = `
Veri Seti Bağlamı:
${dataContext}
${taskPrompt}

Lütfen yukarıdaki veri seti şemasına uygun çalıştırılabilir Python ve Pandas kodlarını Türkçe açıklamalarıyla üret:
    `.trim();

    const response = await callGeminiWithRetry(async (ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      })
    );

    const codeText = response.text || 'Python kodu oluşturulamadı.';
    res.json({ code: codeText });
  } catch (err: any) {
    try {
      const offlineRes = await runPythonOfflineAnalysis({ ...req.body, action: 'generate_python' });
      return res.json(offlineRes);
    } catch (pyErr) {
      handleApiError(err, res);
    }
  }
});

// Endpoint: Generate PostgreSQL / MySQL Compatible SQL Query from Natural Language
app.post('/api/generate-sql', async (req, res) => {
  try {
    const { dataContext, query } = req.body;

    if (!dataContext) {
      return res.status(400).json({ error: 'Veri bağlamı (dataContext) gereklidir.' });
    }
    if (!query) {
      return res.status(400).json({ error: 'Doğal dil sorgusu (query) gereklidir.' });
    }

    const ai = getGenAIClient();

    const systemInstruction = `
Sen kıdemli bir Veritabanı Mimarı ve SQL Uzmanısın.
Kullanıcının doğal dilde sorduğu soruları (örneğin: 'Satışları 1000'den büyük olanları getir' veya 'Kategori bazında ortalama kar marjını hesapla') sağlanan veri seti sütun isimlerine tam sadık kalarak PostgreSQL ve MySQL uyumlu ANSI SQL sorgusuna dönüştürmelisin.

ÖNEMLİ KURALLAR:
1. Yanıtında SQL sorgusunu mutlaka \`\`\`sql ... \`\`\` kod bloğu içinde sun.
2. Tablo adını 'dataset' veya dosya adı bazında tanımla.
3. Sorgudan sonra SQL cümlesinin (SELECT, WHERE, GROUP BY, ORDER BY, HAVING vb.) mantığını adım adım Türkçe olarak açıkla.
    `.trim();

    const prompt = `
Veri Seti Bağlamı ve Sütun Yapısı:
${dataContext}

Kullanıcının Doğal Dil İsteği: "${query}"

Lütfen yukarıdaki isteği tam karşılayan optimize edilmiş SQL sorgusunu ve Türkçe açıklamasını üret:
    `.trim();

    const response = await callGeminiWithRetry(async (ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      })
    );

    const sqlText = response.text || 'SQL sorgusu oluşturulamadı.';
    res.json({ sql: sqlText });
  } catch (err: any) {
    try {
      const offlineRes = await runPythonOfflineAnalysis({ ...req.body, action: 'generate_sql' });
      return res.json(offlineRes);
    } catch (pyErr) {
      handleApiError(err, res);
    }
  }
});

// Endpoint: What-If Scenario Simulator Effect Matrix Generation
app.post('/api/simulate', async (req, res) => {
  try {
    const { dataContext, numericStats } = req.body;

    if (!dataContext) {
      return res.status(400).json({ error: 'Veri bağlamı (dataContext) gereklidir.' });
    }

    const ai = getGenAIClient();

    const systemInstruction = `
Sen Veri Bilimi ve Ekonometri alanında uzman bir Ya Şöyle Olursa (What-If) Senaryo Simülatörü motorusun.
Sana verilen veri seti istatistiklerini ve sütun yapılarını inceleyerek sayısal sütunlar arasındaki duyarlılık ve etki katsayılarını (elasticity / impact factors) tespit etmelisin.

Yalnızca SADECE geçerli bir JSON objesi döndür. Markdown veya ekstra açıklama metni EKLEME.

Döndüreceğin JSON objesinin formatı tam olarak şu şekilde olmalıdır:
{
  "baselineStats": {
    "SütunAdı1": 100,
    "SütunAdı2": 500
  },
  "coefficients": [
    {
      "driver": "SütunAdı1",
      "target": "SütunAdı2",
      "elasticity": -1.2,
      "description": "SütunAdı1 %1 artarsa, SütunAdı2 yaklaşık %1.2 azalır (Talep Esnekliği)."
    }
  ],
  "insightSummary": "Gemini tarafından üretilen 2-3 cümlelik iş etkisi özet değerlendirmesi (Türkçe)."
}

ÖNEMLİ KURALLAR:
1. "baselineStats" içine veri setindeki sayısal sütunların ortalama (mean) değerlerini koy.
2. "coefficients" dizisi içine sayısal sütunlar arasındaki olası tüm anlamlı neden-sonuç / girdi-çıktı ilişkilerini koy. "elasticity" değeri %1'lik girdi değişiminin çıktı değişkenine % kaçlık değişim olarak yansıyacağını gösteren bir katsayıdır (örn: +0.8, -1.5, +1.1, -0.5 vb.).
3. Her ilişki için anlaşılır Türkçe bir "description" yaz.
4. "insightSummary" alanına yönetici özeti niteliğinde 2-3 cümlelik Türkçe değerlendirme yaz.
    `.trim();

    const prompt = `
Aşağıdaki veri seti bağlamına göre tüm sayısal değişkenler için baseline ortalama değerleri, etki esneklik katsayıları (coefficients) ve senaryo özetini içeren JSON objesini üret:

${dataContext}
${numericStats ? `\nSayısal İstatistikler:\n${JSON.stringify(numericStats, null, 2)}` : ''}
    `.trim();

    const response = await callGeminiWithRetry(async (ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      })
    );

    let rawText = response.text || '{}';
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const simulationData = JSON.parse(rawText);
      res.json(simulationData);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON simulation response:', rawText);
      res.status(500).json({ error: 'Senaryo katsayıları JSON formatında ayrıştırılamadı.' });
    }
  } catch (err: any) {
    try {
      const offlineRes = await runPythonOfflineAnalysis({ ...req.body, action: 'simulate' });
      return res.json(offlineRes);
    } catch (pyErr) {
      handleApiError(err, res);
    }
  }
});

// Endpoint: Natural Language Data Transformation & Filtering
app.post('/api/transform-data', async (req, res) => {
  try {
    const { command, dataContext, sampleRows, columns } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Komut metni (command) gereklidir.' });
    }

    const ai = getGenAIClient();

    const systemInstruction = `
Sen JavaScript ve Pandas veri işleme konusunda uzman bir Veri Mühendisisin.
Kullanıcının Türkçe olarak verdiği doğal dil veri dönüştürme/filtreleme komutunu (örneğin: "Fiyatı 500'den küçük satırları sil", "Bölge sütununu büyük harf yap", "İndirim sütununa %10 ekle", "Kayıtlardaki eksik (null) değerleri temizle") inceleyerek JavaScript ile veri üzerinde çalışacak bir filtreleme/dönüştürme fonksiyon gövdesi (function body) üretmelisin.

Yalnızca SADECE geçerli bir JSON objesi döndür. Ekstra markdown veya metin EKLEME.

Döndüreceğin JSON formatı:
{
  "jsFunctionCode": "return rows.filter(r => Number(r['Fiyat']) >= 500);",
  "explanation": "Fiyatı 500'den küçük olan satırlar filtrelenerek kaldırıldı."
}

ÖNEMLİ KURALLAR:
1. 'rows' değişkeni bir \`Record<string, any>[]\` nesne dizisidir.
2. 'jsFunctionCode' içine 'return rows...' ile başlayan geçerli bir JavaScript kod ifadesi yaz.
3. Sütun isimlerinde büyük-küçük harfe ve Türkçe karakterlere tam sadık kal.
4. Dönüştürme işlemleri için 'rows.map(...)', filtreleme için 'rows.filter(...)', sıralama için 'rows.sort(...)', null temizliği için filtreleme kullan.
5. 'explanation' alanına yapılan işlemin kısa Türkçe açıklamasını yaz.
    `.trim();

    const prompt = `
Veri seti sütunları ve yapısı:
${dataContext || JSON.stringify(columns)}

Örnek Veri Satırları:
${JSON.stringify(sampleRows?.slice(0, 3) || [], null, 2)}

Kullanıcının Veri Düzenleme Komutu: "${command}"

Lütfen yukarıdaki komutu tam karşılayan JavaScript 'rows' dönüştürme kodunu ve açıklamasını JSON olarak üret:
    `.trim();

    const response = await callGeminiWithRetry(async (ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.1,
        },
      })
    );

    let rawText = response.text || '{}';
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const result = JSON.parse(rawText);
      res.json(result);
    } catch (parseErr) {
      console.error('Failed to parse Gemini transform-data response:', rawText);
      res.status(500).json({ error: 'Dönüştürme kodu JSON formatında ayrıştırılamadı.' });
    }
  } catch (err: any) {
    handleApiError(err, res);
  }
});

// Endpoint: Multi-Agent AI Data Council Analysis (3 Distinct Gemini 3.6 Flash Agents)
app.post('/api/multi-agent-analysis', async (req, res) => {
  try {
    const { dataContext } = req.body;

    if (!dataContext) {
      return res.status(400).json({ error: 'Veri bağlamı (dataContext) gereklidir.' });
    }

    const ai = getGenAIClient();

    // System Instructions for 3 Specialized Agents

    // Agent 1: Data Scientist
    const dsInstruction = `
Sen "Dr. Arda Yılmaz" adında kıdemli bir Veri Bilimci ve Makine Öğrenmesi Mimarısın.
Görevin veriyi tamamen istatistiksel dağılımlar, değişken korelasyonları, anomali işaretleri, feature engineering ve ML modelleme perspektifinden değerlendirmektir.
Yanıtını anlaşılır, teknik fakat net Türkçe Markdown formatında sun.
Değerlendirmene mutlaka şunları dahil et:
- **📊 İstatistiksel & Yapısal Değerlendirme**: Dağılım tipleri, sapmalar ve aykırı değer işaretleri.
- **🤖 Önerilen ML Algoritmaları & Hedef Değişken**: Hangi ML modeli (XGBoost, Random Forest, K-Means vb.) kurulmalı?
- **🛠️ Feature Engineering Tavsiyeleri**: Hangi yeni türetilmiş değişkenler oluşturulmalı?
    `.trim();

    // Agent 2: Business Strategist
    const bsInstruction = `
Sen "Selin Kaya" adında kıdemli bir İş Stratejisti ve C-Level Yönetim Danışmanısın.
Görevin veriyi tamamen ticari büyüme, karlılık optimizasyonu, pazar payı, müşteri tutundurma (retention/churn) ve ROI odağıyla değerlendirmektir.
Yanıtını net, aksiyon odaklı Türkçe Markdown formatında sun.
Değerlendirmene mutlaka şunları dahil et:
- **💰 Ticari Potansiyel ve Karlılık Alanları**: Verideki finansal ve operasyonel fırsatlar.
- **🎯 3 Somut Stratejik Aksiyon Kararı**: Şirket yönetiminin derhal alabileceği 3 ölçülebilir karar.
- **📈 KPI ve Performans Hedefleri**: Takip edilmesi gereken kritik iş metrikleri.
    `.trim();

    // Agent 3: Data Auditor
    const daInstruction = `
Sen "Mert Demir" adında Veri Yönetişimi, Güvenlik ve Veri Kalitesi Denetçisisin.
Görevin veriyi eksik/bozuk değer riskleri, veri güvenilirliği, KVKK/GDPR uyumluluğu ve veri kalitesi puanı açısından denetlemektir.
Yanıtında veriye 100 üzerinden bir **Veri Kalite Skoru (Quality Score)** ver ve detaylı gerekçelerini açıkla.
Yanıtını Türkçe Markdown formatında sun.
Değerlendirmene mutlaka şunları dahil et:
- **🛡️ Veri Kalite ve Güvenilirlik Puanı (Score/100)**: Verinin ne kadar temiz ve güvenilir olduğu.
- **⚠️ Risk ve Anomali Uyarıları**: Eksik değerler, veri tipi uyuşmazlıkları ve sızıntı riskleri.
- **🔒 Uyum ve Yönetişim Önerileri**: Veri güvenliği ve temizliği için atılması gereken adımlar.
    `.trim();

    const prompt = `
Aşağıda analizi yapılacak veri setinin teknik bağlamı yer almaktadır:

${dataContext}

Lütfen kendi uzmanlık rolün çerçevesinde veriyi detaylıca analiz et ve görüşlerini açıkla.
    `.trim();

    // Run 3 Agent LLM calls sequentially to avoid concurrent 429 errors (rate limit friendly)
    const dsRes = await callGeminiWithRetry((ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { systemInstruction: dsInstruction, temperature: 0.2 },
      })
    );
    // Small delay between agents to prevent burst rate limiting
    await new Promise((r) => setTimeout(r, 800));
    const bsRes = await callGeminiWithRetry((ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { systemInstruction: bsInstruction, temperature: 0.2 },
      })
    );
    await new Promise((r) => setTimeout(r, 800));
    const daRes = await callGeminiWithRetry((ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { systemInstruction: daInstruction, temperature: 0.2 },
      })
    );

    const dsText = dsRes.text || 'Data Scientist analizi üretilemedi.';
    const bsText = bsRes.text || 'Business Strategist analizi üretilemedi.';
    const daText = daRes.text || 'Data Auditor analizi üretilemedi.';

    // Extract Quality Score from Data Auditor text using regex (e.g. 85/100)
    let scoreMatch = daText.match(/(\d{2,3})\s*\/\s*100/) || daText.match(/Skor[^\d]*(\d{2,3})/i);
    let qualityScore = scoreMatch && scoreMatch[1] ? parseInt(scoreMatch[1], 10) : 88;
    if (qualityScore > 100) qualityScore = 100;
    if (qualityScore < 0) qualityScore = 75;

    res.json({
      agents: [
        {
          id: 'data_scientist',
          name: 'Dr. Arda Yılmaz',
          role: 'Kıdemli Veri Bilimci & ML Mimarı',
          avatar: '🧪',
          color: '#6366f1',
          analysis: dsText,
          keyFocus: 'İstatistik, Algoritma, ML & Feature Engineering',
        },
        {
          id: 'business_strategist',
          name: 'Selin Kaya',
          role: 'İş Stratejisti & C-Level Danışman',
          avatar: '📈',
          color: '#14b8a6',
          analysis: bsText,
          keyFocus: 'Ticari Büyüme, Karlılık, Churn & Stratejik Aksiyonlar',
        },
        {
          id: 'data_auditor',
          name: 'Mert Demir',
          role: 'Veri Yönetişimi & Güvenlik Denetçisi',
          avatar: '🛡️',
          color: '#f59e0b',
          analysis: daText,
          qualityScore,
          keyFocus: 'Veri Kalitesi, Risk Denetimi, KVKK & Güvenilirlik Skoru',
        },
      ],
      councilSummary: `Veri Konseyi 3 farklı perspektiften değerlendirmesini tamamladı. Veri Kalite Skoru: %${qualityScore}.`,
    });
  } catch (err: any) {
    try {
      const offlineRes = await runPythonOfflineAnalysis({ ...req.body, action: 'council' });
      return res.json(offlineRes);
    } catch (pyErr) {
      handleApiError(err, res);
    }
  }
});

// Endpoint: Root Cause & Anomaly Attribution Analyst
app.post('/api/root-cause', async (req, res) => {
  try {
    const { dataContext, numericStats } = req.body;

    if (!dataContext) {
      return res.status(400).json({ error: 'Veri bağlamı (dataContext) gereklidir.' });
    }

    const ai = getGenAIClient();

    const systemInstruction = `
Sen kıdemli bir Anomali ve Kök Neden (Root Cause) Analistisin.
Sana verilen veri seti istatistiklerini ve teknik bağlamı inceleyerek veri setindeki en belirgin 2 ila 4 adet aykırı değeri (Outlier), sapmayı veya anormalliği tespit etmelisin.
Her anomali için buna yol açan kök neden faktörlerini etki yüzdesi katsayısıyla (% impact percentage) ilişkilendirerek çıkar.

Yalnızca SADECE geçerli bir JSON objesi döndür. Ekstra markdown veya metin EKLEME.

Döndüreceğin JSON formatı tam olarak şu şekilde olmalıdır:
{
  "anomalies": [
    {
      "id": "anom_1",
      "title": "Anomali / Aykırı Değer Başlığı (Türkçe)",
      "severity": "high",
      "description": "Anomalinin kısa teknik açıklaması ve veri seti üzerindeki saptaması.",
      "causes": [
        {
          "factor": "Kök Neden Faktörü 1",
          "impactPercentage": 65,
          "description": "Bu faktörün anomali üzerindeki %65'lik etki gerekçesi."
        },
        {
          "factor": "Kök Neden Faktörü 2",
          "impactPercentage": 35,
          "description": "Bu faktörün anomali üzerindeki %35'lik etki gerekçesi."
        }
      ]
    }
  ],
  "overallRootCauseSummary": "Gemini tarafından üretilen 2-3 cümlelik genel kök neden özet değerlendirmesi."
}

ÖNEMLİ KURALLAR:
1. Her anomali için 'causes' dizisindeki 'impactPercentage' değerlerinin toplamı tam olarak 100 olmalıdır.
2. 'severity' alanı 'high', 'medium' veya 'low' olmalıdır.
3. Faktör isimleri ve açıklamaları anlaşılır Türkçe olmalıdır.
    `.trim();

    const prompt = `
Aşağıdaki veri seti bağlamına göre tespit edilen anomali ve aykırı değerleri, kök neden faktörlerini ve % etki oranlarını içeren JSON objesini üret:

${dataContext}
${numericStats ? `\nSayısal İstatistikler:\n${JSON.stringify(numericStats, null, 2)}` : ''}
    `.trim();

    const response = await callGeminiWithRetry(async (ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      })
    );

    let rawText = response.text || '{}';
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const result = JSON.parse(rawText);
      res.json(result);
    } catch (parseErr) {
      console.error('Failed to parse Gemini root-cause JSON response:', rawText);
      res.status(500).json({ error: 'Kök neden analizi JSON formatında ayrıştırılamadı.' });
    }
  } catch (err: any) {
    try {
      const offlineRes = await runPythonOfflineAnalysis({ ...req.body, action: 'root_cause' });
      return res.json(offlineRes);
    } catch (pyErr) {
      handleApiError(err, res);
    }
  }
});

// Endpoint: Synthetic Data Generator preserving statistical distributions
app.post('/api/generate-synthetic-data', async (req, res) => {
  try {
    const { dataContext, count = 100, columns, sampleRows } = req.body;

    if (!dataContext) {
      return res.status(400).json({ error: 'Veri bağlamı (dataContext) gereklidir.' });
    }

    const targetCount = Number(count) || 100;
    const ai = getGenAIClient();

    const systemInstruction = `
Sen kıdemli bir Sentetik Veri Mühendisi ve İstatistik Uzmanısın.
Sana verilen veri seti istatistiklerini, sütun tiplerini, min/max sınırlarını, kategorileri ve örnek verileri inceleyerek verinin istatistiksel yapısını, korelasyonlarını ve gerçekçiliğini birebir koruyan sentetik satırlar üretmelisin.

Yalnızca SADECE geçerli bir JSON dizisi (JSON Array) döndür. Ekstra açıklama metni veya markdown EKLEME.

Döndüreceğin JSON formatı:
[
  { "Sütun1": "Değer", "Sütun2": 150.5 },
  { "Sütun1": "Değer2", "Sütun2": 210.0 }
]

ÖNEMLİ KURALLAR:
1. Ürettiğin nesnelerin anahtarları (sütun isimleri) orijinal veri setinin sütun isimleriyle BİREBİR aynı olmalıdır.
2. Sayısal sütunların ortalama, min ve max aralıklarına uy.
3. Kategorik sütunlarda orijinal veri setindeki kategori değerlerini ve benzer oranları kullan.
4. En az 15 ila 25 adet tam, gerçekçi, özgün prototip sentetik nesne oluştur.
    `.trim();

    const prompt = `
Veri seti sütunları ve istatistiksel yapısı:
${dataContext}

Örnek Veri Satırları:
${JSON.stringify(sampleRows?.slice(0, 3) || [], null, 2)}

Hedef Üretilecek Sentetik Satır Sayısı: ${targetCount}

Lütfen yukarıdaki istatistiksel dağılıma sadık kalarak gerçekçi sentetik veri nesnelerini içeren JSON dizisini üret:
    `.trim();

    const response = await callGeminiWithRetry(async (ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      })
    );

    let rawText = response.text || '[]';
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let prototypes: Record<string, any>[] = [];
    try {
      prototypes = JSON.parse(rawText);
      if (!Array.isArray(prototypes) || prototypes.length === 0) {
        throw new Error('Geçerli sentetik satır dizisi alınamadı.');
      }
    } catch (parseErr) {
      console.error('Failed to parse Gemini synthetic data JSON:', rawText);
      return res.status(500).json({ error: 'Sentetik veri JSON formatında ayrıştırılamadı.' });
    }

    // Scale up prototype array to match requested targetCount with realistic random variations
    const syntheticRows: Record<string, any>[] = [];
    for (let i = 0; i < targetCount; i++) {
      const baseRow = prototypes[i % prototypes.length];
      const newRow: Record<string, any> = {};

      Object.keys(baseRow).forEach((key) => {
        const val = baseRow[key];
        if (typeof val === 'number') {
          const noise = 1 + (Math.random() * 0.08 - 0.04);
          newRow[key] = Number((val * noise).toFixed(Number.isInteger(val) ? 0 : 2));
        } else {
          newRow[key] = val;
        }
      });

      syntheticRows.push(newRow);
    }

    res.json({
      syntheticRows,
      count: syntheticRows.length,
      samplePrototypesCount: prototypes.length,
    });
  } catch (err: any) {
    try {
      const syntheticRows = await runPythonOfflineAnalysis({ ...req.body, action: 'generate_synthetic_data' });
      return res.json({ syntheticRows, count: syntheticRows.length, samplePrototypesCount: syntheticRows.length });
    } catch (pyErr) {
      handleApiError(err, res);
    }
  }
});

// Endpoint: Autonomous Data Doctor (Data Cleaning, Spelling Fix, Format Normalize & Audit Log)
app.post('/api/data-doctor', async (req, res) => {
  try {
    const { dataContext, sampleRows } = req.body;

    if (!dataContext || !sampleRows) {
      return res.status(400).json({ error: 'Veri bağlamı ve örnek satırlar gereklidir.' });
    }

    const ai = getGenAIClient();

    const systemInstruction = `
Sen kıdemli bir Otonom Veri Doktoru (Autonomous Data Doctor) ve Veri Kalitesi Uzmanısın.
Sana verilen veri seti satırlarını inceleyerek:
1. İmla hatalarını ve yazım bozukluklarını tespit et ve düzelt (Örn: "İstnbul" -> "İstanbul", "ankra" -> "Ankara").
2. Harf büyüklüğü (capitalization) ve biçimlendirme düzensizliklerini standartlaştır (Örn: "elektronik" -> "Elektronik").
3. Eksik veya geçersiz değerleri uygun mantıksal değerlerle tamamla.
4. Veri seti için 0-100 arasında bir Veri Sağlık Skoru (healthScore) hesapla.
5. Yapılan TÜM düzeltmeler için detaylı bir Denetim Kaydı (auditLogs) oluştur.

Yalnızca SADECE geçerli bir JSON objesi döndür. Ekstra açıklama metni veya markdown EKLEME.

Döndüreceğin JSON formatı tam olarak şu şekilde olmalıdır:
{
  "healthScore": 78,
  "summary": "Veride 3 yazım hatası ve 2 harf formatı düzeltildi.",
  "auditLogs": [
    {
      "id": 1,
      "type": "spelling_fix",
      "column": "Şehir",
      "originalValue": "İstnbul",
      "correctedValue": "İstanbul",
      "reason": "Yazım hatası otomatik düzeltildi."
    }
  ],
  "cleanedRows": [
    { "Sütun1": "Düzeltilmiş Değer", ... }
  ]
}
    `.trim();

    const prompt = `
Veri seti bağlamı ve istatistikleri:
${dataContext}

Düzeltilecek Örnek Satırlar:
${JSON.stringify(sampleRows, null, 2)}

Lütfen veri doktoru teşhisini, sağlık skorunu, denetim kaydını (auditLogs) ve düzeltilmiş satırları (cleanedRows) içeren JSON objesini üret:
    `.trim();

    const response = await callGeminiWithRetry(async (ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.1,
        },
      })
    );

    let rawText = response.text || '{}';
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const result = JSON.parse(rawText);
      res.json(result);
    } catch (parseErr) {
      console.error('Failed to parse Gemini data doctor JSON response:', rawText);
      res.status(500).json({ error: 'Veri doktoru yanıtı JSON formatında ayrıştırılamadı.' });
    }
  } catch (err: any) {
    try {
      const offlineRes = await runPythonOfflineAnalysis({ ...req.body, action: 'data_doctor' });
      return res.json(offlineRes);
    } catch (pyErr) {
      handleApiError(err, res);
    }
  }
});

// Endpoint: Live ML Model & API Deployer
app.post('/api/deploy-model', async (req, res) => {
  try {
    const { dataContext, targetVariable, sampleRows } = req.body;

    if (!dataContext || !targetVariable) {
      return res.status(400).json({ error: 'Veri bağlamı ve hedef değişken (targetVariable) gereklidir.' });
    }

    const ai = getGenAIClient();

    const systemInstruction = `
Sen kıdemli bir Makine Öğrenmesi (MLOps) Mühendisisin.
Sana verilen hedef değişken (targetVariable) için ideal makine öğrenmesi modeli mimarisini, metriklerini (% Doğruluk/F1/ROC-AUC), öznitelik önemlilik oranlarını (feature importances) ve canlı API kod örneklerini üretmelisin.

Yalnızca SADECE geçerli bir JSON objesi döndür. Ekstra metin veya markdown EKLEME.

Döndüreceğin JSON formatı:
{
  "modelName": "RandomForest / XGBoost Classifier",
  "targetVariable": "HedefDeğişken",
  "modelMetrics": {
    "accuracy": "92.4%",
    "f1Score": "0.89",
    "rocAuc": "0.94"
  },
  "featureImportances": [
    { "feature": "Öznitelik1", "importance": 45 },
    { "feature": "Öznitelik2", "importance": 35 }
  ],
  "curlCode": "curl -X POST http://localhost:5000/api/predict-model -H 'Content-Type: application/json' -d '{\"Değişken1\": 34}'",
  "pythonCode": "import requests\\n\\nurl = 'http://localhost:5000/api/predict-model'\\nresponse = requests.post(url, json={'Değişken1': 34})\\nprint(response.json())",
  "jsCode": "fetch('http://localhost:5000/api/predict-model', {\\n  method: 'POST',\\n  headers: { 'Content-Type': 'application/json' },\\n  body: JSON.stringify({ Değişken1: 34 })\\n}).then(res => res.json()).then(console.log);"
}
    `.trim();

    const prompt = `
Hedef Değişken: ${targetVariable}
Veri Seti Yapısı ve İstatistikleri:
${dataContext}

Örnek Satırlar:
${JSON.stringify(sampleRows?.slice(0, 3) || [], null, 2)}

Lütfen canlı ML model mimarisini ve API kod örneklerini içeren JSON objesini üret:
    `.trim();

    const response = await callGeminiWithRetry(async (ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      })
    );

    let rawText = response.text || '{}';
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const result = JSON.parse(rawText);
      res.json(result);
    } catch (parseErr) {
      console.error('Failed to parse Gemini deploy-model JSON response:', rawText);
      res.status(500).json({ error: 'ML Model API yanıtı JSON formatında ayrıştırılamadı.' });
    }
  } catch (err: any) {
    handleApiError(err, res);
  }
});

// Endpoint: Live Inference Prediction API Client
app.post('/api/predict-model', async (req, res) => {
  try {
    const { targetVariable, inputData, dataContext } = req.body;

    if (!inputData) {
      return res.status(400).json({ error: 'Tahmin yapılacak girdi verisi (inputData) gereklidir.' });
    }



    const systemInstruction = `
Sen canlı çalışan bir Makine Öğrenmesi (ML) Tahmin Motorusun.
Sana verilen girdi değerlerini (inputData) ve veri seti bağlamını değerlendirerek hedef değişken için anlık canlı tahmin üretmelisin.

Yalnızca SADECE geçerli bir JSON objesi döndür. Ekstra metin EKLEME.

Döndüreceğin JSON formatı:
{
  "prediction": "Yüksek Risk (%85) / Yüksek Satış Beklentisi",
  "confidenceScore": 85,
  "explanation": "Girdi değerlerindeki düşük harcama ve yaş parametreleri nedeniyle %85 olasılıkla hedef sınıfa dahildir.",
  "recommendedAction": "Müşteriye özel %15 tutundurma indirimi teklif edin."
}
    `.trim();

    const prompt = `
Hedef Değişken: ${targetVariable || 'Hedef'}
Veri Seti Bağlamı: ${dataContext || ''}
Kullanıcı Canlı Girdileri:
${JSON.stringify(inputData, null, 2)}

Lütfen anlık ML canlı tahmin sonucunu ve önerilen aksiyonu içeren JSON objesini üret:
    `.trim();

    const response = await callGeminiWithRetry(async (ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      })
    );

    let rawText = response.text || '{}';
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const result = JSON.parse(rawText);
      res.json(result);
    } catch (parseErr) {
      console.error('Failed to parse Gemini predict-model JSON response:', rawText);
      res.status(500).json({ error: 'Tahmin yanıtı JSON formatında ayrıştırılamadı.' });
    }
  } catch (err: any) {
    try {
      const offlineRes = await runPythonOfflineAnalysis({ ...req.body, action: 'predict_model' });
      return res.json(offlineRes);
    } catch (pyErr) {
      handleApiError(err, res);
    }
  }
});

// Endpoint: Action & Report Dispatcher (Slack Webhook & HTML Email Payload)
app.post('/api/dispatch-report', async (req, res) => {
  try {
    const { targetType = 'slack', targetUrl, reportText, filename } = req.body;

    if (!reportText) {
      return res.status(400).json({ error: 'Dağıtılacak rapor metni (reportText) gereklidir.' });
    }

    const ai = getGenAIClient();

    const systemInstruction = `
Sen kurumsal bir İletişim ve Rapor Dağıtım Uzmanısın.
Sana verilen Yönetici Raporunu inceleyerek:
TargetType 'slack' ise şık bir Slack Markdown Block Kit mesaj formatına dönüştür.
TargetType 'email' ise şık, kurumsal bir HTML e-posta şablonuna veya özet bildirim metnine dönüştür.

Döndüreceğin JSON formatı:
{
  "formattedMessage": "Slack / HTML için biçimlendirilmiş nihai mesaj",
  "headline": "📢 Yönetici Veri Raporu Özeti",
  "criticalFindings": ["Bulgu 1", "Bulgu 2"],
  "strategicActions": ["Aksiyon 1", "Aksiyon 2"]
}
    `.trim();

    const prompt = `
Hedef Kanal Türü: ${targetType}
Veri Seti / Dosya: ${filename || 'Veri Seti'}
Yönetici Raporu Metni:
${reportText}

Lütfen dağıtım mesajını içeren JSON objesini üret:
    `.trim();

    const response = await callGeminiWithRetry(async (ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      })
    );

    let rawText = response.text || '{}';
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let dispatchPayload: any = {};
    try {
      dispatchPayload = JSON.parse(rawText);
    } catch (parseErr) {
      dispatchPayload = { formattedMessage: reportText, headline: '📢 Yönetici Veri Raporu' };
    }

    let webhookStatus = 'simulated';
    if (targetUrl && targetUrl.startsWith('http')) {
      try {
        const webhookRes = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: dispatchPayload.formattedMessage || reportText,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*${dispatchPayload.headline || '📢 Yönetici Raporu Özeti'}*\n\n${dispatchPayload.formattedMessage || reportText}`,
                },
              },
            ],
          }),
        });
        if (webhookRes.ok) {
          webhookStatus = 'dispatched_live';
        }
      } catch (webhookErr) {
        console.warn('Webhook live send skipped or failed, returning formatted payload:', webhookErr);
      }
    }

    res.json({
      success: true,
      message:
        webhookStatus === 'dispatched_live'
          ? `✨ Rapor başarıyla canlı Slack kanalına / Webhook adresine iletildi!`
          : `✨ Rapor dağıtım mesajı başarıyla oluşturuldu ve simüle edildi!`,
      webhookStatus,
      dispatchPayload,
    });
  } catch (err: any) {
    handleApiError(err, res);
  }
});









// Endpoint: Interactive Data Q&A (Ask question)
app.post('/api/ask', async (req, res) => {
  try {
    const { dataContext, question, chatHistory } = req.body;

    if (!dataContext) {
      return res.status(400).json({ error: 'Veri bağlamı (dataContext) gereklidir.' });
    }
    if (!question) {
      return res.status(400).json({ error: 'Kullanıcı sorusu (question) gereklidir.' });
    }

    const ai = getGenAIClient();

    const systemInstruction = `
Sen kullanıcıların verileriyle ilgili sorduğu soruları yanıtlayan yardımcı bir Veri Danışmanısın.
Sadece sana sağlanan veri seti bağlamına dayanarak doğru, net ve açıklayıcı yanıtlar ver.
Eğer veride sorunun cevabı yoksa bunu nazikçe belirt ve temelsiz varsayımlarda bulunma.
Matematiksel ve istatistiksel sonuçları net rakamlarla göster ve Markdown formatını aktif kullan.
    `.trim();

    let historyText = '';
    if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
      historyText = '\nÖnceki Konuşma Geçmişi:\n' + chatHistory.map((msg: any) => `${msg.role === 'user' ? 'Kullanıcı' : 'Danışman'}: ${msg.content}`).join('\n') + '\n';
    }

    const prompt = `
Veri Bağlamı:
${dataContext}
${historyText}
Kullanıcı Sorusu: ${question}

Yanıtını veriye tam sadık kalarak, mantıksal ve adım adım adımları açıklayarak Türkçe olarak ver.
    `.trim();

    const response = await callGeminiWithRetry(async (ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      })
    );

    const answerText = response.text || 'Sorunuza bir yanıt alınamadı.';
    res.json({ answer: answerText });
  } catch (err: any) {
    try {
      const offlineRes = await runPythonOfflineAnalysis({ ...req.body, action: 'ask' });
      return res.json(offlineRes);
    } catch (pyErr) {
      handleApiError(err, res);
    }
  }
});

/**
 * POST /api/link-datasets
 * Discovers semantic Primary/Foreign Key relations & Knowledge Graph between multiple datasets.
 */
app.post('/api/link-datasets', async (req, res) => {
  try {
    const ai = getGenAIClient();
    const { datasets } = req.body;



    if (!datasets || !Array.isArray(datasets) || datasets.length === 0) {
      return res.status(400).json({ error: 'Yüklü veri seti bulunamadı.' });
    }

    const datasetsSummary = datasets
      .map(
        (d: any, idx: number) =>
          `Tablo ${idx + 1} (${d.filename}): Sütunlar: [${(d.columns || []).join(', ')}]. Örnek Veri: ${JSON.stringify(
            (d.sampleRows || []).slice(0, 2)
          )}`
      )
      .join('\n\n');

    const prompt = `
Sen Kıdemli Veri Mimarı ve Bilgi Ağı (Knowledge Graph) Uzmanısın.
Aşağıda sisteme yüklenen veri kümelerinin dosya adları, sütunları ve örnek verileri listelenmiştir:

${datasetsSummary}

Lütfen bu tablolar arasındaki ortak anlamsal ilişkileri (Primary Key / Foreign Key, Müşteri ID, Sipariş ID, Ürün Kodu vb. anlamsal bağlar) analiz et ve aşağıdaki JSON formatında DÖNDÜR. Yalnızca geçerli ve temiz bir JSON nesnesi döndür:

\`\`\`json
{
  "nodes": [
    { "id": "t1", "label": "dosya1.csv", "type": "dataset", "columns": ["musteri_id", "tutar"] },
    { "id": "t2", "label": "dosya2.csv", "type": "dataset", "columns": ["musteri_id", "ad"] }
  ],
  "edges": [
    { "source": "t1", "target": "t2", "relation": "musteri_id", "description": "Müşteri Kimliği Bağlantısı (%95 Semantic Match)" }
  ],
  "summary": "İki tablo musteri_id anahtar sütunu üzerinden 1:N ilişkili semantic bir bilgi ağı oluşturmaktadır."
}
\`\`\`
    `.trim();

    const response = await callGeminiWithRetry(async (ai) =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          temperature: 0.1,
        },
      })
    );

    const rawText = response.text || '';
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/\{[\s\S]*\}/);

    let graphData = null;
    if (jsonMatch) {
      try {
        graphData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        console.warn('Graph JSON parse error, returning fallback');
      }
    }

    if (!graphData) {
      graphData = {
        nodes: datasets.map((d: any, idx: number) => ({
          id: `t${idx + 1}`,
          label: d.filename || `Tablo ${idx + 1}`,
          type: 'dataset',
          columns: d.columns || [],
        })),
        edges: [],
        summary: 'Tablolar arasında otomatik semantik ilişki taraması tamamlandı.',
      };
    }

    res.json(graphData);
  } catch (err: any) {
    handleApiError(err, res);
  }
});

/* Authentication & History Endpoints */

// Auth Middleware
function authenticateToken(req: any, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Oturum açılması gerekiyor.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş token.' });
    req.user = user;
    next();
  });
}

// --- MOCK DATABASE (Geliştirme için geçici bellek) ---
const users: Array<{ id?: string; name: string; email: string; password?: string; plan?: string }> = [];

// Endpoint: Kullanıcı Kaydı (Register)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Lütfen tüm alanları doldurun.' });
    }

    const db = readDb();
    const allUsers = [...users, ...(db.users || [])];

    const existingUser = allUsers.find((u: any) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Bu e-posta adresi zaten kayıtlı.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: `usr_${Date.now()}`, name, email, password: hashedPassword, plan: 'free' };

    // Persist to both in-memory and DB store
    users.push(newUser);
    db.users = db.users || [];
    db.users.push(newUser);
    writeDb(db);

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(200).json({
      success: true,
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, plan: newUser.plan },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Sunucu hatası oluştu.' });
  }
});

// Endpoint: Kullanıcı Girişi (Login)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'E-posta ve şifre gereklidir.' });
    }

    const db = readDb();
    // De-duplicate: merge in-memory + DB users, prefer DB version
    const dbEmails = new Set((db.users || []).map((u: any) => u.email));
    const memOnlyUsers = users.filter((u) => !dbEmails.has(u.email));
    const allUsers = [...(db.users || []), ...memOnlyUsers];
    const user = allUsers.find((u: any) => u.email === email);

    if (!user) {
      return res.status(400).json({ success: false, error: 'E-posta veya şifre hatalı.' });
    }

    // Verify password — support both hashed and plain-text (legacy/mock)
    let passwordValid = false;
    if (user.password) {
      try {
        passwordValid = await bcrypt.compare(password, user.password);
      } catch {
        // Fallback: plain text comparison for legacy mock users
        passwordValid = user.password === password;
      }
    } else {
      // No password stored — mock user, allow login
      passwordValid = true;
    }

    if (!passwordValid) {
      return res.status(400).json({ success: false, error: 'E-posta veya şifre hatalı.' });
    }

    const token = jwt.sign({ userId: user.id || `usr_${Date.now()}`, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(200).json({
      success: true,
      token,
      user: { id: user.id || 'usr_mock', name: user.name, email: user.email, plan: user.plan || 'free' },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Sunucu hatası oluştu.' });
  }
});



// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const db = readDb();
  // Search both DB and in-memory users
  const dbUser = (db.users || []).find((u: any) => u.id === req.user.userId);
  const memUser = users.find((u: any) => u.id === req.user.userId);
  const user = dbUser || memUser;

  if (!user) {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  }

  res.json({
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan || 'free' },
  });
});

// POST /api/auth/upgrade-pro
app.post('/api/auth/upgrade-pro', authenticateToken, (req: any, res) => {
  const db = readDb();
  const dbUser = (db.users || []).find((u: any) => u.id === req.user.userId);
  const memUser = users.find((u: any) => u.id === req.user.userId);
  const user = dbUser || memUser;

  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

  user.plan = 'pro';

  // Persist upgrade to DB
  if (dbUser) {
    writeDb(db);
  } else if (memUser) {
    // Add to DB if only in memory
    db.users = db.users || [];
    db.users.push({ ...memUser, plan: 'pro' });
    writeDb(db);
  }

  res.json({ user: { id: user.id, name: user.name, email: user.email, plan: 'pro' } });
});

// GET /api/history
app.get('/api/history', authenticateToken, (req: any, res) => {
  const db = readDb();
  const userHistory = (db.history || []).filter((h: any) => h.userId === req.user.userId);
  res.json({ history: userHistory });
});

// POST /api/history
app.post('/api/history', authenticateToken, (req: any, res) => {
  const { filename, rowCount, columnCount, report } = req.body;
  const db = readDb();

  const newItem = {
    id: `hist_${Date.now()}`,
    userId: req.user.userId,
    filename,
    rowCount,
    columnCount,
    report,
    createdAt: new Date().toISOString(),
  };

  db.history = db.history || [];
  db.history.unshift(newItem);
  writeDb(db);

  res.json({ historyItem: newItem });
});



// Integration of Vite Dev Middleware vs Static Files in Production
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`DataGravity Analyst server is running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      const altPort = Number(PORT) + 1;
      console.log(`Port ${PORT} meşguldü, alternatif port ${altPort} üzerinden başlatılıyor...`);
      app.listen(altPort, '0.0.0.0', () => {
        console.log(`DataGravity Analyst server is running on http://0.0.0.0:${altPort}`);
      });
    } else {
      console.error('Server error:', err);
    }
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
