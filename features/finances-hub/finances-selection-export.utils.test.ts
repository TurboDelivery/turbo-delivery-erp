import { describe, expect, it } from 'vitest';

import { IFinanceItem, STATUTS_PAR_DEFAUT } from './finances-hub.utils';
import { ligneFiltres, lignesExportees, nomFichierSelection, payeeLe } from './finances-selection-export.utils';

const maintenant = new Date(2026, 10, 20, 16, 45);
const ctx = {
  auteur: 'Koné (Comptable)',
  categories: ['REPARATIONS MOTOS'],
  maintenant,
  moisCle: '2026-08',
  moisLibelle: 'août 2026',
  recherche: '',
  statuts: STATUTS_PAR_DEFAUT,
  typeLibelle: 'Toutes',
};

describe('le nom du fichier exporté', () => {
  it('une catégorie : son nom, sans espace ni accent — c\'est celui de la maquette', () => {
    expect(nomFichierSelection(ctx)).toBe('Depenses_REPARATIONS-MOTOS_2026-08_20261120-1645');
  });
  it('plusieurs catégories : MULTI', () => {
    expect(nomFichierSelection({ ...ctx, categories: ['LOYERS', 'CIE | SODECI'] })).toBe('Depenses_MULTI_2026-08_20261120-1645');
  });
  it('aucune : TOUTES', () => {
    expect(nomFichierSelection({ ...ctx, categories: [] })).toBe('Depenses_TOUTES_2026-08_20261120-1645');
  });
  it('une catégorie accentuée ou ponctuée reste un nom de fichier propre', () => {
    expect(nomFichierSelection({ ...ctx, categories: ['Sécurité-Sociale / CNPS'] })).toBe(
      'Depenses_SECURITE-SOCIALE-CNPS_2026-08_20261120-1645',
    );
  });
});

describe('la ligne des filtres', () => {
  it('reprend mot pour mot celle de la maquette', () => {
    expect(ligneFiltres(ctx)).toBe(
      'Période : août 2026 · Type : toutes · Catégorie : REPARATIONS MOTOS · Statuts : tous sauf rejeté · Recherche : aucune',
    );
  });
  it('dit la recherche et les statuts quand ils sortent du défaut', () => {
    expect(ligneFiltres({ ...ctx, categories: [], recherche: ' pneu ', statuts: ['paye'] })).toContain(
      'Catégorie : toutes · Statuts : Payé · Recherche : pneu',
    );
  });
});

describe('ce qui part dans le fichier', () => {
  it('⚠ une rejetée affichée n\'est PAS exportée', () => {
    const l = (statut: IFinanceItem['statut']) => ({ statut }) as IFinanceItem;
    expect(lignesExportees([l('paye'), l('rejete'), l('pending')])).toHaveLength(2);
  });
});

describe('« Payée le »', () => {
  it('le jour du décaissement, JJ/MM', () => {
    expect(payeeLe({ payeeLe: '2026-08-27T10:15:00Z' })).toBe('27/08');
  });
  it('un tiret tant que rien n\'est sorti', () => {
    expect(payeeLe({ payeeLe: null })).toBe('—');
    expect(payeeLe({})).toBe('—');
  });
  it('⚠ 23 h 30 UTC reste le même jour, quel que soit le poste qui exporte', () => {
    expect(payeeLe({ payeeLe: '2026-08-31T23:30:00Z' })).toBe('31/08');
  });
});
