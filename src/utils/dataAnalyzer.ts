import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  DatasetAnalysisContext,
  ColumnInfo,
  NumericColumnStats,
  CategoricalColumnStats,
  ColumnDataType,
} from '../types/data';

/**
 * Safely parse numeric value
 */
function parseNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '.').trim();
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Calculate percentiles (e.g. 25, 50, 75)
 */
function calculatePercentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  const index = (p / 100) * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  if (upper >= sortedArr.length) return sortedArr[sortedArr.length - 1];
  return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
}

/**
 * Detect column data type
 */
function detectColumnType(values: any[]): ColumnDataType {
  const nonNulls = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNulls.length === 0) return 'categorical';

  let numCount = 0;
  let boolCount = 0;

  for (const val of nonNulls) {
    if (typeof val === 'boolean' || val === 'true' || val === 'false' || val === 'TRUE' || val === 'FALSE') {
      boolCount++;
    }
    const n = parseNumber(val);
    if (n !== null) {
      numCount++;
    }
  }

  if (boolCount / nonNulls.length > 0.8) return 'boolean';
  if (numCount / nonNulls.length > 0.8) return 'numeric';
  return 'categorical';
}

/**
 * Repairs common garbled / Mojibake Turkish character corruptions
 */
export function repairTurkishMojibake(text: string): string {
  if (!text) return text;
  return text
    .replace(/Ã§/g, 'ç')
    .replace(/Ã¶/g, 'ö')
    .replace(/Ä±/g, 'ı')
    .replace(/ÅŸ/g, 'ş')
    .replace(/Ã¼/g, 'ü')
    .replace(/ÄŸ/g, 'ğ')
    .replace(/Ã‡/g, 'Ç')
    .replace(/Ã–/g, 'Ö')
    .replace(/Ä°/g, 'İ')
    .replace(/Åž/g, 'Ş')
    .replace(/Ãœ/g, 'Ü')
    .replace(/ÄĞ/g, 'Ğ')
    .replace(/Äğ/g, 'Ğ')
    .replace(/\uFFFD/g, '');
}

/**
 * Detects character encoding (UTF-8 with/without BOM vs ISO-8859-9 / Windows-1254)
 * and repairs Turkish character corruptions automatically.
 */
export function readTextWithAutoEncoding(buffer: ArrayBuffer): { text: string; detectedEncoding: string } {
  const bytes = new Uint8Array(buffer);

  // 1. Check UTF-8 BOM
  let startOffset = 0;
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    startOffset = 3;
  }

  const slicedBytes = bytes.subarray(startOffset);

  // 2. Count Windows-1254 / ISO-8859-9 Turkish character byte markers
  let turkishByteCount = 0;
  for (let i = 0; i < slicedBytes.length; i++) {
    const b = slicedBytes[i];
    if (
      b === 0xD0 || b === 0xF0 || // Ğ, ğ
      b === 0xDD || b === 0xFD || // İ, ı
      b === 0xDE || b === 0xFE || // Ş, ş
      b === 0xC7 || b === 0xE7 || // Ç, ç
      b === 0xD6 || b === 0xF6 || // Ö, ö
      b === 0xDC || b === 0xFC    // Ü, ü
    ) {
      turkishByteCount++;
    }
  }

  // 3. Try UTF-8 decoding
  let utf8Text = '';
  let utf8HasErrors = false;
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
    utf8Text = utf8Decoder.decode(slicedBytes);
    if ((utf8Text.match(/\uFFFD/g) || []).length > 0) {
      utf8HasErrors = true;
    }
  } catch (e) {
    utf8HasErrors = true;
  }

  const mojibakePattern = /Ã§|Ã¶|Ä±|ÅŸ|Ã¼|ÄŸ|Ã‡|Ã–|Ä°|Åž|Ãœ|ÄĞ/g;
  const mojibakeMatches = utf8Text.match(mojibakePattern) || [];

  let finalEncoding = 'UTF-8';
  let decodedText = utf8Text;

  if (utf8HasErrors || turkishByteCount > 2 || mojibakeMatches.length > 2) {
    try {
      const turkishDecoder = new TextDecoder('windows-1254');
      const trText = turkishDecoder.decode(slicedBytes);
      if (trText && trText.length > 0) {
        decodedText = trText;
        finalEncoding = 'ISO-8859-9 (Windows-1254)';
      }
    } catch (e) {
      try {
        const isoDecoder = new TextDecoder('iso-8859-9');
        decodedText = isoDecoder.decode(slicedBytes);
        finalEncoding = 'ISO-8859-9';
      } catch (err) {
        // Fall back to UTF-8
      }
    }
  }

  decodedText = repairTurkishMojibake(decodedText);
  return { text: decodedText, detectedEncoding: finalEncoding };
}

