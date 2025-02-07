import { tool } from 'ai';
import { z } from 'zod';

import { WrappedToolProps } from '.';
import { solanaTools } from '../solana/solana';

const getTopHoldersTool = () => {
  const metadata = {
    description: solanaTools.getTopHolders.description,
    parameters: solanaTools.getTopHolders.parameters,
  };
  const buildTool = (props: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async ({
        mint,
      }: z.infer<typeof solanaTools.getTopHolders.parameters>) => {
        return await solanaTools.getTopHolders.execute({ mint });
      },
    });

  return {
    metadata,
    buildTool,
  };
};

const resolveWalletAddressFromDomain = () => {
  const metadata = {
    description: solanaTools.resolveWalletAddressFromDomain.description,
    parameters: solanaTools.resolveWalletAddressFromDomain.parameters,
  };
  const buildTool = (props: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async ({
        domain,
      }: z.infer<
        typeof solanaTools.resolveWalletAddressFromDomain.parameters
      >) => {
        return await solanaTools.resolveWalletAddressFromDomain.execute({
          domain,
        });
      },
    });

  return {
    metadata,
    buildTool,
  };
};

const getWalletPortfolio = () => {
  const metadata = {
    description: solanaTools.getWalletPortfolio.description,
    parameters: solanaTools.getWalletPortfolio.parameters,
  };
  const buildTool = (props: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async ({
        walletAddress,
      }: z.infer<typeof solanaTools.getWalletPortfolio.parameters>) => {
        return await solanaTools.getWalletPortfolio.execute({ walletAddress });
      },
    });

  return {
    metadata,
    buildTool,
  };
};

export const allSolanaTools = {
  getTopHolders: getTopHoldersTool(),
  resolveWalletAddressFromDomain: resolveWalletAddressFromDomain(),
  getWalletPortfolio: getWalletPortfolio(),
};
