import { DataStreamWriter } from 'ai';

import { performSwap } from '@/server/actions/swap';

import { swapTokens } from './swap';

export interface WrappedToolProps {
  dataStream?: DataStreamWriter;
  abortData?: {
    aborted: boolean;
    abortController: AbortController;
  };
  extraData?: any;
}

export const toolConfirmationRegistry: Record<string, Function> = {
  [swapTokens.name]: performSwap,
};
