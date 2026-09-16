import type { IRentabilite } from '@/features/rentabilite/types/rentabilite.types';

import type { SectionEtat } from '@/features/finance-dashboard/components/etat/etat-financier';

/**
 * Ce que l'écran de rentabilité calcule en plus de ce que le service rend.
 *
 * <p>Tout est dérivé de la réponse, rien n'est extrapolé. La distinction compte : une
 * projection est une hypothèse, et le projet a déjà retiré une barre de progression qui
 * simulait une mesure qu'elle n'avait pas. Ici, le mois précédent est une SECONDE LECTURE
 * du même service à une autre date d'arrêté, donc une mesure elle aussi.</p>
 */

/**
 * Le même jour, le mois d'avant.
 *
 * <p>C'est la seule comparaison honnête sur un cumul : comparer le 15 septembre au
 * 31 août opposerait quinze jours à trente et un. Le jour est ramené au dernier jour du
 * mois quand il n'existe pas : il n'y a pas de 31 avril, et le 31 mars se compare au
 * 28 ou 29 février.</p>
 */
export function memeJourMoisPrecedent(iso: string): string {
  const [a, m, j] = (iso ?? '').split('-').map(Number);
  if (!a || !m || !j) return '';

  const anneeCible = m === 1 ? a - 1 : a;
  const moisCible = m === 1 ? 12 : m - 1;
  const dernierJour = new Date(Date.UTC(anneeCible, moisCible, 0)).getUTCDate();
  const jourCible = Math.min(j, dernierJour);

  return `${anneeCible}-${String(moisCible).padStart(2, '0')}-${String(jourCible).padStart(2, '0')}`;
}

/** Le taux de marge, en pourcentage du chiffre d'affaires. `null` si le CA est nul. */
export function tauxMarge(d: Pick<IRentabilite, 'caCumule' | 'profit'>): number | null {
  if (!d.caCumule) return null;
  return (d.profit / d.caCumule) * 100;
}

/**
 * Le résultat rapporté à un jour écoulé.
 *
 * <p>C'est l'unité dans laquelle on agit sur les jours qui restent, et elle se compare
 * d'un mois à l'autre même quand les deux mois n'ont pas le même nombre de jours.</p>
 */
export function resultatParJour(d: Pick<IRentabilite, 'joursEcoules' | 'profit'>): number | null {
  if (!d.joursEcoules) return null;
  return d.profit / d.joursEcoules;
}

/**
 * Ce qui reste à encaisser sur le chiffre d'affaires déjà réalisé.
 *
 * <p>Le service rend le CA et l'encaissé ; l'écart entre les deux est de l'argent facturé
 * et non rentré. Ce n'est pas une ligne du compte de résultat, c'est une question de
 * trésorerie, d'où sa section à part.</p>
 */
export function resteAEncaisser(d: Pick<IRentabilite, 'caCumule' | 'revenuEncaisse'>): number {
  return d.caCumule - (d.revenuEncaisse ?? 0);
}

/**
 * Le compte de résultat, en deux colonnes : la date d'arrêté et le même jour du mois d'avant.
 *
 * <p>La forme vient de `EtatFinancier`, déjà en place sur le tableau de bord Finance, avec
 * son raisonnement : un compte de résultat se lit en colonnes alignées, pas en tuiles, et
 * le lecteur doit pouvoir additionner ce qu'il voit et retomber sur le total.</p>
 *
 * <p>La colonne de référence est `cumul` : ce n'est pas un cumul ici, mais la structure
 * n'expose que deux colonnes et leurs intitulés sont libres. On ne généralise pas le
 * composant à N colonnes pour deux écrans.</p>
 *
 * <h3>La ligne « Non ventilé »</h3>
 * <p>Elle n'apparaît que si les deux seaux de commission ne font pas le total. Un
 * établissement sans type de commission n'entre dans aucun des deux, et sans cette ligne
 * l'écart serait invisible : trois nombres qui ne s'additionnent pas, et rien pour le dire.</p>
 */
