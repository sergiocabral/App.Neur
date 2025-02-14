'use server';

import { cache } from 'react';

import { z } from 'zod';

import prisma from '@/lib/prisma';
import { ActionResponse, actionClient } from '@/lib/safe-action';
import { Token } from '@/types/db';

const getTokenByAddress = cache(
  actionClient
    .schema(z.object({ contractAddress: z.string() }))
    .action<
      ActionResponse<Token>
    >(async ({ parsedInput: { contractAddress } }) => {
      try {
        const token = await prisma.token.findFirst({
          where: { contractAddress },
        });

        if (!token) {
          return { success: false, error: 'Token does not exist' };
        }

        return { success: true, data: token };
      } catch {
        return { success: false, error: 'Error getting token by address' };
      }
    }),
);

type TokenUpdateInput = Required<Pick<Token, 'symbol' | 'contractAddress'>> &
  Partial<Token>;

export async function createOrUpdateToken(data: TokenUpdateInput) {
  try {
    if (data.id) {
      // Update existing token
      return await prisma.token.update({
        where: { id: data.id },
        data,
      });
    } else {
      // Create new token
      return await prisma.token.create({
        data: {
          symbol: data.symbol,
          contractAddress: data.contractAddress,
          imageUrl: data.imageUrl,
          name: data.name,
          decimals: data.decimals,
        },
      });
    }
  } catch (err) {
    console.error('Error creating or updating token:', err);
    return null;
  }
}

export async function createOrUpdateTokens(tokens: TokenUpdateInput[]) {
  if (tokens.length === 0) return [];

  return await prisma.$transaction(
    tokens.map((token) => {
      if (token.id) {
        // Update existing token
        return prisma.token.update({
          where: { id: token.id },
          data: {
            symbol: token.symbol,
            contractAddress: token.contractAddress,
            imageUrl: token.imageUrl,
            name: token.name,
            decimals: token.decimals,
          },
        });
      } else {
        // Create new token
        return prisma.token.create({
          data: {
            symbol: token.symbol,
            contractAddress: token.contractAddress,
            imageUrl: token.imageUrl,
            name: token.name,
            decimals: token.decimals,
          },
        });
      }
    }),
  );
}
