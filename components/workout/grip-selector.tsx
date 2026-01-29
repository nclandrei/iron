'use client';

import { useState } from 'react';
import { Grip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { getGripConfig, gripDisplayNames, type GripType } from '@/lib/config/exercise-grips';

interface GripSelectorProps {
  exerciseName: string;
  currentGrip: GripType;
  onGripChange: (grip: GripType) => void;
  disabled?: boolean;
}

export function GripSelector({ exerciseName, currentGrip, onGripChange, disabled }: GripSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const gripConfig = getGripConfig(exerciseName);

  if (!gripConfig) {
    return null;
  }

  function handleSelectGrip(grip: GripType) {
    onGripChange(grip);
    setIsOpen(false);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="h-7 px-2 text-xs gap-1"
      >
        <Grip className="h-3 w-3" />
        <span>{gripDisplayNames[currentGrip]}</span>
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[50vh]">
          <SheetHeader>
            <SheetTitle>Select Grip</SheetTitle>
            <SheetDescription>
              Choose grip for {exerciseName}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-2 p-4 pt-2">
            {gripConfig.options.map((grip) => (
              <Button
                key={grip}
                variant={grip === currentGrip ? 'default' : 'outline'}
                className="h-12 justify-start text-left"
                onClick={() => handleSelectGrip(grip)}
              >
                <div className="font-medium">{gripDisplayNames[grip]}</div>
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
