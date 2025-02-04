'use client';

import { useEffect, useState } from 'react';

import { AnimatePresence } from 'framer-motion';
import { ExternalLink, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { CreateDriftDataResult } from '@/types/stream';

import { DriftStatus } from './drift-status';

interface DriftFormProps {
  data: {
    success: boolean;
    result: CreateDriftDataResult;
  };
  onDrift: (result: CreateDriftDataResult) => void;
}

const DRIFT_BUTTON_TEXT = {
  updating: 'Updating...',
  'awaiting-confirmation': 'Confirm',
  confirmed: 'Confirmed',
  processing: 'Processing...',
  completed: 'Drift Complete',
  canceled: 'Canceled',
  failed: 'Drift Failed',
} as const;

export function DriftForm({ data, onDrift }: DriftFormProps) {
  const { result } = data;
  const step = result?.step ?? 'updating';

  const [amount, setAmount] = useState(result?.amount?.toString() ?? '');
  const [selectedSymbol, setSelectedSymbol] = useState(result?.symbol ?? '');
  const [hasChanges, setHasChanges] = useState(false);

  const onConfirm = async () => {
    if (hasChanges) {
      // Save changes
      onDrift({
        ...result,
        amount: Number.parseFloat(amount) || 0,
        symbol: selectedSymbol,
      });
      setHasChanges(false);
    } else {
      // Confirm drift
      onDrift({
        ...result,
        step: 'confirmed',
      });
    }
  };

  useEffect(() => {
    if (result?.amount) {
      setAmount(result.amount.toString());
      setSelectedSymbol(result?.symbol ?? '');
      setHasChanges(false);
    }
  }, [result?.amount, result?.symbol]);

  const driftButtonText = DRIFT_BUTTON_TEXT[step] ?? 'Select Symbol';

  const status = {
    isProcessing: step === 'processing',
    isCompleted: step === 'completed',
    isCanceled: step === 'canceled',
    isFailed: step === 'failed',
    showInputs: !['processing', 'completed', 'canceled', 'failed'].includes(
      step,
    ),
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setHasChanges(true);
  };

  const handleSymbolChange = (value: string) => {
    setSelectedSymbol(value);
    setHasChanges(true);
  };

  const onCancel = () => {
    if (hasChanges) {
      // Cancel changes
      setAmount(result?.amount?.toString() ?? '');
      setSelectedSymbol(result?.symbol ?? '');
      setHasChanges(false);
    } else {
      // Cancel drift
      onDrift({
        ...result,
        step: 'canceled',
      });
    }
  };

  if (status.isCanceled || status.isFailed) {
    return (
      <div className="flex flex-col gap-4">
        <div className="py-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <X className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-medium">
                Drift {status.isCanceled ? 'Canceled' : 'Failed'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {amount} {selectedSymbol}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        {status.showInputs ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Symbol</label>
              <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select symbol" />
                </SelectTrigger>
                <SelectContent>
                  {result?.availableSymbols?.length &&
                  result?.availableSymbols?.length > 0 ? (
                    result.availableSymbols.map((symbol) => (
                      <SelectItem key={symbol.mint} value={symbol.symbol}>
                        {symbol.symbol}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      No symbols available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Amount</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <DriftStatus result={result!} amount={amount} />
        )}
      </AnimatePresence>

      {selectedSymbol && (
        <>
          <Separator />
          <DriftDetails
            result={result}
            isCompleted={status.isCompleted}
            driftButtonText={driftButtonText}
            hasChanges={hasChanges}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        </>
      )}
    </div>
  );
}

function DriftDetails({
  result,
  isCompleted,
  driftButtonText,
  hasChanges,
  onConfirm,
  onCancel,
}: {
  result: CreateDriftDataResult;
  isCompleted: boolean;
  driftButtonText: string;
  hasChanges: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      {isCompleted && result.signature && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between pt-2">
            <span className="text-muted-foreground">Transaction</span>
            <a
              href={`https://solscan.io/tx/${result.signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline"
            >
              <span className="font-mono">
                {result.signature.slice(0, 8)}...
                {result.signature.slice(-8)}
              </span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
      {isCompleted && result.account && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-muted-foreground">Account</span>
          <span className="font-mono text-sm">
            {result.account.slice(0, 8)}...{result.account.slice(-8)}
          </span>
        </div>
      )}
      {!isCompleted && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            size="lg"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            size="lg"
            onClick={onConfirm}
            disabled={result.step !== 'awaiting-confirmation' && !hasChanges}
          >
            {hasChanges ? 'Save Changes' : driftButtonText}
          </Button>
        </div>
      )}
    </>
  );
}
