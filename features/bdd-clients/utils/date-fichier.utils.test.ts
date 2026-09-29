import { describe, expect, it } from 'vitest';

import { compterDatesIllisibles, lireDateFichier } from './date-fichier.utils';

describe('lireDateFichier', () => {
  /*
   * Le cas qui a bloqué un import de 13 481 lignes : la caisse de CHICKEN NATION écrit
   * la date ET l'heure, en jour/mois/année. Le serveur répondait
   * « Text '28/09/2026 15:41' could not be parsed at index 0 », et rien n'entrait.
   */
  it('lit le format des caisses : jour/mois/année et heure', () => {
    expect(lireDateFichier('28/09/2026 15:41')).toBe('2026-09-28T15:41:00.000Z');
    expect(lireDateFichier('28/09/2026 15:41:07')).toBe('2026-09-28T15:41:07.000Z');
  });

  it('lit une date seule, à minuit', () => {
    expect(lireDateFichier('28/09/2026')).toBe('2026-09-28T00:00:00.000Z');
  });

  /*
   * ⚠ L'axe jour/mois n'est pas négociable. Se tromper décale des milliers de commandes
   * de plusieurs mois, en silence, et rien ne le rattrape après coup.
   */
  it('met le JOUR avant le mois, y compris quand les deux sont plausibles', () => {
    expect(lireDateFichier('03/04/2026')).toBe('2026-04-03T00:00:00.000Z');
    expect(lireDateFichier('04/03/2026')).toBe('2026-03-04T00:00:00.000Z');
  });

  it('accepte le tiret et le point comme séparateurs', () => {
    expect(lireDateFichier('28-09-2026')).toBe('2026-09-28T00:00:00.000Z');
    expect(lireDateFichier('28.09.2026 08:05')).toBe('2026-09-28T08:05:00.000Z');
  });

  it('lit une année sur deux chiffres comme les années 2000', () => {
    expect(lireDateFichier('28/09/26')).toBe('2026-09-28T00:00:00.000Z');
  });

  it('reconnaît l’ISO en premier, qui n’est jamais ambigu', () => {
    expect(lireDateFichier('2026-09-28')).toBe('2026-09-28T00:00:00.000Z');
    expect(lireDateFichier('2026-09-28 15:41')).toBe('2026-09-28T15:41:00.000Z');
    expect(lireDateFichier('2026-09-28T15:41:00Z')).toBe('2026-09-28T15:41:00.000Z');
  });

  /*
   * ⚠ Une forme valide n'est pas une date réelle. `Date.UTC` reporte le 31 février au
   * 3 mars sans rien dire : la commande changerait de mois toute seule.
   */
  it('refuse une date qui n’existe pas au calendrier', () => {
    expect(lireDateFichier('31/02/2026')).toBeNull();
    expect(lireDateFichier('32/01/2026')).toBeNull();
    expect(lireDateFichier('01/13/2026')).toBeNull();
    expect(lireDateFichier('29/02/2025')).toBeNull();
    // 2028 est bissextile : celle-là existe.
    expect(lireDateFichier('29/02/2028')).toBe('2028-02-29T00:00:00.000Z');
  });

  it('refuse une heure impossible', () => {
    expect(lireDateFichier('28/09/2026 25:00')).toBeNull();
    expect(lireDateFichier('28/09/2026 12:61')).toBeNull();
  });

  it('refuse une année hors du plausible plutôt que de l’enregistrer', () => {
    // ⚠ Ce projet a déjà écrit 68 bons à l'an 0026 avec un champ de date sans bornes.
    expect(lireDateFichier('28/09/0026')).toBeNull();
    expect(lireDateFichier('0026-09-28')).toBeNull();
  });

  it('rend null sur une cellule vide ou qui n’est pas une date', () => {
    expect(lireDateFichier('')).toBeNull();
    expect(lireDateFichier('   ')).toBeNull();
    expect(lireDateFichier(null)).toBeNull();
    expect(lireDateFichier('N/A')).toBeNull();
    expect(lireDateFichier('hier')).toBeNull();
  });

  it('tolère ce qui traîne autour de la date', () => {
    expect(lireDateFichier('  28/09/2026 15:41  ')).toBe('2026-09-28T15:41:00.000Z');
    expect(lireDateFichier('28/09/2026 15:41 (livrée)')).toBe('2026-09-28T15:41:00.000Z');
  });
});

describe('compterDatesIllisibles', () => {
  it('ne compte QUE les cellules remplies et illisibles', () => {
    expect(
      compterDatesIllisibles(['28/09/2026', '', null, 'hier', '2026-09-28', 'N/A', '   ']),
    ).toBe(2);
  });

  it('rend zéro quand la colonne n’est pas rattachée', () => {
    expect(compterDatesIllisibles(['', '', ''])).toBe(0);
  });
});
