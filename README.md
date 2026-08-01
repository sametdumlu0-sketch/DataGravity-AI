# 🧠 DataGravity Analyst — Enterprise Dual-Engine AI & Python Analytics Platform

<p align="center">
  <img src="https://img.shields.io/badge/Gemini-2.0%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Scikit--Learn-1.9-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" />
  <img src="https://img.shields.io/badge/version-2.0%20Pro-6366F1?style=for-the-badge" />
</p>

> **DataGravity Analyst**, kurumsal düzeyde ikili analiz motoruna (Dual-Engine Architecture) sahip bir veri analitiği platformudur. CSV ve Excel dosyalarınızı yükleyin; ister **Google Gemini 2.0 Flash AI** altyapısıyla doğal dil raporları ve podcast dinleyin, ister **lokal Python (Pandas, SciPy, Scikit-Learn)** motoruyla kota sınırı olmadan %100 istatistiksel ve makine öğrenmesi analizi yapın.

---

## ⚡ İkili Analiz Motoru Mimarisi (Dual-Engine Architecture)

Sistem 2 bağımsız ve tam yetkinlikte çalışan analiz motoruna sahiptir:

```
                  ┌─────────────────────────────────────────┐
                  │          Veri Seti (CSV / Excel)        │
                  └────────────────────┬────────────────────┘
                                       │
                     ┌─────────────────┴─────────────────┐
                     ▼                                   ▼
        🤖 MOD 1: Gemini 2.0 AI              ⚡ MOD 2: Python ML Engine
     (Google LLM & Multimodal API)       (Local Pandas, SciPy, Scikit-Learn)
  ┌─────────────────────────────────┐ ┌───────────────────────────────────┐
  │ • Doğal Dille Raporlama & Chat  │ │ • %100 İstatistiki Kesinlik       │
  │ • 45s Sesli Podcast Özeti       │ │ • IsolationForest Anomali Tespiti │
  │ • Multi-Agent AI Veri Konseyi   │ │ • K-Means Kümeleme & Segmentasyon │
  │ • Strateji ve İş Önerileri      │ │ • Sınırsız & Sıfır API Kotası     │
  └─────────────────────────────────┘ └───────────────────────────────────┘
```

---

## 🚀 11 Temel Analiz Özelliği (İkili Destek)

Aşağıdaki **11 özelliğin tamamı** hem Gemini 2.0 AI hem de yerel Python motoru tarafından %100 desteklenmektedir:

| # | Modül / Özellik | 🤖 Gemini 2.0 AI Motoru | ⚡ Python Data Science Motoru |
|---|---|---|---|
| 1 | **Yönetici Raporu & Sesli Podcast** | LLM Üretimi Rapor + 45s Podcast | Pandas + SciPy İstatistiki Rapor |
| 2 | **Grafik Önerileri (Recharts)** | LLM Tabanlı Grafik Seçimi | Frekans ve Varyans Tabanlı Otomatik Grafik |
| 3 | **Veri Sohbeti (Data Chat)** | Gemini Canlı Sohbet | Pandas NLP İstatistiksel Soru-Cevap |
| 4 | **What-If Senaryo Simülatörü** | LLM Esneklik Tahmini | `LinearRegression` Esneklik ve Etki Matrisi |
| 5 | **Kök Neden & Anomali Analisti** | LLM Kök Neden Analizi | `IsolationForest` & Korelasyon Kök Nedeni |
| 6 | **Multi-Agent AI Konseyi** | 3 LLM Ajanı Tartışması | 3 İstatistiki Perspektif (Bilimci, Stratejist, Denetçi) |
| 7 | **Otonom Veri Doktoru** | LLM Temizleme ve Formatlama | Imputation & Outlier Capping ile %100 Gerçek Temizlik |
| 8 | **Sentetik Veri Üretici** | LLM Prototip Satır Üretimi | Gaussian KDE ve Parametrik Dağılım Örnekleme |
| 9 | **Canlı ML Eğitimi & Tahminleme** | LLM Tahmin Simülasyonu | `RandomForestRegressor` Eğitimi & Anlık Tahmin |
| 10 | **Python Kodu Oluşturucu** | LLM Kodu | Canlı Çalıştırılabilir Pandas/Seaborn Scripti |
| 11 | **Doğal Dil SQL Üreteci** | LLM SQL Sorgusu | ANSI SQL (SELECT, GROUP BY, WHERE) Sorgusu |

---

## 📤 Dışa Aktarım ve Entegrasyonlar

- 📊 **PowerPoint (.pptx):** 4 slaytlı kurumsal sunum dosyası (`pptxgenjs`).
- 📄 **Markdown (.md):** Ham teknik rapor metni.
- 🌐 **HTML Paneli:** Stillendirilmiş tekil HTML rapor çıktısı.
- 🖨️ **PDF / Yazdır:** Birebir CSS stilli tarayıcı yazdırma çıktısı.
- 📢 **Slack & E-posta Dispatcher:** Analiz bulgularını canlı kanallara iletme.

---

## 🛠️ Teknoloji Yığını

- **Frontend:** React 19, TypeScript 5.8, Tailwind CSS 4, Framer Motion, Recharts, Three.js, Lucide Icons.
- **Backend:** Express.js 4, TypeScript, `@google/genai` SDK, `jsonwebtoken`, `bcryptjs`.
- **Python Engine:** Python 3.13+, `pandas`, `numpy`, `scikit-learn`, `scipy`.

---

## ⚡ Hızlı Başlangıç & Kurulum

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/sametdumlu0-sketch/DataGravity-AI.git
cd DataGravity-AI
```

### 2. Node.js Bağımlılıklarını Yükleyin
```bash
npm install
```

### 3. Python Sanal Ortamını (`.venv`) Hazırlayın
```bash
# Windows
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Ortam Değişkenlerini (`.env`) Yapılandırın
Proje kök dizininde `.env` dosyasını oluşturun:
```env
# Gemini API Key (Otomatik 4-Key Rotation Destekli)
GEMINI_API_KEY=your_gemini_api_key_1
GEMINI_API_KEY_2=your_gemini_api_key_2
GEMINI_API_KEY_3=your_gemini_api_key_3
GEMINI_API_KEY_4=your_gemini_api_key_4

PORT=3000
JWT_SECRET=datagravity_analyst_secret_jwt_key_2026
```

### 5. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Uygulama `http://localhost:3000` adresinde yayında olacaktır! 🚀

---

## 🔑 Otomatik API Key Rotation & Cooldown

Sistem 4 adede kadar `GEMINI_API_KEY` tanımını destekler. Herhangi bir anahtar 429 Rate Limit hatası aldığında sunucu:
1. Otomatik olarak bir sonraki anahtara geçer (**Key Rotation**).
2. Google kotalarının yenilenmesi için akıllı **Global Cooldown** uygular.
3. Kota aşımında anında **Python Data Science Motoruna** geçerek kullanıcıya kesintisiz hizmet verir.

---

## 📝 Lisans
MIT License © 2026 DataGravity Team.
