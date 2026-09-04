import type { IFinanceResume } from '@/features/finance-dashboard/types/finance-resume.type';
import type { IDashboardStatsResponse } from '@/features/dashboard/types/personnel.types';

/**
 * Jeux de donnees pour la prevalisation du tableau de bord.
 *
 * <p>Toutes les regressions visuelles de ce projet ont ete trouvees par un humain qui
 * regardait l'ecran, jamais par un outil : `tsc` a 0 et un build vert ne prouvent rien
 * sur une interface. Or les ecrans du tableau de bord sont derriere l'authentification,
 * donc invisibles sans session.</p>
 *
 * <p>Ces jeux permettent de rendre l'ecran hors authentification, sur une route de
 * prevalisation, et donc de le VOIR — y compris dans les etats qu'on oublie de
 * regarder : le chargement, l'echec de lecture, la periode sans aucun mouvement, et le
 * deficit. C'est precisement dans ces etats-la que les defauts sont passes jusqu'ici.</p>
 *
 * <p>Les formes suivent exactement les types de production. Les compteurs reprennent les
 * ordres de grandeur observes en prod le 03/09/2026 (71 partenaires, 222 turboys dont
 * 173 independants, 37 journaliers et 12 superviseurs-livreurs, 42 personnels,
 * 14 utilisateurs actifs) pour que la mise en page soit jugee sur des nombres vrais :
 * un gabarit valide sur « 1 » se casse sur « 1 284 730 ».</p>
 */

/** Ce que renvoie `/api/finance/global/stats`. Le type n'est pas exporte par la requete. */
export interface StatsGlobalesExemple {
    chiffreAffaire: number;
    depenses: number;
    revenuEncaisse: number;
    solde: number;
    commission: number;
    fraisLivraison: number;
    investissement: number;
    commissionFixe: number;
    commissionPourcentage: number;
}

/** Ce que renvoie `useDepenseSummaryQuery`. */
export interface ResumeDepensesExemple {
    totalRecurrentes: number;
    totalNonRecurrentes: number;
}

/** Sous-ensemble de `ITraficLivreurs` utile aux alertes d'exploitation. */
export interface TraficExemple {
    totalLivreurs: number;
    disponibles: number;
    enActivite: number;
    horsService: number;
}

/** Etat du creneau de saisie des tickets, et delai avant verrouillage. */
export interface CreneauExemple {
    semaine: number;
    statut: 'OUVERT' | 'VERROUILLE' | 'V1_VALIDE' | 'V2_VALIDE';
    heuresAvantVerrouillage: number;
    ticketsSaisis: number;
}

export interface JeuExemple {
    cle: string;
    /** Ce que ce jeu sert a verifier a l'ecran. */
    intitule: string;
    effectifs: IDashboardStatsResponse;
    comptesEnAttente: number;
    statsGlobales: StatsGlobalesExemple;
    /** Meme requete, plage decalee : la comparaison ne coute rien de plus au backend. */
    statsPeriodePrecedente: StatsGlobalesExemple;
    resume: IFinanceResume;
    depenses: ResumeDepensesExemple;
    trafic: TraficExemple;
    creneau: CreneauExemple;
}

const EFFECTIFS: IDashboardStatsResponse = {
    partenaireActif: 71,
    turboys: 222,
    turboysIndependant: 173,
    turboysJournalier: 37,
    turboysSuperviseurLivreur: 12,
    personnel: 42,
    utilisateurs: 14,
};

/** Mois courant : de l'activite, une marge positive, un encours a relancer. */
const MOIS_ORDINAIRE: JeuExemple = {
    cle: 'ordinaire',
    intitule: 'Mois ordinaire — marge positive, encours a relancer',
    effectifs: EFFECTIFS,
    comptesEnAttente: 3,
    statsGlobales: {
        chiffreAffaire: 8_462_730,
        depenses: 5_918_400,
        revenuEncaisse: 6_207_500,
        solde: 2_544_330,
        commission: 1_284_730,
        fraisLivraison: 7_178_000,
        investissement: 450_000,
        commissionFixe: 778_000,
        commissionPourcentage: 506_730,
    },
    statsPeriodePrecedente: {
        chiffreAffaire: 7_549_100,
        depenses: 5_602_800,
        revenuEncaisse: 5_980_200,
        solde: 1_946_300,
        commission: 1_142_600,
        fraisLivraison: 6_406_500,
        investissement: 300_000,
        commissionFixe: 690_000,
        commissionPourcentage: 452_600,
    },
    resume: {
        chiffreAffaire: 8_462_730,
        totalTickets: 4_318,
        totalDepenses: 5_918_400,
        totalRevenus: 6_207_500,
        totalInvestissements: 450_000,
        totalFacturesEnCours: 2_255_230,
        totalFacturesEnCoursCumule: 14_872_400,
        totalDepensesCumule: 61_204_900,
        margeCumule: 23_918_700,
        chiffreAffaireCumule: 85_123_600,
    },
    depenses: { totalRecurrentes: 4_120_000, totalNonRecurrentes: 1_798_400 },
    trafic: { totalLivreurs: 222, disponibles: 31, enActivite: 47, horsService: 144 },
    creneau: { semaine: 36, statut: 'OUVERT', heuresAvantVerrouillage: 198, ticketsSaisis: 44 },
};

