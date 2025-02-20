'use client';

import React, { useCallback, useEffect, useRef } from 'react';

import {
  CandlestickSeries,
  ChartOptions,
  DeepPartial,
  IChartApi,
  ISeriesApi,
  LineSeries,
  createChart,
} from 'lightweight-charts';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Candle, candleArrayToLine } from '@/types/chart-elements';
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

function shouldScaleLine(
  interval: INTERVAL,
  timeRange: TIME_RANGE | undefined,
): boolean {
  return interval == INTERVAL.DAYS && timeRange != undefined;
}

enum CHART_TYPES {
  CANDLE,
  LINE,
}

export default function LightweightChart({
  data,
  interval,
  timeRange,
  tokenInfo: { symbol, address },
  aggregator,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const candleButtonRef = useRef<HTMLButtonElement>(null);
  const lineButtonRef = useRef<HTMLButtonElement>(null);
  const chartRef = useRef<IChartApi>(null);
  const seriesRef = useRef<ISeriesApi<any>>(null);
  const selectedChartTypeRef = useRef<CHART_TYPES>(CHART_TYPES.CANDLE);
  const timeRangeDisplay: string | undefined = timeRange
    ? TimeRange.mapTimeRangeToDisplay(timeRange)
    : undefined;
  const intervalDisplay = Interval.mapIntervalToDisplay(interval);

  function switchToCandle() {
    selectedChartTypeRef.current = CHART_TYPES.CANDLE;
    if (chartRef.current && seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
      addCandleSeries();
    }
  }

  function switchToLine() {
    selectedChartTypeRef.current = CHART_TYPES.LINE;
    if (chartRef.current && seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
      addLineSeries();
    }
  }

  const computeMinMove = useCallback((): number => {
    const minMove = Math.min(
      ...data
        .slice(1)
        .map((d, i) => Math.abs(d.close - data[i].close))
        .filter((diff) => diff > 0),
    );

    return minMove < 0.01
      ? Math.pow(10, Math.floor(Math.log10(minMove)))
      : 0.01;
  }, [data]);

  const addCandleSeries = useCallback(() => {
    if (chartRef.current) {
      const computedMinMove = computeMinMove();
      seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
        priceFormat: {
          type: 'price',
          minMove: computedMinMove,
        },
      });
      seriesRef.current.priceScale().applyOptions({
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      });
      seriesRef.current.setData(data);
    }
  }, [computeMinMove, data]);

  const addLineSeries = useCallback(() => {
    if (chartRef.current) {
      const computedMinMove = computeMinMove();
      const lineData = candleArrayToLine(data);
      seriesRef.current = chartRef.current.addSeries(LineSeries, {
        priceFormat: {
          type: 'price',
          minMove: computedMinMove,
        },
      });
      // adjust for candle wicks affecting price scale, attempt to maintain similar scale
      if (shouldScaleLine(interval, timeRange)) {
        seriesRef.current.priceScale().applyOptions({
          scaleMargins: {
            top: 0.2,
            bottom: 0.15,
          },
        });
      }
      seriesRef.current.setData(lineData);
    }
  }, [computeMinMove, data]);

  useEffect(() => {
    if (containerRef.current) {
      chartRef.current = createChart(containerRef.current, chartOptions);
      chartRef.current.timeScale().fitContent();
      // re-render safe
      switch (selectedChartTypeRef.current) {
        case CHART_TYPES.CANDLE:
          addCandleSeries();
          break;
        case CHART_TYPES.LINE:
          addLineSeries();
          break;
        default:
          addCandleSeries();
      }
    }
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [addCandleSeries, addLineSeries, data]);

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
        <Button
          ref={candleButtonRef}
          onClick={switchToCandle}
          variant={'secondary'}
        >
          Candle
        </Button>
        <Button
          ref={lineButtonRef}
          onClick={switchToLine}
          variant={'secondary'}
        >
          Line
        </Button>
        <div ref={containerRef}></div>
      </CardContent>
    </Card>
  );
}
