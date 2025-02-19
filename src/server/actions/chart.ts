import { UTCTimestamp } from 'lightweight-charts';
import { z } from 'zod';

import { Candle } from '@/types/candle';
import { INTERVAL, Interval } from '@/types/interval';
import { TIME_RANGE, TimeRange } from '@/types/time-range';

const API_KEY = process.env.CG_API_KEY;
const BASE_URL =
  process.env.CG_BASE_URL || 'https://pro-api.coingecko.com/api/v3';
const NETWORK = 'solana';

const tokenSchema = z.object({ id: z.string() });
const priceHistorySchemaOHLC = z.array(z.array(z.number()).length(5));
const dexOhlcvApiResponseSchema = z.object({
  data: z.object({
    attributes: z.object({
      ohlcv_list: z.array(z.array(z.number()).length(6)),
    }),
  }),
});

export async function getTokenId(
  contractAddress: string,
  network: string = NETWORK,
): Promise<string> {
  if (!API_KEY) throw new Error('API key not found');
  const url = `${BASE_URL}/coins/${network}/contract/${contractAddress}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { accept: 'application/json', 'x-cg-pro-api-key': API_KEY },
  });
  if (!response.ok)
    throw new Error(`Failed to fetch token ID for ${contractAddress}`);
  const data = await response.json();
  return tokenSchema.parse(data).id;
}

export async function getPriceHistoryFromCG(
  tokenId: string,
  interval: INTERVAL = INTERVAL.DAYS,
  timeRange: TIME_RANGE = TIME_RANGE.WEEK,
): Promise<Candle[]> {
  if (!API_KEY) throw new Error('API key not found');
  const cgInterval = Interval.mapIntervalToCgInterval(interval);
  const cgTimeRange = TimeRange.mapTimeRangeToCgTimeRange(timeRange);
  const url = `${BASE_URL}/coins/${tokenId}/ohlc?vs_currency=usd&days=${cgTimeRange}&interval=${cgInterval}&precision=18`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { accept: 'application/json', 'x-cg-pro-api-key': API_KEY },
  });
  if (!response.ok)
    throw new Error(`Failed to fetch market_chart for ${tokenId}`);
  const data = await response.json();
  const parsed = priceHistorySchemaOHLC.parse(data);
  return parsed.map(([time, open, high, low, close]) => ({
    // Convert to seconds for lightweight-charts rendering
    time: (time / 1000) as UTCTimestamp,
    open,
    high,
    low,
    close,
  }));
}

async function getTokenPools(
  contractAddress: string,
  network: string = NETWORK,
): Promise<string> {
  if (!API_KEY) throw new Error('API key not found');
  const url = `${BASE_URL}/onchain/networks/${network}/tokens/${contractAddress}/pools`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { accept: 'application/json', 'x-cg-pro-api-key': API_KEY },
  });
  if (!response.ok)
    throw new Error(`Failed to fetch token pools for ${contractAddress}`);
  const json = await response.json();
  const poolData = json.data;
  if (!Array.isArray(poolData) || poolData.length === 0) {
    throw new Error(`No pools found for ${contractAddress}`);
  }
  const topPoolId = poolData[0]?.attributes?.address;
  if (!topPoolId)
    throw new Error(`No valid pool ID in the response for ${contractAddress}`);
  return topPoolId;
}

async function getDexOhlcv(
  poolId: string,
  network: string = NETWORK,
  interval: INTERVAL = INTERVAL.MINUTES,
  aggregator?: string,
  beforeTimestamp?: number,
): Promise<Candle[]> {
  if (!API_KEY) throw new Error('API key not found');
  const path = Interval.mapIntervalToDexPath(interval);
  const agg = Interval.validateAggregator(interval, aggregator);
  let url = `${BASE_URL}/onchain/networks/${network}/pools/${poolId}/ohlcv/${path}?aggregate=${agg}&currency=usd`;
  if (beforeTimestamp) url += `&before_timestamp=${beforeTimestamp}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { accept: 'application/json', 'x-cg-pro-api-key': API_KEY },
  });
  if (!response.ok)
    throw new Error(`Failed to fetch DEX OHLCV for pool: ${poolId}`);
  const data = await response.json();
  const parsed = dexOhlcvApiResponseSchema.parse(data);
  const ohlcvList = parsed.data.attributes.ohlcv_list;

  const result = ohlcvList.map(([timestamp, open, high, low, close]) => {
    return {
      // Timestamp from DEX already in seconds
      time: timestamp as UTCTimestamp,
      open,
      high,
      low,
      close,
    };
  });
  result.reverse();
  return result;
}

export async function getDexPriceHistory(
  contractAddress: string,
  network: string = NETWORK,
  interval: INTERVAL = INTERVAL.MINUTES,
  aggregator?: string,
  beforeTimestamp?: number,
): Promise<Candle[]> {
  const topPoolId = await getTokenPools(contractAddress, network);
  return getDexOhlcv(topPoolId, network, interval, aggregator, beforeTimestamp);
}

export async function getPriceHistory(
  contractAddress: string,
  network: string = NETWORK,
  interval: INTERVAL = INTERVAL.DAYS,
  timeRange: TIME_RANGE = TIME_RANGE.WEEK,
  aggregator?: string,
  beforeTimestamp?: number,
): Promise<Candle[]> {
  try {
    const tokenId = await getTokenId(contractAddress, network);
    return getPriceHistoryFromCG(tokenId, interval, timeRange);
  } catch (err) {
    return getDexPriceHistory(
      contractAddress,
      network,
      interval,
      aggregator,
      beforeTimestamp,
    );
  }
}
