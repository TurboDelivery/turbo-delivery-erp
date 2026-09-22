'use client';

import { useQuery } from '@tanstack/react-query';

import { entreeCaisseAPI } from '@/features/entrees-caisse/apis/entree-caisse.api';
import type { IEntreeCaisse } from '@/features/entrees-caisse/types/entree-caisse.types';

/**
 * Les autres composantes du CA de la periode du releve.
 *
 * <h3>Pourquoi elles manquaient a cet ecran</h3>
 * <p>Une prestation hors livraison entre dans le chiffre d'affaires sans condition, et elle
 * gonfle donc la carte « Encours » du tableau de bord, qui vaut CA moins encaisse. Mais
 * l'ecran fait pour verifier ce qui reste a encaisser ne lit que les factures : une
 * prestation non payee etait comptee dans un total sans pouvoir etre vue nulle part.</p>
 *
 * <p>La lecture se fait sur les MEMES bornes que le releve, l'annee et, s'il est pose, le
 * mois. Les deux bornes sont obligatoires : le serveur lit par un intervalle qui ne tolere
 * pas de borne nulle.</p>
 *
 * <p>⚠ Une prestation n'est rattachee a AUCUN partenaire : la table ne porte pas de tiers.
 * Des qu'un filtre partenaire, cycle ou point de vente est pose, cette liste n'a plus de
 * sens dans le perimetre affiche, et l'ecran le dit au lieu de melanger.</p>
 */
export function usePrestationsEncours(annee: number, mois: number | null) {
  const debut = mois
    ? `${annee}-${String(mois).padStart(2, '0')}-01`
    : `${annee}-01-01`;
  const fin = mois
    ? new Date(Date.UTC(annee, mois, 0)).toISOString().slice(0, 10)
    : `${annee}-12-31`;

  return useQuery<IEntreeCaisse[]>({
    queryKey: ['encours', 'prestations', debut, fin],
    queryFn: () => entreeCaisseAPI.lister({ debut, fin }),
    staleTime: 60_000,
  });
}

/**
 * Début de l'historique exploitable.
 *
 * <p>Les bornes larges sont EXPLICITES et non omises : sur cette famille
 * d'endpoints, une borne absente ne veut pas dire « tout », elle rend zéro. Le
 * même écueil avait été rencontré sur les statistiques d'investissements.</p>
 */
const DEBUT_HISTORIQUE = '2024-01-01';

/**
 * Les autres composantes du CA, TOUTES périodes confondues.
 *
 * <p>Le bandeau de tête est une vue globale : y verser des prestations bornées
 * à l'année et au mois du filtre fabriquerait un total dont une moitié serait
 * filtrée et l'autre non. Celles-ci ne le sont pas.</p>
 *
 * <p>Fenêtre large côté client plutôt qu'un agrégat serveur : la table compte
 * onze lignes en production, mesurées le 22/09/2026. Le jour où elle en
 * comptera des milliers, ce choix devra être revu — c'est écrit ici pour qu'on
 * s'en souvienne.</p>
 */
export function usePrestationsGlobales() {
  const fin = `${new Date().getFullYear()}-12-31`;

  return useQuery<IEntreeCaisse[]>({
    queryKey: ['encours', 'prestations', 'global', DEBUT_HISTORIQUE, fin],
    queryFn: () => entreeCaisseAPI.lister({ debut: DEBUT_HISTORIQUE, fin }),
    staleTime: 5 * 60 * 1000,
  });
}

/** Ce que le bandeau et l'onglet annoncent, calcule une seule fois. */
export function resumerPrestations(lignes: IEntreeCaisse[] | undefined) {
  const toutes = lignes ?? [];
  const aEncaisser = toutes.filter((l) => !l.paye);
  return {
    aEncaisser,
    montantAEncaisser: aEncaisser.reduce((t, l) => t + (Number(l.montant) || 0), 0),
    montantTotal: toutes.reduce((t, l) => t + (Number(l.montant) || 0), 0),
    nb: toutes.length,
    nbAEncaisser: aEncaisser.length,
    toutes,
  };
}
