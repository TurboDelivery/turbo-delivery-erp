import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DeductionAddBarProps {
  onAddAbsence?: () => void;
  onAddAdvance?: () => void;
  onAddLoan?: () => void;
}

function DeductionAddBar({ onAddAbsence, onAddAdvance, onAddLoan }: DeductionAddBarProps) {
  const handleAddAbsence = onAddAbsence ?? (() => {});
  const handleAddAdvance = onAddAdvance ?? (() => {});
  const handleAddLoan = onAddLoan ?? (() => {});

  return (
    <div className="flex items-center gap-4">
      <AddButton label="Absence" onClick={handleAddAbsence} />
      <AddButton label="Avance sur salaire" onClick={handleAddAdvance} />
      <AddButton label="Enregistrer un pret" onClick={handleAddLoan} />
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <Button onClick={onClick} variant="outline" size="sm">
      <Plus />
      <span>{label}</span>
    </Button>
  );
}

export default DeductionAddBar;