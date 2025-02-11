import { Output, streamText, tool } from 'ai';
import { z } from 'zod';

import { searchWalletAssets } from '@/lib/solana/helius';
import { diffObjects, streamUpdate } from '@/lib/utils';
import { MeteoraPool, openMeteoraPosition } from '@/server/actions/meteora';
import { MeteoraPositionResult, Token } from '@/types/stream';

import { ToolConfig, WrappedToolProps } from '.';
import { searchForToken } from './search-token';

export const getUserTokens = ({
  extraData: { walletAddress },
}: WrappedToolProps) =>
  tool({
    description: 'Search for all tokens held by a wallet.',
    parameters: z.object({
      walletAddress: z.string().describe('The wallet address of the token'),
    }),
    execute: async ({ walletAddress }) => {
      const tokens = await searchWalletAssets(walletAddress);
      return {
        success: true,
        result: tokens.fungibleTokens.map((token) => ({
          symbol: token.token_info.symbol,
          mint: token.id,
          balance: token.token_info.balance / 10 ** token.token_info.decimals,
          logoURI:
            token.content.files?.[0]?.uri || token.content.links?.image || '',
        })),
      };
    },
  });

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
      'Call this tool when the user wants to open a liquidity position',
    parameters: z.object({
      token: tokenSchema.optional().describe('Token to provide liquidity in'),
      amount: z.number().optional().describe('Amount of token to provide'),
      poolId: z.string().optional().describe('Pool to provide liquidity in'),
    }),
    updateParameters: z.object({
      token: z.object({
        symbol: z.string(),
        mint: z.string(),
      }),
      amount: z.number(),
      poolId: z.string(),
    }),
  };

  const buildTool = ({
    dataStream = undefined,
    abortData,
    extraData: { askForConfirmation, walletAddress },
  }: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async (originalToolCall, { toolCallId }) => {
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

        if (originalToolCall.token?.mint || originalToolCall.token?.token) {
          const selectedTokenResult = originalToolCall.token.mint
            ? await searchForToken(originalToolCall.token.mint, false)
            : await searchForToken(originalToolCall.token.token!);
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
              const result = await openMeteoraPosition({
                poolId: originalToolCall.poolId,
                tokenMint: updatedToolCall.token.mint,
                amount: originalToolCall.amount,
              });
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
