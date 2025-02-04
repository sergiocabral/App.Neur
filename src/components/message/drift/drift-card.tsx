import { Card, CardContent } from '@/components/ui/card';
import type { CreateDriftDataResult } from '@/types/stream';

import { DriftForm } from './drift-form';

interface DriftCardProps {
  data: {
    success: boolean;
    result: CreateDriftDataResult;
  };
  addToolResult: (result: CreateDriftDataResult) => void;
}

export function DriftCard({ data, addToolResult }: DriftCardProps) {
  if (!data) return null;

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardContent className="p-4 sm:p-6">
        <DriftForm data={data} onDrift={addToolResult} />
      </CardContent>
    </Card>
  );
}