export function construireCompteDeResultat(
  actuel: IRentabilite,
  precedent: IRentabilite | null,
): SectionEtat[] {
  const cel = (v: number | null) => ({ valeur: v });
  const ref = (lire: (d: IRentabilite) => number) => (precedent ? cel(lire(precedent)) : cel(null));

  const nonVentileActuel =
    actuel.commission - (actuel.commissionFixe ?? 0) - (actuel.commissionPourcentage ?? 0);
  const nonVentilePrecedent = precedent
    ? precedent.commission - (precedent.commissionFixe ?? 0) - (precedent.commissionPourcentage ?? 0)
    : 0;
  const montrerNonVentile =
    Math.round(nonVentileActuel) !== 0 || Math.round(nonVentilePrecedent) !== 0;

  const sections: SectionEtat[] = [
    {
      titre: "Chiffre d'affaires",
      lignes: [
        {
          cle: 'frais',
          libelle: 'Frais de livraison',
          niveau: 1,
          periode: cel(actuel.fraisLivraison),
          cumul: ref((d) => d.fraisLivraison),
        },
        {
          cle: 'commission',
          libelle: 'Commission',
          niveau: 1,
          periode: cel(actuel.commission),
          cumul: ref((d) => d.commission),
        },
        {
          cle: 'commission-fixe',
          libelle: 'dont part fixe',
          niveau: 2,
          periode: cel(actuel.commissionFixe),
          cumul: ref((d) => d.commissionFixe),
        },
        {
          cle: 'commission-pct',
          libelle: 'dont part au pourcentage',
          niveau: 2,
          periode: cel(actuel.commissionPourcentage),
          cumul: ref((d) => d.commissionPourcentage),
        },
        ...(montrerNonVentile
          ? [
              {
                cle: 'commission-non-ventilee',
                libelle: 'dont non ventilé',
                niveau: 2 as const,
                periode: cel(nonVentileActuel),
                cumul: precedent ? cel(nonVentilePrecedent) : cel(null),
              },
            ]
          : []),
        {
          cle: 'ca-total',
          libelle: "Total chiffre d'affaires",
          niveau: 0,
          total: true,
          periode: cel(actuel.caCumule),
          cumul: ref((d) => d.caCumule),
        },
      ],
    },
    {
      titre: 'Dépenses retenues',
      lignes: [
        {
          cle: 'fixe',
          libelle: 'Charges fixes au prorata',
          niveau: 1,
          periode: cel(actuel.fixeProrata),
          cumul: ref((d) => d.fixeProrata),
        },
        {
          cle: 'variable',
          libelle: 'Dépenses variables constatées',
          niveau: 1,
          periode: cel(actuel.variableReel),
          cumul: ref((d) => d.variableReel),
        },
        {
          cle: 'dep-total',
          libelle: 'Total dépenses retenues',
          niveau: 0,
          total: true,
          periode: cel(actuel.totalCumule),
          cumul: ref((d) => d.totalCumule),
        },
      ],
    },
    {
      titre: 'Résultat',
      lignes: [
        {
          cle: 'resultat',
          libelle: actuel.marge ? 'Marge' : 'Déficit',
          niveau: 0,
          total: true,
          periode: cel(actuel.profit),
          cumul: ref((d) => d.profit),
        },
      ],
    },
    {
      titre: 'Encaissement',
      lignes: [
        {
          cle: 'encaisse',
          libelle: 'Encaissé sur la période',
          niveau: 1,
          periode: cel(actuel.revenuEncaisse),
          cumul: ref((d) => d.revenuEncaisse),
        },
        {
          cle: 'reste-a-encaisser',
          libelle: 'Reste à encaisser',
          niveau: 1,
          periode: cel(resteAEncaisser(actuel)),
          cumul: precedent ? cel(resteAEncaisser(precedent)) : cel(null),
        },
      ],
    },
  ];

  return sections;
}
