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
import { MeteoraPositionResult } from '@/types/stream';

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
          logoURI: token.content.files?.[0]?.uri || token.content.links?.image || '',
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
    description: 'Use this tool when the user wants to open or provide liquidity in a DLMM Pool. The tool will guide through selecting a token, choosing a pool, and specifying the amount to deposit.',
    parameters: z.object({
      token: tokenSchema,
      amount: z.number(),
      poolId: z.string(),
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
      execute: async ( input:MeteoraPositionResult = {}, { toolCallId }) => {  // Correct
        console.log("Tool Started")
        const updatedToolCall: MeteoraPositionResult = {
          step: 'token-selection'  // Initial step
        };

        // Step 1: Get user's token balances
          console.log('📍 Step 1: Initiating token-selection step');

        try {
          console.log('🔍 Fetching user token balances...');

          // const { experimental_partialOutputStream: partialOutputStream } =
          //   streamText({
          //     model: openai('gpt-4o-mini', { structuredOutputs: true }),
          //     system: 'Use the tools required to fetch user token balances',
          //     prompt: `Get the user token balances for wallet address ${walletAddress}`,
          //     maxSteps: 6,
          //     tools: {
          //       getUserTokens: getUserTokens(),
          //     },
          //     experimental_output: Output.object({
          //       schema: z.object({
          //         availableTokens: z.array(
          //           z.object({
          //             symbol: z.string(),
          //             mint: z.string(),
          //             balance: z.number(),
          //             logoURI: z.string().optional(),
          //           }),
          //         ),
          //       }),
          //     }),
          //   });

          console.log('💫 Starting to process token stream...');

          const tokens = await getUserTokens({
            extraData: {walletAddress},
          }).execute({walletAddress},{toolCallId, messages:[] });
              // Process the stream output
          // for await (const delta of partialOutputStream) {
          //   if (delta?.availableTokens) {
          //     const transformedTokens = delta.availableTokens
          //       .filter((t): t is NonNullable<typeof t> => t !== undefined && t.mint != undefined && t.symbol != undefined && t.balance != undefined)
          //       .map(token => ({
          //         mint: token.mint || '',
          //         symbol: token.symbol || '',
          //         imageUrl: token.logoURI || '', // Providing empty string as fallback
          //         balance: token.balance || 0,
          //       }));
              
          //     streamUpdate({
          //       stream: dataStream,
          //       update: {
          //         type: 'stream-result-data',
          //         toolCallId,
          //         content: {
          //           step: 'token-selection',
          //           availableTokens: transformedTokens,
          //         },
          //       },
          //     });
          //   }
          // }
          if(tokens.result && updatedToolCall.step === 'token-selection'){
            console.log("Updating stream with token selection", tokens.result)
            streamUpdate({
              stream: dataStream,
              update: {
                type: 'stream-result-data',
                toolCallId,
                content: {
                  step: 'token-selection',
                  availableTokens: tokens.result,
                },
              },
            });
          }

          // Step 2: Once token is selected, get Meteora Pools
          if (updatedToolCall.step === 'token-selection' && !updatedToolCall.selectedToken) {
            // Wait for frontend to provide selected token
            console.log("Waiting for token selection............");
            streamUpdate({
              stream: dataStream,
              update: {
                status: 'idle',
                type: 'stream-result-data',
                toolCallId,
                content: {
                  step: 'token-selection',
                },
              },
            });

            // The tool will pause here waiting for frontend input
            if (abortData?.abortController) {
              abortData.shouldAbort = true;
            }

            return {
              success: true,
              result: {
                step: 'token-selection',
                ...updatedToolCall
              }
            };
          }

          // When frontend sends back selected token via addToolResult
          if (updatedToolCall.selectedToken?.mint) {
            console.log(
              '📍 Step 2: Token selected, fetching pools for mint:',
              updatedToolCall.selectedToken.mint,
            );
            
            try {
              const pools = await getMeteoraPoolsForToken(
                updatedToolCall.selectedToken.mint,
              );

              console.log('🏊‍♂️ Pools fetched:', pools);
              
              streamUpdate({
                stream: dataStream,
                update: {
                  type: 'stream-result-data',
                  toolCallId,
                  content: {
                    step: 'pool-selection',
                    selectedToken: updatedToolCall.selectedToken,
                    selectedPool: pools[0],
                  },
                },
              });
            } catch (error) {
              console.error('❌ Error fetching pools:', error);
              streamUpdate({
                stream: dataStream,
                update: {
                  type: 'stream-result-data',
                  toolCallId,
                  content: {
                    step: 'failed',
                    error: 'Failed to fetch pools',
                  },
                },
              });
            }
          }

          if(updatedToolCall.selectedPool){
            streamUpdate({
              stream: dataStream,
              update: {
                type: 'stream-result-data',
                toolCallId,
                content: {
                  step: 'amount-input',
                  amount: updatedToolCall.amount,
                  selectedPool: updatedToolCall.selectedPool,
                  selectedToken: updatedToolCall.selectedToken,
                },
              },
            })
          }

          if(updatedToolCall.step === 'amount-input' && !updatedToolCall.amount){
            streamUpdate({
              stream: dataStream,
              update: {
                status: 'idle',
                type: 'stream-result-data',
                toolCallId,
                content: {
                  step: 'amount-input',
                },
              },
            });

            if(abortData?.abortController){
              abortData.shouldAbort = true;
            }

            return {
              success: true,
              result: {
                step: 'amount-input',
                ...updatedToolCall
              }
            };
          }

          if(updatedToolCall.amount){
            console.log("Did you fill the amount?", updatedToolCall.amount)
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

            if(abortData?.abortController){
              abortData.shouldAbort = true;
            }

            return {
              success: true,
              result: {
                step: 'awaiting-confirmation',
                ...updatedToolCall
              }
            }
          }

          if(
            updatedToolCall.step == 'processing-tnx' &&
            updatedToolCall.selectedToken &&
            updatedToolCall.amount &&
            updatedToolCall.selectedPool
          ){

          // Process the transaction
          console.log('🔄 Processing transaction with parameters:', {
            poolId: updatedToolCall.selectedPool.poolId,
            tokenMint: updatedToolCall.selectedToken.mint,
              amount: updatedToolCall.amount,
            });
  
            const result = await openMeteoraPosition({
              poolId: updatedToolCall.selectedPool.poolId,
              tokenMint: updatedToolCall.selectedToken.mint,
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
          }
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
