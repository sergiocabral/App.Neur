import { UTCTimestamp } from 'lightweight-charts';

export interface Candle {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}
