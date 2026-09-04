import { CheckCircle2, Lock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  isApprouvant: boolean;
  isRejetant: boolean;
  onRejeter: () => void;
  onApprouver: () => void;
}

export default function ApprobationFinaleActionBar({ isApprouvant, isRejetant, onRejeter, onApprouver }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 rounded-xl border border-separator bg-surface px-5 py-4">
      <Lock className="h-4 w-4 text-green-500 shrink-0 hidden sm:block" />
      <p className="text-sm text-muted flex-1">
        Confirmation à double validation requise — déclenche immédiatement les virements Wave.
      </p>
      <div className="flex flex-wrap gap-3 shrink-0">
        <Button variant="outline" className="gap-2" onClick={onRejeter} disabled={isRejetant}>
          <XCircle className="h-4 w-4" />
          Rejeter
        </Button>
        <Button
          className="bg-green-600 hover:bg-green-700 text-white gap-2"
          onClick={onApprouver}
          disabled={isApprouvant}
        >
          <CheckCircle2 className="h-4 w-4" />
          Approuver et déclencher Wave
        </Button>
      </div>
    </div>
  );
}
