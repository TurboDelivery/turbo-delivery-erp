'use client';

import React, { useMemo } from 'react';
import { nomComplet } from '@/utils/nom.utils';
import { Restaurant } from '@/types/models';
import { TicketTable } from '@/components/tickets/table';
import { LignesPreparees, ligneComplete } from '@/features/tickets/components/lignes-preparees';
import { PlanSaisie } from '@/features/tickets/components/plan-saisie';
import { useNewTickets } from '@/features/tickets/hooks/use-new-tickets';
import { useAbility } from '@/hooks/use-ability';
import { useLivreurs } from '@/features/tickets/hooks/use-livreurs';
import { useCreateBonLivraison } from '@/features/tickets/queries/tickets.mutation';
import { CreneauActifBanner } from '@/features/creneaux/components/creneau-actif-banner';
import EtatErreur from '@/components/commons/EtatErreur';

/**
 * Aucune ligne en cours dans l'archive : la saisie vit dans l'etabli, au-dessus.
 * Constante hors composant pour ne pas fabriquer un ensemble neuf a chaque rendu.
 */
const AUCUN_NOUVEAU: Set<string> = new Set();

/**
 * Le tableau exige encore un gestionnaire d'enregistrement de ligne neuve.
 *
 * <p>Il ne peut plus s'en servir : aucune ligne en cours ne lui parvient. La branche du
 * composant qui l'appelle est donc morte, et lui passer une fonction vide dit exactement
 * cela — plutot que de lui donner le vrai gestionnaire, qui laisserait croire que ce
 * chemin existe encore.</p>
 */
const NE_SERT_PLUS = () => {};

interface TicketPageClientProps {
  restaurants: Restaurant[];
}

export function TicketPageClient({ restaurants }: TicketPageClientProps) {
  const ability = useAbility();
  const { livreurs, isErrorLivreurs, isFetchingLivreurs, refetchLivreurs } = useLivreurs();
  const {
    mutate: createBonLivraisonMutation,
    mutateAsync: createBonLivraisonAsync,
    isPending: isCreatingBonLivraison,
  } = useCreateBonLivraison();

  /*
   * ⚠ Le libelle suit l'ordre du SERVEUR, nom puis prenoms, via `nomComplet`.
   *
   * <p>Il etait compose ici en « prenoms nom » alors que la colonne « Livreur » de la ligne
   * affiche une chaine deja assemblee par le serveur, dans l'autre ordre. L'operateur lisait
   * « ote azo » dans le tableau et tapait « ote » dans le filtre : le ComboBox cherche par
   * sous-chaine sur SON libelle, « azo ote », et ne proposait rien.</p>
   *
   * <p>Le filtre retenait aussi les seuls livreurs portant un nom ET des prenoms. Celui qui
   * n'a que l'un des deux voyait ses tickets dans le tableau, mais restait introuvable dans
   * le filtre : il etait infiltrable par construction. On garde desormais tout livreur
   * identifiable, comme le fait deja l'ecran de validation.</p>
   *
   * <p>Et la liste est TRIEE : 222 livreurs dans l'ordre du serveur ne se parcourent pas a
   * l'oeil, ce qui oblige a taper, donc a connaitre l'ordre exact du libelle.</p>
   */
  const validLivreurs = useMemo(() => livreurs.filter((l) => l.id && (l.nom || l.prenoms)), [livreurs]);
  const livreurOptions = useMemo(
    () =>
      validLivreurs
        .map((l) => ({ value: l.id, label: nomComplet(l) }))
        .sort((a, b) => a.label.localeCompare(b.label, 'fr')),
    [validLivreurs],
  );
  const restaurantOptions = useMemo(() => restaurants.map((r) => ({ value: r.id, label: r.nomEtablissement })), [restaurants]);

  const {
    newTickets,
    newTicketIds,
    insertState,
    handleInsert,
    handleSaveNewTickets,
    handleCancelNewTicket,
    handleNewTicketChange,
    handleNewTicketPatch,
  } = useNewTickets({
    restaurants,
    livreurOptions,
    restaurantOptions,
    createBonLivraisonMutation,
    createBonLivraisonAsync,
  });

  // Chaque cellule livreur du tableau, la carte mobile et la barre d'insertion resolvent
  // leur libelle dans livreurOptions. Sur un echec de lecture cette liste reste vide : les
  // tickets s'affichaient sans livreur et le selecteur annoncait "aucun livreur", soit une
  // affectation manquante credible alors que les livreurs existent bel et bien.
  if (isErrorLivreurs) {
    return (
      <>
        <CreneauActifBanner />
        <EtatErreur quoi="les livreurs" onReessayer={() => refetchLivreurs()} enCours={isFetchingLivreurs} />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CreneauActifBanner />

      {/*
        La SAISIE et la CONSULTATION sont deux activites opposees, et elles partageaient une
        seule surface. Les lignes en cours de saisie etaient inserees au sommet du tableau
        d'archive, visuellement identiques aux 1 037 lignes deja enregistrees : un tri ou un
        filtre les dispersait, et rien ne disait ou l'on en etait. Elles ont desormais leur
        propre etabli, au-dessus de l'archive qui reste intacte.
      */}
      <PlanSaisie
        completees={newTickets.filter(ligneComplete).length}
        etat={{
          nombreLignes: insertState.insertCount,
          livreurId: insertState.insertLivreurId,
          restaurantId: insertState.insertRestaurantId,
          date: insertState.insertDate,
          setNombreLignes: insertState.setInsertCount,
          setLivreurId: insertState.setInsertLivreurId,
          setRestaurantId: insertState.setInsertRestaurantId,
          setDate: insertState.setInsertDate,
        }}
        livreurs={livreurOptions}
        onPreparer={handleInsert}
        peutCreer={ability.can('create', 'Ticket')}
        preparees={newTickets.length}
        restaurants={restaurantOptions}
      />

      <LignesPreparees
        enregistrement={isCreatingBonLivraison}
        livreurOptions={livreurOptions}
        onChange={handleNewTicketChange}
        onEnregistrerLot={handleSaveNewTickets}
        onPatch={handleNewTicketPatch}
        onRetirer={handleCancelNewTicket}
        restaurantOptions={restaurantOptions}
        restaurants={restaurants}
        tickets={newTickets}
      />

      {/*
        Le tableau ne recoit plus les lignes en cours : `newTickets` y reste vide, et
        `newTicketIds` aussi. Lui laisser la liste des identifiants gardait un etat mort dont
        les colonnes se servent encore pour decider (`isNew`, exclusion de la selection). Il
        redevient ce qu'il est, une archive consultable, et les tickets fraichement
        enregistres y reviennent par la requete, comme n'importe quel autre.
      */}
      <TicketTable
        restaurants={restaurants}
        livreurOptions={livreurOptions}
        restaurantOptions={restaurantOptions}
        newTickets={[]}
        newTicketIds={AUCUN_NOUVEAU}
        isCreatingBonLivraison={isCreatingBonLivraison}
        onSaveNewTicket={NE_SERT_PLUS}
        onCancelNewTicket={handleCancelNewTicket}
        onNewTicketChange={handleNewTicketChange}
        onNewTicketPatch={handleNewTicketPatch}
      />
    </div>
  );
}
