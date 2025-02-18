'use client';

import React, { useEffect, useRef } from 'react';

import { CandlestickSeries, IChartApi, createChart } from 'lightweight-charts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Candle } from '@/types/candle';
import { INTERVAL } from '@/types/interval';

interface PriceChartProps {
  data: Candle[];
  interval: INTERVAL;
  tokenInfo: {
    symbol: string;
    address: string;
  };
}

function shortenAddress(addr: string) {
  if (addr.length <= 10) return addr;
  return addr.slice(0, 4) + '...' + addr.slice(-4);
}

export default function LightweightChart({
  data,
  interval,
  tokenInfo: { symbol, address },
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let chart: IChartApi;
    if (containerRef.current) {
      chart = createChart(containerRef.current);
      const series = chart.addSeries(CandlestickSeries);
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
          <CardTitle>{symbol} Price</CardTitle>
          <CardDescription>
            Contract Address:
            <span className="hidden sm:inline"> {address}</span>
            <span className="inline sm:hidden"> {shortenAddress(address)}</span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div
          ref={containerRef}
          style={{ width: '600px', height: '400px' }}
        ></div>
      </CardContent>
    </Card>
  );
}