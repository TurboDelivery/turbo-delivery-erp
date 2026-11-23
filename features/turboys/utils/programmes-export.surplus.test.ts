import { describe, expect, it } from 'vitest';

import { COMPLEMENT_VIDE, type IProgramme } from '@/features/turboys/types/programme.types';
import {
  libellePreuves,
  preuvesExport,
  surplusExport,
  totalCarburantExport,
} from '@/features/turboys/utils/programmes-export.utils';

/**
 * Les colonnes carburant et preuves de l'export (§8.4).
 *
 * <p>Ce document est lu par la direction et par la comptabilité, et sert de pièce à un
 * décaissement. Une colonne fausse n'y lève rien : elle se découvre au rapprochement
 * bancaire, des semaines après.</p>
 */

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'] as const;

const AUJOURDHUI = new Date('2026-11-25T12:00:00Z');

const prog = (over: Partial<IProgramme>): IProgramme =>
  ({
    annee: 2026,
    complement: { ...COMPLEMENT_VIDE },
    id: 'p1',
    jours: JOURS.map((j, i) => ({
      actif: true,
      date: `2026-11-${23 + i}`,
      jour: j,
      montantCarburant: 3000,
    })),
    livreurId: 'l1',
    montantCarburantHebdo: 21000,
    semaine: 48,
    statut: 'NOTIFIE',
    ...over,
  }) as IProgramme;

const surplus = (id: string, montant: number, annule = false) => ({
  annule,
  id,
  jour: 'LUNDI',
  montant,
  motif: 'RENFORT_AUTRE_SITE' as const,
  siteId: 's1',
});

const preuve = (surplusId: string | null, statut: 'RECUE' | 'VALIDEE' | 'REJETEE') => ({
  envoyeLe: '2026-11-23T09:00:00Z',
  fichierUrl: '/u/x.jpg',
  id: `pr-${surplusId ?? 'dot'}-${statut}`,
  jour: 'LUNDI',
  statut,
  surplusId,
});

describe('surplusExport', () => {
  it('rend zéro sans surplus', () => {
    expect(surplusExport(prog({}))).toBe(0);
  });

  it('additionne les surplus vivants', () => {
    const p = prog({
      complement: { ...COMPLEMENT_VIDE, surplusParJour: { LUNDI: [surplus('a', 2000), surplus('b', 1500)] } },
    });
    expect(surplusExport(p)).toBe(3500);
  });

  it('⚠ ignore un surplus ANNULÉ : il ne coûte rien', () => {
    const p = prog({
      complement: { ...COMPLEMENT_VIDE, surplusParJour: { LUNDI: [surplus('a', 2000), surplus('b', 9000, true)] } },
    });
    expect(surplusExport(p)).toBe(2000);
  });
});

describe('totalCarburantExport', () => {
  it('dotation + surplus (RG-C04)', () => {
    const p = prog({
      complement: { ...COMPLEMENT_VIDE, surplusParJour: { LUNDI: [surplus('a', 2000)] } },
    });
    expect(totalCarburantExport(p)).toBe(23000);
  });

  it('la dotation seule quand il n’y a pas de surplus', () => {
    expect(totalCarburantExport(prog({}))).toBe(21000);
  });

  /**
   * ⚠ Un total à « 0 FCFA » dans un tableau comptable se lit comme une décision, alors
   * que la saisie n'a simplement pas été faite.
   */
  it('⚠ rend VIDE quand rien n’est saisi, pas zéro', () => {
    const p = prog({
      jours: JOURS.map((j, i) => ({ actif: true, date: `2026-11-${23 + i}`, jour: j, montantCarburant: null })),
      montantCarburantHebdo: null,
    });
    expect(totalCarburantExport(p)).toBe('');
  });

  it('rend le surplus seul quand la dotation manque', () => {
    const p = prog({
      complement: { ...COMPLEMENT_VIDE, surplusParJour: { LUNDI: [surplus('a', 2000)] } },
      jours: JOURS.map((j, i) => ({ actif: true, date: `2026-11-${23 + i}`, jour: j, montantCarburant: null })),
      montantCarburantHebdo: null,
    });
    expect(totalCarburantExport(p)).toBe(2000);
  });
});

describe('preuvesExport', () => {
  /** ⚠ Compter demain annoncerait à la direction un retard qui n’existe pas. */
  it('⚠ ne compte QUE les jours déjà passés', () => {
    const c = preuvesExport(prog({}), AUJOURDHUI);
    // Lundi 23, mardi 24, mercredi 25 : trois jours passés ou en cours.
    expect(c.attendues).toBe(3);
    expect(c.manquantes).toBe(3);
  });

  it('compte une capture reçue et une validée', () => {
    const p = prog({
      complement: { ...COMPLEMENT_VIDE, preuvesParJour: { LUNDI: [preuve(null, 'VALIDEE')] } },
    });
    const c = preuvesExport(p, AUJOURDHUI);
    expect(c).toMatchObject({ attendues: 3, manquantes: 2, recues: 1, validees: 1 });
  });

  it('⚠ une capture rejetée laisse le versement non prouvé', () => {
    const p = prog({
      complement: { ...COMPLEMENT_VIDE, preuvesParJour: { LUNDI: [preuve(null, 'REJETEE')] } },
    });
    expect(preuvesExport(p, AUJOURDHUI).recues).toBe(0);
  });

  it('un surplus passé ajoute un versement attendu', () => {
    const p = prog({
      complement: { ...COMPLEMENT_VIDE, surplusParJour: { LUNDI: [surplus('a', 2000)] } },
    });
    expect(preuvesExport(p, AUJOURDHUI).attendues).toBe(4);
  });

  it('un jour de repos n’attend rien', () => {
    const p = prog({
      jours: JOURS.map((j, i) => ({
        actif: j !== 'LUNDI',
        date: `2026-11-${23 + i}`,
        jour: j,
        montantCarburant: 3000,
      })),
    });
    expect(preuvesExport(p, AUJOURDHUI).attendues).toBe(2);
  });

  it('un jour sans date n’est pas compté : on ne sait pas s’il est passé', () => {
    const p = prog({ jours: JOURS.map((j) => ({ actif: true, jour: j, montantCarburant: 3000 })) });
    expect(preuvesExport(p, AUJOURDHUI).attendues).toBe(0);
  });
});

describe('libellePreuves', () => {
  it('rend vide quand rien n’est attendu : une colonne à « 0/0 » n’apprend rien', () => {
    expect(libellePreuves({ attendues: 0, manquantes: 0, recues: 0, validees: 0 })).toBe('');
  });

  it('dit le reçu, le validé, et le manquant', () => {
    expect(libellePreuves({ attendues: 4, manquantes: 1, recues: 3, validees: 2 })).toBe(
      '3/4 · 2 validées · 1 manquante',
    );
  });

  it('tait le manquant quand il n’y en a pas', () => {
    expect(libellePreuves({ attendues: 3, manquantes: 0, recues: 3, validees: 3 })).toBe('3/3 · 3 validées');
  });

  it('accorde le singulier', () => {
    expect(libellePreuves({ attendues: 2, manquantes: 1, recues: 1, validees: 1 })).toBe(
      '1/2 · 1 validée · 1 manquante',
    );
  });
});
