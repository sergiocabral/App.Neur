import { UTCTimestamp } from 'lightweight-charts';

export interface Candle {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Line {
  time: UTCTimestamp;
  value: number;
}

export function candleArrayToLine(candleArray: Candle[]): Line[] {
  return candleArray.map((candle) => {
    const price: number = candle.close ?? candle.open ?? 0;
    return {
      time: candle.time,
      value: price,
    };
  });
}