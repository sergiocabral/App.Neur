import { tool } from 'ai';
import { z } from 'zod';

import { WrappedToolProps } from '.';
import { driftTools } from '../solana/drift';

const getDriftAPY = () => {
  const metadata = {
    description:
      'Get Drift APY for a given symbol or all symbols (if no symbol is provided)',
    parameters: driftTools.getDriftAPY.parameters,
  };
  const buildTool = (props: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async ({
        symbols,
      }: z.infer<typeof driftTools.getDriftAPY.parameters>) => {
        return await driftTools.getDriftAPY.execute({ symbols });
      },
    });

  return {
    metadata,
    buildTool,
  };
};

export const allDriftTools = {
  getDriftAPY: getDriftAPY(),
};
