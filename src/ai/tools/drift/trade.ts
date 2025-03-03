import { generateObject, tool } from 'ai';
import { z } from 'zod';

import { streamUpdate } from '@/lib/utils';
import {
  PerpMarketType,
  SpotMarketType,
  SpotTokenSwapDriftAction,
  getMainnetDriftMarkets,
  tradeDriftPerpAccountAction,
} from '@/server/actions/drift';

import { ToolConfig, WrappedToolProps } from '..';
import { openai } from '../../providers';
import { driftTools } from '../../solana/drift';

export const getDriftAPY = () => {
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

export const tradeDriftPerpAccount = (): ToolConfig => {
  const metadata = {
    description: 'Tool to Trade a perpetual account on Drift protocol.',
    parameters: z.object({
      message: z
        .string()
        .optional()
        .or(z.literal(''))
        .describe('Message that the user sent'),
    }),
    updateParameters: z.object({
      amount: z.number().describe('The amount to trade'),
      action: z.enum(['long', 'short']).describe('The action to take'),
      type: z.enum(['market', 'limit']).describe('The type of trade'),
      price: z.number().optional().describe('The price to trade at'),
      symbol: z.string().describe('The symbol of the token to trade'),
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
        let updatedToolCall: {
          toolCallId: string;
          status: 'streaming' | 'idle';
          step:
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
        } = {
          toolCallId,
          status: 'streaming',
          step: 'market-selection',
        };

        const getMarkets = await getMainnetDriftMarkets({ agentKit });
        if (getMarkets.success) {
          updatedToolCall.prepMarkets = getMarkets.result?.PrepMarkets ?? [];
          streamUpdate({
            stream: dataStream,
            update: {
              type: 'stream-result-data',
              status: 'streaming',
              toolCallId,
              content: {
                step: 'market-selection',
                prepMarkets: updatedToolCall.prepMarkets,
              },
            },
          });
        }

        const { object: originalToolCall } = await generateObject({
          model: openai('gpt-4o-mini', { structuredOutputs: true }),
          schema: z.object({
            amount: z.number().nullable(),
            action: z.enum(['long', 'short']).nullable(),
            type: z.enum(['market', 'limit']).nullable(),
            symbol: z.string(),
            price: z.number().nullable(),
          }),
          prompt: `The user sent the following message: ${message}`,
        });

        if (
          originalToolCall &&
          originalToolCall.symbol &&
          originalToolCall.amount &&
          originalToolCall.action &&
          originalToolCall.type
        ) {
          updatedToolCall = {
            ...updatedToolCall,
            step: 'awaiting-confirmation',
            price: originalToolCall.price ?? undefined,
            amount: originalToolCall.amount,
            action: originalToolCall.action,
            type: originalToolCall.type,
            symbol: originalToolCall.symbol,
          };
          streamUpdate({
            stream: dataStream,
            update: {
              type: 'stream-result-data',
              status: 'idle',
              toolCallId,
              content: {
                ...updatedToolCall,
              },
            },
          });
        }

        return {
          success: true,
          noFollowUp: true,
          result: {
            step: 'awaiting-confirmation',
            amount: updatedToolCall.amount,
            action: updatedToolCall.action,
            type: updatedToolCall.type,
            price: updatedToolCall.price,
            symbol: updatedToolCall.symbol,
          },
        };
      },
    });

  return {
    metadata,
    buildTool,
    confirm: async (toolResults: any, extraData: any) => {
      const { amount, symbol, action, type, price } = toolResults;
      try {
        const result = await tradeDriftPerpAccountAction({
          amount,
          symbol,
          action,
          type,
          price,
        }, extraData);
        return {
          success: true,
          noFollowUp: true,
          result: {
            ...result,
            signature: result.result?.signature,
            step: 'completed',
          },
        };
      } catch (error) {
        console.error(error);
        return {
          success: true,
          noFollowUp: true,
          result: {
            step: 'failed',
            error: error instanceof Error ? error.message : 'An unexpected error occurred.',
          },
        };
        
      }
    },
  };
};

const amountSchema = z
  .object({
    toAmount: z.number().optional().describe('The amount of the token to swap to'),
    fromAmount: z.number().optional().describe('The amount to swap from'),
  })
  .refine(
    (data) => 
      (data.toAmount === undefined) !== (data.fromAmount === undefined) && // Ensures exactly one is provided
      ((data.toAmount !== undefined && data.toAmount > 0) || (data.fromAmount !== undefined && data.fromAmount > 0)), // Ensures provided value is > 0
    {
      message: 'Either `toAmount` or `fromAmount` must be provided and must be greater than 0, but not both.',
      path: [],
    }
  );

export const SpotTokenSwapDrift = (): ToolConfig => {
  const metadata = {
    description: 'Swap spot tokens on Drift protocol.',
    parameters: z.object({
      message: z
        .string()
        .optional()
        .or(z.literal(''))
        .describe('Message that the user sent'),
    }),
    updateParameters: z.object({
      fromSymbol: z.string().describe('The symbol of the token to swap from'),
      toSymbol: z.string().describe('The symbol of the token to swap to'),
      amount: amountSchema,
      slippage: z.number().optional().describe('The slippage tolerance'),
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
        let updatedToolCall: {
          toolCallId: string;
          status: 'streaming' | 'idle';
          step:
            | 'awaiting-confirmation'
            | 'confirmed'
            | 'processing'
            | 'completed'
            | 'canceled'
            | 'failed';
          fromSymbol?: string;
          toSymbol?: string;
          fromAmount?: number;
          toAmount?: number;
          slippage?: number;
          spotMarkets?: SpotMarketType[];
        } = {
          toolCallId,
          status: 'streaming',
          step: 'awaiting-confirmation',
        };

        streamUpdate({
          stream: dataStream,
          update: {
            type: 'stream-result-data',
            status: 'streaming',
            toolCallId,
            content: {
              step: 'get-markets',
            },
          },
        });

        const getMarkets = await getMainnetDriftMarkets({ agentKit });

        if (getMarkets.success) {
          updatedToolCall = {
            ...updatedToolCall,
            step: 'awaiting-confirmation',
            spotMarkets: getMarkets.result?.SpotMarkets ?? [],
          };
        }

        streamUpdate({
          stream: dataStream,
          update: {
            type: 'stream-result-data',
            status: 'streaming',
            toolCallId,
            content: {
              step: 'awaiting-confirmation',
              spotMarkets: updatedToolCall.spotMarkets,
            },
          },
        });
        const { object: originalToolCall } = await generateObject({
          model: openai('gpt-4o-mini', { structuredOutputs: true }),
          schema: z.object({
            fromSymbol: z.string().nullable(),
            toSymbol: z.string().nullable(),
            amount: amountSchema.nullable(),
            slippage: z.number().nullable(),
          }),
          prompt: `The user sent the following message: ${message}`,
        });

        if (originalToolCall) {
          updatedToolCall = {
            ...updatedToolCall,
            step: 'awaiting-confirmation',
            fromSymbol: originalToolCall.fromSymbol ?? undefined,
            toSymbol: originalToolCall.toSymbol ?? undefined,
            fromAmount: originalToolCall.amount?.fromAmount ?? undefined,
            toAmount: originalToolCall.amount?.toAmount ?? undefined,
            slippage: originalToolCall.slippage ?? undefined,
          };
          streamUpdate({
            stream: dataStream,
            update: {
              type: 'stream-result-data',
              status: 'idle',
              toolCallId,
              content: {
                ...updatedToolCall,
              },
            },
          });
        }

        return {
          success: true,
          noFollowUp: true,
          result: {
            step: 'awaiting-confirmation',
            fromSymbol: updatedToolCall.fromSymbol,
            toSymbol: updatedToolCall.toSymbol,
            fromAmount: updatedToolCall.fromAmount,
            slippage: updatedToolCall.slippage,
          },
        };
      },
    });

  return {
    metadata,
    buildTool,
    confirm: async (toolResults: any, extraData: any) => {
      const { fromSymbol, toSymbol, fromAmount, toAmount, slippage } = toolResults;
      try {
        const result = await SpotTokenSwapDriftAction({
          fromSymbol,
          toSymbol,
          toAmount,
          fromAmount,
          slippage,
        }, extraData);
        return {
          success: true,
          noFollowUp: true,
          result: {
            ...result,
            signature: result.result?.signature,
            step: 'completed',
          },
        };
      } catch (error) {
        console.error(error);
        return {
          success: true,
          noFollowUp: true,
          result: {
            step: 'failed',
            error: error instanceof Error ? error.message : 'An unexpected error occurred.',
          },
        };
        
      }
    },
  };
};
