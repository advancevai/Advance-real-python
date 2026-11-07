export type HudMode = 'result' | 'register' | 'add_balance';

export type PredictionSize = 'BIG' | 'SMALL';

export interface Prediction {
  n: number;
  s: PredictionSize;
}

export interface PredictionHistoryItem {
  id: string;
  period: string;
  predictedDigit: number;
  predictedSize: PredictionSize;
  actualDigit?: number;
  actualSize?: PredictionSize;
  isWin?: boolean;
  timestamp: number;
}

export interface LotteryRecord {
  issueNumber: string;
  number?: number;
  colour?: string;
  openTime?: string;
}

export type ViewportMode = 'arena' | 'iframe' | 'split';
