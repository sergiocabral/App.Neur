'use client';

import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, ExternalLink, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { truncate } from '@/lib/utils/format';
import { ManageDriftPosition, perpPosition } from '@/types/stream';

import { CompletedAnimation, ProcessingAnimation } from '../swap/swap-status';

interface DriftAccountInfoProps {
  data: {
    success: boolean;
    result: ManageDriftPosition;
  };
  addToolResult: (result: ManageDriftPosition) => void;
}

export default function DriftAccountInfo({
  data: { success, result },
  addToolResult: addToolResult,
}: DriftAccountInfoProps) {
  const [showSpotPositions, setShowSpotPositions] = useState(true);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showPerpPositions, setShowPerpPositions] = useState(true);
  const [selectedPrepPosition, setSelectedPrepPosition] =
    useState<perpPosition | null>(null);
  const [overlay, setOverlay] = useState(
    result?.step === 'processing' ||
      result?.step === 'canceled' ||
      result?.step === 'completed',
  );
  const [signature, setSignature] = useState(result?.signature);

  useEffect(() => {
    if (result) {
      setOverlay(
        result?.step === 'processing' ||
          result?.step === 'canceled' ||
          result?.step === 'completed',
      );
      setSignature(result?.signature);
    }
    console.log(success, result);
  }, [result, selectedPrepPosition]);

  const handleCancel = async () => {
    setSelectedPrepPosition(null);
    await addToolResult({
      step: 'canceled',
    });
  };

  const handleConfirmation = async () => {
    if (selectedPrepPosition) {
      console.log(selectedPrepPosition);
      await addToolResult({
        step: 'confirmed',
        selectedPrepPositon: selectedPrepPosition,
      });
    }
  };

  if (overlay) {
    return (
      <Card className="overflow-hidden">
        {result?.step != 'completed' && (
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
                      {result?.step === 'canceled' ? (
                        <X className="h-8 w-8 text-destructive" />
                      ) : (
                        <ProcessingAnimation />
                      )}
                    </motion.div>

                    <div className="space-y-1">
                      {result?.step === 'canceled' ? (
                        <h3 className="text-lg font-medium">Canceled</h3>
                      ) : (
                        <h3 className="text-lg font-medium">
                          Processing Your request...
                        </h3>
                      )}
                      {result?.step !== 'canceled' && (
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <span className="font-medium">
                            {selectedPrepPosition?.market || ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </CardContent>
        )}

        {result?.step === 'completed' && overlay && (
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
                        Successfully Closed {selectedPrepPosition?.positionType}{' '}
                        {selectedPrepPosition?.market} position!
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-sm">
                        Signature:{' '}
                        <a
                          href={`https://solscan.io/tx/${result?.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <span className="font-mono">
                            {truncate(result?.signature ?? '', 8)}
                          </span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  if (!success) {
    return (
      <Card className="bg-destructive/10 p-6">
        <h2 className="mb-2 text-xl font-semibold text-destructive">
          Drift Account Retrieval Failed
        </h2>
        <pre className="text-sm text-destructive/80">
          {JSON.stringify(result.error, null, 2)}
        </pre>
      </Card>
    );
  }

  if (!result || !result?.info) {
    return (
      <>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </>
    );
  }

  const {
    name = '',
    accountAddress = '',
    authority = '',
    overallBalance = 0,
    settledPerpPnl = '',
    lastActiveSlot = 0,
    spotPositions = [],
    perpPositions = [],
  } = result.info;

  return (
    <Card className="w-full max-w-xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{name}</CardTitle>
          <span className="font-mono font-medium">
            ${overallBalance.toFixed(2)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="space-y-2">
          <div
            className="flex cursor-pointer items-center justify-between py-1 text-xs hover:text-foreground/80"
            onClick={() => setShowAccountDetails(!showAccountDetails)}
            role="button"
            tabIndex={0}
          >
            <span className="font-medium">Account Details</span>
            {showAccountDetails ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </div>

          {showAccountDetails && (
            <div className="grid gap-2 px-2 text-xs">
              <div className="grid gap-0.5">
                <span className="text-muted-foreground">Account</span>
                <span className="font-mono">{accountAddress}</span>
              </div>
              <div className="grid gap-0.5">
                <span className="text-muted-foreground">Authority</span>
                <span className="font-mono">{authority}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>Last Active:</span>
                <span>Slot {lastActiveSlot}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Settled PnL</span>
          <span className="font-mono text-sm">{settledPerpPnl}</span>
        </div>

        <Separator />

        <div className="space-y-2">
          <div
            className="flex cursor-pointer items-center justify-between gap-1 py-1 text-sm hover:text-foreground/80"
            onClick={() => setShowSpotPositions(!showSpotPositions)}
            role="button"
            tabIndex={0}
          >
            <span className="font-medium">Spot Positions</span>
            {showSpotPositions ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </div>

          {showSpotPositions && spotPositions.length > 0 && (
            <div className="grid gap-3">
              {spotPositions.map((position, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="mb-2 flex items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{position?.symbol}</span>
                      <Badge
                        variant={
                          position?.type === 'borrow'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {position?.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Available</span>
                      <span
                        className={`font-mono ${!position?.availableBalance || position?.availableBalance < 0 ? 'text-red-400' : 'text-green-400'}`}
                      >
                        {position?.availableBalance.toFixed(8)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Orders</span>
                      <span className="font-mono">{position?.openOrders}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Bids</span>
                      <span className="font-mono text-green-400">
                        {position?.openBids}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Asks</span>
                      <span className="font-mono text-red-400">
                        {position?.openAsks}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showSpotPositions && spotPositions.length === 0 && (
            <div className="py-2 text-center text-sm text-muted-foreground">
              No spot positions
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <div
            className="flex cursor-pointer items-center justify-between gap-1 py-1 text-sm hover:text-foreground/80"
            onClick={() => setShowPerpPositions(!showPerpPositions)}
            role="button"
            tabIndex={0}
          >
            <span className="font-medium">Perp Positions</span>
            {showPerpPositions ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </div>
          {showPerpPositions && perpPositions.length > 0 && (
            <div className="grid gap-3">
              <div className="max-h-[300px] overflow-y-auto pr-2">
                {perpPositions.map((position, index) => (
                  <div
                    key={index}
                    className="mb-3 rounded-lg border border-border/50 p-3 transition-colors last:mb-0 hover:bg-accent/50"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{position?.market}</span>
                        <Badge
                          variant={
                            position?.positionType === 'short'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {position?.positionType.toUpperCase()}
                        </Badge>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setSelectedPrepPosition(position)}
                        className="h-8 px-2 py-1 text-xs"
                      >
                        Close Position
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-4 items-center gap-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">P&L</span>
                          <span
                            className={`font-mono ${position?.baseAssetAmount < 0 ? 'text-red-400' : 'text-green-400'}`}
                          >
                            {position?.baseAssetAmount < 0 ? '-$' : '$'}
                            {Math.abs(position?.baseAssetAmount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-mono">
                            ${(position?.quoteAssetAmount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">
                            Entry Amount
                          </span>
                          <span className="font-mono">
                            ${position?.quoteEntryAmount}
                          </span>
                        </div>
                        {/* <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground">
                              Break Even
                            </span>
                            <span className="font-mono">
                              {position.quoteBreakEvenAmount}
                            </span>
                          </div> */}
                      </div>
                      <Separator />
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">
                            Settled PnL
                          </span>
                          <span className="font-mono">
                            {position?.settledPnl}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Orders</span>
                          <span className="font-mono">
                            {position?.openOrders}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Bids</span>
                          <span className="font-mono text-green-400">
                            {position?.openBids}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Asks</span>
                          <span className="font-mono text-red-400">
                            {position?.openAsks}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showPerpPositions && perpPositions.length === 0 && (
            <div className="py-2 text-center text-sm text-muted-foreground">
              No perp positions
            </div>
          )}
        </div>

        {result?.step === 'awaiting-confirmation' && selectedPrepPosition && (
          <CardFooter className="justify-between border-t bg-muted/50 px-6 py-4">
            <div className="flex items-center justify-between gap-2">
              <Button onClick={handleCancel} variant="default">
                Cancel
              </Button>
              <Button onClick={handleConfirmation} variant="default">
                Confirm
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Ready to close {selectedPrepPosition?.positionType}{' '}
              {selectedPrepPosition?.market} position!
            </div>
          </CardFooter>
        )}
      </CardContent>
    </Card>
  );
}
