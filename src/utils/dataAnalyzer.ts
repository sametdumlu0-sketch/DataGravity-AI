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
 * Parse raw tabular records into structured DatasetAnalysisContext
 */
export function analyzeRawData(records: Record<string, any>[], filename: string): DatasetAnalysisContext {
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

  // Construct Markdown Context identical to Python Pandas summary logic
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

  // First 5 rows markdown table
  let sampleTableHead = '| ' + colNames.join(' | ') + ' |';
  let sampleTableDivider = '| ' + colNames.map(() => '---').join(' | ') + ' |';
  let sampleTableRows = headRows.map((r) => '| ' + colNames.map((c) => String(r[c] ?? '')).join(' | ') + ' |').join('\n');

  const contextMarkdown = `
### Veri Seti Teknik Bağlamı
* Dosya Adı: ${filename}
* Satır Sayısı: ${rowCount}
* Sütun Sayısı: ${columnCount}

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

  return {
    filename,
    rowCount,
    columnCount,
    columns,
    numericStats,
    categoricalStats,
    headRows,
    allData: records,
    contextMarkdown,
  };
}

/**
 * Parse CSV String
 */
export function parseCSVString(csvString: string, filename: string = 'data.csv'): DatasetAnalysisContext {
  const parsed = Papa.parse<Record<string, any>>(csvString, {
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
 * Parse Excel ArrayBuffer
 */
export function parseExcelBuffer(buffer: ArrayBuffer, filename: string): DatasetAnalysisContext {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Excel dosyasında sayfa bulunamadı.');
  }
  const worksheet = workbook.Sheets[firstSheetName];
  const records = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
  return analyzeRawData(records, filename);
}

/**
 * Parse JSON String
 */
export function parseJSONString(jsonString: string, filename: string = 'data.json'): DatasetAnalysisContext {
  const data = JSON.parse(jsonString);
  const records = Array.isArray(data) ? data : [data];
  return analyzeRawData(records, filename);
}
