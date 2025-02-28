'use client';

import { useState } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface SpotPosition {
  availableBalance: number;
  symbol: string;
  openAsks: number;
  openBids: number;
  openOrders: number;
  type: string;
}

interface AccountInfo {
  name: string;
  accountAddress: string;
  authority: string;
  overallBalance: number;
  settledPerpPnl: string;
  lastActiveSlot: number;
  perpPositions: any[];
  spotPositions: SpotPosition[];
}

interface DriftAccountInfoProps {
  data: {
    success: boolean;
    result: AccountInfo;
  };
  addToolResult: (result: AccountInfo) => void;
}

export default function DriftAccountInfo({
  data: { success, result },
  addToolResult: _addToolResult,
}: DriftAccountInfoProps) {
  const [showSpotPositions, setShowSpotPositions] = useState(true);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showPerpPositions, setShowPerpPositions] = useState(true);

  if (!success || !result) {
    return (
      <Card className="bg-destructive/10 p-6">
        <h2 className="mb-2 text-xl font-semibold text-destructive">
          Drift Account Retrieval Failed
        </h2>
        <pre className="text-sm text-destructive/80">
          {JSON.stringify(result, null, 2)}
        </pre>
      </Card>
    );
  }

  const {
    name = '',
    accountAddress = '',
    authority = '',
    overallBalance = 0,
    settledPerpPnl = '',
    lastActiveSlot = 0,
  } = result;

  const spotPositions = [
      {
        availableBalance: -0.003001,
        symbol: 'USDC',
        openAsks: 0,
        openBids: 0,
        openOrders: 0,
        type: 'borrow',
      },
      {
        availableBalance: 0.002244117,
        symbol: 'SOL',
        openAsks: 0,
        openBids: 0,
        openOrders: 0,
        type: 'deposit',
      },
    ],
    perpPositions = [
      {
        market: 'SOL-PERP',
        baseAssetAmount: -0.01,
        quoteAssetAmount: 1.436839,
        quoteEntryAmount: 1.4402,
        quoteBreakEvenAmount: 1.439839,
        settledPnl: 0,
        openAsks: 0,
        openBids: 0,
        openOrders: 0,
        positionType: 'short',
      },
    ];

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
                        className={`font-mono ${position?.availableBalance < 0 ? 'text-red-400' : 'text-green-400'}`}
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

        {spotPositions.length > 0 && perpPositions.length > 0 && (
          <Separator className="my-2" />
        )}

        {perpPositions.length > 0 && (
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
            {showPerpPositions && (
              <div className="grid gap-3">
                {perpPositions.map((position, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="mb-2 flex items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{position.market}</span>
                        <Badge
                          variant={
                            position.positionType === 'short'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {position.positionType.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-4 items-center gap-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">P&L</span>
                          <span
                            className={`font-mono ${position.baseAssetAmount < 0 ? 'text-red-400' : 'text-green-400'}`}
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
                            {position.settledPnl}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Orders</span>
                          <span className="font-mono">
                            {position.openOrders}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Bids</span>
                          <span className="font-mono text-green-400">
                            {position.openBids}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Asks</span>
                          <span className="font-mono text-red-400">
                            {position.openAsks}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
