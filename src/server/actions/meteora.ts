import { cache } from 'react';

import { BN } from '@coral-xyz/anchor';
import DLMM, { LbPosition, StrategyType } from '@meteora-ag/dlmm';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { SolanaAgentKit } from 'solana-agent-kit';

import { RPC_URL } from '@/lib/constants';
import { searchWalletAssets } from '@/lib/solana/helius';

import { retrieveAgentKit } from './ai';
import { JupiterToken } from './jupiter';
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
  tokenXName: JupiterToken;
  tokenYName: JupiterToken;
}

export interface MeteoraDlmmGroup {
  name: string;
  pairs: MeteoraDlmmPair[];
  maxApr: number;
  totalTvl: number;
}

export interface PositionWithPoolName {
  position: LbPosition;
  poolName: string;
  poolAddress: string;
  mintX: string;
  mintY: string;
}

export const getMeteoraDlmmForToken = cache(
  async (tokenMint: string): Promise<MeteoraDlmmGroup[]> => {
    const minTvl = 2_000;
    const response = await fetch(
      `https://dlmm-api.meteora.ag/pair/all_by_groups?limit=10&sort_key=feetvlratio&order_by=desc&include_unknown=false&hide_low_tvl=${minTvl}&hide_low_apr=true&include_token_mints=${tokenMint}`,
      {
        next: {
          revalidate: 300,
        },
      },
    );
    const data = await response.json();

    return Promise.all(
      data.groups.map(async (group: any) => {
        return {
          name: group.name,
          pairs: group.pairs,
          maxApr: Math.max(...group.pairs.map((p: any) => p.apr)),
          totalTvl: group.pairs.reduce(
            (acc: number, p: any) => acc + parseFloat(p.liquidity),
            0,
          ),
        };
      }),
    );
  },
);

export const getSwapRatioForPool = async (poolId: string) => {
  const pool = await DLMM.create(
    new Connection(RPC_URL),
    new PublicKey(poolId),
  );
  const activeBin = await pool.getActiveBin();
  return parseFloat(pool.fromPricePerLamport(Number(activeBin.price)));
};

