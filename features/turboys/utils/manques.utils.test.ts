import { describe, expect, it } from 'vitest';

import type { IJourProgramme, IProgramme } from '../types/programme.types';
import { manquesProgramme, puceSitesDesservis } from './manques.utils';

const jour = (p: Partial<IJourProgramme> = {}): IJourProgramme => ({ actif: true, debut: '10:00', fin: '23:00', jour: 'LUNDI', montantCarburant: 5000, ...p });

const programme = (p: Partial<IProgramme> = {}): IProgramme => ({
  accepteLe: null,
  annee: 2026,
  id: 'p1',
  jours: [jour()],
  livreurId: 'l1',
  livreurNom: 'TOURE Bakary',
  motifRefus: null,
  nbRelances: 0,
  publieLe: null,
  refuseLe: null,
  semaine: 48,
  siteId: 's1',
  source: null,
  statut: 'BROUILLON',
  typeLivreur: 'JOURNALIER',
  ...p,
});

const cles = (p: IProgramme) => manquesProgramme(p).map((m) => m.cle);

describe('ce qui manque à un programme', () => {
  it('un programme complet ne manque de rien', () => {
    expect(manquesProgramme(programme())).toEqual([]);
  });

  it('un journalier sans site : « Site à renseigner », en rouge', () => {
    expect(manquesProgramme(programme({ siteId: null }))).toEqual([{ cle: 'SITE', libelle: 'Site à renseigner', ton: 'danger' }]);
  });

  it('un superviseur-livreur sans base : « Bases à renseigner », et pas « Site »', () => {
    const p = programme({ siteId: null, typeLivreur: 'SUPERVISEUR_LIVREUR' });
    expect(cles(p)).toEqual(['BASES']);
    expect(manquesProgramme(p)[0].libelle).toBe('Bases à renseigner');
  });

  it('un superviseur-livreur qui gère une base n\'a pas besoin de site', () => {
    const p = programme({
      complement: { basesGerees: ['s1'], preuvesParJour: {}, sitesDesservis: [], sitesParJour: {}, surplusParJour: {} },
      siteId: null,
      typeLivreur: 'SUPERVISEUR_LIVREUR',
    });
    expect(cles(p)).toEqual([]);
  });

  it('aucun jour travaillé : « Horaires à renseigner », et « Sans carburant »', () => {
    expect(cles(programme({ jours: [jour({ actif: false, montantCarburant: null })] }))).toEqual(['HORAIRES', 'CARBURANT']);
  });

  it('un jour travaillé sans heure de descente : « Horaires à renseigner »', () => {
    expect(cles(programme({ jours: [jour({ fin: null })] }))).toEqual(['HORAIRES']);
  });

  it('aucun montant : « Sans carburant », en orange', () => {
    expect(manquesProgramme(programme({ jours: [jour({ montantCarburant: null })] }))).toEqual([
      { cle: 'CARBURANT', libelle: 'Sans carburant', ton: 'warning' },
    ]);
  });

  it('⚠ un montant figé par le serveur vaut carburant, même si les jours n\'en portent plus', () => {
    expect(cles(programme({ jours: [jour({ montantCarburant: null })], montantCarburantHebdo: 30000, statut: 'NOTIFIE' }))).toEqual([]);
  });

  it('tout manque à la fois, dans l\'ordre de la saisie : où, quand, avec quel carburant', () => {
    expect(cles(programme({ jours: [], siteId: null }))).toEqual(['SITE', 'HORAIRES', 'CARBURANT']);
  });
});

describe('les puces des sites desservis', () => {
  it('deux sites : deux puces, rien au survol', () => {
    expect(puceSitesDesservis(['ANGRÉ', 'FAYA'])).toEqual({ puces: ['ANGRÉ', 'FAYA'], reste: [] });
  });
  it('quatre sites : deux puces et « +2 »', () => {
    expect(puceSitesDesservis(['ANGRÉ', 'FAYA', 'COCODY', 'MARCORY'])).toEqual({ puces: ['ANGRÉ', 'FAYA'], reste: ['COCODY', 'MARCORY'] });
  });
  it('aucun site : rien', () => {
    expect(puceSitesDesservis([])).toEqual({ puces: [], reste: [] });
  });
});
