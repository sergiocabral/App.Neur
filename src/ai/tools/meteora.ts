import { Output, streamText, tool } from 'ai';
import { z } from 'zod';

import { searchWalletAssets } from '@/lib/solana/helius';
import { diffObjects, streamUpdate } from '@/lib/utils';
import {
  getMeteoraPoolsForToken,
  openMeteoraPosition,
} from '@/server/actions/meteora';

import { ToolConfig, WrappedToolProps } from '.';
import { openai } from '../providers';

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
        result: {
          availableTokens: tokens.fungibleTokens.map((token) => ({
            symbol: token.token_info.symbol,
            mint: token.token_info.token_program,
            balance: token.token_info.balance / 10 ** token.token_info.decimals,
            logoURI: token.mint_extensions?.metadata.uri || '',
          })),
        },
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
    name: 'openMeteoraPosition',
    description: 'Open a Spot position in a Meteora DLMM Pool',
    parameters: z.object({
      token: tokenSchema.optional(),
      amount: z.number().optional(),
      poolId: z.string().optional(),
    }),
    updateParameters: z.object({
      token: z
        .object({
          symbol: z.string(),
          mint: z.string(),
        })
        .optional(),
      amount: z.number().optional(),
      poolId: z.string().optional(),
    }),
  };

  const buildTool = ({
    dataStream = undefined,
    abortData,
    extraData: { askForConfirmation, walletAddress },
  }: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async ({ token, amount, poolId }, { toolCallId }) => {
        console.log('🚀 Meteora Tool Execution Started:', {
          token,
          amount,
          poolId,
        });
        const updatedToolCall = { token, amount, poolId };

        // Step 1: Get user's token balances
        console.log('📍 Step 1: Initiating token-selection step');
        streamUpdate({
          stream: dataStream,
          update: {
            type: 'stream-result-data',
            status: 'streaming',
            toolCallId,
            content: {
              step: 'token-selection',
            },
          },
        });

        try {
          console.log('🔍 Fetching user token balances...');

          const { experimental_partialOutputStream: partialOutputStream } =
            streamText({
              model: openai('gpt-4o-mini', { structuredOutputs: true }),
              system: 'Use the tools required to fetch user token balances',
              prompt: 'Get the user token balances',
              maxSteps: 6,
              tools: {
                searchWalletAssets: getUserTokens({
                  extraData: {walletAddress},
                }),
              },
              experimental_output: Output.object({
                schema: z.object({
                  availableTokens: z.array(
                    z.object({
                      symbol: z.string(),
                      mint: z.string(),
                      balance: z.number(),
                      logoURI: z.string().optional(),
                    }),
                  ),
                }),
              }),
            });

          console.log('💫 Starting to process token stream...');
          console.log("partialOutputStream", partialOutputStream);
          const streamedTokens = await getUserTokens({
            extraData: {walletAddress},
          }).execute({walletAddress},{toolCallId, messages:[] });

          console.log('🔍 User token balances fetched:', streamedTokens);

          const validTokens = streamedTokens.result.availableTokens;

          console.log('✅ Filtered valid tokens:', validTokens);

          if (validTokens.length > 0) {
            streamUpdate({
              stream: dataStream,
              update: {
                type: 'stream-result-data',
                toolCallId,
                content: {
                  step: 'token-selection',
                  availableTokens: validTokens,
                },
              },
            });
          } else {
            console.log('⚠️ No valid tokens found');
            streamUpdate({
              stream: dataStream,
              update: {
                type: 'stream-result-data',
                toolCallId,
                content: {
                  step: 'failed',
                  error: 'No tokens found in wallet',
                },
              },
            });
          }

          // Step 2: Once token is selected, get Meteora Pools
          if (updatedToolCall.token?.mint) {
            console.log(
              '📍 Step 2: Token selected, fetching pools for mint:',
              updatedToolCall.token.mint,
            );
            const pools = await getMeteoraPoolsForToken(
              updatedToolCall.token.mint,
            );

            console.log('🏊‍♂️ Pools fetched:', pools);
            streamUpdate({
              stream: dataStream,
              update: {
                type: 'stream-result-data',
                toolCallId,
                content: {
                  step: 'pool-selection',
                  selectedToken: updatedToolCall.token,
                  pools: pools.map((pool) => ({
                    poolId: pool.poolId,
                    tvl: pool.tvl,
                    apr: pool.apr,
                    token0: pool.token0,
                    token1: pool.token1,
                    poolName: pool.poolName,
                  })),
                },
              },
            });
          }

          // Step 3: Handle amount input and confirmation
          if (
            updatedToolCall.amount &&
            updatedToolCall.poolId &&
            updatedToolCall.token?.mint
          ) {
            console.log(
              '📍 Step 3: Amount and pool selected, preparing confirmation',
              {
                amount: updatedToolCall.amount,
                poolId: updatedToolCall.poolId,
                tokenMint: updatedToolCall.token.mint,
              },
            );

            const pools = await getMeteoraPoolsForToken(
              updatedToolCall.token.mint,
            );
            const selectedPool = pools?.find(
              (p) => p.poolId === updatedToolCall.poolId,
            );
            console.log('🎯 Selected pool details:', selectedPool);

            streamUpdate({
              stream: dataStream,
              update: {
                type: 'stream-result-data',
                toolCallId,
                content: {
                  step: 'awaiting-confirmation',
                  selectedToken: updatedToolCall.token,
                  selectedPool,
                  amount: updatedToolCall.amount,
                },
              },
            });
          }
          console.log('Are we even getting here in try ' + walletAddress);
        } catch (error) {
          console.error('❌ Error in Meteora tool:', error);
          streamUpdate({
            stream: dataStream,
            update: {
              type: 'stream-result-data',
              toolCallId,
              content: {
                step: 'failed',
                error:
                  error instanceof Error
                    ? error.message
                    : 'Unknown error occurred',
              },
            },
          });
        }

        // Handle confirmation and transaction
        if (
          askForConfirmation ||
          !updatedToolCall.token?.mint ||
          !updatedToolCall.amount ||
          !updatedToolCall.poolId
        ) {
          console.log(
            '⏳ Awaiting confirmation or missing required parameters:',
            {
              askForConfirmation,
              hasMint: !!updatedToolCall.token?.mint,
              hasAmount: !!updatedToolCall.amount,
              hasPoolId: !!updatedToolCall.poolId,
            },
          );

          if (abortData?.abortController) {
            abortData.shouldAbort = true;
          }
          return {
            success: true,
            result: {
              step: 'awaiting-confirmation',
              ...updatedToolCall,
            },
          };
        }

        // Process the transaction
        console.log('🔄 Processing transaction with parameters:', {
          poolId: updatedToolCall.poolId,
          tokenMint: updatedToolCall.token.mint,
          amount: updatedToolCall.amount,
        });

        const result = await openMeteoraPosition({
          poolId: updatedToolCall.poolId,
          tokenMint: updatedToolCall.token.mint,
          amount: updatedToolCall.amount,
        });

        console.log('📝 Transaction result:', result);

        streamUpdate({
          stream: dataStream,
          update: {
            type: 'stream-result-data',
            toolCallId,
            content: {
              step: result.success ? 'completed' : 'failed',
              signature: result.result?.signature,
            },
          },
        });

        return {
          success: true,
          result: {
            step: result.success ? 'completed' : 'failed',
            ...updatedToolCall,
            signature: result.result?.signature,
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