export const openMeteoraPosition = async (
  {
    poolId,
    token: inputToken,
    amount,
    shouldSwapHalf = false,
  }: {
    poolId: string;
    token: {
      mint: string;
      symbol?: string;
    };
    amount: number;
    shouldSwapHalf?: boolean;
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

    const inputAmount = shouldSwapHalf ? amount / 2 : amount;

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

    const { fungibleTokens } = await searchWalletAssets(
      agent.wallet.publicKey.toBase58(),
    );

    const tokenX = fungibleTokens.find(
      (token) => token.id === dlmmPool.tokenX.publicKey.toBase58(),
    );
    const tokenY = fungibleTokens.find(
      (token) => token.id === dlmmPool.tokenY.publicKey.toBase58(),
    );

    const tokenXBalance = tokenX?.token_info?.balance || 0;
    const tokenYBalance = tokenY?.token_info?.balance || 0;

    const needsSwap = isBaseX
      ? tokenYBalance.toString() < tokenYAmountBN.toString()
      : tokenXBalance.toString() < tokenXAmountBN.toString();

    if (shouldSwapHalf) {
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
    } else if (needsSwap) {
      return {
        success: false,
        error: 'Insufficient token balance',
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

export interface TokenData {
  name: string;
  symbol: string;
  decimals: number;
  price?: number;
}

export const getTokenData = async ({ mint }: { mint: string }) => {
  try {
    if (!mint) {
      throw new Error('Mint address is required');
    }
    const response = await fetch(`https://api.jup.ag/tokens/v1/token/${mint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const price = await fetch(`https://api.jup.ag/price/v2?ids=${mint}`);
    const token = (await response.json()) as TokenData;
    token.price = (await price.json()).data[mint].price;
    return token;
  } catch (error: any) {
    throw new Error(`Error fetching token data: ${error.message}`);
  }
};

export const getMeteoraPositions = async (
  {
    poolIds,
  }: {
    poolIds: PublicKey[];
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

  const connection = agent.connection;

  try {
    let AllPositions: PositionWithPoolName[] = [];
    for (const poolId of poolIds) {
      const dlmmPool = await DLMM.create(connection, poolId);
      const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(
        agent.wallet.publicKey,
      );
      const apiCall = await fetch(`https://dlmm-api.meteora.ag/pair/${poolId}`);
      const poolData = await apiCall.json();
      const details = userPositions.map((position) => {
        return {
          position,
          poolName: poolData.name,
          poolAddress: poolId.toBase58(),
          mintX: poolData.mint_x,
          mintY: poolData.mint_y,
        };
      });
      AllPositions = AllPositions.concat(details);
    }
    return {
      success: true,
      result: AllPositions,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get positions',
    };
  }
};

export const closeMeteoraPositions = async (
  {
    poolId,
    position,
  }: {
    poolId: PublicKey;
    position: LbPosition;
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
    const dlmmPool = await DLMM.create(agent.connection, poolId);
    const pos = await dlmmPool.getPosition(position.publicKey);

    if (
      pos.positionData.feeX.gt(new BN(0)) ||
      pos.positionData.feeY.gt(new BN(0))
    ) {
      await claimSwapFee({ poolId, position: pos }, { agentKit: agent });
    }
    const binsArray = pos.positionData.positionBinData.map((bin) => bin.binId);
    const removeLiquidityTx = await dlmmPool.removeLiquidity({
      user: agent.wallet.publicKey,
      binIds: binsArray,
      bps: new BN(100 * 100),
      position: pos.publicKey,
      shouldClaimAndClose: true,
    });

    if (Array.isArray(removeLiquidityTx)) {
      throw new Error('Unexpected array of transactions');
    }

    const signature = await agent.wallet.signTransaction(removeLiquidityTx);
    const removeLiquiditySignature = await agent.connection.sendRawTransaction(
      signature.serialize(),
      {
        skipPreflight: false,
        maxRetries: 5,
        preflightCommitment: 'confirmed',
      },
    );
    await agent.connection.confirmTransaction(
      removeLiquiditySignature,
      'confirmed',
    );

    return {
      success: true,
      result: {
        signature: removeLiquiditySignature,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to close positions',
    };
  }
};

export const claimRewareForOnePosition = async (
  {
    poolId,
    position,
  }: {
    poolId: PublicKey;
    position: LbPosition;
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
    const dlmmPool = await DLMM.create(agent.connection, poolId);
    const pos = await dlmmPool.getPosition(position.publicKey);
    const tnx = await dlmmPool.claimLMReward({
      owner: agent.wallet.publicKey,
      position: pos,
    });

    if (!tnx) {
      throw new Error('Failed to create claim LM reward transaction');
    }

    tnx.feePayer = agent.wallet.publicKey;
    const signedTx = await agent.wallet.signTransaction(tnx);
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
    console.log(error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to close positions',
    };
  }
};

export const claimSwapFee = async (
  {
    poolId,
    position,
  }: {
    poolId: PublicKey;
    position: LbPosition;
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
    const dlmmPool = await DLMM.create(agent.connection, poolId);
    const pos = await dlmmPool.getPosition(position.publicKey);
    const tnx = await dlmmPool.claimSwapFee({
      owner: agent.wallet.publicKey,
      position: pos,
    });
    tnx.feePayer = agent.wallet.publicKey;
    const signedTx = await agent.wallet.signTransaction(tnx);
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
    console.log(error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to close positions',
    };
  }
};

export async function getAllLbPairPositionForOwner(extraData: {
  agentKit?: SolanaAgentKit;
}) {
  const agent =
    extraData.agentKit ??
    (await retrieveAgentKit(undefined))?.data?.data?.agent;

  if (!agent) {
    throw new Error('Failed to retrieve agent');
  }
  const ownerAddress = agent.wallet.publicKey.toBase58();
  const SHYFT_API_KEY = process.env.SHYFT_API_KEY;
  const operationsDoc = `
    query MyQuery {
      meteora_dlmm_PositionV2(
        where: {owner: {_eq: ${JSON.stringify(ownerAddress)}}}
      ) {
        upperBinId
        lowerBinId
        totalClaimedFeeYAmount
        totalClaimedFeeXAmount
        lastUpdatedAt
        lbPair
        owner
      }
      meteora_dlmm_Position(
        where: {owner: {_eq: ${JSON.stringify(ownerAddress)}}}
      ) {
        lastUpdatedAt
        lbPair
        lowerBinId
        upperBinId
        totalClaimedFeeYAmount
        totalClaimedFeeXAmount
        owner
      }
    }
`; //you can cherrypick the fields as per your requirement
  const result = await fetch(
    `https://programs.shyft.to/v0/graphql/accounts?api_key=${SHYFT_API_KEY}&network=mainnet-beta`, //SHYFT's GQL endpoint
    {
      method: 'POST',
      body: JSON.stringify({
        query: operationsDoc,
        variables: {},
        operationName: 'MyQuery',
      }),
    },
  );

  const { errors, data } = await result.json();
  const allLbPairs: PublicKey[] = [];

  console.log("Here's the data: ", data);
  if (data.meteora_dlmm_Position.length > 0) {
    for (let index = 0; index < data.meteora_dlmm_Position.length; index++) {
      const position = data.meteora_dlmm_Position[index];
      allLbPairs.push(new PublicKey(position.lbPair));
    }
  }

  if (data.meteora_dlmm_PositionV2.length > 0) {
    for (let index = 0; index < data.meteora_dlmm_PositionV2.length; index++) {
      const position = data.meteora_dlmm_PositionV2[index];
      allLbPairs.push(new PublicKey(position.lbPair));
    }
  }
  return allLbPairs;
}
