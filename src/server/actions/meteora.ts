import { BN } from '@coral-xyz/anchor';
import DLMM, { StrategyType } from '@meteora-ag/dlmm';
import {
  Connection,
  PublicKey,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

import { retrieveAgentKit } from './ai';

export interface MeteoraPool {
  poolId: string;
  tvl: number;
  apr: number;
  token0: string;
  token1: string;
  poolName: string;
}

export const getMeteoraPoolsForToken = async (
  tokenMint: string,
): Promise<MeteoraPool[]> => {
  const pools = await fetch(
    `https://amm-v2.meteora.ag/pools/search?page=1&size=10&sort_key=fee_tvl_ratio&order_by=desc&pool_type=dynamic&hide_low_apr=true&include_token_mints=${tokenMint}`,
  );
  const data = await pools.json();
  return data.data.pools.map((pool: any) => ({
    poolId: pool.address,
    tvl: pool.pool_tvl,
    apr: pool.apr,
    token0: pool.pool_token_mints[0],
    token1: pool.pool_token_mints[1],
    poolName: pool.pool_name,
  }));
};

export const openMeteoraPosition = async ({
  poolId,
  tokenMint,
  amount,
}: {
  poolId: string;
  tokenMint: string;
  amount: number;
}) => {
  const agent = (await retrieveAgentKit(undefined))?.data?.data?.agent;

  if (!agent) {
    return {
      success: false,
      error: 'Failed to retrieve agent',
    };
  }

  try {
    const connection = new Connection(process.env.RPC_URL || '');
    const dlmmPool = await DLMM.create(connection, new PublicKey(poolId));

    // Get active bin for price reference
    const activeBin = await dlmmPool.getActiveBin();
    const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side
    const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
    const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

    // Calculate amounts based on current price
    const activeBinPricePerToken = dlmmPool.fromPricePerLamport(
      Number(activeBin.price),
    );
    const totalXAmount = new BN(
      amount * Math.pow(10, dlmmPool.tokenX.decimal),
    );
    const totalYAmount = totalXAmount.mul(
      new BN(Number(activeBinPricePerToken)),
    );

    // Create position transaction
    const createPositionTx =
      await dlmmPool.initializePositionAndAddLiquidityByStrategy({
        positionPubKey: agent.wallet.publicKey,
        user: agent.wallet.publicKey,
        totalXAmount,
        totalYAmount,
        strategy: {
          maxBinId,
          minBinId,
          strategyType: StrategyType.SpotBalanced,
        },
      });

    const signature = await agent.wallet.signTransaction(createPositionTx);

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
