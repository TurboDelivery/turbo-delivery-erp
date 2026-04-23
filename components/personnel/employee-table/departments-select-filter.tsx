import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import React, { useState } from 'react';

interface DepartmentsSelectFilterProps {
  selectedDepartments: string[];
  onDepartmentsChange: (departments: string[] | null) => void;
  departments: Array<{ name: string; id: string }>;
}

export function DepartmentsSelectFilter({ selectedDepartments, onDepartmentsChange, departments }: DepartmentsSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (departmentName: string) => {
    const isSelected = selectedDepartments.includes(departmentName);
    onDepartmentsChange(isSelected ? null : [departmentName]);
    setOpen(false);
  };

  const handleClearAll = () => {
    onDepartmentsChange(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-[200px] justify-between"
        >
          {selectedDepartments.length > 0 ? selectedDepartments[0] : 'Tous les départements'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un département..." />
          <CommandEmpty>Aucun département trouvé.</CommandEmpty>
          <CommandGroup>
            {departments?.map((department) => (
              <CommandItem
                key={department.id}
                value={department.name}
                onSelect={handleSelect}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedDepartments.includes(department.name) ? "opacity-100" : "opacity-0"
                  )}
                />
                {department.name}
              </CommandItem>
            )) || []}
          </CommandGroup>
        </Command>
        {selectedDepartments.length > 0 && (
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
