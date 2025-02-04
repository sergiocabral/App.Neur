'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

import type { CreateDriftDataResult } from '@/types/stream';

interface DriftStatusProps {
  result: CreateDriftDataResult;
  amount: string;
}

export function DriftStatus({ result, amount }: DriftStatusProps) {
  const isProcessing = result.step === 'processing';
  const isFailed = result.step === 'failed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-8"
    >
      <div className="flex flex-col items-center space-y-4 text-center">
        {isProcessing ? (
          <ProcessingAnimation />
        ) : isFailed ? (
          <FailedAnimation />
        ) : (
          <CompletedAnimation />
        )}

        <div className="space-y-1">
          <h3 className="text-lg font-medium">
            {isProcessing
              ? 'Processing Drift'
              : isFailed
                ? 'Drift Failed'
                : 'Drift Complete'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {amount} {result.symbol}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ProcessingAnimation() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <motion.div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'linear',
          }}
        />
      </div>
    </div>
  );
}

function CompletedAnimation() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
      className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
    >
      <Check className="h-8 w-8 text-primary" />
    </motion.div>
  );
}

function FailedAnimation() {
  return (
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
      <X className="h-8 w-8 text-destructive" />
    </motion.div>
  );
}
