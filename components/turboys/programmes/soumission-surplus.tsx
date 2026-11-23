'use client';

import { Button } from '@heroui-v3/react';
import React from 'react';

import { ChampListe } from '@/components/commons/champs-formulaire';
import { FenetreAction } from '@/components/commons/FenetreAction';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';
import {
  useEtatSoumissionSurplusQuery,
  useSoumettreSurplusMutation,
} from '@/features/turboys/queries/programme.query';
import type { IProgramme, ISoumissionSurplus } from '@/features/turboys/types/programme.types';
import { pdfSurplusBlob } from '@/features/turboys/utils/programmes-export.utils';
import { useAbility } from '@/hooks/use-ability';
import { formatMontant } from '@/utils/format.utils';

/**
 * SOUMETTRE LES SURPLUS DE LA SEMAINE AU DÉCAISSEMENT (décision du propriétaire,
 * 23/11/2026).
 *
 * <h3>Pourquoi ce n'est pas le bouton d'engagement</h3>
 *
 * <p>L'engagement du carburant se pose AVANT la semaine, sur la dotation prévue, et passe
 * au visa du DGA. Les surplus naissent PENDANT. Les ajouter à la charge déjà visée en
 * ferait une somme que le DGA n'a pas vue. Ils partent donc dans une charge distincte,
 * soumise le lundi qui suit — et sur un bouton, pas sur un cron : un décaissement doit
 * avoir un auteur.</p>
 *
 * <p>La ligne n'apparaît QUE s'il y a quelque chose à dire. Une semaine sans surplus ne
 * porte rien ici : un bouton permanent qui dirait « 0 surplus à soumettre » occuperait
 * l'attention sans jamais rien demander.</p>
 */

/** La ligne d'état, sans aucune requête : ce que le banc montre. */
export function SoumissionSurplus({
  enCours = false,
  etat,
  onSoumettre,
  peutSoumettre,
}: {
  enCours?: boolean;
  etat: ISoumissionSurplus | null | undefined;
  onSoumettre: () => void;
  peutSoumettre: boolean;
}) {
  // Rien à soumettre et rien de soumis : la semaine n'a pas eu de surplus, on se tait.
  if (!etat || (etat.nbASoumettre === 0 && etat.nbDejaSoumis === 0)) return null;

  const dejaTout = etat.nbASoumettre === 0;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {dejaTout ? (
        <span className="text-sm text-foreground">
          {etat.nbDejaSoumis} surplus soumis au décaissement,{' '}
          <span className="font-semibold tabular-nums">{formatMontant(etat.montantDejaSoumis)}</span>
          <span className="text-muted">, dans une charge distincte de la dotation</span>
        </span>
      ) : (
        <>
          <span className="text-sm text-foreground">
            {etat.nbASoumettre} surplus à soumettre,{' '}
            <span className="font-semibold tabular-nums text-warning-soft-foreground">
              {formatMontant(etat.montantASoumettre)}
            </span>
          </span>
          {peutSoumettre && etat.soumissible ? (
            <Button isPending={enCours} onPress={onSoumettre} size="sm" variant="outline">
              Soumettre au décaissement
            </Button>
          ) : (
            // L'empêchement se LIT. Un bouton grisé sans sa raison fait chercher
            // pourquoi, et la raison la plus fréquente ici — la semaine n'est pas
            // finie — n'est devinable par personne.
            <span className="text-xs text-muted">
              {etat.empechement ?? 'À soumettre par la comptabilité.'}
            </span>
          )}
          {etat.nbDejaSoumis > 0 && (
            <span className="text-xs text-muted">
              {etat.nbDejaSoumis} déjà soumis ({formatMontant(etat.montantDejaSoumis)})
            </span>
          )}
        </>
      )}
    </div>
  );
}

