export interface FormattedError {
  title: string;
  message: string;
  isRateLimit: boolean;
  canRetry: boolean;
}

export function formatErrorMessage(err: any): FormattedError {
  const msg = typeof err === 'string' ? err : err?.message || JSON.stringify(err || '');

  if (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Quota') ||
    msg.includes('rate limit') ||
    msg.includes('istek sınırı')
  ) {
    return {
      title: 'Yapay Zeka Analisti Yoğun',
      message: 'Yapay zeka analisti şu an yüksek yoğunlukta çalışıyor. İstek birkaç saniye içinde otomatik olarak yeniden denenecek.',
      isRateLimit: true,
      canRetry: true,
    };
  }

  if (msg.includes('500') || msg.includes('Internal Server') || msg.includes('Sunucu')) {
    return {
      title: 'Geçici Sunucu Aksaması',
      message: 'Sunucuyla iletişim kurulurken geçici bir aksama yaşandı. Lütfen tekrar deneyin.',
      isRateLimit: false,
      canRetry: true,
    };
  }

  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('bağlantı')) {
    return {
      title: 'Bağlantı Kontrolü',
      message: 'İnternet bağlantınız kontrol ediliyor... Lütfen ağ durumunuzu gözden geçirin.',
      isRateLimit: false,
      canRetry: true,
    };
  }

  return {
    title: 'Analiz İletişim Uyarısı',
    message: msg.replace(/[*#`]/g, '') || 'İşlem sırasında geçici bir aksama oluştu.',
    isRateLimit: false,
    canRetry: true,
  };
}
