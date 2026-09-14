import Link from 'next/link';

import { jourCourt, requetePeriode, type ParametresPeriode } from '@/features/performance/utils/periode.utils';

/**
 * Les semaines d'une période, sur la fiche individuelle.
 *
 * <h3>Pourquoi la fiche ne s'additionne pas sur un mois</h3>
 * <p>Les indicateurs de la fiche viennent de la GRILLE DE PAIE, et une grille de paie couvre
 * un créneau, c'est-à-dire une semaine. Les additionner sur un mois produirait trois valeurs
 * fausses par construction : un taux moyen qui n'a été appliqué à aucune semaine, une
 * éligibilité à la prime qui ne vaudrait pour aucune, et un « net à payer » qui ne
 * correspondrait à aucun virement réel — or c'est précisément ce document qui justifie un
 * virement.</p>
 *
 * <p>La période filtre donc les semaines PROPOSÉES, et la fiche en montre une. C'est moins
 * ambitieux que ce que le cahier des charges laisse entendre au §2.3, et c'est dit à
 * l'écran plutôt que masqué derrière un total plausible.</p>
 */
export function SemainesDeLaPeriode({
  actif,
  chemin,
  libellePeriode,
  lundis,
  parametres,
}: {
  actif: string;
  /** Le chemin de la fiche, sans requête. */
  chemin: string;
  libellePeriode: string;
  lundis: string[];
  parametres: ParametresPeriode;
}) {
  if (lundis.length <= 1) return null;

  return (
    <section
      aria-label="Semaines de la période"
      className="rounded-lg bg-surface-secondary px-4 py-3"
    >
      <p className="text-xs text-muted">
        {libellePeriode} compte {lundis.length} semaines. Une fiche de paie en couvre une
        seule&nbsp;: choisissez laquelle. Les totaux de la période figurent sur la liste, d&apos;où
        vous venez.
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {lundis.map((lundi) => {
          const courant = lundi === actif;
          return (
            <Link
              aria-current={courant ? 'true' : undefined}
              className={
                courant
                  ? 'rounded-medium bg-foreground px-2.5 py-1 text-xs font-medium text-background'
                  : 'rounded-medium border border-default-200 px-2.5 py-1 text-xs font-medium text-foreground hover:border-default-400'
              }
              href={`${chemin}${requetePeriode(parametres, { semaine: lundi })}`}
              key={lundi}
            >
              {jourCourt(lundi)}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
