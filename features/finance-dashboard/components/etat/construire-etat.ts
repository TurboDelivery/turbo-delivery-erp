import { format } from 'date-fns';

import type { SectionEtat } from './etat-financier';

/**
 * Construit les lignes de l'etat financier a partir des reponses du service.
 *
 * <p>C'est ici que vit le CONTRAT avec l'ecran precedent : les quinze liens de detail,
 * avec leur periode deja appliquee, sont repris un a un. Les extraire de la vue permet
 * de les verifier d'un coup d'œil et de rendre l'ecran avec un jeu d'exemple, sans
 * session ni appel reseau.</p>
 *
 * <p>Les valeurs a `null` ne sont pas des zeros : le service ne fournit pas les
 * decompositions sur le cumul. La vue les ecrit « — ».</p>
 */

export interface EntreesEtat {
    /** `/api/finance/global/stats` sur la plage choisie. */
    statsGlobales?: {
        chiffreAffaire: number;
        fraisLivraison: number;
        commission: number;
        commissionFixe: number;
        commissionPourcentage: number;
        depenses: number;
    } | null;
    /** Meme requete, plage precedente de meme duree. Absente = pas d'ecart affiche. */
    statsPeriodePrecedente?: {
        chiffreAffaire: number;
        depenses: number;
    } | null;
    resume?: {
        totalDepenses: number;
        totalRevenus: number;
        totalInvestissements: number;
        totalFacturesEnCours: number;
        totalFacturesEnCoursCumule: number;
        totalDepensesCumule: number;
        margeCumule: number;
        chiffreAffaireCumule: number;
    } | null;
    depenses?: { totalRecurrentes: number; totalNonRecurrentes: number } | null;
    debut?: Date;
    fin?: Date;
}

/** L'application demarre en 2024 : c'est la borne basse du cumul. */
const DEBUT_HISTORIQUE = '2024-01-01';

const iso = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : '');

