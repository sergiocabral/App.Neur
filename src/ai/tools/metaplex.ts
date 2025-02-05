import { tool } from 'ai';
import { z } from 'zod';

import { streamUpdate } from '@/lib/utils';
import { retrieveAgentKit } from '@/server/actions/ai';

import { WrappedToolProps } from '.';

const createNft = () => {
  const metadata = {
    description: 'Create an NFT through Metaplex',
    parameters: z.object({
      name: z.string().describe('The name of the NFT'),
      uri: z.string().describe('The URI of the NFT'),
    }),
  };
  const buildTool = ({
    dataStream = undefined,
    abortData,
    extraData,
  }: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async (
        originalToolCall: z.infer<typeof metadata.parameters>,
        { toolCallId },
      ) => {
        const agent = (await retrieveAgentKit(undefined))?.data?.data?.agent;

        agent?.deployCollection({
          ...originalToolCall,
        });

        return {
          success: true,
          result: {},
        };
      },
    });

  return {
    metadata,
    buildTool,
  };
};

export const allMetaplexTools = {
  createNft: createNft(),
};
