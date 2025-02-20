import { PublicKey } from '@solana/web3.js';
import { SolanaAgentKit } from 'solana-agent-kit';

import { retrieveAgentKit } from './ai';

interface SwapParams {
  inputAmount: number;
  inputToken: {
    mint: string;
  };
  outputToken: {
    mint: string;
  };
}

export const performSwap = async (
  { inputAmount, inputToken, outputToken }: SwapParams,
  extraData: {
    agentKit?: SolanaAgentKit;
  },
) => {
  const agent =
    extraData.agentKit ??
    (await retrieveAgentKit(undefined))?.data?.data?.agent;
  if (!agent) {
    return {
      success: false,
      error: 'Agent not found',
    };
  }

  try {
    const signature = await agent.trade(
      new PublicKey(outputToken.mint),
      inputAmount,
      new PublicKey(inputToken.mint),
      300,
    );

    return {
      success: true,
      result: {
        signature,
      },
    };
  } catch (error) {
    console.error('Error performing swap:', error);
    return {
      success: false,
      error: 'Unable to perform swap',
    };
  }
};
