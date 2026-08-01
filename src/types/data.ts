export type ColumnDataType = 'numeric' | 'categorical' | 'boolean' | 'datetime';

export interface NumericColumnStats {
  columnName: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
  nullCount: number;
}

export interface CategoricalColumnStats {
  columnName: string;
  count: number;
  unique: number;
  topValue: string;
  topFreq: number;
  nullCount: number;
  topCategories: { value: string; count: number; percentage: number }[];
}

export interface ColumnInfo {
  name: string;
  type: ColumnDataType;
  nullCount: number;
  nullPercentage: number;
  sampleValues: (string | number | boolean | null)[];
}

export interface ExcelFileData {
  filename: string;
  buffer: ArrayBuffer;
  sheetNames: string[];
}

export interface DatasetAnalysisContext {
  filename: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnInfo[];
  numericStats: NumericColumnStats[];
  categoricalStats: CategoricalColumnStats[];
  headRows: Record<string, any>[];
  allData: Record<string, any>[];
  contextMarkdown: string;
  detectedEncoding?: string;
  activeSheetName?: string;
  availableSheets?: string[];
  isSummarizedForLLM?: boolean;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area';

export interface AIChartRecommendation {
  id: string;
  type: ChartType;
  title: string;
  description: string;
  reasoning: string;
  xAxisKey: string;
  yAxisKey: string;
  aggregateType?: 'sum' | 'avg' | 'count' | 'max' | 'min';
  color?: string;
  data: Record<string, any>[];
}

export interface SampleDataset {
  id: string;
  title: string;
  description: string;
  category: string;
  iconName: string;
  csvData: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

export interface AnalysisSection {
  id: string;
  title: string;
  icon: string;
  content: string;
}

export interface SimulatorCoefficient {
  driver: string;
  target: string;
  elasticity: number;
  description: string;
}

export interface SimulatorResponse {
  baselineStats: Record<string, number>;
  coefficients: SimulatorCoefficient[];
  insightSummary?: string;
}

