import { describe, expect, it } from 'vitest';

import { COMPLEMENT_VIDE, type IProgramme } from '@/features/turboys/types/programme.types';
import {
  aRecuUnSurplus,
  basesDuJour,
  couvertureSemaine,
  JOURS_SEMAINE,
  sitesDuJour,
} from '@/features/turboys/utils/couverture.utils';

/**
 * La couverture : ce que personne ne recompte.
 *
 * Une case qui affiche 2 au lieu de 3 ne lève aucune erreur et ne se voit pas à l'écran.
 * C'est la raison d'être de ce fichier.
 */

const programme = (p: Partial<IProgramme> & { livreurId: string }): IProgramme =>
  ({
    annee: 2026,
    complement: { ...COMPLEMENT_VIDE },
    id: `prog-${p.livreurId}`,
    jours: JOURS_SEMAINE.map((j) => ({ actif: true, jour: j })),
    semaine: 48,
    statut: 'NOTIFIE',
    typeLivreur: 'JOURNALIER',
    ...p,
  }) as IProgramme;

/** Un programme dont seuls les jours nommés sont travaillés. */
const avecJours = (actifs: string[]) =>
  JOURS_SEMAINE.map((j) => ({ actif: actifs.includes(j), jour: j }));

describe('couvertureSemaine', () => {
  it('ne compte rien sans programme', () => {
    const c = couvertureSemaine([]);
    expect(c.lignes).toHaveLength(0);
    expect(c.trous).toBe(0);
    expect(c.sitesCouverts).toBe(0);
    expect(c.sitesAuProgramme).toBe(0);
  });

  it('compte un livreur sur sa base les sept jours : aucun trou', () => {
    const c = couvertureSemaine([programme({ livreurId: 'l1', siteId: 'yopougon' })]);

    expect(c.sitesAuProgramme).toBe(1);
    expect(c.lignes[0].parJour.LUNDI).toBe(1);
    expect(c.lignes[0].parJour.DIMANCHE).toBe(1);
    expect(c.trous).toBe(0);
    expect(c.sitesCouverts).toBe(1);
  });

  it("le jour de repos d'un livreur seul est un trou", () => {
    const c = couvertureSemaine([
      programme({ jours: avecJours(['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']), livreurId: 'l1', siteId: 'yopougon' }),
    ]);

    expect(c.lignes[0].parJour.DIMANCHE).toBe(0);
    expect(c.trous).toBe(1);
    expect(c.sitesCouverts).toBe(0);
  });

  /**
   * C'est l'exemple que la spec donne elle-même : quatre programmes, chaque titulaire
   * prend son repos un jour du lundi au jeudi, et Yopougon a 3 livreurs du lundi au jeudi
   * puis 4 du vendredi au dimanche. Le test le vérifie case par case.
   */
  it('reproduit le comptage de la semaine 48 décrit par la spec', () => {
    const repos = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI'];
    const c = couvertureSemaine(
      repos.map((jourDeRepos, i) =>
        programme({
          jours: avecJours(JOURS_SEMAINE.filter((j) => j !== jourDeRepos)),
          livreurId: `l${i}`,
          siteId: 'yopougon',
        }),
      ),
    );

    expect(c.lignes[0].parJour.LUNDI).toBe(3);
    expect(c.lignes[0].parJour.JEUDI).toBe(3);
    expect(c.lignes[0].parJour.VENDREDI).toBe(4);
    expect(c.lignes[0].parJour.DIMANCHE).toBe(4);
    expect(c.trous).toBe(0);
  });

  it('un superviseur-livreur ne compte dans les présents d’aucun site (CA-43)', () => {
    const c = couvertureSemaine([
      programme({
        complement: { ...COMPLEMENT_VIDE, basesGerees: ['angre', 'yopougon'] },
        livreurId: 'othe',
        typeLivreur: 'SUPERVISEUR_LIVREUR',
      }),
    ]);

    // Ni présence comptée, ni site déclaré à couvrir de son fait.
    expect(c.sitesAuProgramme).toBe(0);
    expect(c.trous).toBe(0);
  });

  it('un site desservi un seul jour reste une ligne, et ses six autres jours sont des trous', () => {
    const c = couvertureSemaine([
      programme({
        complement: { ...COMPLEMENT_VIDE, sitesDesservis: ['angre'], sitesParJour: { MERCREDI: ['angre'] } },
        livreurId: 'l1',
        siteId: 'yopougon',
      }),
    ]);

    const angre = c.lignes.find((l) => l.siteId === 'angre');
    expect(angre).toBeDefined();
    expect(angre!.parJour.MERCREDI).toBe(1);
    expect(angre!.trous).toBe(6);

    // Et le mercredi, le livreur n'est PLUS compté sur sa base : les sites du jour
    // remplacent la base, ils ne s'y ajoutent pas.
    const yop = c.lignes.find((l) => l.siteId === 'yopougon');
    expect(yop!.parJour.MERCREDI).toBe(0);
    expect(yop!.parJour.MARDI).toBe(1);
  });

  it('compte un livreur une seule fois par case, même si le site est répété', () => {
    const c = couvertureSemaine([
      programme({
        complement: { ...COMPLEMENT_VIDE, sitesParJour: { LUNDI: ['angre', 'angre'] } },
        livreurId: 'l1',
        siteId: 'angre',
      }),
    ]);

    expect(c.lignes.find((l) => l.siteId === 'angre')!.parJour.LUNDI).toBe(1);
  });

  it('liste les livreurs de chaque case : le clic sur une case doit pouvoir les nommer', () => {
    const c = couvertureSemaine([
      programme({ livreurId: 'ali', siteId: 'yopougon' }),
      programme({ livreurId: 'bea', siteId: 'yopougon' }),
    ]);

    expect(c.lignes[0].livreursParJour.LUNDI).toEqual(['ali', 'bea']);
  });

  it('un programme sans site n’invente pas de ligne', () => {
    const c = couvertureSemaine([programme({ livreurId: 'l1', siteId: null })]);
    expect(c.sitesAuProgramme).toBe(0);
  });

  it('additionne les trous de plusieurs sites', () => {
    const c = couvertureSemaine([
      programme({ jours: avecJours(['LUNDI']), livreurId: 'l1', siteId: 'a' }),
      programme({ jours: avecJours(['LUNDI', 'MARDI']), livreurId: 'l2', siteId: 'b' }),
    ]);

    expect(c.trous).toBe(6 + 5);
    expect(c.sitesAuProgramme).toBe(2);
    expect(c.sitesCouverts).toBe(0);
  });
});

