import { PerpMarketType, SpotMarketType } from '@/server/actions/drift';
import { PositionWithPoolName } from '@/server/actions/meteora';

export interface TokenInfo {
  symbol?: string;
  mint?: string;
}

export interface SpotPosition {
  availableBalance: number;
  symbol: string;
  openAsks: number;
  openBids: number;
  openOrders: number;
  type: string;
}

export interface perpPosition {
  market: string;
  baseAssetAmount: number;
  quoteAssetAmount: number;
  quoteEntryAmount: number;
  quoteBreakEvenAmount: number;
  settledPnl: number;
  openAsks: number;
  openBids: number;
  openOrders: number;
  positionType: string;
}

export interface DriftAccountInfoType {
  name: string;
  accountAddress: string;
  authority: string;
  overallBalance: number;
  settledPerpPnl: string;
  lastActiveSlot: number;
  perpPositions: perpPosition[];
  spotPositions: (SpotPosition | undefined)[];
}

export interface SwapDataResult {
  step?:
    | 'token-search'
    | 'fetching-balance'
    | 'updating'
    | 'awaiting-confirmation'
    | 'confirmed'
    | 'processing'
    | 'completed'
    | 'canceled'
    | 'failed';
  inputToken?: TokenInfo;
  outputToken?: TokenInfo;
  inputAmount?: number;
  price?: number;
  signature?: string;
}

export interface CreateActionDataResult {
  step?:
    | 'tool-search'
    | 'updating'
    | 'awaiting-confirmation'
    | 'confirmed'
    | 'processing'
    | 'completed'
    | 'canceled'
    | 'failed';

  frequency?: number;
  maxExecutions?: number;
  startTimeOffset?: number;
  name?: string;
  message?: string;
  requiredTools?: Array<string>;
  missingTools?: Array<string>;
  actionId?: string;
  nextExecutionTime?: string;
}

export interface LaunchPumpfunResult {
  step?:
    | 'updating'
    | 'awaiting-confirmation'
    | 'confirmed'
    | 'processing'
    | 'completed'
    | 'canceled'
    | 'failed';
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  initalBuySOL?: number;
  website?: string;
  twitter?: string;
  telegram?: string;
  signature?: string;
  mint?: string;
  metadataUri?: string;
}

export interface TransferDataResult {
  step?:
    | 'token-search'
    | 'updating'
    | 'awaiting-confirmation'
    | 'confirmed'
    | 'processing'
    | 'completed'
    | 'canceled'
    | 'failed';
  token?: TokenInfo;
  amount?: number;
  receiverAddress?: string;
  signature?: string;
}

export interface CreateDriftDataResult {
  step?:
    | 'updating'
    | 'awaiting-confirmation'
    | 'confirmed'
    | 'processing'
    | 'completed'
    | 'canceled'
    | 'failed';
  symbol?: string;
  amount?: number;
  availableSymbols?: Array<{ symbol: string; mint: string }>;
  signature?: string;
  account?: string;
}

export interface DepositDriftDataResult {
  step?:
    | 'updating'
    | 'awaiting-confirmation'
    | 'confirmed'
    | 'processing'
    | 'completed'
    | 'canceled'
    | 'failed';
  symbol?: string;
  amount?: number;
  availableSymbols?: Array<{ symbol: string; mint: string }>;
  txSig?: string;
  account?: string;
}

export interface Token {
  symbol: string;
  mint: string;
  name?: string;
  balance?: number;
  logoURI?: string | null;
}

export interface MeteoraPositionResult {
  step?:
    | 'token-selection'
    | 'pool-selection'
    | 'amount-input'
    | 'awaiting-confirmation'
    | 'confirmed'
    | 'processing'
    | 'completed'
    | 'canceled';
  token?: Token | null;
  poolId?: string;
  amount?: number;
  shouldSwapHalf?: boolean;
  signature?: string;
  error?: string;
}

export interface MeteoraPositionUpdateResult {
  step?:
    | 'position-selection'
    | 'perform-action'
    | 'awaiting-confirmation'
    | 'confirmed'
    | 'processing'
    | 'completed'
    | 'canceled';
  positions?: PositionWithPoolName[];
  selectedPositionAddress?: string | null;
  action?: 'close' | 'claimLMReward' | 'claimSwapFee';
  signature?: string;
  error?: string;
}

export interface DriftPrepTrade {
  step?:
    | 'market-selection'
    | 'inputs'
    | 'awaiting-confirmation'
    | 'confirmed'
    | 'processing'
    | 'completed'
    | 'canceled'
    | 'failed';
  prepMarkets?: PerpMarketType[];
  amount?: number;
  action?: 'long' | 'short';
  type?: 'market' | 'limit';
  price?: number;
  symbol?: string;
  signature?: string;
  error?: string;
}

export interface DriftSpotTrade {
  step?:
    | 'get-markets'
    | 'awaiting-confirmation'
    | 'confirmed'
    | 'processing'
    | 'completed'
    | 'canceled'
    | 'failed';
  spotMarkets?: SpotMarketType[];
  fromSymbol?: string;
  toSymbol?: string;
  fromAmount?: number;
  toAmount?: number;
  slippage?: number;
  signature?: string;
  error?: string;
}

export interface ManageDriftPosition {
  step?:
    | 'get-info'
    | 'awaiting-confirmation'
    | 'confirmed'
    | 'processing'
    | 'completed'
    | 'canceled'
    | 'failed';
  info?: DriftAccountInfoType;
  selectedPrepPositon?: perpPosition;
  signature?: string;
  error?: string;
}

export interface ToolDataStream {
  type: 'stream-result-data';
  status?: 'streaming' | 'idle' | 'completed' | undefined;
  toolCallId: string;
  content?:
    | SwapDataResult
    | CreateActionDataResult
    | LaunchPumpfunResult
    | TransferDataResult
    | CreateDriftDataResult
    | MeteoraPositionResult
    | MeteoraPositionUpdateResult
    | DriftPrepTrade
    | DriftSpotTrade
    | ManageDriftPosition;
}

export type DataStreamDelta = ToolDataStream;
