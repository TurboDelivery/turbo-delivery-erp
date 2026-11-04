import { describe, expect, it } from 'vitest';

import { formatSemaineLabel } from '@/lib/week.utils';

/*
 * Ce libelle a menti en production : la semaine 44 de 2026 s'affichait « Semaine du 26 au 1
 * Octobre 2026 » dans le selecteur, alors que le titre de la meme page annoncait « 26 Oct.
 * au 1 Nov. ». Le defaut tenait en une ligne : seul le mois du LUNDI etait lu.
 *
 * Les trois cas ci-dessous sont les trois formes possibles d'une semaine, et le troisieme
 * est celui qu'on ne voit qu'une fois par an.
 */
describe('formatSemaineLabel', () => {
  it('ecrit le mois une seule fois quand la semaine y tient', () => {
    expect(formatSemaineLabel('2026-10-19', '2026-10-25')).toBe('Semaine du 19 au 25 Octobre 2026');
  });

  it('nomme les DEUX mois quand la semaine est a cheval', () => {
    expect(formatSemaineLabel('2026-10-26', '2026-11-01')).toBe('Semaine du 26 Oct. au 1 Nov. 2026');
  });

  it('nomme les DEUX annees au passage du nouvel an', () => {
    expect(formatSemaineLabel('2025-12-29', '2026-01-04')).toBe(
      'Semaine du 29 Déc. 2025 au 4 Janv. 2026',
    );
  });
});
