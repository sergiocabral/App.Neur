'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownUp, ArrowLeft, ArrowRight, Filter, Loader2, X } from 'lucide-react';

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
import { Separator } from '@/components/ui/separator';
import { useWalletPortfolio } from '@/hooks/use-wallet-portfolio';
import type { MeteoraPositionUpdateResult } from '@/types/stream';
import { getAllLbPairPositionForOwner, getMeteoraPositions, getTokenData, PositionWithPoolName, TokenData } from '@/server/actions/meteora';
import { PublicKey } from '@solana/web3.js';
import { Skeleton } from '@/components/ui/skeleton';
import { CompletedAnimation, ProcessingAnimation } from '../swap/swap-status';
import { Label } from '@/components/ui/label';

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
  const [selectedPositon, setSelectedPositon] = useState<PositionWithPoolName | null>(null);
  console.log(data);
  const [walletAddress, setWalletAddress] = useState(data.result?.wallet);
  const [tokenX, setTokenX] = useState<TokenData | undefined>(undefined);
  const [tokenY, setTokenY] = useState<TokenData | undefined>(undefined);

  const { data: walletPortfolio } = useWalletPortfolio();

  const [allPositions, setAllPositions] = useState<PositionWithPoolName[] | null>(data.result?.positions || null);
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<'close' | 'claimLMReward' | 'claimSwapFee' | null>(data.result?.action || null);

  const [overlay, setOverlay] = useState(
    data.result?.step === 'processing' ||
      data.result?.step === 'canceled' ||
      data.result?.step === 'completed',
  );

  useEffect(() => {
    if(data.result?.positions){
      setAllPositions(data.result?.positions);
    }
    if (data.result?.selectedPosition && data.result?.selectedPosition?.position.publicKey !== selectedPositon?.position.publicKey) {
      setSelectedPositon(data.result?.selectedPosition);
    }

    setOverlay(
      data.result?.step === 'processing' ||
        data.result?.step === 'canceled' ||
        data.result?.step === 'completed',
    );
  }, [data.result, data.result?.selectedPosition, selectedPositon?.position.publicKey, data.result?.positions]);

  useEffect(() => {
    if(selectedPositon?.mintX &&  selectedPositon.mintY){
      console.log("selectedPositon int the effect", selectedPositon);
      const fetchTokenData = async () => {
        const tokenXData = await getTokenData({mint: selectedPositon.mintX});
        const tokenYData = await getTokenData({mint: selectedPositon.mintY});
        console.log("tokenXData", tokenXData);
        console.log("tokenYData", tokenYData);
        setTokenX(tokenXData);
        setTokenY(tokenYData);
      };
      fetchTokenData();
    }
  }, [selectedPositon?.mintX, selectedPositon?.mintY]);

  const handlePositionSelect = async (Position: PositionWithPoolName) => {
    try {
      setIsLoading(true);
      setSelectedPositon(Position);
      await addToolResult({
        step: data.result?.step || 'awaiting-confirmation',
        selectedPosition: Position,
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
          selectedPosition: undefined,
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
        selectedPosition: selectedPositon? selectedPositon : undefined,
        action: action? action : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleCancel = async () => {
    setAction(null);
  }


  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        {/* DLMM Position Selection */}
        {!overlay && !selectedPositon && allPositions && (
          <>
            <CardHeader>
              <CardTitle>Your Positions</CardTitle>
              <CardDescription>Select the position you wanna know more about!</CardDescription>
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
                          Position Address: {position.position.publicKey.toString().slice(0, 8)}...
                          {position.position.publicKey.toString().slice(-8)} • 
                          Pool Address: {position.poolAddress.slice(0, 8)}...
                          {position.poolAddress.toString().slice(-8)}
                        </div>
                      </div>
                    </div>
                )))}
            </CardContent>
          </>
        )}

        {/* Amount Input and Pool Details */}
        {!overlay && selectedPositon &&(
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
                <CardTitle>{selectedPositon.poolName}</CardTitle>
                <CardDescription>Pool Information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Swap Fee</Label>
                      {tokenX && <div className="font-medium">
                        TokenX Fee: {parseInt(selectedPositon.position.positionData.feeX.toString(), 16)/ 10 ** tokenX.decimals}
                      </div> }
                      {tokenY && <div className="font-medium">
                        TokenY Fee: {parseInt(selectedPositon.position.positionData.feeY.toString(), 16)/ 10 ** tokenY.decimals}
                      </div>
                      }
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Rewards</Label>
                    <div className="font-medium">
                      Reward One: {parseInt(selectedPositon.position.positionData.rewardOne.toString(), 16)}
                    </div>
                    <div className="font-medium">
                      Reward Two: {parseInt(selectedPositon.position.positionData.rewardTwo.toString(), 16)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Total claimed Fee</Label>
                    {tokenX && 
                      <div className="font-medium">
                        Total Claim Fee X: {parseInt(selectedPositon.position.positionData.totalClaimedFeeXAmount.toString(), 16)/ 10 ** tokenX.decimals}
                      </div>
                    }
                    {tokenY && 
                    <div className="font-medium">
                      Total Claim Fee Y: {parseInt(selectedPositon.position.positionData.totalClaimedFeeYAmount.toString(), 16)/ 10 ** tokenY.decimals}
                    </div>
                    }
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">Manage Position</Label>
                  <div className="space-y-1">
                    <div className="font-medium">
                      Pool Address: {selectedPositon.poolAddress}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div>
                      <Button onClick={() => setAction('claimSwapFee')} variant="default" disabled={action != null}>
                        Claim Swap Fee
                      </Button>
                    </div>
                    <div>
                      <Button onClick={() => setAction('claimLMReward')} variant="default" disabled={action != null}>
                        Claim Rewards
                      </Button>
                    </div>
                    <div>
                      <Button onClick={() => setAction('close')} variant="default" disabled={action != null}>
                        Close Position
                      </Button>
                    </div>
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
                    {data.result?.step === 'canceled' ?( 
                      <h3 className="text-lg font-medium">
                      Failed to {action === 'close' ? 'close the position' : (action === 'claimLMReward' ? 'claim your rewards' : 'claim your swap fee')}
                      </h3>
                    ):(
                      <h3 className="text-lg font-medium">
                        Processing Your request...
                      </h3>
                    )}
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <span className="font-medium">
                        Position Address: {selectedPositon?.position.publicKey.toString().slice(0, 8)}...{selectedPositon?.position.publicKey.toString().slice(-8)}                    
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
                    <h3 className="text-lg font-medium">Changes Made Successfully!</h3>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <span className="font-medium">
                      <span className="font-medium">
                        Successfully {action === 'close' ? 'closed the position' : (action === 'claimLMReward' ? 'claimed your rewards' : 'claimed your swap fee')}
                      </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        Position Address: {selectedPositon?.position.publicKey.toString().slice(0, 8)}...{selectedPositon?.position.publicKey.toString().slice(-8)}                    
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
            {selectedPositon && action &&(
              <Button onClick={handleConfirmation} variant="default">
                Confirm Changes
              </Button>
            )}
            <Button onClick={handleCancel} variant="default">
              Cancel
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Ready to {action === 'close' ? 'close your position?' : (action === 'claimLMReward' ? 'claim your rewards?' : 'claim your swap fee?')}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