/** Le mois ou les depenses passent devant : le signe du resultat doit se lire seul. */
const MOIS_DEFICITAIRE: JeuExemple = {
    ...MOIS_ORDINAIRE,
    cle: 'deficit',
    intitule: 'Mois deficitaire — le resultat est negatif, et doit se voir',
    comptesEnAttente: 12,
    statsGlobales: { ...MOIS_ORDINAIRE.statsGlobales, chiffreAffaire: 4_106_200, depenses: 6_842_900, solde: -2_736_700 },
    statsPeriodePrecedente: { ...MOIS_ORDINAIRE.statsGlobales },
    resume: {
        ...MOIS_ORDINAIRE.resume,
        chiffreAffaire: 4_106_200,
        totalTickets: 2_094,
        totalDepenses: 6_842_900,
        totalRevenus: 3_012_400,
        totalFacturesEnCours: 3_908_100,
    },
    depenses: { totalRecurrentes: 4_120_000, totalNonRecurrentes: 2_722_900 },
    // Terrain a l'arret : aucun livreur disponible, la carte du trafic est aveugle.
    trafic: { totalLivreurs: 222, disponibles: 0, enActivite: 3, horsService: 187 },
    creneau: { semaine: 36, statut: 'OUVERT', heuresAvantVerrouillage: 6, ticketsSaisis: 12 },
};

/**
 * Periode sans aucun mouvement. Cas frequent en debut de mois, et cas ou l'ecran ment
 * le plus facilement : un « 0 FCFA » se lit comme un chiffre mesure, et une variation
 * calculee sur un denominateur nul n'a aucun sens.
 */
const PERIODE_VIDE: JeuExemple = {
    cle: 'vide',
    intitule: 'Periode sans mouvement — aucun zero ne doit passer pour une mesure',
    effectifs: EFFECTIFS,
    comptesEnAttente: 0,
    statsGlobales: {
        chiffreAffaire: 0, depenses: 0, revenuEncaisse: 0, solde: 0, commission: 0,
        fraisLivraison: 0, investissement: 0, commissionFixe: 0, commissionPourcentage: 0,
    },
    statsPeriodePrecedente: {
        chiffreAffaire: 0, depenses: 0, revenuEncaisse: 0, solde: 0, commission: 0,
        fraisLivraison: 0, investissement: 0, commissionFixe: 0, commissionPourcentage: 0,
    },
    resume: {
        chiffreAffaire: 0, totalTickets: 0, totalDepenses: 0, totalRevenus: 0,
        totalInvestissements: 0, totalFacturesEnCours: 0,
        totalFacturesEnCoursCumule: 14_872_400, totalDepensesCumule: 61_204_900,
        margeCumule: 23_918_700, chiffreAffaireCumule: 85_123_600,
    },
    depenses: { totalRecurrentes: 0, totalNonRecurrentes: 0 },
    trafic: { totalLivreurs: 222, disponibles: 58, enActivite: 0, horsService: 164 },
    creneau: { semaine: 36, statut: 'V2_VALIDE', heuresAvantVerrouillage: 0, ticketsSaisis: 0 },
};

/**
 * Nombres extremes. Un gabarit valide sur « 71 » se casse sur un montant a neuf
 * chiffres : c'est ainsi que les compteurs ont deborde dans les exports.
 */
const VALEURS_EXTREMES: JeuExemple = {
    ...MOIS_ORDINAIRE,
    cle: 'extremes',
    intitule: 'Valeurs extremes — la mise en page tient-elle sur neuf chiffres ?',
    effectifs: { ...EFFECTIFS, turboys: 1_284, turboysIndependant: 1_004, turboysJournalier: 218, turboysSuperviseurLivreur: 62, partenaireActif: 1_147 },
    comptesEnAttente: 486,
    statsGlobales: { ...MOIS_ORDINAIRE.statsGlobales, chiffreAffaire: 428_940_150, fraisLivraison: 371_206_800, commission: 57_733_350 },
    resume: { ...MOIS_ORDINAIRE.resume, chiffreAffaire: 428_940_150, chiffreAffaireCumule: 3_204_887_600, totalFacturesEnCoursCumule: 892_450_300 },
    trafic: { totalLivreurs: 1_284, disponibles: 402, enActivite: 318, horsService: 564 },
    creneau: { semaine: 36, statut: 'OUVERT', heuresAvantVerrouillage: 198, ticketsSaisis: 2_841 },
};

export const JEUX_EXEMPLE: JeuExemple[] = [MOIS_ORDINAIRE, MOIS_DEFICITAIRE, PERIODE_VIDE, VALEURS_EXTREMES];

export const jeuParCle = (cle: string): JeuExemple =>
    JEUX_EXEMPLE.find((j) => j.cle === cle) ?? MOIS_ORDINAIRE;

/** Etats d'affichage a verifier en plus des jeux de donnees. */
export const ETATS_AFFICHAGE = ['normal', 'chargement', 'echec'] as const;
export type EtatAffichage = (typeof ETATS_AFFICHAGE)[number];
