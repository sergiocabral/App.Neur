import React from 'react';

import { z } from 'zod';

import PriceChart from '@/components/price-chart';
import { getDexPriceHistory, getPriceHistory } from '@/server/actions/chart';
import { Candle } from '@/types/candle';
import { INTERVAL } from '@/types/interval';
import { TIME_RANGE } from '@/types/time-range';

const chartToolParameters = z.object({
  contractAddress: z.string().describe('The contract address of the token'),
  interval: z
    .nativeEnum(INTERVAL)
    .default(INTERVAL.DAYS)
    .describe('The time interval/frequency units for the price history'),
  timeRange: z
    .nativeEnum(TIME_RANGE)
    .default(TIME_RANGE.MONTH)
    .describe(
      'Time range to fetch for price history (default 30, one month, 1M)',
    ),
  tokenSymbol: z.string().optional().describe('Optional token symbol'),
  aggregator: z.string().optional().describe('OHLCV aggregator for DEX'),
  beforeTimestamp: z
    .number()
    .optional()
    .describe('Fetch DEX data before this timestamp (in seconds)'),
});

function renderChart(result: unknown) {
  const typedResult = result as {
    success: boolean;
    data?: Candle[];
    interval: INTERVAL;
    timeRange?: TIME_RANGE;
    tokenInfo: { symbol: string; address: string };
    aggregator?: string;
    error?: string;
  };

  if (!typedResult.success) {
    return <div>Error: {typedResult.error}</div>;
  }

  if (!typedResult.data || typedResult.data.length === 0) {
    return <div>No price history data found</div>;
  }

  return (
    <PriceChart
      data={typedResult.data}
      interval={typedResult.interval}
      timeRange={typedResult.timeRange}
      tokenInfo={typedResult.tokenInfo}
    />
  );
}

export const priceChartTool = {
  displayName: '📈 Price Chart',
  isCollapsible: true,
  isExpandedByDefault: true,
  description:
    'Retrieves and displays price history for a Solana token via CoinGecko market data, falling back to DEX if unavailable.',
  parameters: chartToolParameters,
  requiredEnvVars: ['CG_API_KEY'],
  execute: async ({
    contractAddress,
    interval,
    timeRange,
    tokenSymbol,
    aggregator,
    beforeTimestamp,
  }: z.infer<typeof chartToolParameters>) => {
    try {
      const history = await getPriceHistory(
        contractAddress,
        'solana',
        interval,
        timeRange,
        aggregator,
        beforeTimestamp,
      );

      return {
        success: true,
        data: history,
        interval,
        timeRange,
        tokenInfo: {
          symbol: tokenSymbol ?? contractAddress,
          address: contractAddress,
        },
        suppressFollowUp: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve token price history',
      };
    }
  },
  render: renderChart,
};

export const dexChartTool = {
  displayName: '📊 DEX Price Chart',
  isCollapsible: true,
  isExpandedByDefault: true,
  description: 'Retrieves and displays price history data from the DEX.',
  parameters: chartToolParameters,
  requiredEnvVars: ['CG_API_KEY'],
  execute: async ({
    contractAddress,
    interval,
    tokenSymbol,
    aggregator,
    beforeTimestamp,
  }: z.infer<typeof chartToolParameters>) => {
    try {
      const history = await getDexPriceHistory(
        contractAddress,
        'solana',
        interval,
        aggregator,
        beforeTimestamp,
      );

      return {
        success: true,
        data: history,
        interval,
        tokenInfo: {
          symbol: tokenSymbol ?? contractAddress,
          address: contractAddress,
        },
        aggregator,
        suppressFollowUp: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve token price history from DEX',
      };
    }
  },
  render: renderChart,
};

export const chartTools = {
  priceChartTool,
  dexChartTool,
};
