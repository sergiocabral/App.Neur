import { tool } from 'ai';
import { z } from 'zod';

import { streamUpdate } from '@/lib/utils';
import { retrieveAgentKit } from '@/server/actions/ai';
import { createDriftAccount as createDriftAccountAction } from '@/server/actions/drift';

import { ToolConfig, WrappedToolProps } from '..';

export const createDriftAccount = (): ToolConfig => {
  const metadata = {
    description: 'Create a drift account for the user',
    parameters: z.object({
      amount: z.number().default(0).describe('The amount of tokens to deposit'),
      symbol: z
        .string()
        .default('')
        .describe('The symbol of the token to deposit')
    })
  };

  const buildTool = ({
    dataStream = undefined,
    abortData,
    extraData: { askForConfirmation },
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
          askForConfirmation ||
          !originalToolCall.symbol ||
          !originalToolCall.amount
        ) {
          streamUpdate({
            stream: dataStream,
            update: {
              type: 'stream-result-data',
              status: 'idle',
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

          const result = await createDriftAccountAction({
            amount: originalToolCall.amount,
            symbol: originalToolCall.symbol,
          });

          streamUpdate({
            stream: dataStream,
            update: {
              type: 'stream-result-data',
              toolCallId,
              content: {
                ...result,
                step: result.success ? 'completed' : 'failed',
              },
            },
          });

          return {
            success: result.success,
            result: {
              ...originalToolCall,
              ...result.result,
              step: result.success ? 'completed' : 'failed',
            },
          };
        }

         // get available markets to show in UI
         const agent = (await retrieveAgentKit(undefined))?.data?.data?.agent;
         const markets = agent
           ? (agent.getAvailableDriftMarkets('spot') as any[])
           : [];
 
         const availableSymbols = [
           ...new Map(
             markets.map((m) => [
               m.mint.toBase58(),
               { symbol: m.symbol, mint: m.mint.toBase58() },
             ]),
           ).values(),
         ];

        return {
          success: true,
          result: {
            ...originalToolCall,
            availableSymbols,
            step: 'awaiting-confirmation',
          },
        };
      },
    });

  return {
    metadata,
    buildTool,
    confirm: createDriftAccountAction
  };
};

