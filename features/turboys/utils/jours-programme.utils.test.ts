import { describe, expect, it } from 'vitest';

import { IJourProgramme } from '@/features/turboys/types/programme.types';

import { anomaliesJours, dureeMinutes, finitApresMinuit, heuresSemaine } from './jours-programme.utils';

const jour = (p: Partial<IJourProgramme> = {}): IJourProgramme => ({
  actif: true,
  date: null,
  debut: '10:00',
  fin: '23:00',
  jour: 'LUNDI',
  montantCarburant: 3000,
  ...p,
});

describe('durée d’un jour de service', () => {
  it('compte les heures d’un service ordinaire', () => {
    expect(dureeMinutes(jour({ debut: '10:00', fin: '23:00' }))).toBe(13 * 60);
  });

  it('compte un service qui finit APRÈS MINUIT, au lieu de rendre un négatif', () => {
    // 11:00 → 00:00 dure treize heures, pas moins onze. C'est le cas de Kevin Bozo dans
    // la spec, « 11:00–00:00 +1 », et une soustraction naïve donnerait -660 minutes :
    // une semaine de nuit afficherait un total d'heures négatif.
    expect(dureeMinutes(jour({ debut: '11:00', fin: '00:00' }))).toBe(13 * 60);
    expect(dureeMinutes(jour({ debut: '22:00', fin: '06:00' }))).toBe(8 * 60);
  });

  it('rend zéro quand une heure manque, plutôt que NaN', () => {
    expect(dureeMinutes(jour({ debut: null }))).toBe(0);
    expect(dureeMinutes(jour({ fin: '8:' }))).toBe(0);
  });

  it('reconnaît une fin après minuit, y compris à l’heure pile', () => {
    expect(finitApresMinuit(jour({ debut: '11:00', fin: '00:00' }))).toBe(true);
    expect(finitApresMinuit(jour({ debut: '10:00', fin: '23:00' }))).toBe(false);
    // Même heure de montée et de descente : c'est une erreur de saisie, pas un service
    // de vingt-quatre heures. Le contrôle la refuse ; ici on constate seulement que la
    // durée n'est pas comptée comme un tour d'horloge.
    expect(finitApresMinuit(jour({ debut: '10:00', fin: '10:00' }))).toBe(true);
  });
});

describe('total d’heures de la semaine', () => {
  it('n’additionne que les jours travaillés', () => {
    const semaine = [
      jour({ debut: '10:00', fin: '23:00', jour: 'LUNDI' }),
      jour({ actif: false, jour: 'MARDI' }),
      jour({ debut: '11:00', fin: '00:00', jour: 'MERCREDI' }),
    ];
    expect(heuresSemaine(semaine)).toBe(26);
  });

  it('rend zéro sur une semaine entièrement au repos', () => {
    expect(heuresSemaine([jour({ actif: false }), jour({ actif: false, jour: 'MARDI' })])).toBe(0);
  });
});

describe('contrôles de saisie', () => {
  it('ne dit rien d’un jour de repos, même incomplet', () => {
    const a = anomaliesJours([jour({ actif: false, debut: null, montantCarburant: null })], {}, 2);
    expect(a).toHaveLength(0);
  });

  it('bloque une descente à la même heure que la montée', () => {
    const a = anomaliesJours([jour({ debut: '10:00', fin: '10:00' })], { LUNDI: ['s1'] }, 2);
    expect(a.filter((x) => x.bloquante)).toHaveLength(1);
    expect(a[0].message).toContain('descente');
  });

  it('bloque un jour travaillé sans site quand il y a un choix à faire', () => {
    const a = anomaliesJours([jour()], {}, 2);
    expect(a.some((x) => x.bloquante && x.message.includes('Aucun site'))).toBe(true);
  });

  it('ne bloque PAS sans site quand un seul site existe : la base est cochée d’office', () => {
    const a = anomaliesJours([jour()], {}, 1);
    expect(a.filter((x) => x.bloquante)).toHaveLength(0);
  });

  it('avertit sans bloquer sur un jour travaillé à zéro franc', () => {
    // La spec le dit expressément : « jour travaillé à 0 FCFA (avertissement « Sans
    // carburant », non bloquant) ». Le carburant se saisit parfois après le planning.
    const a = anomaliesJours([jour({ montantCarburant: 0 })], { LUNDI: ['s1'] }, 2);
    expect(a).toHaveLength(1);
    expect(a[0].bloquante).toBe(false);
    expect(a[0].message).toBe('Sans carburant.');
  });

  it('avertit aussi quand le montant est absent, pas seulement quand il vaut zéro', () => {
    const a = anomaliesJours([jour({ montantCarburant: null })], { LUNDI: ['s1'] }, 2);
    expect(a.map((x) => x.message)).toEqual(['Sans carburant.']);
  });
});