/** La ligne branchée : état, droit, catégorie, justificatif, envoi. */
export function SoumissionSurplusConnectee({
  annee,
  nomSite,
  programmes,
  semaine,
}: {
  annee: number;
  /** Nom d'un site par identifiant, pour que le justificatif ne dise pas « site inconnu ». */
  nomSite: Map<string, string>;
  /** Tous les programmes de la semaine : le justificatif en tire le détail des surplus. */
  programmes: IProgramme[];
  semaine: number;
}) {
  const ability = useAbility();
  const peutSoumettre = ability.can('accorder-surplus', 'ProgrammeLivreur');
  const etatQuery = useEtatSoumissionSurplusQuery(annee, semaine);
  const { categories } = useCategorieDepense();
  const [ouvert, setOuvert] = React.useState(false);
  const [categorieId, setCategorieId] = React.useState('');
  const soumettre = useSoumettreSurplusMutation(() => setOuvert(false));

  React.useEffect(() => {
    if (categorieId || categories.length === 0) return;
    const carburant = categories.find((c) => /carburant|essence|fuel/i.test(c.nomCategorie ?? ''));
    if (carburant) setCategorieId(carburant.id);
  }, [categories, categorieId]);

  const etat = etatQuery.data ?? null;

  /*
   * Le détail des surplus NON SOUMIS, pour le justificatif. Reconstruit depuis les
   * programmes plutôt que demandé au serveur : l'écran les a déjà, et une requête de
   * plus pour composer une pièce jointe serait un aller-retour pour rien.
   *
   * ⚠ Un surplus déjà soumis en est exclu : la charge ne porte que ce qui part
   * maintenant, et l'y faire figurer donnerait à croire qu'on repaie.
   */
  const detail = React.useMemo(
    () =>
      programmes.flatMap((p) =>
        Object.values(p.complement?.surplusParJour ?? {})
          .flat()
          .filter((s) => !s.annule)
          .map((s) => ({
            commentaire: s.commentaire,
            jour: s.jour,
            livreurNom: p.livreurNom ?? 'Livreur',
            montant: s.montant ?? 0,
            motif: s.motif,
            siteNom: nomSite.get(s.siteId) ?? 'Site inconnu',
          })),
      ),
    [nomSite, programmes],
  );

  const confirmer = () => {
    if (!categorieId || !etat) return;
    const donnees = new FormData();
    donnees.append('annee', String(annee));
    donnees.append('semaine', String(semaine));
    donnees.append('categorieId', categorieId);
    donnees.append('creerPar', 'ERP');
    donnees.append('justificatif', pdfSurplusBlob(detail, annee, semaine), `surplus_${annee}_S${semaine}.pdf`);
    soumettre.mutate(donnees);
  };

  return (
    <>
      <SoumissionSurplus
        enCours={soumettre.isPending}
        etat={etat}
        onSoumettre={() => setOuvert(true)}
        peutSoumettre={peutSoumettre}
      />
      <FenetreAction
        actionInactive={!categorieId}
        enAttente={soumettre.isPending}
        libelleAction={`Soumettre ${formatMontant(etat?.montantASoumettre ?? 0)}`}
        onAction={confirmer}
        onFermer={() => setOuvert(false)}
        ouvert={ouvert}
        titre={`Surplus carburant de la semaine ${semaine} / ${annee}`}
      >
        <p className="text-3xl font-bold tabular-nums text-foreground">
          {formatMontant(etat?.montantASoumettre ?? 0)}
        </p>
        <p className="text-sm text-muted">
          {etat?.nbASoumettre ?? 0} surplus accordé{(etat?.nbASoumettre ?? 0) > 1 ? 's' : ''} pendant la
          semaine. Une charge variable «&nbsp;Surplus carburant semaine {semaine}/{annee}&nbsp;» part au visa du
          DGA, puis à l&apos;approbation du DG, avec le détail des surplus en justificatif.
        </p>
        <p className="text-sm text-muted">
          Cette charge est <strong>distincte</strong> de l&apos;engagement de la dotation : celle que le DGA a
          visée avant la semaine ne bouge pas.
        </p>
        <ChampListe
          label="Catégorie de dépense"
          onChange={setCategorieId}
          options={categories.map((c) => ({ label: c.nomCategorie, value: c.id }))}
          placeholder="Rechercher une catégorie"
          valeur={categorieId}
        />
        {!categorieId && (
          <p className="text-xs text-danger-soft-foreground">Choisissez une catégorie pour soumettre.</p>
        )}
      </FenetreAction>
    </>
  );
}
