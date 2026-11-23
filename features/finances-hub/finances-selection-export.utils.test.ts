import { describe, expect, it } from 'vitest';

import { IFinanceItem, libelleMoyen, mapChargeFixe, mapChargeVariable, MOYENS_PAIEMENT, STATUTS_PAR_DEFAUT } from './finances-hub.utils';
import {
  COLONNES_PDF,
  compte,
  genererSelectionXlsx,
  ligneFiltres,
  lignesExportees,
  nomFichierSelection,
  payeeLe,
} from './finances-selection-export.utils';
import * as XLSX from 'xlsx';

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

describe('« Compte » : le compte de trésorerie débité', () => {
  it('reprend le compte retenu au décaissement', () => {
    expect(compte({ compte: 'Caisse physique' })).toBe('Caisse physique');
    expect(compte({ compte: '  Banque SGBCI ' })).toBe('Banque SGBCI');
  });
  it('⚠ un tiret, jamais un compte supposé, quand rien n\'a été retenu', () => {
    expect(compte({ compte: null })).toBe('—');
    expect(compte({ compte: undefined })).toBe('—');
    expect(compte({ compte: '   ' })).toBe('—');
  });
  it('le compte et le moyen viennent du serveur, pour une fixe comme pour une variable', () => {
    const brute = { compteTresorerie: 'Caisse physique', dateDecaissement: '2026-08-27T10:00:00Z', designation: 'x', id: '1', moyenPaiement: 'MOBILE_MONEY' };
    expect(mapChargeVariable(brute)).toMatchObject({ compte: 'Caisse physique', moyen: 'MOBILE_MONEY' });
    expect(mapChargeFixe(brute)).toMatchObject({ compte: 'Caisse physique', moyen: 'MOBILE_MONEY' });
  });
  it('une charge d\'avant la saisie du compte reste sans compte ni moyen', () => {
    expect(mapChargeVariable({ designation: 'x', id: '1' })).toMatchObject({ compte: null, moyen: null });
  });
});

describe('le moyen de paiement', () => {
  it('quatre moyens, dont le code part au serveur', () => {
    expect(MOYENS_PAIEMENT.map((m) => m.code)).toEqual(['ESPECES', 'CHEQUE', 'MOBILE_MONEY', 'VIREMENT']);
  });
  it('se lit en clair, et un code inconnu n\'est pas masqué', () => {
    expect(libelleMoyen('MOBILE_MONEY')).toBe('Mobile Money');
    expect(libelleMoyen('TROC')).toBe('TROC');
    expect(libelleMoyen(null)).toBe('—');
  });
});

describe('les colonnes des exports', () => {
  it('le PDF porte les onze colonnes de la maquette, « Compte » en dernier', () => {
    expect(COLONNES_PDF.map((c) => c.titre)).toEqual([
      'N°', 'ÉCHÉANCE', 'PAYÉE LE', 'DÉSIGNATION', 'CATÉGORIE', 'TYPE', 'MONTANT', 'STATUT', 'VISA DGA', 'ACCORD DG', 'COMPTE',
    ]);
  });
  it('⚠ leurs largeurs remplissent exactement la page (A4 paysage, 273 mm utiles)', () => {
    expect(COLONNES_PDF.reduce((s, c) => s + c.w, 0)).toBe(273);
  });
  it('le fichier Excel écrit le compte et le moyen de chaque ligne', () => {
    const ligne = (p: Partial<IFinanceItem>): IFinanceItem => ({
      categorie: 'REPARATIONS MOTOS', categorieId: 'c1', date: '2026-08-27', designation: 'Réparation de moto', dyn: false,
      echeance: '27/08', id: 'a', justif: true, montant: 19500, src: 'Manuel', statut: 'paye', type: 'variable', ...p,
    });
    const classeur = XLSX.read(
      genererSelectionXlsx(
        [
          ligne({ compte: 'Caisse physique', moyen: 'ESPECES', payeeLe: '2026-08-27T09:00:00Z' }),
          ligne({ id: 'b', statut: 'pending' }),
        ],
        ctx,
      ),
      { type: 'array' },
    );
    const detail = XLSX.utils.sheet_to_json<Record<string, unknown>>(classeur.Sheets['Détail']);
    expect(detail[0]).toMatchObject({ Compte: 'Caisse physique', 'Moyen de paiement': 'Espèces', 'Payée le': '27/08' });
    expect(detail[1]).toMatchObject({ Compte: '—', 'Moyen de paiement': '—', 'Payée le': '—' });
  });
});
