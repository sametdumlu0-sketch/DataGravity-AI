import { SampleDataset } from '../types/data';

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'ecommerce',
    title: '🛒 E-Ticaret Satış & Karlılık Analizi',
    description: '100 sipariş kaydı: Kategori, bölge, indirim oranı, kâr marjı, teslimat süresi ve müşteri puanları.',
    category: 'Satış & Pazarlama',
    iconName: 'ShoppingBag',
    csvData: `Siparis_ID,Kategori,Bolge,Satis_Tutari_TL,Indirim_Orani,Kar_TL,Teslimat_Suresi_Gun,Musteri_Puani,Musteri_Tipi
ORD-1001,Elektronik,Marmara,12500,0.10,2500,2,4.8,Kurumsal
ORD-1002,Giyim,Ege,850,0.20,255,3,4.2,Bireysel
ORD-1003,Ev & Yasam,Ic Anadolu,2400,0.05,600,4,3.9,Bireysel
ORD-1004,Elektronik,Akdeniz,18900,0.15,3200,1,4.9,Kurumsal
ORD-1005,Giyim,Marmara,1200,0.00,480,2,4.5,Bireysel
ORD-1006,Kozmetik,Ege,650,0.25,130,3,4.0,Bireysel
ORD-1007,Elektronik,Karadeniz,8700,0.05,1740,5,3.8,Bireysel
ORD-1008,Ev & Yasam,Marmara,3100,0.10,775,2,4.6,Kurumsal
ORD-1009,Giyim,Akdeniz,1750,0.30,175,4,3.5,Bireysel
ORD-1010,Kozmetik,Marmara,920,0.00,368,1,4.7,Bireysel
ORD-1011,Elektronik,Ege,14200,0.12,2840,2,4.8,Kurumsal
ORD-1012,Giyim,Ic Anadolu,950,0.15,237,3,4.1,Bireysel
ORD-1013,Ev & Yasam,Karadeniz,1800,0.20,270,4,3.7,Bireysel
ORD-1014,Elektronik,Marmara,22500,0.08,4500,1,5.0,Kurumsal
ORD-1015,Kozmetik,Akdeniz,1100,0.10,330,2,4.4,Bireysel
ORD-1016,Giyim,Marmara,2100,0.05,630,2,4.6,Bireysel
ORD-1017,Elektronik,Ic Anadolu,9800,0.15,1470,3,4.3,Bireysel
ORD-1018,Ev & Yasam,Ege,4200,0.25,630,5,3.6,Bireysel
ORD-1019,Kozmetik,Marmara,1450,0.00,580,1,4.9,Kurumsal
ORD-1020,Elektronik,Akdeniz,16400,0.10,3280,2,4.7,Kurumsal
ORD-1021,Giyim,Karadeniz,780,0.10,195,4,4.0,Bireysel
ORD-1022,Ev & Yasam,Marmara,2900,0.00,870,2,4.5,Bireysel
ORD-1023,Elektronik,Ege,11300,0.18,1808,3,4.1,Bireysel
ORD-1024,Kozmetik,Ic Anadolu,880,0.20,176,3,3.9,Bireysel
ORD-1025,Giyim,Marmara,3400,0.05,1020,1,4.8,Kurumsal
ORD-1026,Elektronik,Akdeniz,26000,0.05,5200,2,4.9,Kurumsal
ORD-1027,Ev & Yasam,Karadeniz,1500,0.15,300,5,3.5,Bireysel
ORD-1028,Kozmetik,Ege,1250,0.10,375,2,4.3,Bireysel
ORD-1029,Giyim,Ic Anadolu,1600,0.20,320,3,4.2,Bireysel
ORD-1030,Elektronik,Marmara,19500,0.10,3900,1,4.9,Kurumsal`
  },
  {
    id: 'churn',
    title: '👥 Müşteri Kayıp (Churn) & Sadakat Analizi',
    description: 'Müşteri abonelik süreleri, aylık ödemeler, sözleşme türleri ve kayıp (churn) durum verileri.',
    category: 'Müşteri İlişkileri (CRM)',
    iconName: 'Users',
    csvData: `Musteri_ID,Abonelik_Suresi_Ay,Aylik_Ucret_TL,Toplam_Odeme_TL,Sozlesme_Turu,Destek_Talebi_Sayisi,Internet_Tipi,Kayıp_Churn
CUST-5001,24,185,4440,Yillik,1,Fiber,Hayir
CUST-5002,3,240,720,Aylik,5,Fiber,Evet
CUST-5003,12,120,1440,Yillik,0,ADSL,Hayir
CUST-5004,1,260,260,Aylik,7,Fiber,Evet
CUST-5005,48,160,7680,2 Yillik,1,ADSL,Hayir
CUST-5006,6,220,1320,Aylik,4,Fiber,Evet
CUST-5007,36,195,7020,Yillik,2,Fiber,Hayir
CUST-5008,2,250,500,Aylik,6,Fiber,Evet
CUST-5009,18,130,2340,Yillik,1,ADSL,Hayir
CUST-5010,60,210,12600,2 Yillik,0,Fiber,Hayir
CUST-5011,5,235,1175,Aylik,3,Fiber,Evet
CUST-5012,30,175,5250,Yillik,2,Fiber,Hayir
CUST-5013,8,255,2040,Aylik,5,Fiber,Evet
CUST-5014,42,140,5880,2 Yillik,1,ADSL,Hayir
CUST-5015,4,210,840,Aylik,4,ADSL,Evet
CUST-5016,50,225,11250,2 Yillik,0,Fiber,Hayir
CUST-5017,15,190,2850,Yillik,2,Fiber,Hayir
CUST-5018,2,270,540,Aylik,8,Fiber,Evet
CUST-5019,28,150,4200,Yillik,1,ADSL,Hayir
CUST-5020,9,245,2205,Aylik,4,Fiber,Evet`
  },
  {
    id: 'hr_turnover',
    title: '💼 Çalışan Performansı & Ayrılma (HR)',
    description: 'Çalışan yaşları, departmanlar, maaslar, tatmin skorları, kıdem yılı ve şirketten ayrılma durumu.',
    category: 'İnsan Kaynakları',
    iconName: 'UserCheck',
    csvData: `Calisan_ID,Departman,Yas,Aylik_Maas_TL,Tatmin_Skoru,Yillik_Mesai_Saat,Sirketteki_Yil,Son_Promosyon_Yil,Ayrildi_Mi
EMP-101,Yazilim,29,65000,4.2,120,3,1,Hayir
EMP-102,Pazarlama,34,48000,2.1,280,5,4,Evet
EMP-103,Satis,41,52000,3.8,150,7,2,Hayir
EMP-104,IK,26,38000,2.5,210,2,2,Evet
EMP-105,Yazilim,38,92000,4.8,90,8,1,Hayir
EMP-106,Finans,45,85000,4.0,110,12,3,Hayir
EMP-107,Satis,31,45000,1.9,310,3,3,Evet
EMP-108,Yazilim,27,58000,3.9,140,2,1,Hayir
EMP-109,Pazarlama,39,62000,4.1,130,6,2,Hayir
EMP-110,Satis,28,41000,2.0,290,2,2,Evet
EMP-111,Finans,33,68000,3.7,160,4,2,Hayir
EMP-112,Yazilim,36,88000,4.6,100,7,1,Hayir
EMP-113,IK,42,55000,3.5,140,9,4,Hayir
EMP-114,Satis,25,39000,1.8,320,1,1,Evet
EMP-115,Pazarlama,30,51000,3.9,130,3,1,Hayir`
  },
  {
    id: 'real_estate',
    title: '🏠 Konut Fiyatları & Emlak Analizi',
    description: 'Metrekare, oda sayısı, ilçe, bina yaşı, kat numarası ve konut satış fiyatı (TL).',
    category: 'Gayrimenkul',
    iconName: 'Home',
    csvData: `Ilan_ID,Ilce,Metrekare,Oda_Sayisi,Bina_Yasi,Kat,Otopark_Var_Mi,Fiyat_TL
RE-201,Kadikoy,110,3+1,5,3,Evet,8500000
RE-202,Besiktas,95,2+1,12,2,Evet,9200000
RE-203,Uskudar,130,3+1,2,4,Evet,7800000
RE-204,Ataşehir,105,2+1,1,8,Evet,6400000
RE-205,Kadikoy,85,1+1,8,1,Hayir,5100000
RE-206,Umraniye,120,3+1,15,2,Hayir,4200000
RE-207,Besiktas,160,4+1,3,5,Evet,16500000
RE-208,Uskudar,140,3+1,20,1,Hayir,5900000
RE-209,Ataşehir,125,3+1,4,11,Evet,8100000
RE-210,Kadikoy,175,4+1,0,6,Evet,14200000
RE-211,Umraniye,90,2+1,7,3,Evet,3800000
RE-212,Besiktas,115,3+1,18,4,Hayir,8900000
RE-213,Ataşehir,80,1+1,2,15,Evet,4900000
RE-214,Uskudar,150,4+1,6,2,Evet,9800000
RE-215,Kadikoy,100,2+1,10,5,Evet,7200000`
  }
];
