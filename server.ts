import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

import fs from 'fs';

// Helper to initialize GoogleGenAI lazily
function getGenAIClient() {
  let apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Attempt fallback from .streamlit/secrets.toml if present
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
      // Ignore reading error
    }
  }

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY bulunamadı! Lütfen Secrets veya .streamlit/secrets.toml dosyasını kontrol edin.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint: Generate Executive Summary Report
app.post('/api/analyze', async (req, res) => {
  try {
    const { dataContext, focusArea } = req.body;

    if (!dataContext) {
      return res.status(400).json({ error: 'Veri bağlamı (dataContext) gereklidir.' });
    }

    const ai = getGenAIClient();

    const systemInstruction = `
Sen kıdemli bir Veri Bilimci ve İş Analistisin.
Sana verilen veri seti özet bilgilerini inceleyerek iş değeri yüksek, teknik ve aksiyona dönüştürülebilir analizler sunmalısın.
Yanıtlarını profesyonel, anlaşılır ve düzenli Markdown formatında Türkçe olarak hazırla.
    `.trim();

    let focusInstruction = '';
    if (focusArea) {
      focusInstruction = `\nLütfen analizinde özellikle **${focusArea}** konusuna/odağına öncelik ver ve derinleştir.`;
    }

    const prompt = `
Aşağıda analizi yapılacak veri setinin teknik özeti yer almaktadır:

${dataContext}
${focusInstruction}

Lütfen yukarıdaki verileri detaylıca inceleyerek tam olarak şu 4 ana başlık altında kapsamlı bir analiz raporu sun:

1. **📌 Genel Veri Özeti**: Verinin ne tür bir iş sürecine ait olduğunu tahmin et, sütunların yapısını ve veri kalitesini (eksik veriler, tipler, genel tutarlılık) değerlendir.
2. **🔍 Kritik Bulgular ve Eğilimler**: İstatistiksel özet (mean, std, min, max, quartiles) verilerinde göze çarpan önemli dağılımlar, değişkenler arasındaki olası ilişkiler, aykırı değer veya anomali işaretleri nelerdir?
3. **💡 Stratejik İş Önerileri**: Bu veriden yola çıkarak şirket yönetimi ve karar vericilerin alabileceği 3 ila 5 somut, ölçülebilir aksiyon önerisi sun.
4. **🤖 Önerilen Makine Öğrenmesi Modelleri**: Bu veri setiyle hangi ML problemleri (sınıflandırma, regresyon, kümeleme, zaman serisi vb.) çözülebilir? Hangi hedef değişken (target variable) seçilmeli ve hangi model algoritmaları (örn: XGBoost, Random Forest, K-Means) uygulanmalıdır?
    `.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const reportText = response.text || 'Analiz raporu oluşturulamadı.';
    res.json({ report: reportText });
  } catch (err: any) {
    console.error('API /api/analyze error:', err);
    res.status(500).json({
      error: err.message || 'Yapay zeka analizi sırasında bir hata oluştu.',
    });
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const answerText = response.text || 'Sorunuza bir yanıt alınamadı.';
    res.json({ answer: answerText });
  } catch (err: any) {
    console.error('API /api/ask error:', err);
    res.status(500).json({
      error: err.message || 'Soru yanıtlanırken bir hata oluştu.',
    });
  }
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gemini Data Analyst server is running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
