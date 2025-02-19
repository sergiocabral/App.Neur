'use client';

import React, { useEffect, useRef } from 'react';

import {
  CandlestickSeries,
  ChartOptions,
  DeepPartial,
  IChartApi,
  createChart,
} from 'lightweight-charts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Candle } from '@/types/candle';
import { INTERVAL, Interval } from '@/types/interval';
import { TIME_RANGE, TimeRange } from '@/types/time-range';

interface PriceChartProps {
  data: Candle[];
  interval: INTERVAL;
  timeRange?: TIME_RANGE;
  tokenInfo: {
    symbol: string;
    address: string;
  };
  aggregator?: string;
}

function shortenAddress(addr: string) {
  if (addr.length <= 10) return addr;
  return addr.slice(0, 4) + '...' + addr.slice(-4);
}

const chartOptions: DeepPartial<ChartOptions> = {
  height: 400,
  width: 600,
  layout: {
    background: { color: '#222' },
    textColor: '#DDD',
  },
  grid: {
    vertLines: { color: '#444' },
    horzLines: { color: '#444' },
  },
  timeScale: {
    timeVisible: true,
  },
};

export default function LightweightChart({
  data,
  interval,
  timeRange,
  tokenInfo: { symbol, address },
  aggregator,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeRangeDisplay: string | undefined = timeRange
    ? TimeRange.mapTimeRangeToDisplay(timeRange)
    : undefined;
  const intervalDisplay = Interval.mapIntervalToDisplay(interval);
  useEffect(() => {
    const minMove = Math.min(
      ...data
        .slice(1)
        .map((d, i) => Math.abs(d.close - data[i].close))
        .filter((diff) => diff > 0),
    );

    const computedMinMove =
      minMove < 0.01 ? Math.pow(10, Math.floor(Math.log10(minMove))) : 0.01;
    let chart: IChartApi;

    if (containerRef.current) {
      chart = createChart(containerRef.current, chartOptions);
      chart.timeScale().fitContent();
      const series = chart.addSeries(CandlestickSeries, {
        priceFormat: {
          type: 'price',
          minMove: computedMinMove,
        },
      });
      series.setData(data);
    }
    return () => {
      if (chart) {
        chart.remove();
      }
    };
  }, [data]);

  return (
    <Card>
      <CardHeader className="border-b py-5">
        <div className="grid flex-1 gap-1">
          <CardTitle>
            <span style={{ marginRight: '5px' }}>{symbol}</span>
            {timeRangeDisplay && (
              <span style={{ marginRight: '5px' }}>{timeRangeDisplay}</span>
            )}
            <span style={{ marginRight: '5px' }}>{intervalDisplay}</span>
            {aggregator && <span>{aggregator}</span>}
          </CardTitle>
          <CardDescription>
            Contract Address:
            <span className="hidden sm:inline"> {address}</span>
            <span className="inline sm:hidden"> {shortenAddress(address)}</span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div ref={containerRef}></div>
      </CardContent>
    </Card>
  );
}
