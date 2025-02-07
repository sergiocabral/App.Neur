import { tool } from 'ai';
import { z } from 'zod';

import {
  getJupiterTokenPrice,
  searchJupiterTokens,
} from '@/server/actions/jupiter';

import { WrappedToolProps } from '.';

export interface JupiterToken {
  mint: string;
  name: string;
  symbol: string;
  logoURI: string | null;
}

const searchForToken = async (query: string) => {
  const tokens = await searchJupiterTokens(query, true);
  const searchQuery = query.toLowerCase();

  try {
    // Search and rank tokens
    const results = tokens
      .sort((a, b) => {
        // Exact matches first
        const aExact =
          a.symbol.toLowerCase() === searchQuery ||
          a.name.toLowerCase() === searchQuery ||
          b.address.toLowerCase() === searchQuery;
        const bExact =
          b.symbol.toLowerCase() === searchQuery ||
          b.name.toLowerCase() === searchQuery ||
          b.address.toLowerCase() === searchQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      })
      .slice(0, 1);

    return {
      success: true,
      result: {
        symbol: results[0].symbol,
        mint: results[0].address,
        name: results[0].name,
        logoURI: results[0].logoURI,
      },
    };
  } catch (error) {
    return {
      success: false,
      result: null,
    };
  }
};

export const searchTokenByName = () => {
  const metadata = {
    description: 'Search for a token address by its name or symbol.',
    parameters: z.object({
      token: z.string().describe('The token symbol or name'),
    }),
  };
  const buildTool = (props: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async ({
        token,
      }): Promise<{
        success: boolean;
        result: JupiterToken | null;
      }> => {
        return await searchForToken(token);
      },
    });

  return {
    metadata,
    buildTool,
  };
};

export const searchTokenByMint = () => {
  const metadata = {
    description: 'Search for a token address by its name or symbol.',
    parameters: z.object({
      tokenMint: z
        .string()
        .describe(
          'Mint address for the token. Example So11111111111111111111111111111111111111112',
        ),
    }),
  };
  const buildTool = (props: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async ({
        tokenMint,
      }): Promise<{
        success: boolean;
        result: JupiterToken;
        noFollowUp: boolean;
      }> => {
        const tokens = await searchJupiterTokens(tokenMint, false);
        const searchQuery = tokenMint.toLowerCase();

        // Search and rank tokens
        const results = tokens
          .sort((a, b) => {
            // Exact matches first
            const aExact = a.address.toLowerCase() === searchQuery;
            const bExact = b.address.toLowerCase() === searchQuery;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return 0;
          })
          .slice(0, 1);

        return {
          success: true,
          result: {
            symbol: results[0].symbol,
            mint: results[0].address,
            name: results[0].name,
            logoURI: results[0].logoURI,
          },
          noFollowUp: true,
        };
      },
    });
  return {
    metadata,
    buildTool,
  };
};

export const getSwapRatio = () => {
  const metadata = {
    description: 'Get the swap ratio of two token mints',
    parameters: z.object({
      inputMint: z
        .string()
        .describe(
          'Mint address for the input token. Example So11111111111111111111111111111111111111112',
        ),
      outputMint: z
        .string()
        .describe(
          'Mint address for the output token. Example So11111111111111111111111111111111111111112',
        ),
    }),
  };
  const buildTool = (props: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async ({ inputMint, outputMint }) => {
        const inputPrice = await getJupiterTokenPrice(inputMint);
        const outputPrice = await getJupiterTokenPrice(outputMint);
        const price =
          inputPrice && outputPrice
            ? parseFloat(inputPrice.price) / parseFloat(outputPrice.price)
            : null;
        return {
          success: price !== null,
          result: price,
        };
      },
    });
  return {
    metadata,
    buildTool,
  };
};

const tokenSchema = z
  .object({
    tokenName: z.string().optional().describe('The token name or symbol'),
    mint: z
      .string()
      .regex(
        /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
        'Invalid Solana address format. Must be base58 encoded.',
      )
      .optional()
      .describe('Mint address for the token'),
  })
  .refine((data) => data.tokenName !== undefined || data.mint !== undefined, {
    message: 'At least one of `symbol` or `mint` must be provided',
    path: [],
  });

export const getTokenPrice = () => {
  const metadata = {
    description: 'Get the price of a token',
    parameters: z.object({
      token: tokenSchema,
    }),
  };

  const buildTool = (props: WrappedToolProps) =>
    tool({
      ...metadata,
      execute: async ({ token }) => {
        if (!token.mint && !token.tokenName) {
          return {
            success: false,
            result: null,
          };
        }
        const tokenResult = token.mint
          ? (await searchForToken(token.mint)).result
          : (await searchForToken(token.tokenName!)).result;
        if (!tokenResult) {
          return {
            success: false,
            result: null,
          };
        }
        const price = await getJupiterTokenPrice(tokenResult.mint);
        return {
          success: price !== null,
          data: {
            success: true,
            token: tokenResult,
            price,
          },
        };
      },
    });

  return {
    metadata,
    buildTool,
  };
};

export const allSearchTokenTools = {
  searchTokenByName: searchTokenByName(),
  searchTokenByMint: searchTokenByMint(),
  getTokenPrice: getTokenPrice(),
};
