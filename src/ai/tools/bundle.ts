import { tool } from 'ai';
import { z } from 'zod';

import { WrappedToolProps } from '.';
import { bundleTools } from '../solana/bundle';

const analyzeBundles = () => {
  const metadata = {
    description: bundleTools.analyzeBundles.description,
    parameters: bundleTools.analyzeBundles.parameters,
  };
  const buildTool = (props: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async (
        parameters: z.infer<typeof bundleTools.analyzeBundles.parameters>,
      ) => {
        return await bundleTools.analyzeBundles.execute(parameters);
      },
    });

  return {
    metadata,
    buildTool,
  };
};

export const allBundleTools = {
  analyzeBundles: analyzeBundles(),
};
