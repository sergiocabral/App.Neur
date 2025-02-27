import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings } from 'lucide-react';

interface SlippageSelectorProps {
  defaultSlippage?: number;
  onChange?: (slippage: number) => void;
}

const SlippageSelector = ({ defaultSlippage = 0.5, onChange }: SlippageSelectorProps) => {
  const [slippage, setSlippage] = useState(defaultSlippage);
  const [customSlippage, setCustomSlippage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const presetValues = [0.1, 0.5, 1.0];

  const handlePresetClick = (value: number) => {
    setSlippage(value);
    setCustomSlippage("");
    if (onChange) onChange(value);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomSlippage(value);
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setSlippage(numValue);
      if (onChange) onChange(numValue);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="px-3 flex gap-1 h-8">
          <Settings className="h-4 w-4" />
          <span>Slippage: {slippage}%</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <div className="space-y-4">
          <div className="text-sm font-medium">Slippage Tolerance</div>
          <div className="flex gap-2">
            {presetValues.map((value) => (
              <Button
                key={value}
                variant={slippage === value && !customSlippage ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => handlePresetClick(value)}
              >
                {value}%
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Custom"
              value={customSlippage}
              onChange={handleCustomChange}
              className="w-full"
              step="0.1"
              min="0.1"
            />
            <span className="text-sm">%</span>
          </div>
          {parseFloat(slippage.toString()) > 5 && (
            <div className="text-xs text-red-500">
              High slippage values may result in unfavorable trades
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SlippageSelector;