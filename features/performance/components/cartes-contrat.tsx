import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { formatMontant } from '@/utils/format.utils';
import { formatNumber } from '@/utils/formatNumber';
import type { TurboyType } from '@/features/turboys/types/turboys.types';
import type { ParametresPeriode } from '@/features/performance/utils/periode.utils';
import { SignalLien } from '@/features/performance/components/zone-filtre';

/** Ce qu'une carte compte, déjà agrégé par l'appelant. */
export interface SyntheseContrat {
  contrat: TurboyType;
  /** Livreurs du contrat, programmés ou non. */
  livreurs: number;
  /**
   * Ceux qui ont un emploi du temps sur la semaine lue, ou NULL sur une période plus large.
   *
   * <p>Un emploi du temps est hebdomadaire. Sur un mois, la question « combien sont
   * programmés » n'a pas de réponse unique, et le serveur ne rend plus de créneau : compter
   * les lignes qui en portent un donnerait ZÉRO, ce qui se lirait « personne n'a été
   * programmé de tout le mois ». Le tiret dit l'absence de mesure, pas l'absence.</p>
   */
  programmes: number | null;
  nbTickets: number;
  commission: number;
  prime: number;
}

/**
 * Les trois portes d'entrée du module, exigence 2.1 du cahier des charges.
 *
 * <h3>Trois cartes, et pourquoi celles-là</h3>
 * <p>Le cahier des charges demande trois populations : journaliers, indépendants,
 * superviseurs-livreurs. C'est l'axe du CONTRAT, et non celui de l'assignation que lisent
 * les deux onglets historiques. Un journalier peut être bird ou assigné : les deux axes
 * cohabitent sur la même fiche et ne se recouvrent pas.</p>
 *
 * <h3>Ce que chaque carte dit, et ce qu'elle ne dit pas</h3>
 * <p>Elle porte le nombre de livreurs, puis le volume et l'argent de la semaine lue. Le
 * chiffre mis en avant est le nombre de LIVRAISONS : c'est l'indicateur d'activité que le
 * cahier des charges nomme en premier, et celui qui se compare d'une catégorie à l'autre.
 * Le nombre de livreurs vient en note, parce qu'il répond à une autre question.</p>
 *
 * <p>Une seconde note dit combien de livreurs ont été PROGRAMMÉS. Sans elle, une catégorie
 * de quarante livreurs dont trois ont roulé se lit comme une catégorie qui travaille mal,
 * alors que c'est peut-être une catégorie qu'on n'a pas planifiée. Les deux lectures sont
 * possibles, l'écran doit donner de quoi trancher.</p>
 *
 * <h3>Des liens, pas des boutons</h3>
 * <p>La semaine choisie vit déjà dans l'URL : il suffit de la recopier pour que la liste
 * arrive filtrée comme l'écran d'entrée. Un lien s'ouvre en plus dans un nouvel onglet, ce
 * qui permet de comparer deux catégories côte à côte.</p>
 */
export function CartesContrat({
  parametres,
  syntheses,
}: {
  /**
   * La periode lue, telle qu'elle est dans l'URL. Vide = semaine en cours.
   *
   * <p>Ce sont les parametres BRUTS et non la periode resolue : la carte les recopie tels
   * quels dans son lien, pour que la liste lise exactement ce que cet ecran a lu. Recopier
   * une periode resolue transformerait « septembre 2026 » en une plage de dates, et le
   * selecteur de la page suivante ne saurait plus quel mode afficher.</p>
   */
  parametres?: ParametresPeriode;
  syntheses: SyntheseContrat[];
}) {
  const query = new URLSearchParams(
    Object.entries(parametres ?? {}).filter(([, v]) => Boolean(v)) as [string, string][],
  ).toString();
  const requete = query ? `?${query}` : '';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {syntheses.map((s) => {
        const display = getTurboyTypeDisplay(s.contrat);

        return (
          <Link
            className="group rounded-large border border-default-200 bg-content1 p-5 transition-colors hover:border-default-400 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
            href={`/delivery-men/performance-flotte/${s.contrat}${requete}`}
            key={s.contrat}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-default-500">
                {display.labelPlural}
              </p>
              {/*
                * Le chevron cede sa place au sablier pendant la navigation, dans la meme
                * boite de 16 px, donc sans decalage. C'est le geste le plus frequent de cet
                * ecran et le seul qui ne produisait AUCUN signal : le clic ne passe par la
                * transition d'aucun selecteur.
                *
                * ⚠ On passe un ELEMENT, jamais le type `ChevronRight`. Une icone lucide est
                * un objet forwardRef, donc une fonction : la passer en prop depuis un
                * composant serveur fait tomber la page, build vert compris.
                */}
              <SignalLien>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-default-400 transition-transform group-hover:translate-x-0.5"
                />
              </SignalLien>
            </div>

            {/* Le volume de livraisons : le chiffre qui se compare d'une categorie a l'autre. */}
            <p className="mt-3 text-2xl font-semibold leading-none tabular-nums tracking-tight text-foreground">
              {formatNumber(s.nbTickets)}
              <span className="ml-1.5 text-sm font-normal text-default-500">
                livraison{s.nbTickets > 1 ? 's' : ''}
              </span>
            </p>

            <dl className="mt-4 space-y-1.5 text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-default-500">Livreurs</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatNumber(s.livreurs)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                {/*
                 * Sans cette ligne, une categorie de quarante livreurs dont trois ont roule
                 * se lit comme une categorie qui travaille mal, alors que c'est peut-etre
                 * une categorie qu'on n'a pas planifiee.
                 */}
                <dt className="text-default-500">
                  {s.programmes == null ? 'Programmés' : 'Programmés cette semaine'}
                </dt>
                <dd
                  className="font-medium tabular-nums text-foreground"
                  title={
                    s.programmes == null
                      ? 'Non applicable : un emploi du temps couvre une semaine'
                      : undefined
                  }
                >
                  {s.programmes == null ? '—' : formatNumber(s.programmes)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2 border-t border-default-200 pt-1.5">
                <dt className="text-default-500">Commission</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatMontant(s.commission)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-default-500">Prime</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatMontant(s.prime)}
                </dd>
              </div>
            </dl>
          </Link>
        );
      })}
    </div>
  );
}
