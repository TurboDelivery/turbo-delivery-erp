import { CheckCircle2, Lock } from 'lucide-react';
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
  soumis?: boolean;
}

export default function GrillePaiementBanner({ grille, soumis = false }: Props) {
  return (
    <div
      className={[
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 rounded-xl px-5 sm:px-6 py-4 text-white',
        soumis ? 'bg-green-500' : 'bg-blue-600',
      ].join(' ')}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Lock className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1">
        <p
          className={[
            'text-xs font-semibold uppercase tracking-widest mb-0.5',
            soumis ? 'text-emerald-100' : 'text-blue-100',
          ].join(' ')}
        >
          Créneau verrouillé par le Pôle V&A
        </p>
        <p className="text-lg font-bold leading-tight">
          {grille.code} · {formatDate(grille.debut)} → {formatDate(grille.fin)}
        </p>
        {grille.visePar && grille.viseAt && (
          <p
            className={[
              'mt-1 text-sm',
              soumis ? 'text-emerald-100' : 'text-blue-100',
            ].join(' ')}
          >
            Visa V2 par {grille.visePar} le {formatDateTime(grille.viseAt)} — données figées, prêtes
            pour la grille de paiement.
          </p>
        )}
      </div>
      {soumis && (
        <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white shrink-0">
          <CheckCircle2 className="h-4 w-4" />
          Fichier envoyé
        </div>
      )}
    </div>
  );
}