export function construireEtat({
    statsGlobales,
    statsPeriodePrecedente,
    resume,
    depenses,
    debut,
    fin,
}: EntreesEtat): SectionEtat[] {
    // Les memes chaines de requete que l'ecran precedent, pour que les pages de detail
    // s'ouvrent sur la periode qu'on regardait.
    const qsPeriode = debut && fin ? `?debut=${iso(debut)}&fin=${iso(fin)}` : '';
    const qsFactures =
        debut && fin ? `?tab=factures&fPeriodeDebut=${iso(debut)}&fPeriodeFin=${iso(fin)}` : '';
    const qsFacturesCumul = `?tab=factures&fPeriodeDebut=${DEBUT_HISTORIQUE}&fPeriodeFin=${format(
        // Une date fixe est passee par l'appelant en prevalisation ; ici la borne haute
        // du cumul est simplement « aujourd'hui ».
        fin ?? new Date(),
        'yyyy-MM-dd',
    )}`;

    const ca = statsGlobales?.chiffreAffaire ?? null;
    const totalDepenses = resume?.totalDepenses ?? null;
    const resultat = ca !== null && totalDepenses !== null ? ca - totalDepenses : null;

    const caPrecedent = statsPeriodePrecedente?.chiffreAffaire;
    const depensesPrecedentes = statsPeriodePrecedente?.depenses;
    const resultatPrecedent =
        caPrecedent !== undefined && depensesPrecedentes !== undefined
            ? caPrecedent - depensesPrecedentes
            : undefined;

    return [
        {
            titre: 'Produits',
            lignes: [
                {
                    cle: 'ca',
                    libelle: "Chiffre d'affaires",
                    niveau: 0,
                    periode: { valeur: ca, href: `/finance/revenue${qsPeriode}`, intitule: "Voir le chiffre d'affaires de la période" },
                    cumul: { valeur: resume?.chiffreAffaireCumule ?? null, href: '/finance/revenue', intitule: "Voir le cumul du chiffre d'affaires" },
                    reference: caPrecedent,
                    sens: 'favorable',
                },
                {
                    cle: 'frais',
                    libelle: 'Frais de livraison',
                    niveau: 1,
                    periode: { valeur: statsGlobales?.fraisLivraison ?? null, href: `/finance/revenue${qsPeriode}` },
                    cumul: { valeur: null },
                },
                {
                    cle: 'commissions',
                    libelle: 'Commissions',
                    niveau: 1,
                    periode: { valeur: statsGlobales?.commission ?? null, href: `/finance/revenue${qsPeriode}` },
                    cumul: { valeur: null },
                },
                {
                    cle: 'commission-fixe',
                    libelle: 'dont commission fixe',
                    niveau: 2,
                    periode: { valeur: statsGlobales?.commissionFixe ?? null },
                    cumul: { valeur: null },
                },
                {
                    cle: 'commission-pourcentage',
                    libelle: 'dont commission au pourcentage',
                    niveau: 2,
                    periode: { valeur: statsGlobales?.commissionPourcentage ?? null },
                    cumul: { valeur: null },
                },
            ],
        },
        {
            titre: 'Charges',
            lignes: [
                {
                    cle: 'depenses',
                    libelle: 'Total des dépenses',
                    niveau: 0,
                    periode: { valeur: totalDepenses, href: '/finance/dashboard', intitule: 'Voir les dépenses de la période' },
                    cumul: { valeur: resume?.totalDepensesCumule ?? null, href: '/finance/dashboard', intitule: 'Voir toutes les dépenses' },
                    reference: depensesPrecedentes,
                    sens: 'defavorable',
                },
                {
                    cle: 'charges-fixes',
                    libelle: 'Charges fixes',
                    niveau: 1,
                    periode: { valeur: depenses?.totalRecurrentes ?? null, href: '/finance/dashboard' },
                    cumul: { valeur: null },
                },
                {
                    cle: 'charges-variables',
                    libelle: 'Charges variables',
                    niveau: 1,
                    periode: { valeur: depenses?.totalNonRecurrentes ?? null, href: '/finance/dashboard' },
                    cumul: { valeur: null },
                },
                {
                    cle: 'resultat',
                    libelle: 'Résultat',
                    niveau: 0,
                    total: true,
                    periode: { valeur: resultat, href: '/finance/analyse-rentabilite', intitule: "Voir l'analyse de rentabilité" },
                    cumul: { valeur: resume?.margeCumule ?? null, href: '/finance/analyse-rentabilite', intitule: "Voir l'analyse de rentabilité" },
                    reference: resultatPrecedent,
                    sens: 'favorable',
                },
            ],
        },
        {
            titre: 'Trésorerie',
            lignes: [
                {
                    cle: 'encaisse',
                    libelle: 'Revenus encaissés',
                    niveau: 0,
                    periode: { valeur: resume?.totalRevenus ?? null, href: `/finance/recouvrement${qsPeriode}`, intitule: 'Voir les recouvrements de la période' },
                    cumul: { valeur: null },
                },
                {
                    cle: 'encours',
                    libelle: 'Encours',
                    niveau: 0,
                    periode: { valeur: resume?.totalFacturesEnCours ?? null, href: `/finance/recouvrement${qsFactures}`, intitule: 'Voir les factures en cours de la période' },
                    cumul: { valeur: resume?.totalFacturesEnCoursCumule ?? null, href: `/finance/recouvrement${qsFacturesCumul}`, intitule: 'Voir toutes les factures en cours' },
                },
                {
                    cle: 'investissements',
                    libelle: 'Investissements',
                    niveau: 0,
                    periode: { valeur: resume?.totalInvestissements ?? null, href: `/finance/revenue/investissement${qsPeriode}`, intitule: 'Voir les investissements de la période' },
                    cumul: { valeur: null },
                },
            ],
        },
    ];
}
