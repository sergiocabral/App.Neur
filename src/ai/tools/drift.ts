import { tool } from 'ai';
import { z } from 'zod';

import { streamUpdate } from '@/lib/utils';
import { retrieveAgentKit } from '@/server/actions/ai';

import { WrappedToolProps } from '.';
import { driftTools } from '../solana/drift';

const getDriftAPY = () => {
  const metadata = {
    description:
      'Get Drift APY for a given symbol or all symbols (if no symbol is provided)',
    parameters: driftTools.getDriftAPY.parameters,
  };
  const buildTool = (props: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async ({
        symbols,
      }: z.infer<typeof driftTools.getDriftAPY.parameters>) => {
        return await driftTools.getDriftAPY.execute({ symbols });
      },
    });

  return {
    metadata,
    buildTool,
  };
};

const driftAccountInfo = () => {
  const metadata = {
    description: 'Get drift account info',
    parameters: driftTools.driftAccountInfo.parameters,
  };
  const buildTool = (props: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async ({}: z.infer<
        typeof driftTools.driftAccountInfo.parameters
      >) => {
        return await driftTools.driftAccountInfo.execute();
      },
    });

  return {
    metadata,
    buildTool,
  };
};

const performCreateDriftAccount = async ({
  amount,
  symbol,
}: {
  amount: number;
  symbol: string;
}) => {
  try {
    const agent = (await retrieveAgentKit(undefined))?.data?.data?.agent;

    if (!agent) {
      return { success: false, error: 'Failed to retrieve agent' };
    }

    const result = await agent.createDriftUserAccount(amount, symbol);

    return { success: true, result: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to launch token',
    };
  }
};

const createDriftAccount = () => {
  const metadata = {
    description: 'Create a drift account for the user (no parameters required)',
    parameters: z.object({
      amount: z.number().default(0).describe('The amount of tokens to deposit'),
      symbol: z
        .string()
        .default('')
        .describe('The symbol of the token to deposit'),
    }),
  };
  const buildTool = ({
    dataStream = undefined,
    abortData,
    extraData,
  }: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async (
        originalToolCall: z.infer<typeof metadata.parameters>,
        { toolCallId },
      ) => {
        streamUpdate({
          stream: dataStream,
          update: {
            type: 'stream-result-data',
            status: 'streaming',
            toolCallId,
            content: {
              ...originalToolCall,
              step: 'updating',
            },
          },
        });
        if (
          extraData.askForConfirmation ||
          !originalToolCall.symbol ||
          !originalToolCall.amount
        ) {
          streamUpdate({
            stream: dataStream,
            update: {
              status: 'idle',
              type: 'stream-result-data',
              toolCallId,
              content: {
                step: 'awaiting-confirmation',
              },
            },
          });
          if (abortData?.abortController) {
            abortData.shouldAbort = true;
          }
        } else {
          streamUpdate({
            stream: dataStream,
            update: {
              type: 'stream-result-data',
              toolCallId,
              content: {
                step: 'processing',
              },
            },
          });

          const result = await performCreateDriftAccount({
            amount: originalToolCall.amount,
            symbol: originalToolCall.symbol,
          });
          streamUpdate({
            stream: dataStream,
            update: {
              type: 'stream-result-data',
              toolCallId,
              content: {
                step: result.success ? 'completed' : 'failed',
                ...result,
              },
            },
          });
          return {
            success: true,
            result: {
              step: result.success ? 'completed' : 'failed',
              ...originalToolCall,
              ...result,
            },
          };
        }
        const agent = (await retrieveAgentKit(undefined))?.data?.data?.agent;

        const markets = agent
          ? (agent.getAvailableDriftMarkets('spot') as any[])
          : [];

        return {
          success: true,
          result: {
            step: 'awaiting-confirmation',
            ...originalToolCall,
            availableSymbols: [
              ...new Map(
                markets.map((m) => [
                  m.mint.toBase58(),
                  { symbol: m.symbol, mint: m.mint.toBase58() },
                ]),
              ).values(),
            ],
          },
        };
      },
    });

  return {
    metadata,
    buildTool,
    confirm: performCreateDriftAccount,
  };
};

export const allDriftTools = {
  getDriftAPY: getDriftAPY(),
  driftAccountInfo: driftAccountInfo(),
  createDriftAccount: createDriftAccount(),
};
