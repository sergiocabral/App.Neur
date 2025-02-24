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
  data: {
    success,
    result,
  },
  addToolResult : _addToolResult,
}: DriftAccountInfoProps ) {
  
  const [showSpotPositions, setShowSpotPositions] = useState(true);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  
  if(!success) {
    return (
      <Card className="bg-destructive/10 p-6">
        <h2 className="mb-2 text-xl font-semibold text-destructive">
          Drift Account Retrieval Failed
        </h2>
        <pre className="text-sm text-destructive/80">
          {JSON.stringify(result, null, 2)}
        </pre>
      </Card>
    )
  }
  
  const {name, accountAddress, authority, overallBalance, settledPerpPnl, lastActiveSlot, perpPositions, spotPositions} = result;

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
            className="flex cursor-pointer items-center justify-between py-1 text-sm hover:text-foreground/80"
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
            <div className="grid gap-3 pl-2">
              {spotPositions.map((position, index) => (
                <div key={index} className="grid gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{position.symbol}</span>
                    <Badge variant="secondary" className="text-xs">
                      {position.type}
                    </Badge>
                  </div>
                  <div className="grid gap-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-mono">
                        {position.availableBalance.toFixed(8)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Open Orders</span>
                      <span className="font-mono">{position.openOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Open Bids</span>
                      <span className="font-mono">{position.openBids}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Open Asks</span>
                      <span className="font-mono">{position.openAsks}</span>
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

        {perpPositions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <span className="text-sm font-medium">Perp Positions</span>
              {/* Add perp positions */}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
