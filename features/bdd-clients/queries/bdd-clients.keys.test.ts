import { describe, expect, it } from 'vitest';

import type { IFiltresClients } from '../types/bdd-clients.types';
import { bddClientsKeys } from './bdd-clients.query';

const FILTRES: IFiltresClients = {
  capturesMax: null,
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
};

/**
 * Ce que gardent ces bancs.
 *
 * <p>Deux requêtes partent des mêmes filtres et n'ont pas les mêmes besoins. La liste
 * dépend de la page ; les quatre cartes de tête comptent la population du filtre et
 * n'envoient même pas la page au serveur. Mettre la page dans leur clé refaisait quatre
 * agrégats à chaque clic de pagination, pour le même résultat, et faisait repasser les
 * cartes par leur état de chargement — les chiffres semblaient bouger alors qu'ils ne
 * bougeaient pas.</p>
 */
describe('clés de cache de la base clients', () => {
  it('la liste distingue les pages : c’est ce qu’elle demande', () => {
    expect(bddClientsKeys.liste({ ...FILTRES, page: 1 })).not.toEqual(
      bddClientsKeys.liste({ ...FILTRES, page: 0 }),
    );
  });

  it('les cartes IGNORENT la page : tourner une page ne les refait pas', () => {
    expect(bddClientsKeys.kpis({ ...FILTRES, page: 7 })).toEqual(
      bddClientsKeys.kpis({ ...FILTRES, page: 0 }),
    );
  });

  it('les cartes suivent en revanche tout vrai critère', () => {
    const base = bddClientsKeys.kpis(FILTRES);
    const cas: Partial<IFiltresClients>[] = [
      { recherche: 'koffi' },
      { partenaires: ['r1'] },
      { logique: 'TOUS' },
      { debut: '2026-09-01' },
      { fin: '2026-09-30' },
      { zones: ['z1'] },
      { statut: 'QUALIFIE' },
      { segment: 'VIP' },
      { consentement: 'OUI' },
      { capturesMin: 2 },
      { capturesMax: 5 },
      { partenairesMin: 2 },
    ];
    for (const critere of cas) {
      expect(bddClientsKeys.kpis({ ...FILTRES, ...critere }), JSON.stringify(critere))
        .not.toEqual(base);
    }
  });
});
