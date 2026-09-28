'use client';

import { parseAsString, useQueryState } from 'nuqs';

import { FicheClientPanneau } from '@/components/bdd-clients/fiche/fiche-client-panneau';

import { ClientsFiltres } from './clients-filtres';
import { ClientsKpiCards } from './clients-kpi-cards';
import { ClientsTable } from './clients-table';

/**
 * La base de données clients.
 *
 * <h3>Ce que regarde l'opérateur</h3>
 * <p>Il vient chercher des gens : « qui revient chez nous », « qui a consenti », « qui
 * n'a pas encore été appelé ». La liste est donc l'objet de l'écran et prend tout le pli ;
 * les quatre cartes et les filtres tiennent au-dessus, sur deux bandes, parce que chaque
 * rangée qu'ils prennent est une ligne de clients qu'il ne voit plus.</p>
 *
 * <h3>Ce qui appelle une action, ici, c'est presque rien</h3>
 * <p>Cet écran informe. Aucune couleur d'alerte, aucun accent sur un statut : un client
 * « à qualifier » attend un appel, il n'est pas en faute. Le seul repère coloré est le
 * badge des fidèles, qui est l'information commerciale que la base existe pour produire.</p>
 */
export function ClientsView() {
  /*
   * La fiche ouverte vit dans l'URL, mais HORS de l'objet de filtres.
   *
   * Dans l'URL parce qu'un lien vers une fiche doit se partager et survivre a un
   * rechargement. Hors des filtres parce que la cle de cache de la liste EST l'objet de
   * filtres : y ajouter la fiche ouverte rechargerait toute la liste a chaque ouverture
   * de panneau.
   */
  const [ficheOuverte, setFicheOuverte] = useQueryState(
    'bcFiche',
    parseAsString.withDefault('').withOptions({ clearOnDefault: true }),
  );

  return (
    <section className="flex flex-col gap-3">
      <ClientsKpiCards />
      <ClientsFiltres />
      <ClientsTable onOuvrir={(id) => void setFicheOuverte(id)} />
      <FicheClientPanneau
        clientId={ficheOuverte || null}
        onFermer={() => void setFicheOuverte('')}
      />
    </section>
  );
}
