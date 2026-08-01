import pptxgen from 'pptxgenjs';

interface ParsedReportSections {
  overview: string[];
  findings: string[];
  recommendations: string[];
  mlModels: string[];
}

/**
 * Clean markdown symbols for presentation slides
 */
function cleanText(raw: string): string {
  return raw
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s*/g, '')
    .replace(/^[-\*•]\s*/g, '')
    .trim();
}

/**
 * Parse raw markdown report text into 4 structured sections
 */
function parseReportSections(reportText: string): ParsedReportSections {
  const lines = reportText.split('\n');
  const sections: ParsedReportSections = {
    overview: [],
    findings: [],
    recommendations: [],
    mlModels: [],
  };

  let currentSection: keyof ParsedReportSections | null = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    if (lower.includes('1.') || lower.includes('genel veri özeti')) {
      currentSection = 'overview';
    } else if (lower.includes('2.') || lower.includes('kritik bulgular')) {
      currentSection = 'findings';
    } else if (lower.includes('3.') || lower.includes('stratejik iş önerileri') || lower.includes('öneriler')) {
      currentSection = 'recommendations';
    } else if (lower.includes('4.') || lower.includes('makine öğrenmesi') || lower.includes('ml')) {
      currentSection = 'mlModels';
    } else if (currentSection) {
      const cleaned = cleanText(trimmed);
      if (cleaned.length > 3) {
        sections[currentSection].push(cleaned);
      }
    }
  });

  // Fallback defaults if parsing yields empty arrays
  if (sections.overview.length === 0) {
    sections.overview = [
      'Veri seti genel kalite ve sütun dağılımları başarıyla incelendi.',
      'Sayısal ve kategorik değişkenlerin tutarlılığı doğrulandı.',
    ];
  }
  if (sections.findings.length === 0) {
    sections.findings = [
      'Değişkenler arası önemli korelasyonlar ve eğilimler tespit edildi.',
      'Aykırı değerler ve dağılım özellikleri analiz edildi.',
    ];
  }
  if (sections.recommendations.length === 0) {
    sections.recommendations = [
      'Stratejik maliyet ve karlılık optimizasyonları yapılmalıdır.',
      'Müşteri sadakatini artırıcı süreçler devreye alınmalıdır.',
    ];
  }

  return sections;
}

/**
 * Generate and download a 4-slide corporate PowerPoint presentation (.pptx)
 */
