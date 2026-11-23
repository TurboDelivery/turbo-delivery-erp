import { describe, expect, it } from 'vitest';

import { filtrerSelection, IFinanceItem, statsSelection, STATUTS_PAR_DEFAUT, trierSelection } from './finances-hub.utils';

const ligne = (p: Partial<IFinanceItem>): IFinanceItem => ({
  categorie: 'REPARATIONS MOTOS',
  categorieId: 'c1',
  date: '2026-08-27',
  designation: 'Réparation de moto',
  dyn: false,
  echeance: '27/08',
  id: Math.random().toString(36).slice(2),
  justif: true,
  montant: 19500,
  src: 'Manuel',
  statut: 'paye',
  type: 'variable',
  ...p,
});

/** Le jeu de la maquette : REPARATIONS MOTOS, août 2026. */
const MAQUETTE: IFinanceItem[] = [
  ligne({ date: '2026-08-31', montant: 2000, statut: 'pending' }),
  ...Array.from({ length: 10 }, () => ligne({})),
  ligne({ date: '2026-08-19', designation: 'Réparation', montant: 2000 }),
  ligne({ designation: 'Réparation de moto (doublon de saisie)', statut: 'rejete' }),
];

describe('la sélection de la planche Dépenses', () => {
  it('par défaut, une rejetée ne se montre pas', () => {
    const s = filtrerSelection(MAQUETTE, { recherche: '', statuts: STATUTS_PAR_DEFAUT });
    expect(s).toHaveLength(12);
    expect(s.some((i) => i.statut === 'rejete')).toBe(false);
  });

  it('les chiffres sont ceux de la maquette : 199 000, 12 opérations, 16 583 de moyenne', () => {
    const st = statsSelection(filtrerSelection(MAQUETTE, { recherche: '', statuts: STATUTS_PAR_DEFAUT }));
    expect(st.total).toBe(199000);
    expect(st.n).toBe(12);
    expect(Math.round(st.moyenne)).toBe(16583);
    expect(st.min).toBe(2000);
    expect(st.max).toBe(19500);
    expect(st.paye).toBe(197000);
    expect(st.nbPayees).toBe(11);
    expect(st.reste).toBe(2000);
    expect(st.nbReste).toBe(1);
  });

  it('⚠ une rejetée demandée s\'AFFICHE mais ne se COMPTE pas', () => {
    const tout = filtrerSelection(MAQUETTE, { recherche: '', statuts: [...STATUTS_PAR_DEFAUT, 'rejete'] });
    expect(tout).toHaveLength(13);
    const st = statsSelection(tout);
    expect(st.n).toBe(12);
    expect(st.total).toBe(199000);
    expect(st.nbRejetees).toBe(1);
  });

  it('la recherche ignore les accents et porte sur la désignation', () => {
    const s = filtrerSelection(MAQUETTE, { recherche: 'reparation de', statuts: STATUTS_PAR_DEFAUT });
    expect(s).toHaveLength(11);
  });

  it('le détail par catégorie somme sans les rejetées, la plus lourde d\'abord', () => {
    const st = statsSelection([
      ligne({ categorie: 'LOYERS', montant: 500000, statut: 'approuve' }),
      ligne({ categorie: 'REPARATIONS MOTOS', montant: 19500 }),
      ligne({ categorie: 'REPARATIONS MOTOS', montant: 9000, statut: 'rejete' }),
    ]);
    expect(st.parCategorie).toEqual([
      { categorie: 'LOYERS', n: 1, total: 500000 },
      { categorie: 'REPARATIONS MOTOS', n: 1, total: 19500 },
    ]);
  });

  it('une sélection vide ne divise pas par zéro', () => {
    const st = statsSelection([]);
    expect(st.moyenne).toBe(0);
    expect(st.min).toBe(0);
    expect(st.max).toBe(0);
  });
});

describe('le tri', () => {
  const a = ligne({ date: '2026-08-02', montant: 300 });
  const b = ligne({ date: '2026-08-10', montant: 100 });
  const sansDate = ligne({ date: null, montant: 200 });

  it('⚠ l\'échéance se trie sur la date, pas sur son libellé : le 2 avant le 10', () => {
    expect(trierSelection([b, a], 'echeance', 'asc').map((i) => i.date)).toEqual(['2026-08-02', '2026-08-10']);
    expect(trierSelection([a, b], 'echeance', 'desc').map((i) => i.date)).toEqual(['2026-08-10', '2026-08-02']);
  });

  it('une charge sans date va à la fin, dans les deux sens', () => {
    expect(trierSelection([sansDate, a, b], 'echeance', 'asc')[2]).toBe(sansDate);
    expect(trierSelection([sansDate, a, b], 'echeance', 'desc')[2]).toBe(sansDate);
  });

  it('le montant se trie comme un nombre', () => {
    expect(trierSelection([a, b, sansDate], 'montant', 'asc').map((i) => i.montant)).toEqual([100, 200, 300]);
  });
});