/**
 * Smart summary helper to condense dataset context for Gemini API without exceeding token limits
 */
export function summarizeContextForLLM(
  context: DatasetAnalysisContext,
  maxCharLimit: number = 10000
): string {
  const { filename, rowCount, columnCount, columns, numericStats, categoricalStats, headRows } = context;

  // Base raw context check
  if (context.contextMarkdown && context.contextMarkdown.length <= maxCharLimit) {
    return context.contextMarkdown;
  }

  let dtypesSummary = '';
  if (columns.length > 25) {
    const firstFew = columns.slice(0, 15).map((c) => `${c.name} (${c.type})`).join(', ');
    const lastFew = columns.slice(-5).map((c) => `${c.name} (${c.type})`).join(', ');
    dtypesSummary = `[Toplam ${columns.length} Sütun]: ${firstFew}, ... [${columns.length - 20} sütun gizlendi] ..., ${lastFew}`;
  } else {
    dtypesSummary = columns.map((c) => `- ${c.name}: ${c.type} (Eksik: %${c.nullPercentage})`).join('\n');
  }

  let numericDescribeStr = '';
  if (numericStats.length > 0) {
    const topNumeric = numericStats.slice(0, 20);
    numericDescribeStr = `
| Sütun | Sayı | Ortalama | Std Sapma | Min | Medyan | Max |
| --- | --- | --- | --- | --- | --- | --- |
` + topNumeric.map((s) => `| ${s.columnName} | ${s.count} | ${s.mean} | ${s.std} | ${s.min} | ${s.median} | ${s.max} |`).join('\n');
    if (numericStats.length > 20) {
      numericDescribeStr += `\n* Note: Diğer ${numericStats.length - 20} sayısal sütunun özeti token tasarrufu için saklanmıştır.`;
    }
  } else {
    numericDescribeStr = 'Sayısal sütun bulunmamaktadır.';
  }

  let categoricalDescribeStr = '';
  if (categoricalStats.length > 0) {
    const topCategorical = categoricalStats.slice(0, 15);
    categoricalDescribeStr = `
| Sütun | Unique | En Sık Değer (Frekans) |
| --- | --- | --- |
` + topCategorical.map((s) => `| ${s.columnName} | ${s.unique} | ${String(s.topValue).slice(0, 30)} (${s.topFreq}) |`).join('\n');
    if (categoricalStats.length > 15) {
      categoricalDescribeStr += `\n* Note: Diğer ${categoricalStats.length - 15} kategorik sütunun özeti token tasarrufu için saklanmıştır.`;
    }
  }

  const sampleCols = columns.slice(0, 12).map((c) => c.name);
  const sampleHead = '| ' + sampleCols.join(' | ') + ' |';
  const sampleDivider = '| ' + sampleCols.map(() => '---').join(' | ') + ' |';
  const sampleRowsStr = headRows.slice(0, 3).map((r) => {
    return '| ' + sampleCols.map((c) => {
      const val = String(r[c] ?? '');
      return val.length > 35 ? val.slice(0, 35) + '...' : val;
    }).join(' | ') + ' |';
  }).join('\n');

  return `
⚡ [Akıllı Akış Özeti - Gemini API Sınır Koruyucu]
Veri Seti: ${filename}
Boyut: ${rowCount} Satır × ${columnCount} Sütun ${context.activeSheetName ? `(Sayfa: ${context.activeSheetName})` : ''}

* Sütun Yapısı ve Tipler:
${dtypesSummary}

* İstatistiksel Özet (Sayısal):
${numericDescribeStr}

* İstatistiksel Özet (Kategorik):
${categoricalDescribeStr}

* Örnek Veri Satırları (Kısaltılmış):
${sampleHead}
${sampleDivider}
${sampleRowsStr}
`.trim();
}

