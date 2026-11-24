import { describe, expect, it } from 'vitest';

import type { IJourProgramme, IProgramme } from '../types/programme.types';
import { ENTETES_CSV, programmesEnCsv } from './programmes-csv.utils';

const SITES = new Map([
  ['s1', 'CHICKEN NATION YOPOUGON'],
  ['s2', 'ANGRÉ'],
  ['s3', 'FAYA'],
]);

const jour = (nom: string, p: Partial<IJourProgramme> = {}): IJourProgramme => ({ actif: true, debut: '10:00:00', fin: '23:00:00', jour: nom, montantCarburant: 5000, ...p });

const programme = (p: Partial<IProgramme> = {}): IProgramme => ({
  accepteLe: null,
  annee: 2026,
  id: 'p1',
  jours: [jour('LUNDI'), jour('MARDI', { actif: false, debut: null, fin: null, montantCarburant: null })],
  livreurId: 'l1',
  livreurNom: 'TOURE Bakary',
  motifRefus: null,
  nbRelances: 0,
  publieLe: null,
  refuseLe: null,
  semaine: 48,
  siteId: 's1',
  source: null,
  statut: 'NOTIFIE',
  typeLivreur: 'JOURNALIER',
  ...p,
});

const lignes = (csv: string) => csv.split('\r\n').map((l) => l.split(';'));

describe('le CSV des programmes', () => {
  it('une ligne d\'en-tête puis une ligne par programme, quinze colonnes', () => {
    const t = lignes(programmesEnCsv([programme(), programme({ id: 'p2', livreurNom: 'KONE Awa' })], SITES));
    expect(t).toHaveLength(3);
    expect(t[0]).toEqual(ENTETES_CSV);
    expect(t.every((l) => l.length === 15)).toBe(true);
  });

  it('les jours : horaires sans les secondes, « Repos » écrit en clair', () => {
    const [, l] = lignes(programmesEnCsv([programme()], SITES));
    expect(l.slice(4, 6)).toEqual(['10:00–23:00', 'Repos']);
    // Un jour que le programme ne connaît pas est un repos, pas une case vide.
    expect(l[10]).toBe('Repos');
  });

  it('un service qui finit après minuit porte « +1 »', () => {
    const [, l] = lignes(programmesEnCsv([programme({ jours: [jour('LUNDI', { debut: '18:00', fin: '02:00' })] })], SITES));
    expect(l[4]).toBe('18:00–02:00 +1');
  });

  it('la base, puis les sites desservis sans la base', () => {
    const p = programme({ complement: { basesGerees: [], preuvesParJour: {}, sitesDesservis: ['s2', 's1', 's3'], sitesParJour: {}, surplusParJour: {} } });
    const [, l] = lignes(programmesEnCsv([p], SITES));
    expect(l[2]).toBe('CHICKEN NATION YOPOUGON');
    expect(l[3]).toBe('ANGRÉ · FAYA');
  });

  it('un superviseur-livreur : pas de site de base, ses bases gérées', () => {
    const p = programme({
      complement: { basesGerees: ['s2', 's3'], preuvesParJour: {}, sitesDesservis: [], sitesParJour: {}, surplusParJour: {} },
      siteId: null,
      typeLivreur: 'SUPERVISEUR_LIVREUR',
    });
    const [, l] = lignes(programmesEnCsv([p], SITES));
    expect(l.slice(1, 4)).toEqual(['Superviseur-livreur', '', 'ANGRÉ · FAYA']);
  });

  it('les montants sont des nombres nus : dotation, surplus vivants, total', () => {
    const surplus = (id: string, montant: number, annule: boolean) => ({ annule, id, jour: 'LUNDI', montant, motif: 'AUTRE', siteId: 's1' });
    const p = programme({
      complement: {
        basesGerees: [],
        preuvesParJour: {},
        sitesDesservis: [],
        sitesParJour: {},
        surplusParJour: { LUNDI: [surplus('a', 2000, false), surplus('b', 9000, true)] },
      },
      montantCarburantHebdo: 30000,
    });
    const [, l] = lignes(programmesEnCsv([p], SITES));
    expect(l.slice(11, 15)).toEqual(['30000', '2000', '32000', 'Publié']);
  });

  it('⚠ sans carburant : des cellules vides, pas des zéros', () => {
    const p = programme({ jours: [jour('LUNDI', { montantCarburant: null })], statut: 'BROUILLON' });
    const [, l] = lignes(programmesEnCsv([p], SITES));
    expect(l.slice(11, 15)).toEqual(['', '', '', 'Brouillon']);
  });

  it('un nom qui contient un point-virgule ou un guillemet est mis entre guillemets', () => {
    const csv = programmesEnCsv([programme({ livreurNom: 'KOUASSI "Dj"; Aka' })], SITES);
    expect(csv.split('\r\n')[1].startsWith('"KOUASSI ""Dj""; Aka";Journalier;')).toBe(true);
  });

  it('⚠ une cellule qui commencerait une formule est désamorcée', () => {
    const csv = programmesEnCsv([programme({ livreurNom: '=HYPERLINK("http://x")' })], SITES);
    expect(csv.split('\r\n')[1].startsWith('"\'=HYPERLINK(""http://x"")";')).toBe(true);
  });

  it('aucun programme : la seule ligne d\'en-tête', () => {
    expect(programmesEnCsv([], SITES)).toBe(ENTETES_CSV.join(';'));
  });
});
