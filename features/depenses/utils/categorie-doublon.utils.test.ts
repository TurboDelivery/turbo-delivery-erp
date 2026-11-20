import { describe, expect, it } from 'vitest';

import {
  cleApprochee,
  cleExacte,
  trouverDoublonExact,
  trouverSimilaire,
} from '@/features/depenses/utils/categorie-doublon.utils';

/**
 * Ce banc garde deux propriétés, et la seconde est la plus importante.
 *
 * 1. Le refus trouve bien le doublon, casse et espaces de bord écartés.
 * 2. L'écran ne refuse JAMAIS plus que le serveur. `cleExacte` doit reproduire
 *    `LOWER(TRIM(...))` et rien d'autre : si elle retirait les accents ou réduisait les
 *    espaces du milieu, l'écran interdirait une création que le serveur accepte.
 */
const CATEGORIES = [
  { id: 'a', nomCategorie: 'CARBURANT' },
  { id: 'b', nomCategorie: 'Réparations motos' },
  { id: 'c', nomCategorie: 'Entretien' },
];

describe('cleExacte, la clé du serveur', () => {
  it('retire les espaces de bord et la casse', () => {
    expect(cleExacte('  Carburant  ')).toBe('carburant');
    expect(cleExacte('CARBURANT')).toBe('carburant');
  });

  it("ne touche NI aux accents NI aux espaces du milieu, comme LOWER(TRIM(...))", () => {
    expect(cleExacte('Réparations  motos')).toBe('réparations  motos');
  });

  it('rend une chaîne vide pour un nom absent', () => {
    expect(cleExacte(null)).toBe('');
    expect(cleExacte(undefined)).toBe('');
    expect(cleExacte('   ')).toBe('');
  });
});

describe('trouverDoublonExact, le refus', () => {
  it('trouve le même nom à la casse près', () => {
    expect(trouverDoublonExact('carburant', CATEGORIES)?.id).toBe('a');
    expect(trouverDoublonExact('  CARBURANT ', CATEGORIES)?.id).toBe('a');
  });

  it('ne trouve rien pour un nom libre', () => {
    expect(trouverDoublonExact('Péage', CATEGORIES)).toBeNull();
  });

  it('ne refuse pas une catégorie contre elle-même, au renommage', () => {
    expect(trouverDoublonExact('CARBURANT', CATEGORIES, 'a')).toBeNull();
    expect(trouverDoublonExact('CARBURANT', CATEGORIES, 'b')?.id).toBe('a');
  });

  it("n'accuse PAS un nom que le serveur accepterait", () => {
    // Accents et espaces du milieu différents : le serveur voit deux noms distincts,
    // l'écran doit en voir deux aussi, sans quoi il interdit une création possible.
    expect(trouverDoublonExact('Reparations motos', CATEGORIES)).toBeNull();
    expect(trouverDoublonExact('Réparations  motos', CATEGORIES)).toBeNull();
  });
});

describe('cleApprochee, la clé du rapprochement', () => {
  it('retire les accents, la ponctuation et le pluriel de fin de mot', () => {
    expect(cleApprochee('Réparations motos')).toBe('reparation moto');
    expect(cleApprochee('REPARATION  MOTO')).toBe('reparation moto');
    expect(cleApprochee('Réparation-motos !')).toBe('reparation moto');
  });

  it('laisse les mots courts tranquilles, pour ne pas confondre bus et bu', () => {
    expect(cleApprochee('BUS')).toBe('bus');
  });
});

describe('trouverSimilaire, l avertissement', () => {
  it('rapproche un nom qui ne diffère que par les accents ou le pluriel', () => {
    expect(trouverSimilaire('Reparation motos', CATEGORIES)?.id).toBe('b');
    expect(trouverSimilaire('REPARATIONS MOTO', CATEGORIES)?.id).toBe('b');
  });

  it('se tait quand le doublon est EXACT, pour ne pas doubler le message', () => {
    expect(trouverSimilaire('carburant', CATEGORIES)).toBeNull();
  });

  it('se tait pour un nom franchement différent', () => {
    expect(trouverSimilaire('Péage autoroute', CATEGORIES)).toBeNull();
  });

  it('ne rapproche pas une catégorie d elle-même, au renommage', () => {
    expect(trouverSimilaire('Reparation moto', CATEGORIES, 'b')).toBeNull();
  });
});
