import { useEffect, useState } from 'react';

import Image from 'next/image';

import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MeteoraPool } from '@/server/actions/meteora';
import { DataStreamDelta } from '@/types/stream';
import { MeteoraPositionResult } from '@/types/stream';
import { getTokenBalance } from '@/ai/tools/search-token';

interface MeteoraPositionCardProps {
  data: {
    success: boolean;
    result: MeteoraPositionResult;
  };
  addToolResult: (result: DataStreamDelta) => void;
  toolCallId: string;
}

export function MeteoraPositionCard({
  data,
  addToolResult,
  toolCallId,
}: MeteoraPositionCardProps) {
  const { result } = data;
  console.log(result);
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTokenSelect = async (token: {
    symbol: string;
    mint: string;
    balance: number;
    logoURI?: string;
  }) => {
    try {
      setIsLoading(true);
      await addToolResult({
        type: 'stream-result-data',
        status: 'streaming',
        toolCallId,
        content: {
          step: 'pool-selection',
          selectedToken: {
            symbol: token.symbol,
            mint: token.mint,
          },
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePoolSelect = async (pool: MeteoraPool) => {
    await addToolResult({
      type: 'stream-result-data',
      status: 'streaming',
      toolCallId,
      content: {
        step: 'amount-input',
        selectedToken: result?.selectedToken,
        selectedPool: pool,
      },
    });
  };

  const handleAmountSubmit = async () => {
    await addToolResult({
      type: 'stream-result-data',
      status: 'streaming',
      toolCallId,
      content: {
        step: 'awaiting-confirmation',
        selectedToken: result?.selectedToken,
        selectedPool: result?.selectedPool,
        amount: parseFloat(amount),
      },
    });
  };

  const handleConfirmation = async () => {
    await addToolResult({
      type: 'stream-result-data',
      status: 'streaming',
      toolCallId,
      content: {
        step: 'processing',
        selectedToken: result?.selectedToken,
        selectedPool: result?.selectedPool,
        amount: result?.amount,
      },
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        {/* Find This Please! {result?.step} and {result?.availableTokens?.length} */}
        {/* Token Selection Step */}
        {result?.step === 'token-selection' && result?.availableTokens && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Select Token</div>
            {result.availableTokens.map((token) =>
              token ? (
                <div
                  key={token.mint}
                  className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  onClick={() => handleTokenSelect(token)}
                >
                  <div className="flex items-center gap-3">
                    {token.logoURI && (
                      <Image
                        src={token.logoURI}
                        alt={token.symbol || ''}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        Balance: {token.balance ?? 0}
                      </div>
                    </div>
                  </div>
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              ) : null,
            )}
          </div>
        )}
        {/* Pool Selection Step */}
        {/* {result?.step === 'pool-selection' && result?.pools && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Select Pool</div>
            {result.pools.map((pool) => (
              <div
                key={pool.poolId}
                className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                onClick={() => handlePoolSelect(pool)}
              >
                <div>
                  <div className="font-medium">{pool.poolName}</div>
                  <div className="text-sm text-muted-foreground">
                    TVL: ${pool.tvl.toLocaleString()} • APR: {pool.apr}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )} */}
        {/* Amount Input Step */}
        {/* {result?.step === 'amount-input' && result?.selectedToken && (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="mt-1">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Enter amount`}
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleAmountSubmit}
              disabled={!amount || parseFloat(amount) <= 0}
            >
              Continue
            </Button>
          </div>
        )} */}
        {/* Confirmation Step */}
        {/* {result?.step === 'awaiting-confirmation' && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 font-medium">Position Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token:</span>
                  <span>{result.selectedToken?.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span>{result.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pool:</span>
                  <span>{result.selectedPool?.poolName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">APR:</span>
                  <span>{result.selectedPool?.apr}%</span>
                </div>
              </div>
            </div>
          </div>
        )} */}
        {/* Processing State */}
        {/* {result?.step === 'processing' && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Processing transaction...
            </span>
          </div>
        )} */}
        {/* Completed State */}
        {/* {result?.step === 'completed' && result?.signature && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Position opened successfully!</span>
            </div>
            <a
              href={`https://solscan.io/tx/${result.signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View transaction
            </a>
          </div>
        )} */}
        {/* Failed State */}
        {/* {result?.step === 'failed' && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <XCircle className="h-4 w-4" />
            <span>
              {result.error || 'Failed to open position. Please try again.'}
            </span>
          </div>
        )} */}
      </CardContent>

      {/* Confirmation Footer */}
      {/* {result?.step === 'awaiting-confirmation' && (
        <CardFooter className="justify-between border-t bg-muted/50 px-6 py-4">
          <Button onClick={handleConfirmation} variant="default">
            Confirm Position
          </Button>
          <div className="text-sm text-muted-foreground">
            Ready to open position
          </div>
        </CardFooter>
      )} */}
    </Card>
  );
}
