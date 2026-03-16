import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import React, { useState } from 'react';

interface StatutsSelectFilterProps {
  selectedStatuts: string[];
  onStatutsChange: (statuts: string[] | null) => void;
}

const statutsOptions = [
  { value: 'Actif', label: 'Actif' },
  { value: 'Inactif', label: 'Inactif' },
  { value: 'Congé', label: 'Congé' },
];

export function StatutsSelectFilter({ selectedStatuts, onStatutsChange }: StatutsSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (statutValue: string) => {
    const isSelected = selectedStatuts.includes(statutValue);
    const newSelection = isSelected 
      ? selectedStatuts.filter(s => s !== statutValue)
      : [...selectedStatuts, statutValue];
    
    onStatutsChange(newSelection.length > 0 ? newSelection : null);
  };

  const handleClearAll = () => {
    onStatutsChange(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-[150px] justify-between"
        >
          {selectedStatuts.length > 0 ? `${selectedStatuts.length} statut(s)` : 'Tous les statuts'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un statut..." />
          <CommandEmpty>Aucun statut trouvé.</CommandEmpty>
          <CommandGroup>
            {statutsOptions.map((statut) => (
              <CommandItem
                key={statut.value}
                value={statut.value}
                onSelect={handleSelect}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedStatuts.includes(statut.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {statut.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
        {selectedStatuts.length > 0 && (
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
