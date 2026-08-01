# 🧠 DataGravity Analyst — Enterprise AI Data Analytics Platform

<p align="center">
  <img src="https://img.shields.io/badge/Gemini-3.6%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/version-2.0%20Pro-6366F1?style=for-the-badge" />
</p>

> **DataGravity Analyst**, kurumsal düzeyde yapay zeka destekli bir veri analiz platformudur. CSV/Excel dosyalarınızı yükleyin; Gemini 3.6 Flash modeli anında yönetici raporları, görsel grafikler, kök neden analizleri ve stratejik iş önerileri üretsin.

---

## 🚀 Özellikler

### 📊 Temel Analiz Modülleri
| Modül | Açıklama |
|---|---|
| **Yönetici Raporu** | Gemini 3.6 Flash ile otomatik üretilen detaylı Markdown raporu + 45 saniyelik podcast sesli özeti |
| **Veri Danışmanı** | Verilerinizle sohbet edin, doğal dilde soru sorun |
| **Görsel Keşif** | AI destekli grafik önerileri (Bar, Line, Pie, Area) — Recharts ile |
| **Veri Tablosu** | Gelişmiş filtreleme, sıralama, istatistik ve sütun yönetimi |

### 🤖 AI Modülleri
| Modül | Endpoint |
|---|---|
| **Multi-Agent AI Konseyi** | 3 farklı uzman ajan (Veri Bilimci, Stratejist, Denetçi) sıralı analiz |
| **What-If Senaryo Simülatörü** | Esneklik katsayıları ve etki matrisi üretimi |
| **Kök Neden Analistı** | Anomali ve outlier tespiti, % etki faktörleri |
| **Otonom Veri Doktoru** | Yazım hatası düzeltme, format ayarlama, sağlık skoru |
| **Sentetik Veri Üretici** | İstatistiksel yapıyı koruyan gerçekçi sentetik satırlar |
| **ML Model Deployer** | Hedef değişken bazlı model mimarisi ve API kod üretimi |
| **Doğal Dil SQL Üreteci** | Türkçe sorguları SQL'e dönüştür |
| **Python Kodu Üretici** | Pandas / Scikit-Learn / XGBoost kodu otomatik üretimi |

### 📤 Dışa Aktarım
- 📊 **PowerPoint (.pptx)** — 4 slaytlı kurumsal sunum (pptxgenjs)
- 📄 **Markdown (.md)** — Ham rapor metni
- 🌐 **HTML Paneli** — Stillendirilmiş standalone HTML dosyası
- 🖨️ **PDF / Yazdır** — Tarayıcı print diyaloğu
- 📢 **Slack / E-posta Dispatcher** — Raporu ekiple paylaş

### 🎙️ Ekstra
- **Jarvis Sesli Asistan** (Pro) — Web Speech API ile sesli veri sorgusu
- **Ctrl+K Komut Paleti** — Hızlı gezinme ve arama
- **Kullanıcı Kimlik Doğrulama** — JWT tabanlı kayıt/giriş ve analiz geçmişi
- **Knowledge Graph** — Çoklu veri seti semantik ilişki haritası
- **3D Data Universe** — Three.js ile veri noktaları görselleştirme
- **Data Reel** — 30 saniyelik dikey video özeti (sosyal medya formatı)

---

## 🛠️ Teknoloji Yığını

### Frontend
- **React 19** + **TypeScript 5.8**
- **Tailwind CSS 4** (Dark Mode + Glassmorphism)
- **Framer Motion** — animasyonlar
- **Recharts** — veri görselleştirme
- **Three.js** — 3D görselleştirme
- **Lucide React** — ikonlar
- **React Markdown** — rapor render

### Backend
- **Express.js 4** + **TypeScript**
- **@google/genai** SDK (`gemini-3.6-flash` modeli)
- **jsonwebtoken** — JWT kimlik doğrulama
- **bcryptjs** — şifre hashleme
- **papaparse** — CSV ayrıştırma
- **pptxgenjs** — PowerPoint oluşturma
- **xlsx** — Excel dosya desteği

### Geliştirme
- **Vite 6** — frontend bundler + dev server proxy
- **tsx** — TypeScript backend çalıştırıcı
- **esbuild** — production build

---

## ⚡ Hızlı Başlangıç

### 1. Gereksinimleri Yükle
```bash
npm install
```

