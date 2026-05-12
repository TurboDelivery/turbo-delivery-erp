import { Eye, RotateCcw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  isVisant: boolean;
  isRejetant: boolean;
  onVoirGrille: () => void;
  onRejeter: () => void;
  onViser: () => void;
}

export default function VisaDgaActionBar({ isVisant, isRejetant, onVoirGrille, onRejeter, onViser }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Button
        variant="default"
        className="bg-green-600 hover:bg-green-700 text-white gap-2"
        onClick={onVoirGrille}
      >
        <Eye className="h-4 w-4" />
        Voir grille complète
      </Button>

      <Button
        variant="outline"
        className="gap-2 text-gray-600"
        onClick={onRejeter}
        disabled={isRejetant}
      >
        <RotateCcw className="h-4 w-4" />
        Rejeter et renvoyer
      </Button>

      <Button
        variant="default"
        className="sm:ml-auto bg-red-600 hover:bg-red-700 text-white gap-2"
        onClick={onViser}
        disabled={isVisant}
      >
        <Send className="h-4 w-4" />
        Valider et transmettre au PDG
      </Button>
    </div>
  );
}
