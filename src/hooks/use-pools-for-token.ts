'use client';

import useSWR from 'swr';

import {
  MeteoraDlmmGroup,
  getMeteoraDlmmForToken,
} from '@/server/actions/meteora';

export function useDlmmForToken(mint?: string) {
  const key = mint ? `meteoraDlmmPools-${mint}` : null;

  const { data, error } = useSWR<MeteoraDlmmGroup[]>(key, () =>
    getMeteoraDlmmForToken(mint!),
  );

  return { data, isLoading: !error && !data };
}
