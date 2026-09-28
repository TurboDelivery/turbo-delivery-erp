'use client';

import React from 'react';
import { Users } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import {
  useDoublonsQuery,
  useFusionnerMutation,
  type ICandidatFusion,
} from '@/features/bdd-clients';

import { FusionConfirmation } from './fusion-confirmation';
import { GroupeDoublon } from './groupe-doublon';
import { JournalFusions } from './journal-fusions';

/**
 * Les doublons de la base, et leur fusion.
 *
 * <h3>Ce que l'opérateur vient faire ici</h3>
 * <p>Arbitrer. Il ne cherche personne, il tranche des cas que le serveur lui a préparés.
 * L'écran est donc une pile de décisions à prendre, une par groupe, et non une liste à
 * parcourir : pas de filtre, pas de recherche, pas de pagination — ce serait du mobilier
 * pour un écran qu'on ouvre déjà sur ce qu'on doit y faire.</p>
 *
 * <h3>Pourquoi le journal est sur la même page</h3>
 * <p>Parce que l'annulation est la contrepartie de la fusion. Les mettre sur deux écrans
 * ferait d'un geste réversible un geste réversible en théorie.</p>
 *
 * <p>⚠ Le rapprochement se fait sur le NOM saisi, jamais sur le montant ni sur le
 * restaurant : deux voisins qui commandent au même endroit ne sont pas la même personne.
 * L'écran PROPOSE.</p>
 */
export function DoublonsView() {
  const { data, error, isLoading, refetch } = useDoublonsQuery();
  const fusionner = useFusionnerMutation();

  const [enCours, setEnCours] = React.useState<{
    cible: ICandidatFusion;
    sources: ICandidatFusion[];
  } | null>(null);

  const demander = (
    cibleId: string,
    sourcesIds: string[],
    fiches: ICandidatFusion[],
  ) => {
    const cible = fiches.find((f) => f.id === cibleId);
    if (!cible) return;
    setEnCours({ cible, sources: fiches.filter((f) => sourcesIds.includes(f.id)) });
  };

  /*
   * Les fusions partent l'une APRÈS l'autre.
   *
   * Le serveur fusionne une source dans une cible par appel. Les enchaîner en parallèle
   * ferait courir deux transactions sur la même fiche conservée, et la seconde lirait
   * des compteurs que la première est en train de réécrire. En série, chaque fusion voit
   * le résultat de la précédente — et si l'une échoue, on s'arrête là : les précédentes
   * ont bien eu lieu, le journal les porte, et l'écran se recharge sur l'état réel.
   */
  const lancer = async () => {
    if (!enCours) return;
    for (const source of enCours.sources) {
      try {
        await fusionner.mutateAsync({ cibleId: enCours.cible.id, sourceId: source.id });
      } catch {
        // Le message d'erreur est déjà affiché par la mutation. On n'enchaîne pas sur
        // une base dont on ne connaît plus l'état.
        break;
      }
    }
    setEnCours(null);
    void refetch();
  };

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Doublons</h1>
        <p className="text-sm text-muted">
          Deux fiches ne peuvent pas porter le même numéro. Un doublon est donc la même
          personne sur deux numéros, et le nom saisi est le seul indice : ce qui suit est
          une proposition.
        </p>
      </div>

      {error ? (
        <EtatErreur
          detail={(error as Error).message}
          onReessayer={() => void refetch()}
          quoi="les doublons"
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div className="h-48 animate-pulse rounded-large bg-surface-2" key={i} />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-large border border-separator bg-surface p-10 text-center">
          <Users aria-hidden="true" className="size-6 text-muted" />
          <p className="text-sm text-foreground">Aucun nom ne porte plusieurs fiches.</p>
          <p className="text-xs text-muted">
            Les fiches sans nom ne sont pas rapprochées : il n’y aurait rien à comparer.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((doublon) => (
            <GroupeDoublon
              doublon={doublon}
              enAttente={fusionner.isPending}
              key={doublon.nom}
              onFusionner={(cibleId, sourcesIds) =>
                demander(cibleId, sourcesIds, doublon.fiches)
              }
            />
          ))}
        </div>
      )}

      <JournalFusions />

      <FusionConfirmation
        cible={enCours?.cible ?? null}
        enAttente={fusionner.isPending}
        onConfirmer={() => void lancer()}
        onFermer={() => setEnCours(null)}
        ouvert={enCours !== null}
        sources={enCours?.sources ?? []}
      />
    </section>
  );
}