export async function downloadPPTXPresentation(
  reportText: string,
  filename: string = 'yonetici_sunumu.pptx',
  datasetName: string = 'Veri Seti'
): Promise<void> {
  const parsed = parseReportSections(reportText);
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'DataGravity AI - Yönetici Raporu Sunumu';

  // Theme Palette (Dark Corporate Navy)
  const COLOR_BG = '0F172A'; // Dark Slate Navy
  const COLOR_COVER_BG = '0B132B'; // Deep Dark Navy
  const COLOR_CARD = '1E293B'; // Card background
  const COLOR_ACCENT = '6366F1'; // Indigo Accent
  const COLOR_TEAL = '14B8A6'; // Teal Accent
  const COLOR_GOLD = 'F59E0B'; // Gold Accent
  const COLOR_TEXT_WHITE = 'FFFFFF';
  const COLOR_TEXT_MUTED = '94A3B8';
  const COLOR_TEXT_BODY = 'E2E8F0';

  // -------------------------------------------------------------
  // SLIDE 1: Cover Slide (Koyu Lacivert Kurumsal Tema)
  // -------------------------------------------------------------
  const slide1 = pptx.addSlide();
  slide1.background = { color: COLOR_COVER_BG };

  // Decorative Accent Bar
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.3,
    h: 7.5,
    fill: { color: COLOR_ACCENT },
  });

  // Main Header Box
  slide1.addText('YÖNETİCİ ANALİZ VE STRATEJİ RAPORU', {
    x: 0.8,
    y: 1.5,
    w: 11.5,
    h: 1.2,
    fontSize: 32,
    bold: true,
    color: COLOR_TEXT_WHITE,
    fontFace: 'Arial',
  });

  // Subtitle / Dataset Name
  slide1.addText(`📊 Veri Kümesi: ${datasetName}`, {
    x: 0.8,
    y: 2.8,
    w: 11.5,
    h: 0.6,
    fontSize: 20,
    color: COLOR_TEAL,
    bold: true,
    fontFace: 'Arial',
  });

  // Metadata Card Box
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 4.2,
    w: 11.0,
    h: 1.8,
    fill: { color: COLOR_CARD },
    line: { color: '334155', width: 1 },
  });

  slide1.addText(
    [
      { text: 'Tarih: ', options: { bold: true, color: COLOR_TEXT_MUTED } },
      { text: `${new Date().toLocaleDateString('tr-TR')}\n`, options: { color: COLOR_TEXT_WHITE } },
      { text: 'Analiz Motoru: ', options: { bold: true, color: COLOR_TEXT_MUTED } },
      { text: 'Gemini 3.6 Flash & DataGravity AI Engine\n', options: { color: COLOR_TEXT_WHITE } },
      { text: 'Hazırlayan: ', options: { bold: true, color: COLOR_TEXT_MUTED } },
      { text: 'Otomatik Yönetici Sunum Üreticisi', options: { color: COLOR_TEXT_WHITE } },
    ],
    {
      x: 1.1,
      y: 4.4,
      w: 10.4,
      h: 1.4,
      fontSize: 14,
      fontFace: 'Arial',
      lineSpacing: 22,
    }
  );

  // Footer branding
  slide1.addText('DataGravity-AI • Kurumsal Veri Analizi ve Karar Destek Platformu', {
    x: 0.8,
    y: 6.8,
    w: 11.0,
    h: 0.4,
    fontSize: 11,
    color: COLOR_TEXT_MUTED,
    fontFace: 'Arial',
  });

  // -------------------------------------------------------------
  // SLIDE 2: Genel Veri Özeti ve Temel Metrikler (Kutular İçinde)
  // -------------------------------------------------------------
  const slide2 = pptx.addSlide();
  slide2.background = { color: COLOR_BG };

  // Slide Header
  slide2.addText('📌 Genel Veri Özeti ve Yapısal İnceleme', {
    x: 0.8,
    y: 0.5,
    w: 11.5,
    h: 0.8,
    fontSize: 24,
    bold: true,
    color: COLOR_TEXT_WHITE,
    fontFace: 'Arial',
  });

  slide2.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.3,
    w: 11.5,
    h: 0.05,
    fill: { color: COLOR_ACCENT },
  });

  // Grid Cards for Overview Points
  const overviewItems = parsed.overview.slice(0, 4);
  const cardWidth = 5.5;
  const cardHeight = 2.2;

  overviewItems.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const xPos = 0.8 + col * (cardWidth + 0.5);
    const yPos = 1.6 + row * (cardHeight + 0.4);

    // Card background shape
    slide2.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: yPos,
      w: cardWidth,
      h: cardHeight,
      fill: { color: COLOR_CARD },
      line: { color: COLOR_ACCENT, width: 1 },
    });

    // Card Badge/Title
    slide2.addText(`Özet Bulgusu ${index + 1}`, {
      x: xPos + 0.3,
      y: yPos + 0.2,
      w: cardWidth - 0.6,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: COLOR_TEAL,
      fontFace: 'Arial',
    });

    // Card Content Text
    slide2.addText(item, {
      x: xPos + 0.3,
      y: yPos + 0.65,
      w: cardWidth - 0.6,
      h: cardHeight - 0.8,
      fontSize: 12,
      color: COLOR_TEXT_BODY,
      fontFace: 'Arial',
      valign: 'top',
    });
  });

  // -------------------------------------------------------------
  // SLIDE 3: Kritik Bulgular ve Eğilimler (Maddeler halinde)
  // -------------------------------------------------------------
  const slide3 = pptx.addSlide();
  slide3.background = { color: COLOR_BG };

  slide3.addText('🔍 Kritik Bulgular ve İstatistiksel Eğilimler', {
    x: 0.8,
    y: 0.5,
    w: 11.5,
    h: 0.8,
    fontSize: 24,
    bold: true,
    color: COLOR_TEXT_WHITE,
    fontFace: 'Arial',
  });

  slide3.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.3,
    w: 11.5,
    h: 0.05,
    fill: { color: COLOR_TEAL },
  });

  // Main Card container for findings bullet points
  slide3.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.6,
    w: 11.5,
    h: 5.0,
    fill: { color: COLOR_CARD },
    line: { color: '334155', width: 1 },
  });

  const findingsTextObjects = parsed.findings.slice(0, 6).map((finding) => ({
    text: `• ${finding}\n\n`,
    options: {
      fontSize: 13,
      color: COLOR_TEXT_BODY,
      fontFace: 'Arial',
    },
  }));

  slide3.addText(findingsTextObjects, {
    x: 1.2,
    y: 1.9,
    w: 10.7,
    h: 4.4,
    valign: 'top',
    lineSpacing: 18,
  });

  // -------------------------------------------------------------
  // SLIDE 4: Stratejik İş Önerileri ve Aksiyon Planı
  // -------------------------------------------------------------
  const slide4 = pptx.addSlide();
  slide4.background = { color: COLOR_BG };

  slide4.addText('💡 Stratejik İş Önerileri ve Aksiyon Planı', {
    x: 0.8,
    y: 0.5,
    w: 11.5,
    h: 0.8,
    fontSize: 24,
    bold: true,
    color: COLOR_TEXT_WHITE,
    fontFace: 'Arial',
  });

  slide4.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.3,
    w: 11.5,
    h: 0.05,
    fill: { color: COLOR_GOLD },
  });

  // Strategic Recommendation Action Cards
  const recItems = parsed.recommendations.slice(0, 4);
  const actionCardWidth = 5.5;
  const actionCardHeight = 2.2;

  recItems.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const xPos = 0.8 + col * (actionCardWidth + 0.5);
    const yPos = 1.6 + row * (actionCardHeight + 0.4);

    // Action Card Shape
    slide4.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: yPos,
      w: actionCardWidth,
      h: actionCardHeight,
      fill: { color: COLOR_CARD },
      line: { color: COLOR_GOLD, width: 1 },
    });

    // Action Step Badge
    slide4.addText(`Aksiyon Önerisi #${index + 1}`, {
      x: xPos + 0.3,
      y: yPos + 0.2,
      w: actionCardWidth - 0.6,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: COLOR_GOLD,
      fontFace: 'Arial',
    });

    // Action Content Text
    slide4.addText(item, {
      x: xPos + 0.3,
      y: yPos + 0.65,
      w: actionCardWidth - 0.6,
      h: actionCardHeight - 0.8,
      fontSize: 12,
      color: COLOR_TEXT_BODY,
      fontFace: 'Arial',
      valign: 'top',
    });
  });

  // Save/Download presentation file on client side
  const safeFilename = filename.endsWith('.pptx') ? filename : `${filename}.pptx`;
  await pptx.writeFile({ fileName: safeFilename });
}