/**
 * Parse raw tabular records into structured DatasetAnalysisContext
 */
export function analyzeRawData(
  records: Record<string, any>[],
  filename: string,
  metadata?: { activeSheetName?: string; availableSheets?: string[]; detectedEncoding?: string }
): DatasetAnalysisContext {
  if (!records || records.length === 0) {
    throw new Error('Veri seti boş veya okunamadı.');
  }

  const rowCount = records.length;
  const colNames = Object.keys(records[0] || {});
  const columnCount = colNames.length;

  const columns: ColumnInfo[] = [];
  const numericStats: NumericColumnStats[] = [];
  const categoricalStats: CategoricalColumnStats[] = [];

  colNames.forEach((colName) => {
    const rawValues = records.map((r) => r[colName]);
    const nullCount = rawValues.filter((v) => v === null || v === undefined || v === '' || v === 'NaN' || v === 'null').length;
    const type = detectColumnType(rawValues);

    const sampleValues = rawValues.slice(0, 5);

    columns.push({
      name: colName,
      type,
      nullCount,
      nullPercentage: Number(((nullCount / rowCount) * 100).toFixed(1)),
      sampleValues,
    });

    if (type === 'numeric') {
      const validNums = rawValues
        .map(parseNumber)
        .filter((n): n is number => n !== null)
        .sort((a, b) => a - b);

      if (validNums.length > 0) {
        const sum = validNums.reduce((acc, curr) => acc + curr, 0);
        const mean = sum / validNums.length;
        const variance =
          validNums.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (validNums.length > 1 ? validNums.length - 1 : 1);
        const std = Math.sqrt(variance);

        numericStats.push({
          columnName: colName,
          count: validNums.length,
          mean: Number(mean.toFixed(2)),
          std: Number(std.toFixed(2)),
          min: Number(validNums[0].toFixed(2)),
          q25: Number(calculatePercentile(validNums, 25).toFixed(2)),
          median: Number(calculatePercentile(validNums, 50).toFixed(2)),
          q75: Number(calculatePercentile(validNums, 75).toFixed(2)),
          max: Number(validNums[validNums.length - 1].toFixed(2)),
          nullCount,
        });
      }
    } else {
      const validStrs = rawValues
        .filter((v) => v !== null && v !== undefined && v !== '')
        .map((v) => String(v).trim());

      const countsMap = new Map<string, number>();
      validStrs.forEach((str) => {
        countsMap.set(str, (countsMap.get(str) || 0) + 1);
      });

      const sortedCategories = Array.from(countsMap.entries())
        .sort((a, b) => b[1] - a[1]);

      const topItem = sortedCategories[0] || ['-', 0];

      const topCategories = sortedCategories.slice(0, 8).map(([val, count]) => ({
        value: val,
        count,
        percentage: Number(((count / rowCount) * 100).toFixed(1)),
      }));

      categoricalStats.push({
        columnName: colName,
        count: validStrs.length,
        unique: countsMap.size,
        topValue: topItem[0],
        topFreq: topItem[1],
        nullCount,
        topCategories,
      });
    }
  });

  const headRows = records.slice(0, 5);

  let dtypesStr = columns.map((c) => `- ${c.name}: ${c.type}`).join('\n');
  let nullsStr = columns.map((c) => `- ${c.name}: ${c.nullCount} (%${c.nullPercentage})`).join('\n');

  let numericDescribeStr = '';
  if (numericStats.length > 0) {
    numericDescribeStr = `
| Sütun | Sayı | Ortalama (Mean) | Std Sapma | Min | %25 (Q1) | Medyan (%50) | %75 (Q3) | Max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
` + numericStats.map((s) => `| ${s.columnName} | ${s.count} | ${s.mean} | ${s.std} | ${s.min} | ${s.q25} | ${s.median} | ${s.q75} | ${s.max} |`).join('\n');
  } else {
    numericDescribeStr = 'Sayısal sütun bulunmamaktadır.';
  }

  let categoricalDescribeStr = '';
  if (categoricalStats.length > 0) {
    categoricalDescribeStr = `
| Sütun | Sayı | Benzersiz (Unique) | En Sık Değer | En Sık Frekans |
| --- | --- | --- | --- | --- |
` + categoricalStats.map((s) => `| ${s.columnName} | ${s.count} | ${s.unique} | ${s.topValue} | ${s.topFreq} |`).join('\n');
  }

  let sampleTableHead = '| ' + colNames.join(' | ') + ' |';
  let sampleTableDivider = '| ' + colNames.map(() => '---').join(' | ') + ' |';
  let sampleTableRows = headRows.map((r) => '| ' + colNames.map((c) => String(r[c] ?? '')).join(' | ') + ' |').join('\n');

  let fullContextMarkdown = `
### Veri Seti Teknik Bağlamı
* Dosya Adı: ${filename}
* Satır Sayısı: ${rowCount}
* Sütun Sayısı: ${columnCount}
${metadata?.activeSheetName ? `* Aktif Excel Sayfası: ${metadata.activeSheetName}` : ''}
${metadata?.detectedEncoding ? `* Otomatik Algılanan Kodlama: ${metadata.detectedEncoding}` : ''}

* Sütun İsimleri ve Veri Tipleri:
${dtypesStr}

* Eksik Değer Sayıları:
${nullsStr}

* İstatistiksel Özet (Sayısal Sütunlar):
${numericDescribeStr}

${categoricalStats.length > 0 ? `* İstatistiksel Özet (Kategorik Sütunlar):\n${categoricalDescribeStr}` : ''}

* İlk 5 Satır Örneği:
${sampleTableHead}
${sampleTableDivider}
${sampleTableRows}
  `.trim();

  const tempContext: DatasetAnalysisContext = {
    filename,
    rowCount,
    columnCount,
    columns,
    numericStats,
    categoricalStats,
    headRows,
    allData: records,
    contextMarkdown: fullContextMarkdown,
    detectedEncoding: metadata?.detectedEncoding,
    activeSheetName: metadata?.activeSheetName,
    availableSheets: metadata?.availableSheets,
  };

  // Smart LLM Summarizer Trigger for Large Datasets
  let isSummarizedForLLM = false;
  if (fullContextMarkdown.length > 10000 || rowCount > 1000 || columnCount > 25) {
    fullContextMarkdown = summarizeContextForLLM(tempContext);
    isSummarizedForLLM = true;
  }

  return {
    ...tempContext,
    contextMarkdown: fullContextMarkdown,
    isSummarizedForLLM,
  };
}

