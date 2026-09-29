import { describe, expect, it } from 'vitest';

import type { IFiltresClients } from '../types/bdd-clients.types';
import { aUnFiltrePose } from './filtres.utils';

const VIERGE: IFiltresClients = {
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

describe('aUnFiltrePose', () => {
  it('dit non sur des filtres vierges', () => {
    expect(aUnFiltrePose(VIERGE)).toBe(false);
  });

  /*
   * ⚠ Les deux valeurs qui ne sont PAS des critères. Les compter ferait dire « aucun
   * résultat pour ces filtres » sur une base vide dès qu'on tourne une page, et
   * renverrait l'opérateur chercher un filtre qu'il n'a jamais posé.
   */
  it('ne compte ni la page, ni la logique de croisement', () => {
    expect(aUnFiltrePose({ ...VIERGE, page: 3 })).toBe(false);
    expect(aUnFiltrePose({ ...VIERGE, logique: 'TOUS' })).toBe(false);
  });

  it('ne compte pas une recherche faite d’espaces', () => {
    expect(aUnFiltrePose({ ...VIERGE, recherche: '   ' })).toBe(false);
    expect(aUnFiltrePose({ ...VIERGE, recherche: ' 07 ' })).toBe(true);
  });

  it('dit oui dès qu’un critère est posé, quel qu’il soit', () => {
    const cas: Partial<IFiltresClients>[] = [
      { partenaires: ['a'] },
      { zones: ['z'] },
      { debut: '2026-09-01' },
      { fin: '2026-09-30' },
      { statut: 'QUALIFIE' },
      { segment: 'FIDELE' },
      { consentement: 'OUI' },
      { capturesMin: 1 },
      { capturesMax: 5 },
      { partenairesMin: 2 },
    ];
    for (const critere of cas) {
      expect(aUnFiltrePose({ ...VIERGE, ...critere }), JSON.stringify(critere)).toBe(true);
    }
  });

  /*
   * Zéro est un critère : « au plus 0 capture » cherche les fiches sans commande. Le
   * traiter comme une absence le rendrait impossible à poser.
   */
  it('traite zéro comme un critère, pas comme une absence', () => {
    expect(aUnFiltrePose({ ...VIERGE, capturesMax: 0 })).toBe(true);
    expect(aUnFiltrePose({ ...VIERGE, partenairesMin: 0 })).toBe(true);
  });
});
