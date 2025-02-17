import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { generateObject, tool } from 'ai';
import { z } from 'zod';

import { streamUpdate } from '@/lib/utils';
import {
  PositionWithPoolName,
  claimRewareForOnePosition,
  claimSwapFee,
  closeMeteoraPositions,
  getAllLbPairPositionForOwner,
  getMeteoraPositions,
} from '@/server/actions/meteora';

import { ToolConfig, WrappedToolProps } from '.';
import { openai } from '../providers';

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
      selectedPositionAddress: z.string(),
      action: z.enum(['close', 'claimLMReward', 'claimSwapFee']),
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
        let updatedToolCall: {
          toolCallId: string;
          status: 'streaming' | 'idle';
          step: string;
          selectedPositionAddress?: string | null;
          positions?: PositionWithPoolName[];
          action?: 'close' | 'claimLMReward' | 'claimSwapFee' | null;
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
        if (positions.success && positions.result) {
          updatedToolCall.positions = positions.result;
        }

        streamUpdate({
          stream: dataStream,
          update: {
            type: 'stream-result-data',
            status: 'streaming',
            toolCallId,
            content: {
              step: 'position-selection',
              positions: updatedToolCall.positions,
              action: updatedToolCall.action ?? undefined,
            },
          },
        });

        const { object: originalToolCall } = await generateObject({
          model: openai('gpt-4o-mini', { structuredOutputs: true }),
          schema: z.object({
            selectedPositionAddress: z.string().nullable(),
            action: z
              .enum(['close', 'claimLMReward', 'claimSwapFee'])
              .nullable(),
          }),
          prompt: `The user sent the following message: ${message}`,
        });

        if (originalToolCall) {
          updatedToolCall = {
            ...updatedToolCall,
            selectedPositionAddress: originalToolCall.selectedPositionAddress,
            action: originalToolCall.action ?? updatedToolCall.action,
          };
          streamUpdate({
            stream: dataStream,
            update: {
              type: 'stream-result-data',
              status: 'idle',
              toolCallId,
              content: {
                ...updatedToolCall,
                step: 'awaiting-confirmation',
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
            selectedPositionAddress: updatedToolCall.selectedPositionAddress,
            action: updatedToolCall.action,
          },
        };
      },
    });

  return {
    metadata,
    buildTool,
    confirm: async (toolResults: any, extraData: any) => {
      const { selectedPositionAddress, action, positions } = toolResults;

      if (!selectedPositionAddress || !action || !positions) {
        return {
          success: false,
          error: 'Missing position or action',
        };
      }

      const selectedPosition = positions.find(
        (position: PositionWithPoolName) =>
          position.poolAddress === selectedPositionAddress,
      );

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
