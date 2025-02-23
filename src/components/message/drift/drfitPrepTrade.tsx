'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import { PublicKey } from '@solana/web3.js';
import { AnimatePresence, motion } from 'framer-motion';
import { isNull } from 'lodash';
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  Filter,
  Loader2,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useWalletPortfolio } from '@/hooks/use-wallet-portfolio';
import { truncate } from '@/lib/utils/format';
import { MainnetPerpMarketsList, PerpMarketType } from '@/server/actions/drift';
import {
  PositionWithPoolName,
  TokenData,
  getAllLbPairPositionForOwner,
  getMeteoraPositions,
  getTokenData,
} from '@/server/actions/meteora';
import type { DriftPrepTrade } from '@/types/stream';

import { CompletedAnimation, ProcessingAnimation } from '../swap/swap-status';

interface DriftPrepTradeProps {
  data: {
    success: boolean;
    result?: DriftPrepTrade;
  };
  addToolResult: (result: DriftPrepTrade) => void;
  toolCallId: string;
}

export function DriftPrepTrade({ data, addToolResult }: DriftPrepTradeProps) {
  const [selectedMarket, setSelectedMarket] = useState<PerpMarketType | null>(
    null,
  );
  const [amount, setAmount] = useState<number>();
  const [price, setPrice] = useState<number>();

  const [step, setStep] = useState<
    | 'market-selection'
    | 'inputs'
    | 'awaiting-confirmation'
    | 'confirmed'
    | 'processing'
    | 'completed'
    | 'canceled'
  >(data.result?.step || 'market-selection');

  const [mainnetPerpMarketsLists, setMainnetPerpMarketsLists] = useState<
    PerpMarketType[] | null
  >(MainnetPerpMarketsList);

  console.log(mainnetPerpMarketsLists);

  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState<'market' | 'limit'>();
  const [action, setAction] = useState<'long' | 'short'>();

  useEffect(() => {
    if (data.result?.step) setStep(data.result?.step);
  }, [data]);

  const [overlay, setOverlay] = useState(
    data.result?.step === 'processing' ||
      data.result?.step === 'canceled' ||
      data.result?.step === 'completed',
  );

  const [searchQuery, setSearchQuery] = useState('');

  const filteredMarkets = mainnetPerpMarketsLists?.filter(
    (market) =>
      market.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.baseAssetSymbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleMarketSelect = async (market: PerpMarketType) => {
    try {
      setSelectedMarket(market);
      await addToolResult({
        step: 'awaiting-confirmation',
        marketIndex: market.marketIndex,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // const handleBack = async () => {
  //   try {
  //     setIsLoading(true);
  //     if (selectedPositon) {
  //       setSelectedPositon(null);
  //     } else {
  //       setSelectedPositon(null);
  //       await addToolResult({
  //         step: 'awaiting-confirmation',
  //         selectedPositionAddress: undefined,
  //       });
  //     }
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleConfirmation = async () => {
  //   try {
  //     setIsLoading(true);
  //     await addToolResult({
  //       step: 'confirmed',
  //       selectedPositionAddress: selectedPositon
  //         ? selectedPositon.poolAddress
  //         : undefined,
  //       action: action ? action : undefined,
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleCancel = async () => {
  //   if (action) {
  //     setAction(null);
  //   } else {
  //     try {
  //       setIsLoading(true);
  //       addToolResult({
  //         step: 'canceled',
  //       });
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }
  // };

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        {/* DLMM Position Selection */}
        {!overlay && !selectedMarket && mainnetPerpMarketsLists && (
          <>
            <CardHeader>
              <CardTitle>Your Positions</CardTitle>
              <CardDescription>
                Select the position you wanna know more about!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="sticky top-0 z-10 bg-background pb-2">
                <Input
                  type="text"
                  placeholder="Search markets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {!mainnetPerpMarketsLists ? (
                  <>
                    <Skeleton className="h-[68px] w-full rounded-lg" />
                    <Skeleton className="h-[68px] w-full rounded-lg" />
                    <Skeleton className="h-[68px] w-full rounded-lg" />
                  </>
                ) : (
                  filteredMarkets?.map((prepMarket) => (
                    <div
                      key={prepMarket.baseAssetSymbol}
                      className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                      onClick={() => handleMarketSelect(prepMarket)}
                    >
                      <div>
                        <div className="font-medium">
                          {prepMarket.symbol}{' '}
                          <span className="text-sm text-muted-foreground">
                            {' '}
                            • {prepMarket.fullName}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Base Asset: {prepMarket.baseAssetSymbol}
                        </div>
                        <div className="flex text-sm text-muted-foreground">
                          Category:{' '}
                          {prepMarket.category
                            ?.map((category) => category)
                            .join(', ')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </>
        )}
        {/* Amount Input and Pool Details */}
        {!overlay && selectedMarket && (
          <div className="space-y-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {}}
              className="mb-4 h-8 px-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedMarket.fullName}{' '}
                  <span className="text-sm text-muted-foreground">
                    {' '}
                    • {selectedMarket.fullName}
                  </span>
                </CardTitle>
                <CardDescription>Trade Information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">
                      Base Asset Symbol
                    </Label>
                    <div className="font-medium">
                      {selectedMarket.baseAssetSymbol}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Category</Label>
                    <div className="font-medium">
                      {selectedMarket.category
                        ?.map((category) => category)
                        .join(', ')}
                    </div>
                  </div>
                </div>

                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Select Trade Type</Label>
                  <RadioGroup
                    value={type}
                    onValueChange={(value: 'market' | 'limit') =>
                      setType(value)
                    }
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="market" />
                      <label htmlFor="market">Market</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="limit" />
                      <label htmlFor="limit">Limit</label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Select Action</Label>
                  <RadioGroup
                    value={action}
                    onValueChange={(value: 'long' | 'short') =>
                      setAction(value)
                    }
                  >
                     <div className="flex items-center space-x-2">
                      <RadioGroupItem value="long" />
                      <label htmlFor="long">Long</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="short" />
                      <label htmlFor="short">Short</label>
                    </div>
                  </RadioGroup>
                </div>
                {type === 'limit' && (
                  <div className="space-y-2">
                    <Label htmlFor="amount">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      placeholder="Enter Limit Price"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>

      {/* {overlay && data.result?.step != 'completed' && (
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
                    {data.result?.step === 'canceled' ? (
                      <X className="h-8 w-8 text-destructive" />
                    ) : (
                      <ProcessingAnimation />
                    )}
                  </motion.div>

                  <div className="space-y-1">
                    {data.result?.step === 'canceled' ? (
                      <h3 className="text-lg font-medium">Canceled</h3>
                    ) : (
                      <h3 className="text-lg font-medium">
                        Processing Your request...
                      </h3>
                    )}
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <span className="font-medium">
                        {selectedPositon?.position.publicKey
                          ? `Position Address: ${truncate(selectedPositon?.position.publicKey.toString(), 6)}`
                          : ''}
                      </span>
                    </div>
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
                    <h3 className="text-lg font-medium">
                      Changes Made Successfully!
                    </h3>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <span className="font-medium">
                        <span className="font-medium">Success</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        Signature:{' '}
                        <Link
                          href={`https://solscan.io/tx/${data.result.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {data.result.signature?.toString().slice(0, 8)}...
                          {data.result.signature?.toString().slice(-8)}
                        </Link>
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </CardContent>
      )}

      {data.result?.step === 'awaiting-confirmation' && (
        <CardFooter className="justify-between border-t bg-muted/50 px-6 py-4">
          <div className="flex items-center justify-between gap-2">
            <Button onClick={handleCancel} variant="default">
              Cancel
            </Button>
            {selectedPositon && action && (
              <Button onClick={handleConfirmation} variant="default">
                Confirm
              </Button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {action
              ? `Ready to ${
                  action === 'close'
                    ? 'close your position?'
                    : action === 'claimLMReward'
                      ? 'claim your rewards?'
                      : 'claim your swap fee?'
                }`
              : ''}
          </div>
        </CardFooter>
      )} */}
      {/* </CardContent> */}
    </Card>
  );
}
