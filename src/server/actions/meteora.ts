import { cache } from 'react';

import { BN } from '@coral-xyz/anchor';
import DLMM, { StrategyType } from '@meteora-ag/dlmm';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SolanaAgentKit } from 'solana-agent-kit';

import { retrieveAgentKit } from './ai';
import { performSwap } from './swap';

export interface MeteoraPool {
  poolId: string;
  tvl: number;
  apr: number;
  token0: string;
  token1: string;
  poolName: string;
}

export interface MeteoraDlmmPair {
  address: string;
  name: string;
  mint_x: string;
  mint_y: string;
  reserve_x: string;
  reserve_y: string;
  reserve_x_amount: number;
  reserve_y_amount: number;
  bin_step: number;
  base_fee_percentage: string;
  max_fee_percentage: string;
  protocol_fee_percentage: string;
  liquidity: string;
  reward_mint_x: string;
  reward_mint_y: string;
  fees_24h: number;
  today_fees: number;
  trade_volume_24h: number;
  cumulative_trade_volume: string;
  cumulative_fee_volume: string;
  current_price: number;
  apr: number;
  apy: number;
  farm_apr: number;
  farm_apy: number;
  hide: boolean;
  is_blacklisted: boolean;
  fees: {
    min_30: number;
    hour_1: number;
    hour_2: number;
    hour_4: number;
    hour_12: number;
    hour_24: number;
  };
  fee_tvl_ratio: {
    min_30: number;
    hour_1: number;
    hour_2: number;
    hour_4: number;
    hour_12: number;
    hour_24: number;
  };
}

export interface MeteoraDlmmGroup {
  name: string;
  pairs: MeteoraDlmmPair[];
  maxApr: number;
  totalTvl: number;
}

export const getMeteoraDlmmForToken = cache(
  async (tokenMint: string): Promise<MeteoraDlmmGroup[]> => {
    const minTvl = 2_000;
    const response = await fetch(
      `https://dlmm-api.meteora.ag/pair/all_by_groups?limit=10&sort_key=feetvlratio&order_by=desc&include_unknown=false&hide_low_tvl=${minTvl}&hide_low_apr=true&include_token_mints=${tokenMint}`,
      {
        next: {
          revalidate: 300, // Cache for 5 minutes
        },
      },
    );
    const data = await response.json();
    return data.groups
      .map((group: any) => {
        const pairInfo = group.pairs.reduce(
          (acc: any, pair: any) => {
            return {
              maxApr: Math.max(acc.maxApr, pair.apr),
              totalTvl: acc.totalTvl + parseFloat(pair.liquidity),
            };
          },
          { maxApr: 0, totalTvl: 0 },
        );
        return {
          name: group.name,
          pairs: group.pairs,
          ...pairInfo,
        };
      })
      .sort((a: MeteoraDlmmGroup, b: MeteoraDlmmGroup) => b.maxApr - a.maxApr);
  },
);

export const openMeteoraPosition = async (
  {
    poolId,
    token: inputToken,
    amount,
  }: {
    poolId: string;
    token: {
      mint: string;
      symbol?: string;
    };
    amount: number;
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
    const dlmmPool = await DLMM.create(agent.connection, new PublicKey(poolId));

    // Get active bin for price reference
    const activeBin = await dlmmPool.getActiveBin();
    const TOTAL_RANGE_INTERVAL = 20; // 20 bins on each side
    const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
    const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

    // Calculate amounts based on current price
    const activeBinPricePerToken = dlmmPool.fromPricePerLamport(
      Number(activeBin.price),
    );

    const isBaseX = dlmmPool.tokenX.publicKey.toBase58() === inputToken.mint;

    const inputAmount = amount / 2;

    let tokenXAmountBN, tokenYAmountBN;

    if (isBaseX) {
      tokenXAmountBN = new BN(
        inputAmount * Math.pow(10, dlmmPool.tokenX.decimal),
      );
      tokenYAmountBN = new BN(
        inputAmount *
          parseFloat(activeBinPricePerToken) *
          Math.pow(10, dlmmPool.tokenY.decimal),
      );
    } else {
      tokenYAmountBN = new BN(
        inputAmount * Math.pow(10, dlmmPool.tokenY.decimal),
      );
      tokenXAmountBN = new BN(
        (inputAmount / parseFloat(activeBinPricePerToken)) *
          Math.pow(10, dlmmPool.tokenX.decimal),
      );
    }

    const swapResult = await performSwap(
      {
        inputToken,
        outputToken: {
          mint: isBaseX
            ? dlmmPool.tokenY.publicKey.toBase58()
            : dlmmPool.tokenX.publicKey.toBase58(),
        },
        inputAmount,
      },
      { agentKit: agent },
    );

    if (!swapResult.success) {
      return {
        success: false,
        error: swapResult.error,
      };
    }

    // Create position transaction
    const positionKeypair = new Keypair();
    const createPositionTx =
      await dlmmPool.initializePositionAndAddLiquidityByStrategy({
        positionPubKey: positionKeypair.publicKey,
        user: agent.wallet.publicKey,
        totalXAmount: tokenXAmountBN,
        totalYAmount: tokenYAmountBN,
        strategy: {
          maxBinId,
          minBinId,
          strategyType: StrategyType.SpotBalanced,
        },
      });

    createPositionTx.feePayer = agent.wallet.publicKey;

    const signedTx = await agent.wallet.signTransaction(createPositionTx);
    signedTx.partialSign(positionKeypair);
    const signature = await agent.connection.sendRawTransaction(
      signedTx.serialize(),
      {
        skipPreflight: false,
        maxRetries: 5,
        preflightCommitment: 'confirmed',
      },
    );

    await agent.connection.confirmTransaction(signature);

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
};
