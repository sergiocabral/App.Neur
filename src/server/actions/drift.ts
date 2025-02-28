import { SolanaAgentKit } from "solana-agent-kit";
import { retrieveAgentKit } from "./ai";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export type PerpMarketType = {
    fullName?: string;
    category?: string[];
    symbol: string;
    baseAssetSymbol: string;
    marketIndex: number;
    launchTs: number;
    oracle: PublicKey;
    pythFeedId?: string;
    pythLazerId?: number;
};

export type SpotMarketType = {
    symbol: string;
    marketIndex: number;
    poolId: number;
    oracle: PublicKey;
    mint: PublicKey;
    precision: BN;
    precisionExp: BN;
    serumMarket?: PublicKey;
    phoenixMarket?: PublicKey;
    openbookMarket?: PublicKey;
    launchTs?: number;
    pythFeedId?: string;
    pythLazerId?: number;
};

export const getMainnetDriftMarkets = async (
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
        error: 'Failed to retrieve agent',
      };
    }
    try {
        const SpotMarkets = (await agent.getAvailableDriftSpotMarkets()) as SpotMarketType[];
        const PrepMarkets = (await agent.getAvailableDriftPerpMarkets()) as PerpMarketType[];
        return {
            success: true,
            result: {
                SpotMarkets,
                PrepMarkets,
            },
        }
    } catch (error) {
      console.error('Error opening Fetching Drift Mainnet Markets:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch markets',
      };
    }
  }

export const tradeDriftPerpAccountAction = async (
  {
    amount,
    symbol,
    action,
    type,
    price,
  }: {
    amount: number;
    symbol: string;
    action: 'long' | 'short';
    type: 'market' | 'limit';
    price: number;
  },
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
      error: 'Failed to retrieve agent',
    };
  }
  try {
    console.log('tradeDriftPerpAccountAction', amount, symbol, action, type, price);
    const signature = await agent.tradeUsingDriftPerpAccount(
        amount,
        symbol,
        action,
        type,
        price,
    );
    console.log('tradeDriftPerpAccountAction', signature);
    return {
      success: true,
      result: {
        signature,
      },
    };
  } catch (error) {
    console.error('Error opening Meteora position:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open position',
    };
  }
}

export const SpotTokenSwapDriftAction = async (
    {
      fromSymbol,
      toSymbol,
      fromAmount,
      toAmount,
      slippage,
    }: {
      fromSymbol: string;
      toSymbol: string;
      fromAmount?: number;
      toAmount?: number;
      slippage?: number;
    },
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
        error: 'Failed to retrieve agent',
      };
    }
    if(fromAmount === undefined && toAmount === undefined) {
        throw new Error('fromAmount or toAmount must be provided');
    }
    if(fromAmount && toAmount && fromAmount <=0 && toAmount <= 0) {
        throw new Error('fromAmount or toAmount must be greater than 0');
    }
    if(fromAmount && toAmount && fromAmount > 0 && toAmount > 0) {
        throw new Error('fromAmount and toAmount cannot both be provided');
    }
    try {
      let signature;
      if(toAmount && toAmount > 0) {
        signature = await agent.driftSpotTokenSwap({
            fromSymbol,
            toSymbol,
            toAmount,
            slippage,
        });
     } else if(fromAmount && fromAmount > 0) {
        signature = await agent.driftSpotTokenSwap({
            fromSymbol,
            toSymbol,
            fromAmount,
            slippage,
        });
     }

      return {
        success: true,
        result: {
          signature,
        },
      };
    } catch (error) {
      console.error('Error opening Meteora position:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open position',
      };
    }
  }

export const createDriftVault = async ({
    name,
    marketName,
    redeemPeriod,
    maxTokens,
    minDepositAmount,
    managementFee,
    profitShare,
    hurdleRate,
    permissioned,
}:{
    name: string;
    marketName: `${string}-${string}`;
    redeemPeriod: number;
    maxTokens: number;
    minDepositAmount: number;
    managementFee: number;
    profitShare: number;
    hurdleRate: number;
    permissioned: boolean;
}) => {
  try {
    const agent = (await retrieveAgentKit(undefined))?.data?.data?.agent;

    if (!agent) {
        return { success: false, error: 'Failed to retrieve agent' };
    }

    const signature = await agent.createDriftVault({
        name,
        marketName,
        redeemPeriod,
        maxTokens,
        minDepositAmount,
        managementFee,
        profitShare,
        hurdleRate,
        permissioned,
    });

    return { 
        success: true, 
        result: {
            signature,
        }
    };
  } catch (error) {
    console.error('Error creating drift vault:', error);
    return {
        success: false,
        error:
            error instanceof Error
                ? error.message
                : 'Failed to create drift vault',
    };
  }
}

