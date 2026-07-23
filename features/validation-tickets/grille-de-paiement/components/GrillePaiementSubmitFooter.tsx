import { AlertTriangle, CheckCircle2, ListChecks, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  canSoumettre: boolean;
  isSoumettant: boolean;
  waveManquants: number;
  lignesAValider: number;
  onSoumettre: () => void;
  /** Certification groupée de toutes les lignes du lot (évite N validations manuelles). */
  onToutValider?: () => void;
  isValidantTout?: boolean;
}

/** Construit la liste lisible des blocages (Wave manquants, lignes à valider). */
export function blocagesSoumission(waveManquants: number, lignesAValider: number): string[] {
  const b: string[] = [];
  if (waveManquants > 0) b.push(`${waveManquants} numéro${waveManquants > 1 ? 's' : ''} Wave manquant${waveManquants > 1 ? 's' : ''}`);
  if (lignesAValider > 0) b.push(`${lignesAValider} ligne${lignesAValider > 1 ? 's' : ''} à valider`);
  return b;
}

export default function GrillePaiementSubmitFooter({
  canSoumettre,
  isSoumettant,
  waveManquants,
  lignesAValider,
  onSoumettre,
  onToutValider,
  isValidantTout = false,
}: Props) {
  const blocages = blocagesSoumission(waveManquants, lignesAValider);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-sm ring-1 ring-gray-200 rounded-xl bg-white px-5 py-4">
      <div className="text-sm">
        {blocages.length > 0 ? (
          <span className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Soumission bloquée : {blocages.join(' · ')}.
          </span>
        ) : (
          <span className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Tout est prêt — vous pouvez soumettre au DGA.
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
        {/* Certification groupée : sans elle, le Comptable devait valider les
            livreurs un par un avant de pouvoir soumettre (lot vide sinon). */}
        {lignesAValider > 0 && onToutValider && (
          <Button
            onClick={onToutValider}
            disabled={isValidantTout || isSoumettant}
            variant="outline"
            className="flex items-center gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
          >
            <ListChecks className="h-4 w-4" />
            {isValidantTout ? 'Validation…' : `Tout valider (${lignesAValider})`}
          </Button>
        )}
        <Button
          onClick={onSoumettre}
          disabled={!canSoumettre || isSoumettant}
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          {isSoumettant ? 'Envoi…' : 'Soumettre au DGA'}
        </Button>
      </div>
    </div>
  );
}
