'use client';

import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { isNull } from 'lodash';
import { ArrowLeft, ExternalLink, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { truncate } from '@/lib/utils/format';
import {
  type PositionWithPoolName,
  type TokenData,
  getTokenData,
} from '@/server/actions/meteora';
import type { MeteoraPositionUpdateResult } from '@/types/stream';

import { CompletedAnimation, ProcessingAnimation } from '../swap/swap-status';

interface MeteoraLpManagerProps {
  data: {
    success: boolean;
    result?: MeteoraPositionUpdateResult;
  };
  addToolResult: (result: MeteoraPositionUpdateResult) => void;
  toolCallId: string;
}

export function MeteoraLpManager({
  data,
  addToolResult,
}: MeteoraLpManagerProps) {
  const [selectedPositon, setSelectedPositon] =
    useState<PositionWithPoolName | null>(null);
  const [tokenX, setTokenX] = useState<TokenData | undefined>(undefined);
  const [tokenY, setTokenY] = useState<TokenData | undefined>(undefined);

  const [rewardOne, setRewardOne] = useState<number | null>(null);
  const [rewardTwo, setRewardTwo] = useState<number | null>(null);

  const [feeX, setFeeX] = useState<number | null>(null);
  const [feeY, setFeeY] = useState<number | null>(null);

  const [claimedX, setClaimedX] = useState<number | null>(null);
  const [claimedY, setClaimedY] = useState<number | null>(null);

  const [allPositions, setAllPositions] = useState<
    PositionWithPoolName[] | null
  >(data.result?.positions || null);
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<
    'close' | 'claimLMReward' | 'claimSwapFee' | null
  >(data.result?.action || null);

  const [overlay, setOverlay] = useState(
    data.result?.step === 'processing' ||
      data.result?.step === 'canceled' ||
      data.result?.step === 'completed',
  );

  useEffect(() => {
    if (data.result?.positions) {
      setAllPositions(data.result?.positions);
    }
    if (data.result?.selectedPositionAddress && data.result?.positions) {
      const foundSelectedPosition = data.result?.positions.find(
        (position: PositionWithPoolName) =>
          position.poolAddress === data.result?.selectedPositionAddress,
      );
      if (foundSelectedPosition) {
        setSelectedPositon(foundSelectedPosition);
      }
    }

    setOverlay(
      data.result?.step === 'processing' ||
        data.result?.step === 'canceled' ||
        data.result?.step === 'completed',
    );

    setRewardOne(
      Number.parseInt(
        selectedPositon?.position?.positionData?.rewardOne?.toString() ?? '0',
        16,
      ),
    );
    setRewardTwo(
      Number.parseInt(
        selectedPositon?.position?.positionData?.rewardTwo?.toString() ?? '0',
        16,
      ),
    );

    setFeeX(
      Number.parseInt(
        selectedPositon?.position?.positionData?.feeX?.toString() ?? '0',
        16,
      ),
    );
    setFeeY(
      Number.parseInt(
        selectedPositon?.position?.positionData?.feeY?.toString() ?? '0',
        16,
      ),
    );

    setClaimedX(
      Number.parseInt(
        selectedPositon?.position?.positionData?.totalClaimedFeeXAmount?.toString() ??
          '0',
        16,
      ),
    );
    setClaimedY(
      Number.parseInt(
        selectedPositon?.position?.positionData?.totalClaimedFeeYAmount?.toString() ??
          '0',
        16,
      ),
    );
  }, [
    data.result,
    data.result?.selectedPositionAddress,
    data.result?.positions,
    selectedPositon?.position?.positionData?.feeX?.toString(),
    selectedPositon?.position?.positionData?.rewardOne?.toString(),
    selectedPositon?.position?.positionData?.totalClaimedFeeYAmount?.toString(),
    selectedPositon?.position?.positionData?.totalClaimedFeeXAmount?.toString(),
    selectedPositon?.position?.positionData?.feeY?.toString(),
    selectedPositon?.position?.positionData?.rewardTwo?.toString(),
  ]);

  useEffect(() => {
    if (selectedPositon?.mintX && selectedPositon.mintY) {
      console.log('selectedPositon int the effect', selectedPositon);
      const fetchTokenData = async () => {
        const tokenXData = await getTokenData({ mint: selectedPositon.mintX });
        const tokenYData = await getTokenData({ mint: selectedPositon.mintY });
        setTokenX(tokenXData);
        setTokenY(tokenYData);
      };
      fetchTokenData();
    }
  }, [selectedPositon]);

  const handlePositionSelect = async (position: PositionWithPoolName) => {
    try {
      setIsLoading(true);
      setSelectedPositon(position);
      await addToolResult({
        step: 'awaiting-confirmation',
        selectedPositionAddress: position.poolAddress,
        positions: data.result?.positions,
        action: action ? action : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    try {
      setIsLoading(true);
      if (selectedPositon) {
        setSelectedPositon(null);
      } else {
        setSelectedPositon(null);
        await addToolResult({
          step: 'awaiting-confirmation',
          selectedPositionAddress: undefined,
          positions: data.result?.positions,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmation = async () => {
    try {
      setIsLoading(true);
      await addToolResult({
        step: 'confirmed',
        selectedPositionAddress: selectedPositon
          ? selectedPositon.poolAddress
          : undefined,
        action: action ? action : undefined,
        positions: data.result?.positions,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (action) {
      setAction(null);
    } else {
      try {
        setIsLoading(true);
        addToolResult({
          step: 'canceled',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        {/* DLMM Position Selection */}
        {!overlay && !selectedPositon && allPositions && (
          <>
            <CardHeader>
              <CardTitle>Your Positions</CardTitle>
              <CardDescription>
                Select the position you wanna know more about!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!allPositions ? (
                <>
                  <Skeleton className="h-[68px] w-full rounded-lg" />
                  <Skeleton className="h-[68px] w-full rounded-lg" />
                  <Skeleton className="h-[68px] w-full rounded-lg" />
                </>
              ) : (
                allPositions?.map((position) => (
                  <div
                    key={position.position.publicKey.toString()}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    onClick={() => handlePositionSelect(position)}
                  >
                    <div>
                      <div className="font-medium">{position.poolName}</div>
                      <div className="text-sm text-muted-foreground">
                        Position Address:{' '}
                        {position.position.publicKey.toString().slice(0, 8)}...
                        {position.position.publicKey.toString().slice(-8)} •
                        Pool Address: {position.poolAddress.slice(0, 8)}...
                        {position.poolAddress.toString().slice(-8)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </>
        )}

        {/* Amount Input and Pool Details */}
        {!overlay && selectedPositon && (
          <div className="space-y-6">
            <Button
              aria-label="Back to position list"
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
                <CardTitle>{selectedPositon.poolName}</CardTitle>
                <CardDescription>Pool Information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Swap Fee</Label>
                    {(!tokenX || isNull(feeX)) && (
                      <Skeleton className="h-4 w-24" />
                    )}
                    {(!tokenY || isNull(feeY)) && (
                      <Skeleton className="h-4 w-24" />
                    )}

                    {tokenX && !isNull(feeX) && (
                      <div className="font-medium">
                        {tokenX.symbol} Fee:
                        {' ' + feeX / 10 ** tokenX.decimals + ' '}
                        {tokenX.price && (
                          <span className="font-small">{`($${((feeX / 10 ** tokenX.decimals) * tokenX.price).toFixed(3)})`}</span>
                        )}
                      </div>
                    )}
                    {tokenY && !isNull(feeY) && (
                      <div className="font-medium">
                        {tokenY.symbol} Fee:{' '}
                        {' ' + feeY / 10 ** tokenY.decimals + ' '}
                        {tokenY.price && (
                          <span className="font-small">{`($${((feeY / 10 ** tokenY.decimals) * tokenY.price).toFixed(3)})`}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {!isNull(rewardTwo) &&
                    !isNull(rewardOne) &&
                    rewardOne > 0 &&
                    rewardTwo > 0 &&
                    tokenX &&
                    tokenY && (
                      <div className="checkZero space-y-1">
                        <Label className="text-muted-foreground">Rewards</Label>
                        <div className="font-medium">
                          {tokenX.symbol} Reward:{' '}
                          {' ' + rewardOne / 10 ** tokenX.decimals + ' '}
                          {tokenX.price && (
                            <span className="font-small">{`($${((rewardOne / 10 ** tokenX.decimals) * tokenX.price).toFixed(3)})`}</span>
                          )}
                        </div>
                        <div className="font-medium">
                          {tokenY.symbol} Reward:{' '}
                          {' ' + rewardTwo / 10 ** tokenY.decimals + ' '}
                          {tokenY.price && (
                            <span className="font-small">{`($${((rewardTwo / 10 ** tokenY.decimals) * tokenY.price).toFixed(3)})`}</span>
                          )}
                        </div>
                      </div>
                    )}

                  <div className="space-y-1">
                    <Label className="text-muted-foreground">
                      Total claimed Fee
                    </Label>
                    {(!tokenX || isNull(claimedX)) && (
                      <Skeleton className="h-4 w-24" />
                    )}
                    {(!tokenY || isNull(claimedY)) && (
                      <Skeleton className="h-4 w-24" />
                    )}
                    {tokenX && (
                      <div className="font-medium">
                        Total Claimed {tokenX.symbol}:{' '}
                        {Number.parseInt(
                          selectedPositon.position.positionData.totalClaimedFeeXAmount.toString(),
                          16,
                        ) /
                          10 ** tokenX.decimals}
                        {tokenX.price && !isNull(claimedX) && (
                          <span className="font-small">{`($${((claimedX / 10 ** tokenX.decimals) * tokenX.price).toFixed(3)})`}</span>
                        )}
                      </div>
                    )}
                    {tokenY && (
                      <div className="font-medium">
                        Total Claimed {tokenY.symbol}:{' '}
                        {Number.parseInt(
                          selectedPositon.position.positionData.totalClaimedFeeYAmount.toString(),
                          16,
                        ) /
                          10 ** tokenY.decimals}
                        {!isNull(claimedY) && tokenY.price && (
                          <span className="font-small">{`($${((claimedY / 10 ** tokenY.decimals) * tokenY.price).toFixed(3)})`}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">
                    Manage Position
                  </Label>
                  <div className="space-y-1">
                    <div className="font-medium">
                      Pool Address: {selectedPositon.poolAddress}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setAction('claimSwapFee')}
                            variant="default"
                            disabled={action != null || isLoading}
                          >
                            {isLoading ? 'Processing...' : 'Claim Swap Fee'}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Claim accumulated swap fees from your position</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {!isNull(rewardOne) &&
                      !isNull(rewardTwo) &&
                      rewardOne > 0 &&
                      rewardTwo > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => setAction('claimLMReward')}
                                variant="default"
                                disabled={action != null || isLoading}
                              >
                                {isLoading ? 'Processing...' : 'Claim Rewards'}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Claim accumulated LM rewards from your position
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setAction('close')}
                            variant="default"
                            disabled={action != null || isLoading}
                          >
                            {isLoading ? 'Processing...' : 'Close Position'}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Close your position and withdraw all liquidity</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                    {data.result?.step !== 'canceled' && (
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="font-medium">
                          {selectedPositon?.position.publicKey
                            ? `Position Address: ${truncate(selectedPositon?.position.publicKey.toString(), 6)}`
                            : ''}
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
                      Successfully{' '}
                      {action === 'close'
                        ? 'Closed the Position'
                        : action === 'claimLMReward'
                          ? 'Claimed Rewards'
                          : action === 'claimSwapFee'
                            ? 'Claimed Swap Fee'
                            : ''}
                      !
                    </h3>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      Signature:{' '}
                      <a
                        href={`https://solscan.io/tx/${data?.result?.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <span className="font-mono">
                          {truncate(data?.result?.signature ?? '', 8)}
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
      )}
    </Card>
  );
}
