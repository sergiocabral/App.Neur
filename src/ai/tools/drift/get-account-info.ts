import { tool } from 'ai';
import { z } from 'zod';

import { streamUpdate } from '@/lib/utils';
import { ToolConfig, WrappedToolProps } from '..';
import { getDriftAccountInfo as getDriftAccountInfoAction } from '@/server/actions/drift';

export const getDriftAccountInfo = (): ToolConfig => {

  const metadata = {
    description: 'Get drift account info (no parameters required)',
    parameters: z.object({}),// no parameters required so we kept it empty
  };

  const buildTool = ({ 
    dataStream = undefined,
    abortData,
    extraData: {  },
  }: WrappedToolProps) =>
    
    tool({
      ...metadata,
      execute: async ( _: z.infer<typeof metadata.parameters>,
        { toolCallId }
      ) => {


        streamUpdate({
          stream: dataStream,
          update: {
            type: 'stream-result-data',
            toolCallId: toolCallId,
            status: 'streaming',
            content: {
              step: 'updating',
            },
          },
        });

        const result = await getDriftAccountInfoAction();

        streamUpdate({
          stream: dataStream,
          update: {
            type: 'stream-result-data',
            toolCallId: toolCallId,
            status: 'completed',
            content: {
              ...result.result,
              
              step: 'completed',
            },
          },
        });

        return {
          success: result.success,
          result: {
            ...result.result,
            step: result.success ? 'completed' : 'failed',
          },
          noFollowUp: true,
        };
      },
    });

  return {
    metadata,
    buildTool,
    confirm: getDriftAccountInfoAction,
  };
}; 
