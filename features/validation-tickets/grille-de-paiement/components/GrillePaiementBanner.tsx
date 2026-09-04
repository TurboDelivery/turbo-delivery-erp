import { Lock } from 'lucide-react';
import { IGrillePaiementCreneau } from '../types/grille-paiement.type';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

interface Props {
  grille: IGrillePaiementCreneau;
}

export default function GrillePaiementBanner({ grille }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 rounded-xl px-5 sm:px-6 py-4 text-white bg-blue-600">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface/20">
        <Lock className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5 text-blue-100">
          Créneau verrouillé par le Pôle V&A
        </p>
        <p className="text-lg font-bold leading-tight">
          {/* Le libellé du créneau contient déjà les dates : on n'affiche que
              « Semaine N » suivi des dates en toutes lettres — fini le doublon
              « 20 au 26 Juil.. 2026 · 20 juillet 2026 → 26 juillet 2026 ». */}
          {grille.code.split('—')[0]?.trim() || grille.code} · {formatDate(grille.debut)} →{' '}
          {formatDate(grille.fin)}
        </p>
        {grille.visePar && grille.viseAt && (
          <p className="mt-1 text-sm text-blue-100">
            Visa V2 par {grille.visePar} le {formatDateTime(grille.viseAt)} — données figées, prêtes
            pour la grille de paiement.
          </p>
        )}
      </div>
    </div>
  );
}
