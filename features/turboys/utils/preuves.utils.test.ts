import { describe, expect, it } from 'vitest';

import { COMPLEMENT_VIDE, type IProgramme } from '@/features/turboys/types/programme.types';
import { preuvesDuJour, preuvesManquantes } from '@/features/turboys/utils/preuves.utils';

/**
 * L'état des preuves décide d'une COULEUR sur trente-huit lignes. Un vert mis à tort sur
 * un jour non prouvé passe inaperçu, et la comptabilité découvre le trou en fin de mois.
 */

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'] as const;

const prog = (over: Partial<IProgramme>): IProgramme =>
  ({
    annee: 2026,
    complement: { ...COMPLEMENT_VIDE },
    id: 'p1',
    jours: JOURS.map((j) => ({ actif: true, jour: j, montantCarburant: 3000 })),
    livreurId: 'l1',
    semaine: 48,
    statut: 'NOTIFIE',
    ...over,
  }) as IProgramme;

const surplus = (id: string, annule = false) => ({
  annule,
  annuleLe: null,
  id,
  jour: 'LUNDI',
  montant: 2000,
  motif: 'RENFORT_AUTRE_SITE' as const,
  siteId: 's1',
});

const preuve = (surplusId: string | null, statut: 'RECUE' | 'VALIDEE' | 'REJETEE') => ({
  envoyeLe: '2026-11-23T08:00:00Z',
  fichierUrl: '/u/x.jpg',
  id: `pr-${surplusId ?? 'dot'}-${statut}`,
  jour: 'LUNDI',
  statut,
  surplusId,
});

describe('preuvesDuJour', () => {
  it('sans objet un jour de repos : un œil gris s’y lirait comme un manque', () => {
    const p = prog({ jours: JOURS.map((j) => ({ actif: j !== 'LUNDI', jour: j, montantCarburant: 3000 })) });
    expect(preuvesDuJour(p, 'LUNDI').etat).toBe('SANS_OBJET');
  });

  it('sans objet un jour sans dotation ni surplus : rien n’a été versé', () => {
    const p = prog({ jours: JOURS.map((j) => ({ actif: true, jour: j, montantCarburant: null })) });
    expect(preuvesDuJour(p, 'LUNDI').etat).toBe('SANS_OBJET');
  });

  it('aucune preuve pour une dotation : gris, 0/1', () => {
    const e = preuvesDuJour(prog({}), 'LUNDI');
    expect(e).toMatchObject({ attendues: 1, etat: 'AUCUNE', recues: 0 });
  });

  it('la dotation prouvée : vert, 1/1', () => {
    const p = prog({ complement: { ...COMPLEMENT_VIDE, preuvesParJour: { LUNDI: [preuve(null, 'RECUE')] } } });
    expect(preuvesDuJour(p, 'LUNDI')).toMatchObject({ attendues: 1, etat: 'COMPLETE', recues: 1 });
  });

  it('un surplus ajoute un versement attendu : « 1/2 » (RG-W02)', () => {
    const p = prog({
      complement: {
        ...COMPLEMENT_VIDE,
        preuvesParJour: { LUNDI: [preuve(null, 'RECUE')] },
        surplusParJour: { LUNDI: [surplus('s1')] },
      },
    });
    expect(preuvesDuJour(p, 'LUNDI')).toMatchObject({ attendues: 2, etat: 'PARTIELLE', recues: 1 });
  });

  it('les deux prouvées : vert, 2/2', () => {
    const p = prog({
      complement: {
        ...COMPLEMENT_VIDE,
        preuvesParJour: { LUNDI: [preuve(null, 'VALIDEE'), preuve('s1', 'RECUE')] },
        surplusParJour: { LUNDI: [surplus('s1')] },
      },
    });
    expect(preuvesDuJour(p, 'LUNDI')).toMatchObject({ attendues: 2, etat: 'COMPLETE', recues: 2, validees: 1 });
  });

  it('un surplus ANNULÉ n’attend aucune preuve', () => {
    const p = prog({
      complement: {
        ...COMPLEMENT_VIDE,
        preuvesParJour: { LUNDI: [preuve(null, 'RECUE')] },
        surplusParJour: { LUNDI: [surplus('s1', true)] },
      },
    });
    expect(preuvesDuJour(p, 'LUNDI')).toMatchObject({ attendues: 1, etat: 'COMPLETE' });
  });

  it('⚠ une capture REJETÉE ne prouve rien : le jour repasse gris (CA-54)', () => {
    const p = prog({ complement: { ...COMPLEMENT_VIDE, preuvesParJour: { LUNDI: [preuve(null, 'REJETEE')] } } });
    expect(preuvesDuJour(p, 'LUNDI')).toMatchObject({ etat: 'AUCUNE', recues: 0 });
  });

  /**
   * ⚠ Après un rejet suivi d'un nouveau dépôt, le jour porte DEUX captures pour UN
   * versement. Les compter toutes deux ferait un « 2/1 » absurde, et pire, pourrait
   * faire passer pour complet un jour qui ne l'est pas.
   */
  it('⚠ deux captures pour un seul versement comptent pour UNE', () => {
    const p = prog({
      complement: {
        ...COMPLEMENT_VIDE,
        preuvesParJour: { LUNDI: [preuve(null, 'REJETEE'), preuve(null, 'RECUE')] },
        surplusParJour: { LUNDI: [surplus('s1')] },
      },
    });
    expect(preuvesDuJour(p, 'LUNDI')).toMatchObject({ attendues: 2, etat: 'PARTIELLE', recues: 1 });
  });

  it('une preuve rattachée à un surplus inconnu est ignorée', () => {
    const p = prog({ complement: { ...COMPLEMENT_VIDE, preuvesParJour: { LUNDI: [preuve('fantome', 'RECUE')] } } });
    expect(preuvesDuJour(p, 'LUNDI')).toMatchObject({ attendues: 1, etat: 'AUCUNE', recues: 0 });
  });
});

describe('preuvesManquantes', () => {
  const avecDates = (dates: Record<string, string>) =>
    JOURS.map((j) => ({ actif: true, date: dates[j], jour: j, montantCarburant: 3000 }));

  it('⚠ ne compte pas les jours À VENIR : l’argent n’est pas encore versé', () => {
    const demain = new Date('2026-11-25');
    const p = prog({
      jours: avecDates({
        DIMANCHE: '2026-11-29',
        JEUDI: '2026-11-26',
        LUNDI: '2026-11-23',
        MARDI: '2026-11-24',
        MERCREDI: '2026-11-25',
        SAMEDI: '2026-11-28',
        VENDREDI: '2026-11-27',
      }),
    });

    // Lundi, mardi et mercredi sont passés ou en cours : trois dotations non prouvées.
    expect(preuvesManquantes(p, JOURS, demain)).toBe(3);
  });

  it('un jour prouvé ne manque plus', () => {
    const p = prog({
      complement: { ...COMPLEMENT_VIDE, preuvesParJour: { LUNDI: [preuve(null, 'VALIDEE')] } },
      jours: avecDates({
        DIMANCHE: '2026-11-29',
        JEUDI: '2026-11-26',
        LUNDI: '2026-11-23',
        MARDI: '2026-11-24',
        MERCREDI: '2026-11-25',
        SAMEDI: '2026-11-28',
        VENDREDI: '2026-11-27',
      }),
    });
    expect(preuvesManquantes(p, JOURS, new Date('2026-11-25'))).toBe(2);
  });

  it('un jour sans date n’est pas compté : on ne sait pas s’il est passé', () => {
    expect(preuvesManquantes(prog({}), JOURS, new Date('2026-11-25'))).toBe(0);
  });
});
