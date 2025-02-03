'use client';

import { ArrowLeft, Percent, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Rate {
  tokenData: {
    symbol: string;
    mint: string;
    balance: number;
  };
  lendingApy: number;
}

interface DepositViewProps {
  symbol: string;
  apy: number;
  onBack: () => void;
  onConfirm: (amount: number) => void;
  availableBalance: number;
  addResultUtility: (result: {
    formData: {
      amount: number;
      symbol: string;
      market: string;
    };
    success: boolean;
  }) => void;
}

function DepositView({
  symbol,
  apy,
  onBack,
  onConfirm,
  availableBalance,
  addResultUtility,
}: DepositViewProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSetPercentage = (percentage: number) => {
    const calculatedAmount = (availableBalance * percentage).toFixed(2);
    setAmount(calculatedAmount);
    setError('');
  };

  const handleConfirm = () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (numAmount > availableBalance) {
      setError('Insufficient balance');
      return;
    }
    onConfirm(numAmount);
    addResultUtility({
      success: true,
      formData: {
        amount: numAmount,
        symbol,
        market: 'drift',
      },
    });
  };

  return (
    <div className="flex h-[420px] flex-col">
      <Button
        variant="ghost"
        className="-ml-2 mb-6 w-fit text-muted-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to rates
      </Button>

      <div className="mb-8 text-center">
        <div className="mb-2 inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {symbol}
        </div>
        <div className="flex items-center justify-center gap-1 text-3xl font-bold">
          {apy.toFixed(2)}
          <Percent className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">Annual Percentage Yield</p>
      </div>

      <div className="flex-1 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Available {symbol}
            </span>
            <span className="font-medium">
              {availableBalance.toLocaleString()}
            </span>
          </div>
          <Input
            type="number"
            placeholder={`Enter ${symbol} amount`}
            value={amount}
            onChange={(e) => {
              setError('');
              setAmount(e.target.value);
            }}
            className="font-mono"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[0.25, 0.5, 0.75, 1].map((percentage) => (
            <Button
              key={percentage}
              variant="outline"
              size="sm"
              onClick={() => handleSetPercentage(percentage)}
            >
              {percentage * 100}%
            </Button>
          ))}
        </div>

        <div className="flex flex-1 items-end">
          <Button className="w-full" onClick={handleConfirm} size="lg">
            Deposit {symbol}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FeaturedRate({ rate, onClick }: { rate: Rate; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col items-center rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/50"
    >
      <div className="mb-2 rounded-md bg-primary/10 px-2 py-1">
        <span className="text-sm font-medium text-primary">
          {rate.tokenData.symbol}
        </span>
      </div>
      <div className="mb-1 flex items-baseline gap-1">
        <span className="text-xl font-bold tabular-nums">
          {rate.lendingApy.toFixed(2)}
        </span>
        <span className="text-sm text-muted-foreground">%</span>
      </div>
      <span className="text-xs text-muted-foreground">
        {rate.tokenData.balance.toLocaleString()} available
      </span>
    </button>
  );
}

function RateListItem({ rate, onClick }: { rate: Rate; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/50"
    >
      <div className="grid w-full grid-cols-2 items-baseline gap-2 sm:grid-cols-[100px,1fr,1fr] sm:gap-4">
        <span className="text-sm font-medium">{rate.tokenData.symbol}</span>
        <div className="flex items-baseline justify-end gap-1 sm:justify-start">
          <span className="text-sm font-bold tabular-nums">
            {rate.lendingApy.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">%</span>
        </div>
        <span className="col-span-2 text-left text-xs text-muted-foreground sm:col-span-1 sm:text-right">
          {rate.tokenData.balance.toLocaleString()} available
        </span>
      </div>
    </button>
  );
}

export default function LendingRatesCard({
  rates,
  addResultUtility,
}: {
  rates: Rate[];
  addResultUtility: (result: {
    formData: {
      amount: number;
      symbol: string;
      market: string;
    };
    success: boolean;
  }) => void;
}) {
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);

  const { featuredRates, otherRates } = useMemo(() => {
    // Filter and sort rates
    const sortedRates = rates
      .filter((rate) => rate.lendingApy > 0)
      .sort((a, b) => b.lendingApy - a.lendingApy);

    return {
      featuredRates: sortedRates.slice(0, 3),
      otherRates: sortedRates.slice(3),
    };
  }, []);

  const handleDeposit = (amount: number) => {
    if (!selectedRate) return;
    console.log(`Depositing ${amount} ${selectedRate.tokenData.symbol}`);
    setSelectedRate(null);
  };

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">Lending Rates</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedRate ? (
          <DepositView
            symbol={selectedRate.tokenData.symbol}
            apy={selectedRate.lendingApy}
            onBack={() => setSelectedRate(null)}
            onConfirm={handleDeposit}
            availableBalance={selectedRate.tokenData.balance}
            addResultUtility={addResultUtility}
          />
        ) : (
          <ScrollArea className="h-[420px] pr-4">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {featuredRates.map((rate, index) => (
                  <FeaturedRate
                    key={`${rate.tokenData.symbol}-${index}`}
                    rate={rate}
                    onClick={() => setSelectedRate(rate)}
                  />
                ))}
              </div>

              <div className="space-y-4">
                <Separator />
                <div className="space-y-2">
                  {otherRates.map((rate, index) => (
                    <RateListItem
                      key={`${rate.tokenData.symbol}-${index}`}
                      rate={rate}
                      onClick={() => setSelectedRate(rate)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
