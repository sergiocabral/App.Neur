import { BN } from '@coral-xyz/anchor';
import { CircleDollarSign } from 'lucide-react';
import { z } from 'zod';

import LendingRatesCard from '@/components/drift-lending';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { retrieveAgentKit } from '@/server/actions/ai';
import { SOL_MINT } from '@/types/helius/portfolio';

export const driftTools = {
  driftAccountInfo: {
    agentKit: null,
    description: 'Get drift account info',
    displayName: 'Get Drift Account Info',
    parameters: z.object({}),
    execute: async function () {
      try {
        const agent =
          this.agentKit ||
          (await retrieveAgentKit(undefined))?.data?.data?.agent;

        if (!agent) {
          return { success: false, error: 'Failed to retrieve agent' };
        }

        const result = await agent.driftUserAccountInfo();

        console.log(result);

        const totalDeposits = result.totalDeposits.toNumber() / 10 ** 6;
        const totalWithdraws = result.totalWithdraws.toNumber() / 10 ** 6;
        const accountInfo = {
          baseCurrency: 'USD',
          totalDeposits,
          totalWithdraws,
          totalPnl: result.settledPerpPnl,
        };

        return { success: true, data: accountInfo };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to get drift account',
        };
      }
    },
    render: (result: unknown) => {
      const typedResult = result as {
        success: boolean;
        data: any;
        error?: string;
      };

      if (!typedResult.success) {
        return (
          <Card className="bg-destructive/10 p-6">
            <h2 className="mb-2 text-xl font-semibold text-destructive">
              Drift Account Retrieval Failed
            </h2>
            <pre className="text-sm text-destructive/80">
              {JSON.stringify(typedResult, null, 2)}
            </pre>
          </Card>
        );
      }

      return (
        <Card className="w-full max-w-md">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleDollarSign className="h-4 w-4" />
              Account Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-muted p-2">
                <p className="text-xs text-muted-foreground">Deposits</p>
                <p className="font-medium">${typedResult.data.totalDeposits}</p>
              </div>
              <div className="rounded-md bg-muted p-2">
                <p className="text-xs text-muted-foreground">Withdraws</p>
                <p className="font-medium">
                  ${typedResult.data.totalWithdraws}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    },
  },
  createDriftAccount: {
    agentKit: null,
    description: 'Get drift account info',
    displayName: 'Get Drift Account Info',
    parameters: z.object({
      amount: z.number().describe('The amount of tokens to deposit'),
      symbol: z.string().describe('The symbol of the token to deposit'),
    }),
    execute: async function ({
      amount,
      symbol,
    }: {
      amount: number;
      symbol: string;
    }) {
      try {
        const agent =
          this.agentKit ||
          (await retrieveAgentKit(undefined))?.data?.data?.agent;

        if (!agent) {
          return { success: false, error: 'Failed to retrieve agent' };
        }

        const result = await agent.createDriftUserAccount(amount, symbol);

        return { success: true, data: result };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to get drift account',
        };
      }
    },
    render: (result: unknown) => {
      const typedResult = result as {
        success: boolean;
        data: any;
        error?: string;
      };

      if (!typedResult.success) {
        return (
          <Card className="bg-destructive/10 p-6">
            <h2 className="mb-2 text-xl font-semibold text-destructive">
              Drift Account Retrieval Failed
            </h2>
            <pre className="text-sm text-destructive/80">
              {JSON.stringify(typedResult, null, 2)}
            </pre>
          </Card>
        );
      }

      return <div>{JSON.stringify(typedResult)}</div>;
    },
  },
  depositToDriftUserAccount: {
    agentKit: null,
    description: 'Deposit to drift user account',
    displayName: 'Drift Deposit',
    parameters: z.object({
      amount: z.number().describe('The amount of tokens to deposit'),
      symbol: z.string().describe('The symbol of the token to deposit'),
    }),
    execute: async function ({
      amount,
      symbol,
    }: {
      amount: number;
      symbol: string;
    }) {
      try {
        const agent =
          this.agentKit ||
          (await retrieveAgentKit(undefined))?.data?.data?.agent;

        if (!agent) {
          return { success: false, error: 'Failed to retrieve agent' };
        }

        const result = await agent.depositToDriftUserAccount(amount, symbol);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to get drift account',
        };
      }
    },
    render: (result: unknown) => {
      const typedResult = result as {
        success: boolean;
        data: any;
        error?: string;
      };

      if (!typedResult.success) {
        return (
          <Card className="bg-destructive/10 p-6">
            <h2 className="mb-2 text-xl font-semibold text-destructive">
              Drift Account Retrieval Failed
            </h2>
            <pre className="text-sm text-destructive/80">
              {JSON.stringify(typedResult, null, 2)}
            </pre>
          </Card>
        );
      }

      return <div>{JSON.stringify(typedResult)}</div>;
    },
  },
  getDriftAPY: {
    agentKit: null,
    description:
      'Get Drift APY for a given symbol or all symbols (if no symbol is provided)',
    displayName: 'Drift APY',
    parameters: z.object({
      symbols: z
        .array(z.string())
        .optional()
        .describe('The symbols of the tokens'),
    }),
    execute: async function ({ symbols }: { symbols?: string[] }) {
      try {
        const agent =
          this.agentKit ||
          (await retrieveAgentKit(undefined))?.data?.data?.agent;

        if (!agent) {
          return { success: false, error: 'Failed to retrieve agent' };
        }

        const results: {
          lendingApy: number;
          tokenData: {
            symbol: string;
            mint: string;
            balance: number;
          };
        }[] = [];
        const spotMarkets = agent.getAvailableDriftMarkets('spot');
        const markets = Array.isArray(spotMarkets)
          ? spotMarkets.map((m) => ({
              mint: 'mint' in m ? m.mint.toBase58() : undefined,
              symbol: m.symbol,
            }))
          : [];

        const balances = await agent.getTokenBalances();

        if (!symbols || symbols.length === 0) {
          const rates = (await agent.getAllLendAndBorrowAPY()).map((r) => {
            const market = markets.find((m) => m.symbol === r?.symbol);
            if (!market || !r || !market.mint) {
              return undefined;
            }
            return {
              lendingApy: r.lendAPY,
              tokenData: {
                symbol: r.symbol,
                mint: market.mint,
                balance:
                  market.mint === SOL_MINT
                    ? balances.sol
                    : (balances.tokens?.find(
                        (b) => b.tokenAddress === market.mint,
                      )?.balance ?? 0),
              },
            };
          });

          results.push(...rates.filter((r) => r !== undefined));
        } else {
          for (const symbol of symbols) {
            const market = markets.find((m) => m.symbol === symbol);
            if (market) {
              const result = await agent.getLendAndBorrowAPY(symbol);
              if (market.mint) {
                results.push({
                  lendingApy: result.lendingAPY,
                  tokenData: {
                    symbol: market.symbol,
                    mint: market.mint,
                    balance:
                      market.mint === SOL_MINT
                        ? balances.sol
                        : (balances.tokens?.find(
                            (b) => b.tokenAddress === market.mint,
                          )?.balance ?? 0),
                  },
                });
              }
            }
          }
        }

        return {
          success: true,
          data: {
            rates: results,
            noFollowUp: true,
          },
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to get drift account',
        };
      }
    },
    render: (result: unknown) => {
      const typedResult = result as {
        success: boolean;
        data: {
          rates: any;
          noFollowUp: boolean;
        };
        formData?: {
          amount: number;
          symbol: string;
          market: string;
        };
        error?: string;

        addResultUtility: (result: {
          formData: {
            amount: number;
            symbol: string;
            market: string;
          };
          success: boolean;
        }) => void;
      };

      if (!typedResult.success) {
        return (
          <Card className="bg-destructive/10 p-6">
            <h2 className="mb-2 text-xl font-semibold text-destructive">
              Drift Account Retrieval Failed
            </h2>
            <pre className="text-sm text-destructive/80">
              {JSON.stringify(typedResult, null, 2)}
            </pre>
          </Card>
        );
      }

      if (typedResult.formData) {
        return (
          <pre className="text-sm text-destructive/80">
            {JSON.stringify(typedResult.formData, null, 2)}
          </pre>
        );
      }

      return (
        <LendingRatesCard
          rates={typedResult.data.rates}
          addResultUtility={typedResult.addResultUtility}
        />
      );
    },
  },
};