/**
 * Parse CSV String
 */
export function parseCSVString(csvString: string, filename: string = 'data.csv'): DatasetAnalysisContext {
  const repairedString = repairTurkishMojibake(csvString);
  const parsed = Papa.parse<Record<string, any>>(repairedString, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (parsed.errors && parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error('CSV dosyası ayrıştırılamadı: ' + parsed.errors[0].message);
  }

  return analyzeRawData(parsed.data, filename);
}

/**
 * Parse CSV ArrayBuffer with automatic Turkish encoding detection (ISO-8859-9 / UTF-8)
 */
export function parseCSVBuffer(buffer: ArrayBuffer, filename: string = 'data.csv'): DatasetAnalysisContext {
  const { text, detectedEncoding } = readTextWithAutoEncoding(buffer);
  const context = parseCSVString(text, filename);
  context.detectedEncoding = detectedEncoding;
  return context;
}

/**
 * Extract sheet names from an Excel ArrayBuffer
 */
export function getExcelSheetNames(buffer: ArrayBuffer): string[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  return workbook.SheetNames || [];
}

/**
 * Parse Excel ArrayBuffer for a specific sheet name
 */
export function parseExcelBuffer(
  buffer: ArrayBuffer,
  filename: string,
  targetSheetName?: string
): DatasetAnalysisContext {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('Excel dosyasında sayfa bulunamadı.');
  }

  const selectedSheet = targetSheetName && sheetNames.includes(targetSheetName)
    ? targetSheetName
    : sheetNames[0];

  const worksheet = workbook.Sheets[selectedSheet];
  const records = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

  return analyzeRawData(records, filename, {
    activeSheetName: selectedSheet,
    availableSheets: sheetNames,
  });
}

/**
 * Parse JSON String
 */
export function parseJSONString(jsonString: string, filename: string = 'data.json'): DatasetAnalysisContext {
  const data = JSON.parse(jsonString);
  const records = Array.isArray(data) ? data : [data];
  return analyzeRawData(records, filename);
}
