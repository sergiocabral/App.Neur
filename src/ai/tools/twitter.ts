import { tool } from 'ai';
import { z } from 'zod';

import { WrappedToolProps } from '.';
import { twitterTools } from '../generic/twitter';

const searchTwitterByTag = () => {
  const metadata = {
    description: twitterTools.searchTwitterByTag.description,
    parameters: twitterTools.searchTwitterByTag.parameters,
  };
  const buildTool = (props: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async (
        parameters: z.infer<typeof twitterTools.searchTwitterByTag.parameters>,
      ) => {
        return await twitterTools.searchTwitterByTag.execute(parameters);
      },
    });

  return {
    metadata,
    buildTool,
  };
};

const searchTwitterFromAccount = () => {
  const metadata = {
    description: twitterTools.searchTwitterFromAccount.description,
    parameters: twitterTools.searchTwitterFromAccount.parameters,
  };
  const buildTool = (props: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async (
        parameters: z.infer<
          typeof twitterTools.searchTwitterFromAccount.parameters
        >,
      ) => {
        return await twitterTools.searchTwitterFromAccount.execute(parameters);
      },
    });

  return {
    metadata,
    buildTool,
  };
};

export const allTwitterTools = {
  searchTwitterByTag: searchTwitterByTag(),
  searchTwitterFromAccount: searchTwitterFromAccount(),
};
