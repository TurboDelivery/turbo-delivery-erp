/*
 * Bandeau d'identite du creneau paye, rendu avec HeroUI V3.
 *
 * <p>Le bandeau etait une `div` peinte a la main (`rounded-xl px-5 py-4 bg-blue-600`) : la
 * surface, le rayon et l'espacement etaient a reporter ici a chaque reglage du theme.
 * `Card` les porte deja.</p>
 *
 * <p>La pastille de l'icone melangeait un jeton de theme et une couleur fixe
 * (`bg-surface/20` pose sur `bg-blue-600`). En clair, `--surface` vaut blanc : le rond se
 * lisait comme un halo autour du cadenas. En sombre, `--surface` est presque noir : le
 * meme rond devenait un trou sombre sur le bleu, et le cadenas ne se detachait plus. Le
 * bandeau ne suivait donc pas la bascule clair/sombre de l'en-tete.</p>
 *
 * <p>Le bleu sature pleine largeur criait plus fort que le reste de l'ecran alors qu'il
 * n'appelle aucune action, et il ne correspond a aucune teinte de l'echelle (l'accent de
 * l'ERP est rouge). Juste en dessous, l'alerte « pas encore transmise au DGA » est, elle,
 * une vraie action a mener : c'est elle qui doit ressortir. Le bandeau passe donc sur la
 * surface neutre et garde une seule couleur porteuse de sens, le vert du visa V2, qui
 * reste double par le libelle ecrit en toutes lettres.</p>
 */
import { Card } from '@heroui-v3/react';
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
    <Card>
      <Card.Content className="gap-4 sm:flex-row sm:items-center">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-tertiary">
          <Lock aria-hidden="true" className="size-5 text-muted" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Créneau verrouillé par le Pôle V&A
          </p>
          <p className="mt-0.5 text-lg font-bold leading-tight text-foreground">
            {/* Le libellé du créneau contient déjà les dates : on n'affiche que
                « Semaine N » suivi des dates en toutes lettres — fini le doublon
                « 20 au 26 Juil.. 2026 · 20 juillet 2026 → 26 juillet 2026 ». */}
            {grille.code.split('—')[0]?.trim() || grille.code} · {formatDate(grille.debut)} →{' '}
            {formatDate(grille.fin)}
          </p>
          {grille.visePar && grille.viseAt && (
            <p className="mt-1 text-sm text-muted">
              <span className="font-semibold text-success-soft-foreground">Visa V2</span> par{' '}
              {grille.visePar} le {formatDateTime(grille.viseAt)} — données figées, prêtes pour la
              grille de paiement.
            </p>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
