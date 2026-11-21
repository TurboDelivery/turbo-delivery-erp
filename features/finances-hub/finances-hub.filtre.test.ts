import { describe, expect, it } from 'vitest';

import { IFinanceItem, filtrerItems, normaliserTexte } from './finances-hub.utils';

/**
 * LE BANC DU FILTRE DU TABLEAU FINANCE.
 *
 * <p>Ce filtre se trompe en SILENCE : il ne lève rien, il montre simplement moins de
 * lignes, et l'opérateur conclut qu'il n'y a rien à décaisser. Les deux pièges qu'on
 * vérifie ici sont exactement ceux qu'une relecture laisse passer.</p>
 */

const SEUIL = 100_000;

const item = (p: Partial<IFinanceItem> & { id: string }): IFinanceItem => ({
  categorie: 'DIVERS',
  categorieId: 'c1',
  date: '2026-11-10T00:00:00Z',
  designation: 'Sans nom',
  dyn: false,
  echeance: '30/11',
  justif: true,
  montant: 10_000,
  src: 'Manuel',
  statut: 'pending',
  type: 'variable',
  ...p,
});

describe('normaliserTexte', () => {
  it('déplie les accents et abaisse la casse', () => {
    expect(normaliserTexte('Électricité CIE')).toBe('electricite cie');
    expect(normaliserTexte('Dotation téléphonique')).toBe('dotation telephonique');
  });

  it("laisse l'apostrophe typographique intacte, elle n'est pas un accent", () => {
    expect(normaliserTexte('Bidon d’huile')).toBe('bidon d’huile');
  });
});

describe('filtrerItems — la recherche', () => {
  const lignes = [
    item({ designation: 'Électricité CIE', id: 'a' }),
    item({ categorie: 'LOYERS', designation: 'Loyer bureau', id: 'b' }),
    item({ designation: 'Ramassage poubelle', id: 'c' }),
  ];

  it('trouve un mot accentué tapé SANS accent', () => {
    expect(filtrerItems(lignes, { etape: 'tous', recherche: 'electricite' }, SEUIL).map((i) => i.id)).toEqual(['a']);
  });

  it('trouve un mot sans accent tapé AVEC accent', () => {
    expect(filtrerItems(lignes, { etape: 'tous', recherche: 'Ramassagé' }, SEUIL).map((i) => i.id)).toEqual(['c']);
  });

  it('cherche aussi dans la CATÉGORIE, pas seulement la désignation', () => {
    expect(filtrerItems(lignes, { etape: 'tous', recherche: 'loyers' }, SEUIL).map((i) => i.id)).toEqual(['b']);
  });

  it('ignore les espaces autour de la saisie', () => {
    expect(filtrerItems(lignes, { etape: 'tous', recherche: '   ' }, SEUIL)).toHaveLength(3);
  });

  it('rend la MÊME référence quand rien ne filtre, pour ne pas re-rendre pour rien', () => {
    expect(filtrerItems(lignes, { etape: 'tous', recherche: '' }, SEUIL)).toBe(lignes);
  });
});

describe('filtrerItems — l’étape suit nextAction, pas le statut', () => {
  /*
   * ⚠ CE QUE CE BANC A CORRIGÉ. Il avait d'abord été écrit sur l'idée qu'une charge visée
   * sous le seuil saute l'accord DG et devient payable tout de suite. C'est FAUX dans ce
   * dépôt : `needsDG` est épinglé à `true`, le saut conditionnel ayant été retiré, et la
   * cascade est donc toujours Comptable puis DGA puis DG. Le montant ne change rien.
   *
   * Le filtre appelle quand même `nextAction` plutôt que de lire `statut`, pour que le
   * jour où ce saut revient il suive le bouton de la ligne sans qu'on y repense. Ces cas
   * fixent le comportement d'AUJOURD'HUI ; si `needsDG` redevient conditionnel, ils
   * tomberont, et c'est exactement ce qu'on attend d'eux.
   */
  const petiteVisee = item({ id: 'petite', montant: 50_000, statut: 'vise' });
  const grosseVisee = item({ id: 'grosse', montant: 900_000, statut: 'vise' });
  const approuvee = item({ id: 'approuvee', montant: 900_000, statut: 'approuve' });
  const enAttente = item({ id: 'attente', statut: 'pending' });
  const payee = item({ id: 'payee', statut: 'paye' });
  const rejetee = item({ id: 'rejetee', statut: 'rejete' });
  const toutes = [petiteVisee, grosseVisee, approuvee, enAttente, payee, rejetee];

  const ids = (etape: string) => filtrerItems(toutes, { etape, recherche: '' }, SEUIL).map((i) => i.id);

  it('« À décaisser » ne retient QUE ce que le DG a approuvé', () => {
    expect(ids('pay')).toEqual(['approuvee']);
  });

  it('« À approuver » retient toute charge visée, quel que soit son montant', () => {
    expect(ids('approuve')).toEqual(['petite', 'grosse']);
  });

  it('« À viser » retient ce qui est en attente', () => {
    expect(ids('vise')).toEqual(['attente']);
  });

  it('« Payées » et « Rejetées » se lisent sur le statut, états terminaux', () => {
    expect(ids('paye')).toEqual(['payee']);
    expect(ids('rejete')).toEqual(['rejetee']);
  });

  it('« Toutes les étapes » ne retire rien', () => {
    expect(ids('tous')).toHaveLength(6);
  });

  it('se combine avec la recherche', () => {
    const r = filtrerItems(
      [item({ designation: 'Loyer', id: 'l', statut: 'approuve' }), approuvee],
      { etape: 'pay', recherche: 'loyer' },
      SEUIL,
    );
    expect(r.map((i) => i.id)).toEqual(['l']);
  });
});
