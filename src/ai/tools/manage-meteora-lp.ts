import { BN } from '@coral-xyz/anchor';
import { token } from '@coral-xyz/anchor/dist/cjs/utils';
import { LbPosition } from '@meteora-ag/dlmm';
import { PublicKey } from '@solana/web3.js';
import { Output, generateObject, streamText, tool } from 'ai';
import { symbol, z } from 'zod';

import { diffObjects, streamUpdate } from '@/lib/utils';
import {
  MeteoraPool,
  PositionWithPoolName,
  claimRewareForOnePosition,
  claimSwapFee,
  closeMeteoraPositions,
  getAllLbPairPositionForOwner,
  getMeteoraPositions,
  getTokenData,
  openMeteoraPosition,
} from '@/server/actions/meteora';
import { MeteoraPositionResult, Token } from '@/types/stream';

import { ToolConfig, WrappedToolProps } from '.';
import { openai } from '../providers';
import { searchForToken } from './search-token';

export const meteoraLp = (): ToolConfig => {
  const metadata = {
    description:
      'Tool for managing Meteora LP positions - enter pools, view positions, withdraw liquidity',
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
      amount: z.number().optional(),
      poolId: z.string().optional(),
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
        console.log('message', message);
        const updatedToolCall: {
          toolCallId: string;
          status: 'streaming' | 'idle';
          step: string;
          selectedPosition?: PositionWithPoolName | null;
          positions?: PositionWithPoolName[];
          action?: 'close' | 'claimLMReward' | 'claimSwapFee';
        } = {
          toolCallId,
          status: 'streaming',
          step: 'position-selection',
        };

        const allPairs = await getAllLbPairPositionForOwner({ agentKit });
        const positions = await getMeteoraPositions(
          {
            poolIds: allPairs,
          },
          { agentKit },
        );
        console.log('positions ', positions);
        if (positions.success && positions.result) {
          console.log('setting positions..........');
          console.log(positions.result);
          updatedToolCall.positions = positions.result;
        } else {
          console.log(positions.error);
        }

        console.log('updatedToolCall...............', updatedToolCall);
        // Send initial stream update with wallet
        streamUpdate({
          stream: dataStream,
          update: {
            type: 'stream-result-data',
            status: 'streaming',
            toolCallId,
            content: {
              step: 'position-selection',
              positions: updatedToolCall.positions,
              action: updatedToolCall.action,
            },
          },
        });

        const { object: originalToolCall } = await generateObject({
          model: openai('gpt-4o-mini', { structuredOutputs: true }),
          schema: z.object({
            selectedPosition: z
              .object({
                positon: z.object({
                  publicKey: z.string(), // PublicKey will be represented as string
                  positionData: z.object({
                    totalXAmount: z.string(),
                    totalYAmount: z.string(),
                    positionBinData: z.array(
                      z.object({
                        binId: z.number(),
                        price: z.string(),
                        pricePerToken: z.string(),
                        binXAmount: z.string(),
                        binYAmount: z.string(),
                        binLiquidity: z.string(),
                        positionLiquidity: z.string(),
                        positionXAmount: z.string(),
                        positionYAmount: z.string(),
                      }),
                    ),
                    lastUpdatedAt: z.string(), // BN will be represented as string
                    upperBinId: z.number(),
                    lowerBinId: z.number(),
                    feeX: z.string(), // BN will be represented as string
                    feeY: z.string(), // BN will be represented as string
                    rewardOne: z.string(), // BN will be represented as string
                    rewardTwo: z.string(), // BN will be represented as string
                    feeOwner: z.string(), // PublicKey will be represented as string
                    totalClaimedFeeXAmount: z.string(), // BN will be represented as string
                    totalClaimedFeeYAmount: z.string(), // BN will be represented as string
                  }),
                  version: z.number(),
                }),
                poolName: z.string(),
                poolAddress: z.string(),
                mintX: z.string(),
                mintY: z.string(),
              })
              .nullable(),
            action: z
              .enum(['close', 'claimLMReward', 'claimSwapFee'])
              .nullable(),
          }),
          prompt: `The user sent the following message: ${message}`,
        });

        console.log('originalToolCall...............', originalToolCall);

        if (originalToolCall && originalToolCall.selectedPosition) {
          console.log('originalToolCall', originalToolCall);
          const selectedPosition = {
            position: {
              publicKey: new PublicKey(
                originalToolCall.selectedPosition.positon.publicKey,
              ),
              positionData: {
                totalXAmount:
                  originalToolCall.selectedPosition.positon.positionData
                    .totalXAmount,
                totalYAmount:
                  originalToolCall.selectedPosition.positon.positionData
                    .totalYAmount,
                positionBinData:
                  originalToolCall.selectedPosition.positon.positionData
                    .positionBinData,
                lastUpdatedAt: new BN(
                  originalToolCall.selectedPosition.positon.positionData.lastUpdatedAt,
                ),
                upperBinId:
                  originalToolCall.selectedPosition.positon.positionData
                    .upperBinId,
                lowerBinId:
                  originalToolCall.selectedPosition.positon.positionData
                    .lowerBinId,
                feeX: new BN(
                  originalToolCall.selectedPosition.positon.positionData.feeX,
                ),
                feeY: new BN(
                  originalToolCall.selectedPosition.positon.positionData.feeY,
                ),
                rewardOne: new BN(
                  originalToolCall.selectedPosition.positon.positionData.rewardOne,
                ),
                rewardTwo: new BN(
                  originalToolCall.selectedPosition.positon.positionData.rewardTwo,
                ),
                feeOwner: new PublicKey(
                  originalToolCall.selectedPosition.positon.positionData.feeOwner,
                ),
                totalClaimedFeeXAmount: new BN(
                  originalToolCall.selectedPosition.positon.positionData.totalClaimedFeeXAmount,
                ),
                totalClaimedFeeYAmount: new BN(
                  originalToolCall.selectedPosition.positon.positionData.totalClaimedFeeYAmount,
                ),
              },
              version: originalToolCall.selectedPosition.positon.version,
            },
            poolName: originalToolCall.selectedPosition.poolName,
            poolAddress: originalToolCall.selectedPosition.poolAddress,
            mintX: originalToolCall.selectedPosition.mintX,
            mintY: originalToolCall.selectedPosition.mintY,
          };
          updatedToolCall.selectedPosition = selectedPosition;
          if (originalToolCall.action) {
            updatedToolCall.action = originalToolCall.action;
          }
          streamUpdate({
            stream: dataStream,
            update: {
              type: 'stream-result-data',
              status: 'idle',
              toolCallId,
              content: {
                selectedPosition: updatedToolCall.selectedPosition ?? undefined,
              },
            },
          });
        }

        return {
          success: true,
          noFollowUp: true,
          result: {
            step: 'awaiting-confirmation',
            positions: updatedToolCall.positions,
            selectedPosition: updatedToolCall.selectedPosition,
            action: updatedToolCall.action
          },
        };
      },
    });

  return {
    metadata,
    buildTool,
    confirm: async (toolResults: any, extraData: any) => {
      const { selectedPosition, action } = toolResults;

      if (!selectedPosition || !action) {
        return {
          success: false,
          error: 'Missing position or action',
        };
      }

      if (action === 'claimSwapFee') {
        const result = await claimSwapFee(
          {
            poolId: new PublicKey(selectedPosition.poolAddress),
            position: selectedPosition.position,
          },
          extraData,
        );
        return {
          success: true,
          noFollowUp: true,
          result: {
            ...result,
            signature: result.result?.signature,
            action: action,
            step: 'completed',
          },
        };
      }

      if (action === 'claimLMReward') {
        const result = await claimRewareForOnePosition(
          {
            poolId: new PublicKey(selectedPosition.poolAddress),
            position: selectedPosition.position,
          },
          extraData,
        );
        return {
          success: true,
          noFollowUp: true,
          result: {
            ...result,
            signature: result.result?.signature,
            action: action,
            step: 'completed',
          },
        };
      }

      if (action === 'close') {
        const result = await closeMeteoraPositions(
          {
            poolId: new PublicKey(selectedPosition.poolAddress),
            position: selectedPosition.position,
          },
          extraData,
        );
        return {
          success: true,
          noFollowUp: true,
          result: {
            ...result,
            signature: result.result?.signature,
            action: action,
            step: 'completed',
          },
        };
      }

      return {
        success: false,
        error: 'Invalid action',
      };
    },
  };
};
