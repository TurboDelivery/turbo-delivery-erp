/*
 * Bandeau de tete de l'approbation finale, rendu avec HeroUI V3.
 *
 * <p>Le panneau etait une `div` habillee a la main (`rounded-xl border border-separator
 * bg-surface px-5 py-4`) : la surface, le rayon et l'espacement devaient etre reportes ici
 * a chaque reglage du theme. `Card` les porte deja.</p>
 *
 * <p>Les couleurs etaient ecrites en dur, sans variante sombre. `bg-red-50` sous l'icone
 * restait un carre presque blanc une fois le theme sombre actif, et le `text-green-700` de
 * la ligne de visa passait en vert fonce sur fond fonce : l'operateur ne lisait plus qui
 * avait vise le dossier, ni la mention des cinq niveaux de controle. Le vert fixe du
 * montant ne suivait pas davantage le theme. Les jetons `success` suivent la bascule.</p>
 *
 * <p>Le rouge de la pastille disait « danger » sur un paiement justement verifie, alors que
 * le rouge est aussi l'accent de marque de l'ERP : deux sens pour une seule teinte. La
 * pastille porte maintenant le vert de l'etat valide, qui est ce que l'icone raconte.</p>
 *
 * <p>Le montant passe en chasse tabulaire et recupere son unite FCFA a cote du nombre :
 * releguee a la ligne du dessous, elle laissait un chiffre a six ou sept positions sans
 * ordre de grandeur au moment ou l'on decide de declencher les virements.</p>
 */
import { Card } from '@heroui-v3/react';
import { ShieldCheck } from 'lucide-react';

import { formatDateHeure } from '../utils/approbation-finale.utils';

interface Props {
  visePar?: string;
  viseAt?: string;
  totalNet: number;
  totalLivreurs: number;
}

export default function ApprobationFinaleBanner({ visePar, viseAt, totalNet, totalLivreurs }: Props) {
  return (
    <Card>
      <Card.Content className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-soft">
            <ShieldCheck aria-hidden="true" className="h-5 w-5 text-success-soft-foreground" />
          </div>
          <div>
            {visePar && viseAt && (
              <p className="text-sm font-semibold text-success-soft-foreground">
                Visé par {visePar} le {formatDateHeure(viseAt)}
              </p>
            )}
            <p className="mt-1 text-sm text-foreground">
              Ce paiement a été vérifié et validé par{' '}
              <span className="font-semibold text-success-soft-foreground">
                5 niveaux de contrôle
              </span>
              .
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Saisie · V1 · V2 (Verrouillage) · Comptabilité · DGA.
            </p>
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
            Montant total à virer (Indépendants)
          </p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
            {totalNet.toLocaleString('fr-FR')}{' '}
            <span className="text-base font-semibold text-muted sm:text-lg">FCFA</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">{totalLivreurs} Turboys via Wave</p>
        </div>
      </Card.Content>
    </Card>
  );
}
