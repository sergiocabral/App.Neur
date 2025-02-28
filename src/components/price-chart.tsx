'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  CandlestickSeries,
  type ChartOptions,
  type DeepPartial,
  type IChartApi,
  type ISeriesApi,
  LineSeries,
  createChart,
} from 'lightweight-charts';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { type Candle, candleArrayToLine } from '@/types/chart-elements';
import { INTERVAL, Interval } from '@/types/interval';
import { type TIME_RANGE, TimeRange } from '@/types/time-range';

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

function shouldScaleLine(
  interval: INTERVAL,
  timeRange: TIME_RANGE | undefined,
): boolean {
  return interval === INTERVAL.DAYS && timeRange !== undefined;
}

enum CHART_TYPES {
  CANDLE = 0,
  LINE = 1,
}

const FIXED_HEIGHT = 400;

export default function LightweightChart({
  data,
  interval,
  timeRange,
  tokenInfo: { symbol, address },
  aggregator,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<
    ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null
  >(null);
  const [selectedChartType, setSelectedChartType] = useState<CHART_TYPES>(
    CHART_TYPES.CANDLE,
  );
  const [isDarkMode, setIsDarkMode] = useState(
    typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark'),
  );
  const timeRangeDisplay: string | undefined = timeRange
    ? TimeRange.mapTimeRangeToDisplay(timeRange)
    : undefined;
  const intervalDisplay = Interval.mapIntervalToDisplay(interval);

  const computeMinMove = useCallback((chartData: Candle[]) => {
    const minMove = Math.min(
      ...chartData
        .slice(1)
        .map((d, i) => Math.abs(d.close - chartData[i].close))
        .filter((diff) => diff > 0),
    );

    return minMove < 0.01
      ? Math.pow(10, Math.floor(Math.log10(minMove)))
      : 0.01;
  }, []);

  const getThemeAwareChartOptions =
    useCallback((): DeepPartial<ChartOptions> => {
      return {
        height: 400,
        layout: {
          background: {
            color: isDarkMode ? '#222' : '#ffffff',
          },
          textColor: isDarkMode ? '#DDD' : '#333',
        },
        grid: {
          vertLines: {
            color: isDarkMode
              ? 'rgba(70, 70, 70, 0.5)'
              : 'rgba(220, 220, 220, 0.5)',
            style: 1,
          },
          horzLines: {
            color: isDarkMode
              ? 'rgba(70, 70, 70, 0.5)'
              : 'rgba(220, 220, 220, 0.5)',
            style: 1,
          },
        },
        timeScale: {
          timeVisible: true,
        },
      };
    }, [isDarkMode]);

  const addCandleSeries = useCallback(() => {
    if (!chartRef.current) return;

    const computedMinMove = computeMinMove(data);
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
  }, [data, computeMinMove]);

  const addLineSeries = useCallback(() => {
    if (!chartRef.current) return;

    const computedMinMove = computeMinMove(data);
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
  }, [data, interval, timeRange, computeMinMove]);

  const switchToCandle = useCallback(() => {
    setSelectedChartType(CHART_TYPES.CANDLE);
    if (chartRef.current && seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
      addCandleSeries();
    }
  }, [addCandleSeries]);

  const switchToLine = useCallback(() => {
    setSelectedChartType(CHART_TYPES.LINE);
    if (chartRef.current && seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
      addLineSeries();
    }
  }, [addLineSeries]);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = FIXED_HEIGHT;

    chartRef.current = createChart(containerRef.current, {
      ...getThemeAwareChartOptions(),
      width: containerWidth,
      height: containerHeight,
    });


    chartRef.current.timeScale().fitContent();

    switch (selectedChartType) {
      case CHART_TYPES.CANDLE:
        addCandleSeries();
        break;
      case CHART_TYPES.LINE:
        addLineSeries();
        break;
      default:
        addCandleSeries();
    }
  }, [
    getThemeAwareChartOptions,
    selectedChartType,
    addCandleSeries,
    addLineSeries,
  ]);

  const handleResize = useCallback(() => {
    if (!chartRef.current || !containerRef.current) return;

    const newWidth = containerRef.current.clientWidth;
    const newHeight = FIXED_HEIGHT;

    requestAnimationFrame(() => {
      chartRef.current?.applyOptions({
        width: newWidth,
        height: newHeight,
      });
      chartRef.current?.timeScale().fitContent();
    });
  }, []);

  useEffect(() => {
    initChart();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        if (seriesRef.current) {
          chartRef.current.removeSeries(seriesRef.current);
          seriesRef.current = null;
        }
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [initChart, handleResize]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsDarkMode(document.documentElement.classList.contains('dark'));

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const newIsDarkMode =
            document.documentElement.classList.contains('dark');
          setIsDarkMode(newIsDarkMode);

          if (chartRef.current) {
            chartRef.current.applyOptions(getThemeAwareChartOptions());
          }
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, [getThemeAwareChartOptions]);

  return (
    <Card className="bg-background">
      <CardHeader className="border-b py-5">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl font-semibold">{symbol}</CardTitle>
            {timeRangeDisplay && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-sm text-muted-foreground">
                {timeRangeDisplay}
              </span>
            )}
            <span className="rounded-full bg-muted px-2 py-0.5 text-sm text-muted-foreground">
              {intervalDisplay}
            </span>
            {aggregator && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-sm text-muted-foreground">
                {aggregator}
              </span>
            )}
          </div>
          <CardDescription>
            Contract Address:
            <span className="hidden sm:inline"> {address}</span>
            <span className="inline sm:hidden"> {shortenAddress(address)}</span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="relative pt-6">
        <div
          ref={containerRef}
          className="h-[400px] w-full min-w-[300px]"
          style={{ contain: 'strict' }}
        />
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            onClick={switchToCandle}
            variant={
              selectedChartType === CHART_TYPES.CANDLE ? 'default' : 'secondary'
            }
          >
            Candle
          </Button>
          <Button
            onClick={switchToLine}
            variant={
              selectedChartType === CHART_TYPES.LINE ? 'default' : 'secondary'
            }
          >
            Line
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
