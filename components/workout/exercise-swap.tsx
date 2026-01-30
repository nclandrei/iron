'use client';

import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { getSwapSuggestions, type ExerciseAlternative } from '@/lib/config/exercise-swaps';
import type { Exercise } from '@/lib/types';

interface ExerciseSwapProps {
  exercise: Exercise;
  onSwap: (alternative: ExerciseAlternative, permanent: boolean) => void;
  disabled?: boolean;
}

type SwapStep = 'select' | 'confirm';

export function ExerciseSwap({ exercise, onSwap, disabled }: ExerciseSwapProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<SwapStep>('select');
  const [selectedAlternative, setSelectedAlternative] = useState<ExerciseAlternative | null>(null);

  const suggestions = getSwapSuggestions(exercise.name);

  function handleSelectAlternative(alt: ExerciseAlternative) {
    setSelectedAlternative(alt);
    setStep('confirm');
  }

  function handleConfirm(permanent: boolean) {
    if (selectedAlternative) {
      onSwap(selectedAlternative, permanent);
      handleClose();
    }
  }

  function handleClose() {
    setIsOpen(false);
    setStep('select');
    setSelectedAlternative(null);
  }

  function handleBack() {
    setStep('select');
    setSelectedAlternative(null);
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="h-8 px-2 text-muted-foreground"
      >
        <ArrowLeftRight className="h-4 w-4" />
        <span className="ml-1">Swap</span>
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[70vh] pb-24">
          {step === 'select' ? (
            <>
              <SheetHeader>
                <SheetTitle>Swap Exercise</SheetTitle>
                <SheetDescription>
                  Replace {exercise.name} with:
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-2 p-4 pt-2 overflow-y-auto">
                {suggestions.map((alt) => (
                  <Button
                    key={alt.name}
                    variant="outline"
                    className="h-14 justify-start text-left"
                    onClick={() => handleSelectAlternative(alt)}
                  >
                    <div>
                      <div className="font-medium">{alt.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Default: {alt.defaultWeight}kg
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>Save Changes?</SheetTitle>
                <SheetDescription>
                  Swap to {selectedAlternative?.name}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-3 p-4 pt-2">
                <Button
                  size="lg"
                  className="h-14"
                  onClick={() => handleConfirm(false)}
                >
                  Just for today
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-14"
                  onClick={() => handleConfirm(true)}
                >
                  Update workout permanently
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={handleBack}
                >
                  Back
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
