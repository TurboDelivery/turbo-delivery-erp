'use client';

import { useQueryStates } from 'nuqs';

import { bddClientsFilters } from '../filters/bdd-clients.filter';

/**
 * L'état de filtrage de la base clients, lu et écrit dans l'URL.
 *
 * <p>Un hook plutôt qu'un `useQueryStates` appelé dans la vue : c'est la convention de ce
 * dépôt, et surtout c'est ce qui permet aux cartes de tête et au tableau de lire le MÊME
 * état sans se le passer en propriété sur trois niveaux.</p>
 */
export function useBddClientsFilters() {
  const [filtres, setFiltres] = useQueryStates(
    bddClientsFilters.filter,
    bddClientsFilters.option,
  );

  /** Changer un filtre ramène à la première page : rester en page 4 d'un résultat qui en compte 2 rendrait une liste vide. */
  const poser = (valeurs: Partial<typeof filtres>) => setFiltres({ ...valeurs, page: 0 });

  const actifs =
    filtres.recherche.trim() !== '' ||
    filtres.partenaires.length > 0 ||
    filtres.zones.length > 0 ||
    filtres.debut !== '' ||
    filtres.fin !== '' ||
    filtres.statut !== '' ||
    filtres.segment !== '' ||
    filtres.consentement !== '' ||
    filtres.capturesMin !== null ||
    filtres.partenairesMin !== null;

  const vider = () =>
    setFiltres({
      capturesMin: null,
      consentement: '',
      debut: '',
      fin: '',
      logique: 'AU_MOINS_UN',
      page: 0,
      partenaires: [],
      partenairesMin: null,
      recherche: '',
      segment: '',
      statut: '',
      zones: [],
    });

  return { actifs, filtres, poser, setFiltres, vider };
}
