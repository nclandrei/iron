'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getExercisesByMuscleGroup, type ExerciseDefinition } from '@/lib/config/exercise-library';

interface ExerciseComboboxProps {
  value: string;
  onValueChange: (value: string, exercise?: ExerciseDefinition) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ExerciseCombobox({ value, onValueChange, placeholder = 'Select exercise...', disabled = false }: ExerciseComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const exercisesByGroup = React.useMemo(() => getExercisesByMuscleGroup(), []);
  const muscleGroups = Object.keys(exercisesByGroup);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search exercises..." />
          <CommandList>
            <CommandEmpty>No exercise found.</CommandEmpty>
            {muscleGroups.map((group) => (
              <CommandGroup key={group} heading={group}>
                {exercisesByGroup[group].map((exercise) => (
                  <CommandItem
                    key={exercise.name}
                    value={exercise.name}
                    onSelect={() => {
                      onValueChange(exercise.name, exercise);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === exercise.name ? 'opacity-100' : 'opacity-0')} />
                    {exercise.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
