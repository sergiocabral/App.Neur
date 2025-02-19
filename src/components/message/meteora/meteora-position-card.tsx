'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Info, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDlmmForToken } from '@/hooks/use-pools-for-token';
import { useWalletPortfolio } from '@/hooks/use-wallet-portfolio';
import { searchJupiterTokenMint } from '@/server/actions/jupiter';
import {
  type MeteoraDlmmGroup,
  type MeteoraDlmmPair,
  getSwapRatioForPool,
} from '@/server/actions/meteora';
import { SOL_MINT } from '@/types/helius/portfolio';
import type { MeteoraPositionResult } from '@/types/stream';

import { CompletedAnimation, ProcessingAnimation } from '../swap/swap-status';

interface Token {
  symbol: string;
  mint: string;
  name?: string;
  imageUrl?: string | null;
  balance?: number;
}

interface MeteoraPositionCardProps {
  data: {
    success: boolean;
    result?: MeteoraPositionResult;
  };
  addToolResult: (result: MeteoraPositionResult) => void;
  toolCallId: string;
}

export function MeteoraPositionCard({
  data,
  addToolResult,
}: MeteoraPositionCardProps) {
  // Local state for form data
  const [selectedToken, setSelectedToken] = useState<Token | null>(
    data.result?.token || null,
  );
  const [selectedAmount, setSelectedAmount] = useState<string>(
    data.result?.amount?.toString() || '',
  );
  const [selectedGroup, setSelectedGroup] = useState<MeteoraDlmmGroup | null>(
    null,
  );
  const [selectedPair, setSelectedPair] = useState<MeteoraDlmmPair | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [swapRatio, setSwapRatio] = useState(0);
  const [swapHalf, setSwapHalf] = useState(false);

  const [overlay, setOverlay] = useState(
    data.result?.step === 'processing' ||
      data.result?.step === 'canceled' ||
      data.result?.step === 'completed',
  );

  // Sync with incoming result changes
  useEffect(() => {
    if (data.result?.token?.mint !== selectedToken?.mint) {
      setSelectedToken(data.result?.token || null);
      setSelectedAmount(data.result?.amount?.toString() || '');
      setSelectedGroup(null);
      setSelectedPair(null);
      setSwapHalf(false);
    }
    setOverlay(
      data.result?.step === 'processing' ||
        data.result?.step === 'canceled' ||
        data.result?.step === 'completed',
    );
  }, [data.result, selectedToken?.mint]);

  const { data: walletPortfolio, isLoading: isLoadingPortfolio } =
    useWalletPortfolio();
  const { isLoading: isDlmmLoading, data: dlmmGroups } = useDlmmForToken(
    selectedToken?.mint,
  );

  const handleTokenSelect = async (token: Token) => {
    try {
      setIsLoading(true);
      setSelectedToken(token);
      await addToolResult({
        step: data.result?.step || 'awaiting-confirmation',
        token,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupSelect = async (group: MeteoraDlmmGroup) => {
    setSelectedGroup(group);
  };

  const handlePairSelect = async (pair: MeteoraDlmmPair) => {
    setSelectedPair(pair);
    setSwapHalf(false); // Reset swap half when changing pairs
  };

  const handleConfirmation = async () => {
    if (!selectedAmount || !selectedToken || !selectedPair) return;

    await addToolResult({
      step: 'confirmed',
      token: selectedToken,
      amount: Number.parseFloat(selectedAmount),
      poolId: selectedPair.address,
    });
  };

  const handleCancel = async () => {
    await addToolResult({
      step: 'canceled',
    });
  };

  const handleBack = async () => {
    try {
      setIsLoading(true);
      if (selectedPair) {
        setSelectedPair(null);
      } else if (selectedGroup) {
        setSelectedGroup(null);
      } else if (selectedToken) {
        setSelectedToken(null);
        await addToolResult({
          step: 'awaiting-confirmation',
          token: null,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPair) {
      getSwapRatioForPool(selectedPair.address).then((ratio) => {
        setSwapRatio(ratio);
      });
      searchJupiterTokenMint(selectedPair.mint_x).then((tokenInfo) => {
        if (tokenInfo) {
          selectedPair.tokenXName = tokenInfo;
        }
      });
      searchJupiterTokenMint(selectedPair.mint_y).then((tokenInfo) => {
        if (tokenInfo) {
          selectedPair.tokenYName = tokenInfo;
        }
      });
    }
  }, [selectedPair]);

  const getTokenBalance = (mint?: string) => {
    return walletPortfolio?.tokens.find((t) => t?.mint === mint)?.balance ?? 0;
  };

  const calculateOtherTokenAmount = (inputAmount: number) => {
    if (!selectedToken || !selectedPair || !swapRatio) return 0;

    const isTokenX = selectedToken.mint === selectedPair.mint_x;
    return swapHalf
      ? (inputAmount / 2) * (isTokenX ? swapRatio : 1 / swapRatio)
      : inputAmount * (isTokenX ? swapRatio : 1 / swapRatio);
  };

  const hasEnoughBalance = () => {
    if (!selectedAmount || !selectedPair || !selectedToken) return false;

    const inputAmount = Number(selectedAmount);
    const tokenBalance = getTokenBalance(selectedToken.mint);
    const solBalance = getTokenBalance(SOL_MINT);

    // Check if user has enough SOL for position
    if (
      selectedToken.mint === SOL_MINT
        ? solBalance < 0.057
        : tokenBalance + inputAmount < 0.057 + inputAmount
    )
      return false;

    // Check if selected token has enough balance
    if (inputAmount > tokenBalance) return false;

    // If swap half is enabled, we only need to check the input token
    if (swapHalf) return true;

    // For normal swap, check if other token has enough balance
    const otherTokenMint =
      selectedToken.mint === selectedPair.mint_x
        ? selectedPair.mint_y
        : selectedPair.mint_x;
    const otherTokenBalance = getTokenBalance(otherTokenMint);
    const otherTokenAmount = calculateOtherTokenAmount(inputAmount);

    return otherTokenAmount <= otherTokenBalance;
  };

  const getInsufficientBalanceMessage = () => {
    if (!selectedAmount || !selectedPair || !selectedToken) return null;
    const inputAmount = Number(selectedAmount);

    const solBalance = getTokenBalance(SOL_MINT);
    const tokenBalance = getTokenBalance(selectedToken.mint);
    if (
      selectedToken.mint === SOL_MINT
        ? solBalance < 0.057
        : tokenBalance + inputAmount < 0.057 + inputAmount
    ) {
      return 'Need 0.057 SOL for position (refundable)';
    }

    if (inputAmount > tokenBalance) {
      return `Insufficient ${selectedToken.symbol}`;
    }

    if (!swapHalf) {
      const otherTokenMint =
        selectedToken.mint === selectedPair.mint_x
          ? selectedPair.mint_y
          : selectedPair.mint_x;
      const otherTokenBalance = getTokenBalance(otherTokenMint);
      const otherTokenAmount = calculateOtherTokenAmount(inputAmount);
      const otherTokenSymbol =
        selectedToken.mint === selectedPair.mint_x
          ? selectedPair.tokenYName?.symbol
          : selectedPair.tokenXName?.symbol;

      if (otherTokenAmount > otherTokenBalance) {
        return `Insufficient ${otherTokenSymbol}`;
      }
    }

    return null;
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        {/* Token Selection Step */}
        {!overlay &&
          data.result?.step != 'token-selection' &&
          !selectedToken && (
            <>
              <CardHeader>
                <CardTitle>Select Token</CardTitle>
                <CardDescription>
                  Choose a token from your wallet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingPortfolio ? (
                  <>
                    <Skeleton className="h-[68px] w-full rounded-lg" />
                    <Skeleton className="h-[68px] w-full rounded-lg" />
                    <Skeleton className="h-[68px] w-full rounded-lg" />
                  </>
                ) : (
                  walletPortfolio?.tokens.map((token) =>
                    token ? (
                      <div
                        key={token.mint}
                        className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                        onClick={() => handleTokenSelect(token)}
                      >
                        <div className="flex items-center gap-3">
                          {token.imageUrl && (
                            <Image
                              src={token.imageUrl || '/placeholder.svg'}
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
                  )
                )}
              </CardContent>
            </>
          )}

        {/* DLMM Group Selection */}
        {!overlay && selectedToken && dlmmGroups && !selectedGroup && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-4 h-8 px-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <>
              <CardHeader>
                <CardTitle>Select DLMM Group</CardTitle>
                <CardDescription>Choose a liquidity group</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isDlmmLoading ? (
                  <>
                    <Skeleton className="h-[68px] w-full rounded-lg" />
                    <Skeleton className="h-[68px] w-full rounded-lg" />
                    <Skeleton className="h-[68px] w-full rounded-lg" />
                  </>
                ) : (
                  dlmmGroups?.map((group) => (
                    <div
                      key={group.name}
                      className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                      onClick={() => handleGroupSelect(group)}
                    >
                      <div>
                        <div className="font-medium">{group.name}</div>
                        <div className="text-sm text-muted-foreground">
                          TVL: ${group.totalTvl.toFixed(0).toLocaleString()} •
                          APR: {group.maxApr.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </>
          </>
        )}

        {/* Pool Selection */}
        {!overlay && selectedToken && selectedGroup && !selectedPair && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-4 h-8 px-2"
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <>
              <CardHeader>
                <CardTitle>Select Pool</CardTitle>
                <CardDescription>Choose a liquidity pool</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-[68px] w-full rounded-lg" />
                    <Skeleton className="h-[68px] w-full rounded-lg" />
                    <Skeleton className="h-[68px] w-full rounded-lg" />
                  </>
                ) : (
                  selectedGroup.pairs?.map((pair) => (
                    <div
                      key={pair.address}
                      className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                      onClick={() => handlePairSelect(pair)}
                    >
                      <div>
                        <div className="font-medium">{pair.name}</div>
                        <div className="text-sm text-muted-foreground">
                          TVL: $
                          {Number.parseFloat(pair.liquidity)
                            .toFixed(0)
                            .toLocaleString()}{' '}
                          • APR: {pair.apr.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </>
          </>
        )}

        {/* Amount Input and Pool Details */}
        {!overlay && selectedToken && selectedGroup && selectedPair && (
          <div className="space-y-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-4 h-8 px-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>{selectedPair.name}</CardTitle>
                <CardDescription>Pool Information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Liquidity</Label>
                    <div className="font-medium">
                      $
                      {Number.parseFloat(
                        selectedPair.liquidity,
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">24h Volume</Label>
                    <div className="font-medium">
                      ${selectedPair.trade_volume_24h.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">APR</Label>
                    <div className="font-medium">
                      {selectedPair.apr.toFixed(2)}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Bin Step</Label>
                    <div className="font-medium">{selectedPair.bin_step}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Fee %</Label>
                    <div className="font-medium">
                      {Number.parseFloat(
                        selectedPair.base_fee_percentage,
                      ).toFixed(2)}
                      %
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">24h Fees</Label>
                    <div className="font-medium">
                      ${selectedPair.fees_24h.toLocaleString()}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">Token Pair</Label>
                  <div className="grid gap-1.5 text-sm">
                    <div className="font-medium">
                      Token X: {selectedPair.mint_x.slice(0, 8)}...
                      {selectedPair.mint_x.slice(-8)} •{' '}
                      {selectedPair.tokenXName?.name}
                    </div>
                    <div className="font-medium">
                      Token Y: {selectedPair.mint_y.slice(0, 8)}...
                      {selectedPair.mint_y.slice(-8)} •{' '}
                      {selectedPair.tokenYName?.name}
                    </div>
                    <div className="font-medium">
                      Swap ratio: 1 {selectedPair.tokenXName?.symbol} ={' '}
                      {swapRatio.toFixed(9)} {selectedPair.tokenYName?.symbol}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {/* Token X Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="amount-x">
                    Amount {selectedPair?.tokenXName?.symbol}
                  </Label>
                  {walletPortfolio && (
                    <span className="text-sm text-muted-foreground">
                      Balance: {getTokenBalance(selectedPair?.mint_x)}
                    </span>
                  )}
                </div>
                <Input
                  id="amount-x"
                  type="number"
                  value={
                    selectedToken?.mint === selectedPair?.mint_x
                      ? selectedAmount
                      : selectedAmount
                        ? (Number(selectedAmount) / swapRatio).toFixed(9)
                        : ''
                  }
                  onChange={(e) => setSelectedAmount(e.target.value)}
                  disabled={selectedToken?.mint !== selectedPair?.mint_x}
                  placeholder="Enter amount"
                />
              </div>

              {/* Token Y Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="amount-y">
                    Amount {selectedPair?.tokenYName?.symbol}
                  </Label>
                  {walletPortfolio && (
                    <span className="text-sm text-muted-foreground">
                      Balance: {getTokenBalance(selectedPair?.mint_y)}
                    </span>
                  )}
                </div>
                <Input
                  id="amount-y"
                  type="number"
                  value={
                    selectedToken?.mint === selectedPair?.mint_y
                      ? selectedAmount
                      : selectedAmount
                        ? (Number(selectedAmount) * swapRatio).toFixed(9)
                        : ''
                  }
                  onChange={(e) => setSelectedAmount(e.target.value)}
                  disabled={selectedToken?.mint !== selectedPair?.mint_y}
                  placeholder="Enter amount"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="swap-half"
                  checked={swapHalf}
                  onCheckedChange={(checked) => setSwapHalf(checked === true)}
                />
                <div className="flex items-center space-x-2">
                  <Label
                    htmlFor="swap-half"
                    className="text-sm text-muted-foreground"
                  >
                    Split position 50/50 between tokens
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          When enabled, half of your input token will be swapped
                          for the other token.
                          <br />
                          The total position value remains the same, but tokens
                          are split equally.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {swapHalf && selectedAmount && (
                <div className="text-sm text-muted-foreground">
                  Position split: {Number(selectedAmount) / 2}{' '}
                  {selectedToken?.symbol} +{' '}
                  {calculateOtherTokenAmount(Number(selectedAmount)).toFixed(6)}{' '}
                  {selectedToken?.mint === selectedPair?.mint_x
                    ? selectedPair?.tokenYName?.symbol
                    : selectedPair?.tokenXName?.symbol}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {overlay && data.result?.step != 'completed' && (
        <CardContent className="space-y-1">
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-6"
              >
                <div className="flex flex-col items-center space-y-3 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                    }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10"
                  >
                    {data.result?.step === 'canceled' ? (
                      <X className="h-8 w-8 text-destructive" />
                    ) : (
                      <ProcessingAnimation />
                    )}
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">
                      {data.result?.step === 'canceled'
                        ? 'Position Canceled'
                        : 'Opening a Position'}
                    </h3>
                    {selectedToken?.symbol && (
                      <p className="text-sm text-muted-foreground">
                        For {selectedAmount} {selectedToken.symbol}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </CardContent>
      )}

      {data.result?.step === 'completed' && overlay && (
        <CardContent className="space-y-1">
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-8"
              >
                <div className="flex flex-col items-center space-y-4 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                    }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10"
                  >
                    <CompletedAnimation />
                  </motion.div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">Position Opened!</h3>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <span className="font-medium">
                        {selectedToken?.symbol
                          ? `For ${selectedAmount} ${selectedToken.symbol}`
                          : ''}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedPair?.name}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </CardContent>
      )}

      {!overlay && (
        <CardFooter className="justify-between border-t bg-muted/50 px-6 py-4">
          <div className="flex items-center gap-2">
            {selectedAmount &&
              selectedGroup &&
              selectedPair &&
              selectedToken && (
                <Button
                  onClick={handleConfirmation}
                  variant="default"
                  disabled={!hasEnoughBalance()}
                >
                  Confirm Position
                </Button>
              )}
            <Button onClick={handleCancel} variant="default">
              Cancel
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {!hasEnoughBalance()
              ? getInsufficientBalanceMessage()
              : 'Ready to open position'}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
