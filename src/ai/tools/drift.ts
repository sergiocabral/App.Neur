import { generateObject, tool } from 'ai';
import { z } from 'zod';

import { streamUpdate } from '@/lib/utils';
import { retrieveAgentKit } from '@/server/actions/ai';
import { MainnetPerpMarketsList, PerpMarketType, tradeDriftPerpAccountAction } from '@/server/actions/drift';

import { ToolConfig, WrappedToolProps } from '.';
import { openai } from '../providers';
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
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create drift account',
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

export const tradeDriftPerpAccount = (): ToolConfig => {
  const metadata = {
    description:
      'Tool to Trade a perpetual account on Drift protocol.',
    parameters: z.object({
      message: z
        .string()
        .optional()
        .or(z.literal(''))
        .describe('Message that the user sent')
      }),
    updateParameters: z.object({
      amount: z.number().optional().describe('The amount to trade'),
      symbol: z
        .string()
        .optional()
        .describe('The market symbol to trade (e.g. SOL-PERP)'),
      action: z
        .enum(['long', 'short'])
        .optional()
        .describe('The trade direction'),
      type: z.enum(['market', 'limit']).optional().describe('The order type'),
      price: z.number().optional().describe('The price of the trade'),
    }),
  };

  const buildTool = ({
    dataStream = undefined,
    abortData,
    extraData: { askForConfirmation, agentKit },
  }: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async ({ message }, { toolCallId }) => {
        const updatedToolCall: {
          toolCallId: string;
          status: 'streaming' | 'idle';
          step:  
          | 'market-selection'
          | 'inputs'
          | 'awaiting-confirmation'
          | 'confirmed'
          | 'processing'
          | 'completed'
          | 'canceled';
          amount?: number | null;
          symbol?: string | null;
          action?: 'long' | 'short' | null;
          type?: 'market' | 'limit' | null;
          price?: number | null;
          markets?: PerpMarketType[];
        } = {
          toolCallId,
          status: 'streaming',
          step: 'market-selection',
        };

        streamUpdate({
          stream: dataStream,
          update: {
            type: 'stream-result-data',
            status: 'idle',
            toolCallId,
            content: {
              action: updatedToolCall.action || undefined,
              amount: updatedToolCall.amount || undefined,
              price: updatedToolCall.price || undefined,
              step: updatedToolCall.step || 'market-selection',
            },
          },
        });

        return {
          success: true,
          noFollowUp: true,
          result: {
            ...updatedToolCall,
            step: 'awaiting-market-selection',
          },
        };
      },
    });

  return {
    metadata,
    buildTool,
    confirm: tradeDriftPerpAccountAction,
  };
};

export const allDriftTools = {
  getDriftAPY: getDriftAPY(),
  driftAccountInfo: driftAccountInfo(),
  createDriftAccount: createDriftAccount(),
};