### 2. Ortam Değişkenlerini Ayarla
`.env` dosyasını oluştur (veya `.env.example`'ı kopyala):
```bash
cp .env.example .env
```

`.env` dosyasını düzenle:
```env
# Google Gemini API Anahtarı (zorunlu)
GEMINI_API_KEY=your_gemini_api_key_here

# Opsiyonel: Ek API anahtarları (Rate Limit döngüsü için)
GEMINI_API_KEY_2=your_second_key_here
GEMINI_API_KEY_3=your_third_key_here

# JWT Gizli Anahtarı
JWT_SECRET=your_super_secret_jwt_key

# Sunucu Portu
PORT=3000
```

> **Not:** API anahtarı [Google AI Studio](https://aistudio.google.com/app/apikey) adresinden ücretsiz alınabilir.

### 3. Geliştirme Sunucusunu Başlat
```bash
npm run dev
```

Uygulama **http://localhost:3000** adresinde çalışır.

### 4. Production Build (Opsiyonel)
```bash
npm run build
npm start
```

---

## 🗂️ Proje Yapısı

```
DataGravity-AI/
├── server.ts                         # Express.js backend + tüm API endpointleri
├── src/
│   ├── App.tsx                       # Ana React uygulaması
│   ├── main.tsx                      # React entry point
│   ├── index.css                     # Global stiller
│   ├── components/
│   │   ├── Navbar.tsx                # 2-tier header (logo, arama, kullanıcı)
│   │   ├── ExecutiveReportView.tsx   # Yönetici raporu görünümü
│   │   ├── DataChatView.tsx          # AI Veri Danışmanı chat
│   │   ├── DataVisualizerView.tsx    # Recharts grafik paneli
│   │   ├── DataTableStatsView.tsx    # Gelişmiş veri tablosu
│   │   ├── MultiAgentCouncilView.tsx # 3'lü AI konsey paneli
│   │   ├── WhatIfSimulator.tsx       # Senaryo simülatörü
│   │   ├── RootCauseAnalystView.tsx  # Kök neden analistı
│   │   ├── DataDoctorView.tsx        # Veri doktoru
│   │   ├── MlModelApiDeployer.tsx    # ML model deployer
│   │   ├── KnowledgeGraphView.tsx    # Semantik ilişki grafiği
│   │   ├── ThreeDDataUniverseView.tsx # Three.js 3D görselleştirme
│   │   ├── AuthModal.tsx             # Kayıt / Giriş modal
│   │   ├── CommandPaletteModal.tsx   # Ctrl+K komut paleti
│   │   ├── JarvisVoiceAssistantModal.tsx # Sesli asistan
│   │   ├── SleekErrorCard.tsx        # Kullanıcı dostu hata kartı
│   │   ├── SmartAiLoader.tsx         # AI yükleme animasyonu
│   │   ├── FileUploadSection.tsx     # Dosya yükleme alanı
│   │   └── ...
│   ├── utils/
│   │   ├── dataAnalyzer.ts    # CSV/Excel ayrıştırma ve istatistik
│   │   ├── errorMapper.ts     # Hata mesajı dönüştürücü (formatErrorMessage)
│   │   ├── exportUtils.ts     # PDF/HTML/MD dışa aktarım
│   │   └── pptxExport.ts      # PowerPoint oluşturucu (4 slayt)
│   └── types/
│       └── data.ts            # TypeScript tip tanımları
├── data_store.json             # Kullanıcı ve analiz geçmişi (otomatik oluşur)
├── .env                       # Ortam değişkenleri (git'e eklenmez)
├── .env.example               # Örnek env şablonu
├── .streamlit/
│   └── secrets.toml           # Alternatif API key kaynağı
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔌 API Endpointleri

### AI Analiz Endpointleri
| Method | Endpoint | Açıklama |
|---|---|---|
| `POST` | `/api/analyze` | Yönetici raporu + podcast özeti üret |
| `POST` | `/api/ask` | Doğal dil veri sorusu sor |
| `POST` | `/api/recommend-charts` | AI grafik önerileri al |
| `POST` | `/api/generate-python` | Python kodu üret |
| `POST` | `/api/generate-sql` | SQL sorgusu üret |
| `POST` | `/api/transform-data` | Doğal dil veri dönüşümü |
| `POST` | `/api/simulate` | What-If senaryo simülasyonu |
| `POST` | `/api/multi-agent-analysis` | 3'lü AI konsey analizi |
| `POST` | `/api/root-cause` | Kök neden ve anomali analizi |
| `POST` | `/api/generate-synthetic-data` | Sentetik veri üret |
| `POST` | `/api/data-doctor` | Otonom veri temizleme |
| `POST` | `/api/deploy-model` | ML model mimarisi ve API kodu |
| `POST` | `/api/predict-model` | Canlı ML tahmini |
| `POST` | `/api/dispatch-report` | Slack/E-posta rapor dağıtımı |
| `POST` | `/api/link-datasets` | Çoklu veri seti ilişki grafiği |

### Auth & Kullanıcı Endpointleri
| Method | Endpoint | Açıklama |
|---|---|---|
| `POST` | `/api/auth/register` | Kullanıcı kaydı (bcrypt hash) |
| `POST` | `/api/auth/login` | Kullanıcı girişi (JWT token) |
| `GET` | `/api/auth/me` | Profil bilgisi (token gerekli) |
| `POST` | `/api/auth/upgrade-pro` | Pro plan aktivasyonu |
| `GET` | `/api/history` | Analiz geçmişini listele |
| `POST` | `/api/history` | Geçmişe analiz kaydet |

### Sistem Endpointleri
| Method | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/api/health` | Sunucu sağlık kontrolü |
| `GET` | `/api/check-key` | Gemini API anahtarı durumu |

---

## 🛡️ Hata Yönetimi

### Exponential Backoff Retry
Tüm Gemini API çağrıları `callGeminiWithRetry()` fonksiyonu ile korunmaktadır:

```
1. Deneme başarısız → 2 saniye bekle
2. Deneme başarısız → 3 saniye bekle  (1.5x)
3. Deneme başarısız → 4.5 saniye bekle (1.5x)
→ Hata fırlatılır
```

**Multi-Agent Konseyi:** 3 ajan çağrısı arasında 800ms gecikme ile burst rate limit önlenir.

### API Anahtar Döngüsü
429 hatası alındığında sistem otomatik olarak bir sonraki anahtara geçer:
```
GEMINI_API_KEY → GEMINI_API_KEY_2 → GEMINI_API_KEY_3 → tekrar başa
```

### Kullanıcı Dostu Hata Mesajları
`errorMapper.ts` tüm teknik hata kodlarını Türkçe kullanıcı dostu mesajlara çevirir:

| Hata | Gösterilen Mesaj |
|---|---|
| `429 / RESOURCE_EXHAUSTED` | "Yapay zeka analisti yüksek yoğunlukta çalışıyor..." |
| `500 / Internal Server` | "Geçici sunucu aksaması yaşandı..." |
| `Failed to fetch` | "İnternet bağlantınızı kontrol edin..." |

---

## 👤 Kullanıcı Hesabı Sistemi

- **Kayıt:** E-posta + şifre (bcrypt ile hash'lenerek saklanır)
- **Giriş:** JWT token ile kimlik doğrulama (7 gün geçerli)
- **Kalıcı Depolama:** `data_store.json` dosyasında JSON tabanlı basit DB
- **Analiz Geçmişi:** Her rapor kullanıcı hesabına otomatik kaydedilir
- **Pro Plan:** Jarvis Sesli Asistan ve gelişmiş özelliklere erişim

---

## 🔑 Çoklu API Anahtarı Kullanımı

```env
GEMINI_API_KEY=key_1
GEMINI_API_KEY_2=key_2
GEMINI_API_KEY_3=key_3
```

Alternatif olarak `.streamlit/secrets.toml` dosyasından da okunur:
```toml
GEMINI_API_KEY = "your_key_here"
```

---

## 🧑‍💻 Geliştirme Notları

### Komutlar
```bash
npm run dev      # Geliştirme sunucusu (tsx server.ts + vite)
npm run build    # Production build (vite build + esbuild)
npm start        # Production sunucu
npm run lint     # TypeScript tip kontrolü (tsc --noEmit)
```

### Vite Proxy
`vite.config.ts` `/api/*` isteklerini otomatik olarak `http://localhost:3000`'e yönlendirir.

---

## 📜 Lisans

Bu proje özel kullanım içindir. Tüm hakları saklıdır.

---

<p align="center">
  Gemini 3.6 Flash ile güçlendirilmiş <b>DataGravity Analyst v2.0 Pro</b><br/>
  <code>http://localhost:3000</code>
</p>
