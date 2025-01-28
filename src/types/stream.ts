export interface TokenInfo {
  symbol?: string;
  mint?: string;
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

export interface ToolDataStream {
  type: 'stream-result-data';
  status?: 'streaming' | 'idle' | 'completed' | undefined;
  toolCallId: string;
  content?: SwapDataResult | CreateActionDataResult;
}

export type DataStreamDelta = ToolDataStream;
