'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import { AnimatePresence, motion } from 'framer-motion';
import { isNull } from 'lodash';
import {
  ArrowDown,
  ArrowRight,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MainnetSpotMarketsList, SpotMarketType } from '@/server/actions/drift';
import type { DriftSpotTrade } from '@/types/stream';

import { CompletedAnimation, ProcessingAnimation } from '../swap/swap-status';
import SlippageSelector from './SlippageSelector';

interface DriftPrepTradeProps {
  data: {
    success: boolean;
    result?: DriftSpotTrade;
  };
  addToolResult: (result: DriftSpotTrade) => void;
  toolCallId: string;
}

export function SpotSwapDrift({ data, addToolResult }: DriftPrepTradeProps) {
  const [fromSymbol, setFromSymbol] = useState<string>(data.result?.fromSymbol || 'SOL');
  const [toSymbol, setToSymbol] = useState<string>();
  const [fromAmount, setFromAmount] = useState<number | undefined>(data.result?.fromAmount);
  const [toAmount, setToAmount] = useState<number | undefined>(data.result?.toAmount);
  const [slippage, setSlippage] = useState<number>(data.result?.slippage || 0.5);
  const [sportMarketList, setSportMarketList] = useState<SpotMarketType[]>(MainnetSpotMarketsList);

  const [step, setStep] = useState<
    | 'inputs'
    | 'awaiting-confirmation'
    | 'confirmed'
    | 'processing'
    | 'completed'
    | 'canceled'
    | 'failed'
  >(data.result?.step || 'inputs');

  const [isLoading, setIsLoading] = useState(false);

  const [overlay, setOverlay] = useState(
    data.result?.step === 'confirmed' ||
    data.result?.step === 'processing' ||
    data.result?.step === 'canceled' ||
    data.result?.step === 'completed',
  );

  useEffect(() => {
    if (data.result?.step) setStep(data.result?.step);
    setOverlay(
      data.result?.step === 'confirmed' ||
      data.result?.step === 'processing' ||
      data.result?.step === 'completed' ||
      data.result?.step === 'canceled',
    );
  }, [data]);

  const handleConfirmation = async () => {
    try {
      setIsLoading(true);
      await addToolResult({
        step: 'confirmed',
        fromAmount: (fromAmount && fromAmount > 0) ? fromAmount : undefined,
        toAmount: (toAmount && toAmount > 0) ? toAmount : undefined,
        fromSymbol: fromSymbol,
        toSymbol: toSymbol,
        slippage: slippage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log({ fromSymbol, toSymbol, fromAmount, toAmount, slippage, step: data });
  }, [fromSymbol, toSymbol, fromAmount, toAmount, slippage, data]);

  const handleCancel = async () => {
    setFromAmount(0);
    setToAmount(0);
    setFromSymbol('SOL');
    setToSymbol('');
    setSlippage(0.5);
      try {
        setIsLoading(true);
        addToolResult({
          step: 'canceled',
        });
      } finally {
        setIsLoading(false);
      }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        {/* DLMM Position Selection */}
        {!overlay && sportMarketList && (
          <>
            <CardHeader>
              <CardTitle>Spot Token Swap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="sticky top-0 z-10 bg-background pb-2">
                <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="py-8"
                >
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={`Amount of ${fromSymbol} to be swapped`}
                      disabled={(toAmount && toAmount > 0)? true: false}
                      value={fromAmount}
                      onChange={(e) => setFromAmount(Number(e.target.value))}
                      className="w-full"
                    />
                    <Select
                      value={fromSymbol}
                      onValueChange={(value) => {
                        if (value !== toSymbol) {
                          setFromSymbol(value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent>
                        {sportMarketList.map((market) => (
                          <SelectItem
                            key={market.symbol}
                            value={market.symbol}
                            disabled={market.symbol === toSymbol}
                          >
                            {market.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='flex items-center justify-center'>
                    <ArrowDown className="h-8 w-5 text-primary" />
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={`Amount of ${toSymbol} You will receive`}
                      disabled={(fromAmount && fromAmount > 0)? true: false}
                      value={toAmount}
                      onChange={(e) => setToAmount(Number(e.target.value))}
                      className="w-full"
                    />
                    <Select
                      value={toSymbol}
                      onValueChange={(value) => {
                        if (value !== fromSymbol) {
                          setToSymbol(value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent>
                        {sportMarketList.map((market) => (
                          <SelectItem
                            key={market.symbol}
                            value={market.symbol}
                            disabled={market.symbol === toSymbol}
                          >
                            {market.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end mt-2">
                    <SlippageSelector defaultSlippage={0.5} onChange={setSlippage} />
                  </div>
                </motion.div>
                </AnimatePresence>
              </div>
            </CardContent>
          </>
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
                        {`Swapping ${fromAmount} ${fromSymbol} for ${toAmount} ${toSymbol} at ${slippage}% slippage`}
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
                      Trade Executed Successfully!
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
            {fromSymbol && toSymbol && slippage && ((fromAmount && fromAmount >0) || (toAmount && toAmount >0))&& (
              <Button onClick={handleConfirmation} variant="default">
                Confirm
              </Button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {`Ready to swap ${fromAmount?fromAmount:''} ${fromSymbol} for ${toAmount?toAmount:''} ${toSymbol} at ${slippage}% slippage`}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