describe('sitesDuJour', () => {
  it('rend les sites du jour quand ils sont renseignés', () => {
    const p = programme({
      complement: { ...COMPLEMENT_VIDE, sitesParJour: { LUNDI: ['a', 'b'] } },
      livreurId: 'l1',
      siteId: 'base',
    });
    expect(sitesDuJour(p, 'LUNDI')).toEqual(['a', 'b']);
  });

  it('retombe sur la base quand le jour ne coche rien (RG-S03)', () => {
    const p = programme({ livreurId: 'l1', siteId: 'base' });
    expect(sitesDuJour(p, 'LUNDI')).toEqual(['base']);
  });

  it('une liste VIDE n’est pas un choix : elle retombe sur la base', () => {
    const p = programme({
      complement: { ...COMPLEMENT_VIDE, sitesParJour: { LUNDI: [] } },
      livreurId: 'l1',
      siteId: 'base',
    });
    expect(sitesDuJour(p, 'LUNDI')).toEqual(['base']);
  });

  it('rend une liste vide sans base ni sites du jour', () => {
    expect(sitesDuJour(programme({ livreurId: 'l1', siteId: null }), 'LUNDI')).toEqual([]);
  });
});

describe('basesDuJour (CA-44)', () => {
  it('« 2 bases sur 3 » quand le jour n’en coche que deux', () => {
    const p = programme({
      complement: { ...COMPLEMENT_VIDE, basesGerees: ['a', 'b', 'c'], sitesParJour: { MERCREDI: ['a', 'b'] } },
      livreurId: 'othe',
      typeLivreur: 'SUPERVISEUR_LIVREUR',
    });

    expect(basesDuJour(p, 'MERCREDI')).toEqual({ total: 3, tenues: 2 });
  });

  it('toutes les bases quand le jour ne précise rien', () => {
    const p = programme({
      complement: { ...COMPLEMENT_VIDE, basesGerees: ['a', 'b', 'c'] },
      livreurId: 'othe',
      typeLivreur: 'SUPERVISEUR_LIVREUR',
    });

    expect(basesDuJour(p, 'MERCREDI')).toEqual({ total: 3, tenues: 3 });
  });
});

describe('aRecuUnSurplus', () => {
  const surplus = (annuleLe: string | null) => ({
    annule: annuleLe !== null,
    annuleLe,
    id: 's1',
    jour: 'LUNDI',
    montant: 1500,
    motif: 'RENFORT_AUTRE_SITE' as const,
    siteId: 'a',
  });

  it('vrai avec un surplus vivant', () => {
    const p = programme({ complement: { ...COMPLEMENT_VIDE, surplusParJour: { LUNDI: [surplus(null)] } }, livreurId: 'l1' });
    expect(aRecuUnSurplus(p)).toBe(true);
  });

  it('faux quand le seul surplus est annulé : il reste visible ailleurs, pas ici', () => {
    const p = programme({
      complement: { ...COMPLEMENT_VIDE, surplusParJour: { LUNDI: [surplus('2026-11-24T10:00:00Z')] } },
      livreurId: 'l1',
    });
    expect(aRecuUnSurplus(p)).toBe(false);
  });

  it('faux sans surplus', () => {
    expect(aRecuUnSurplus(programme({ livreurId: 'l1' }))).toBe(false);
  });
});
