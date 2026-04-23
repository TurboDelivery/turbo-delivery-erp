import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import React, { useState } from 'react';

interface PostesSelectFilterProps {
  selectedPostes: string[];
  onPostesChange: (postes: string[] | null) => void;
  postes: string[];
}

export function PostesSelectFilter({ selectedPostes, onPostesChange, postes }: PostesSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (posteValue: string) => {
    const isSelected = selectedPostes.includes(posteValue);
    onPostesChange(isSelected ? null : [posteValue]);
    setOpen(false);
  };

  const handleClearAll = () => {
    onPostesChange(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-[200px] justify-between"
        >
          {selectedPostes.length > 0 ? selectedPostes[0] : 'Tous les postes'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un poste..." />
          <CommandEmpty>Aucun poste trouvé.</CommandEmpty>
          <CommandGroup>
            {postes?.map((poste) => (
              <CommandItem
                key={poste}
                value={poste}
                onSelect={handleSelect}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedPostes.includes(poste) ? "opacity-100" : "opacity-0"
                  )}
                />
                {poste}
              </CommandItem>
            )) || []}
          </CommandGroup>
        </Command>
        {selectedPostes.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="w-full justify-start"
            >
              Effacer la sélection
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
