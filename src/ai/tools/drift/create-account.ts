import { generateObject, tool } from 'ai';
import { z } from 'zod';

import { streamUpdate } from '@/lib/utils';
import { retrieveAgentKit } from '@/server/actions/ai';
import { createDriftAccount as createDriftAccountAction , getDriftMarkets } from '@/server/actions/drift';

import { ToolConfig, WrappedToolProps } from '..';
import { openai } from '@/ai/providers';

export const createDriftAccount = (): ToolConfig => {
  const metadata = {
    description: 'Call this tool when the user wants to create a drift account',
    parameters: z.object({
      message: z
        .string()
        .optional()
        .or(z.literal(''))
        .describe('Message that the user sent'),
    }),
    updateParameters: z.object({
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
    extraData: { agentKit },
  }: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async (
        { message }: z.infer<typeof metadata.parameters>,
        { toolCallId },
      ) => {
        const updatedToolCall: {
          toolCallId: string;
          status: 'streaming' | 'idle';
          step: string;
          availableSymbols: { symbol: string; mint: string }[];
        } = {
          toolCallId,
          status: 'streaming',
          step: 'updating',  
          availableSymbols: [],
        }; 

         const {result: availableSymbols , success } = await getDriftMarkets();

         if(!success){
          throw new Error('Failed to get drift markets');
         }

         streamUpdate({
          stream: dataStream,
          update: {
            type: 'stream-result-data',
            status: 'streaming',
            toolCallId,
            content: {
              ...updatedToolCall,
              step: 'updating',
              availableSymbols,
            },
          },
         });
        
        const { object: originalToolCall } = await generateObject({
          model: openai('gpt-4o-mini', { structuredOutputs: true }),
          schema:z.object({
            amount: z.number().nullable(),
            symbol: z.string().nullable(),
          }),
          prompt: `The user sent the following message: ${message}`,
        });

        if (
          originalToolCall && originalToolCall?.symbol && originalToolCall?.amount
        )  {

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
              status: 'idle',
              content: {
                ...result.result,
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

        return {
          success: true,
          noFollowUp: true,
          result: {
            ...updatedToolCall,
            availableSymbols,
            step: 'awaiting-confirmation',
          },
        };
      },
    });

  return {
    metadata,
    buildTool,
    confirm: createDriftAccountAction,
  };
};

