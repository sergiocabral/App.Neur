import { generateObject, tool } from 'ai';
import { z } from 'zod';

import { streamUpdate } from '@/lib/utils';
import { openMeteoraPosition } from '@/server/actions/meteora';

import { ToolConfig, WrappedToolProps } from '.';
import { openai } from '../providers';
import { searchForToken, searchForTokenByMint } from './search-token';

export const tokenSchema = z
  .object({
    token: z.string().optional().describe('The token name or symbol'),
    mint: z.string().optional().describe('Mint address for the token'),
  })
  .refine((data) => data.token !== undefined || data.mint !== undefined, {
    message: 'At least one of `token` or `mint` must be provided',
    path: [],
  });

export const meteoraPosition = (): ToolConfig => {
  const metadata = {
    description:
      'Call this tool when the user wants to open a liquidity position.',
    parameters: z.object({
      message: z
        .string()
        .optional()
        .or(z.literal(''))
        .describe('Message that the user sent'),
    }),
    updateParameters: z.object({
      token: z.object({
        symbol: z.string(),
        mint: z.string(),
      }),
      amount: z.number(),
      poolId: z.string(),
      shouldSwapHalf: z.boolean(),
    }),
  };

  const buildTool = ({
    dataStream = undefined,
    abortData,
    extraData: { askForConfirmation, agentKit },
  }: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async ({ message }: { message?: string }, { toolCallId }) => {
        const updatedToolCall: {
          toolCallId: string;
          status: 'streaming' | 'idle';
          step: string;
          token?: {
            symbol: string;
            mint: string;
            name: string;
            imageUrl?: string | null;
          } | null;
        } = {
          toolCallId,
          status: 'streaming',
          step: 'token-selection',
        };

        const { object: originalToolCall } = await generateObject({
          model: openai('gpt-4o-mini', { structuredOutputs: true }),
          schema: z.object({
            token: z
              .object({
                symbol: z.string().nullable(),
                mint: z.string().nullable(),
              })
              .nullable(),
            amount: z.number().nullable(),
            poolId: z.string().nullable(),
            shouldSwapHalf: z.boolean().nullable(),
          }),
          prompt: `The user sent the following message: ${message}`,
        });

        if (
          originalToolCall &&
          (originalToolCall.token?.mint || originalToolCall.token?.symbol)
        ) {
          const selectedTokenResult = originalToolCall.token.mint
            ? await searchForTokenByMint(originalToolCall.token.mint)
            : await searchForToken(originalToolCall.token.symbol!);
          if (selectedTokenResult.success && selectedTokenResult.result) {
            updatedToolCall.token = {
              mint: selectedTokenResult.result.mint,
              symbol: selectedTokenResult.result.symbol,
              name: selectedTokenResult.result.name,
              imageUrl: selectedTokenResult.result.logoURI,
            };
            streamUpdate({
              stream: dataStream,
              update: {
                type: 'stream-result-data',
                status: 'idle',
                toolCallId,
                content: {
                  token: updatedToolCall.token ?? undefined,
                },
              },
            });

            if (
              originalToolCall.amount &&
              originalToolCall.poolId &&
              !askForConfirmation
            ) {
              const result = await openMeteoraPosition(
                {
                  poolId: originalToolCall.poolId,
                  token: updatedToolCall.token,
                  amount: originalToolCall.amount,
                },
                { agentKit },
              );
              if (!result.success || !result.result?.signature) {
                return {
                  success: false,
                  error: result.error,
                };
              }
              return {
                success: true,
                noFollowUp: true,
                result: {
                  ...updatedToolCall,
                  signature: result.result.signature,
                  step: 'completed',
                },
              };
            }
          }
        }

        return {
          success: true,
          noFollowUp: true,
          result: {
            ...updatedToolCall,
            step: 'awaiting-confirmation',
          },
        };
      },
    });

  return {
    metadata,
    buildTool,
    confirm: openMeteoraPosition,
  };
};
