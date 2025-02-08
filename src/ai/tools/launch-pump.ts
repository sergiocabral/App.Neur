import { tool } from 'ai';
import { SolanaAgentKit } from 'solana-agent-kit';
import { z } from 'zod';

import { streamUpdate } from '@/lib/utils';
import { retrieveAgentKit } from '@/server/actions/ai';

import { WrappedToolProps } from '.';

interface LaunchParams {
  name: string;
  symbol: string;
  description: string;
  image: string;
  initalBuySOL?: number;
  website?: string;
  twitter?: string;
  telegram?: string;
}

export const performLaunch = async (
  {
    name,
    symbol,
    description,
    image,
    initalBuySOL,
    website,
    twitter,
    telegram,
  }: LaunchParams,
  extraData: {
    agentKit?: SolanaAgentKit;
  },
) => {
  try {
    const agent =
      extraData.agentKit ??
      (await retrieveAgentKit(undefined))?.data?.data?.agent;

    if (!agent) {
      return { success: false, error: 'Failed to retrieve agent' };
    }

    const result = await agent.launchPumpFunToken(
      name,
      symbol,
      description,
      image,
      {
        initialLiquiditySOL: initalBuySOL,
        website,
        twitter,
        telegram,
      },
    );

    return { success: true, result: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to launch token',
    };
  }
};

export const launchPumpFun = () => {
  const metadata = {
    description: 'Launch a token on PumpFun',
    parameters: z.object({
      name: z.string().describe('The name of the token'),
      symbol: z.string().describe('The symbol of the token'),
      description: z.string().describe('The description of the token'),
      initalBuySOL: z
        .number()
        .optional()
        .describe('The amount of SOL to buy the token'),
      image: z.string().optional().describe('The image of the token'),
      website: z.string().optional().describe('The website url of the token'),
      twitter: z.string().optional().describe('The twitter url of the token'),
      telegram: z.string().optional().describe('The telegram url of the token'),
    }),
    updateParameters: z.object({
      name: z.string(),
      symbol: z.string(),
      description: z.string(),
      initalBuySOL: z.number(),
      image: z.string(),
      website: z.string(),
      twitter: z.string(),
      telegram: z.string(),
    }),
  };
  const buildTool = ({
    dataStream = undefined,
    abortData,
    extraData: { askForConfirmation, agentKit },
  }: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async (originalToolCall, { toolCallId }) => {
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
          !originalToolCall.image ||
          !originalToolCall.initalBuySOL
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

          const result = await performLaunch(
            {
              ...originalToolCall,
              image: originalToolCall.image,
              initalBuySOL: originalToolCall.initalBuySOL ?? 0,
            },
            { agentKit },
          );
          streamUpdate({
            stream: dataStream,
            update: {
              type: 'stream-result-data',
              toolCallId,
              content: {
                step: result.success ? 'completed' : 'failed',
                signature: result.result?.signature,
                mint: result.result?.mint,
                metadataUri: result.result?.metadataUri,
              },
            },
          });
          return {
            success: true,
            noFollowUp: true,
            result: {
              step: result.success ? 'completed' : 'failed',
              ...originalToolCall,
              signature: result.result?.signature,
              mint: result.result?.mint,
              metadataUri: result.result?.metadataUri,
            },
          };
        }
        return {
          success: true,
          noFollowUp: true,
          result: {
            step: 'awaiting-confirmation',
            ...originalToolCall,
          },
        };
      },
    });

  return {
    metadata,
    buildTool,
    confirm: performLaunch,
  };
};
