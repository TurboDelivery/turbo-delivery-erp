import { AlertTriangle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  canSoumettre: boolean;
  isSoumettant: boolean;
  onSoumettre: () => void;
}

export default function GrillePaiementSubmitFooter({ canSoumettre, isSoumettant, onSoumettre }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-sm ring-1 ring-gray-200 rounded-xl bg-white px-5 py-4">
      <div className="flex items-center gap-2 text-sm text-amber-600">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Cochez chaque ligne après contrôle pour activer la soumission.</span>
      </div>
      <Button
        onClick={onSoumettre}
        disabled={!canSoumettre || isSoumettant}
        className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 self-end sm:self-auto"
      >
        <Send className="h-4 w-4" />
        Soumettre au DGA
      </Button>
    </div>
  );
}
