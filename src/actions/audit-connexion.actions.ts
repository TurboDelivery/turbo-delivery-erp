'use server';

import { headers } from 'next/headers';

/**
 * Journal des connexions ERP (SPEC-ERP-TURBO-AUDIT-v2.0, F4).
 *
 * Ce module est le SEUL point d'émission des événements d'authentification vers
 * main-backend. Il vit côté serveur pour deux raisons non négociables :
 *
 *  1. la clé partagée `AUDIT_INTERNAL_KEY` ne doit jamais atteindre le navigateur —
 *     l'endpoint accepte un identifiant et un utilisateurId arbitraires, une clé
 *     publique permettrait de fabriquer de fausses lignes dans le seul journal qui
 *     fait foi lors d'une enquête de sécurité ;
 *  2. l'identifiant saisi et le motif d'échec ne sont connus que de la couche
 *     d'authentification (la server action `loginUser`), pas du composant de login.
 *
 * Règle de fer du projet : un journal ne casse jamais le métier. Toute erreur ici
 * est avalée — une supervision indisponible ne doit pas empêcher quiconque de se
 * connecter.
 */

/** Types acceptés par `ConnexionAuditService.TypeEvenement` côté backend. */
export type TypeEvenementConnexion = 'LOGIN' | 'ECHEC' | 'LOGOUT' | 'EXPIRATION' | 'FORCEE';

export type TracerConnexionParams = {
    typeEvenement: TypeEvenementConnexion;
    /** Identifiant saisi (username). Renseigné même quand le compte n'existe pas. */
    identifiant: string;
    /** Utilisateur reconnu, quand il l'est. Nul sur un échec sur compte inexistant. */
    utilisateurId?: string | null;
    utilisateurNom?: string | null;
    /** Cause de l'échec, telle que renvoyée par l'API d'authentification. */
    motif?: string | null;
    /** Session ERP concernée. Sur un LOGOUT, elle est fermée côté serveur. */
    sessionId?: string | null;
};

const ENDPOINT_CONNEXION = '/api/erp/supervision/connexion';

/** Au-delà, on abandonne : le journal ne doit pas rallonger le temps de connexion. */
const DELAI_MAX_MS = 5000;

/**
 * Adresse du poste réel.
 *
 * Le front est derrière nginx : l'IP de la socket est celle du proxy. C'est
 * `x-forwarded-for` (premier maillon de la chaîne) qui porte le poste de travail.
 * Sans cette résolution ici, le backend n'enregistrerait que l'IP du serveur Next,
 * identique pour tout le monde — donc inutilisable.
 */
function adresseClient(entetes: Headers): string | null {
    const transmise = entetes.get('x-forwarded-for');
    if (transmise && transmise.trim() !== '') {
        const premiere = transmise.split(',')[0]?.trim();
        if (premiere) return premiere;
    }
    const reelle = entetes.get('x-real-ip');
    return reelle && reelle.trim() !== '' ? reelle.trim() : null;
}

/**
 * Émet un événement de connexion vers main-backend.
 *
 * Ne lève jamais, ne retourne rien d'exploitable par l'appelant : l'appel est un
 * effet de bord de journalisation, pas une étape du parcours de connexion.
 */
export async function tracerConnexion(params: TracerConnexionParams): Promise<void> {
    try {
        const cleInterne = process.env.AUDIT_INTERNAL_KEY;
        if (!cleInterne || cleInterne.trim() === '') {
            // Fail-closed assumé et symétrique du backend : sans clé configurée,
            // l'endpoint répond 401 de toute façon. On n'appelle même pas.
            console.warn(
                "[supervision] AUDIT_INTERNAL_KEY absente : l'événement de connexion n'est pas journalisé.",
            );
            return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL;
        if (!baseUrl) return;

        const entetes = await headers();

        await fetch(`${baseUrl}${ENDPOINT_CONNEXION}`, {
            method: 'POST',
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Key': cleInterne,
            },
            body: JSON.stringify({
                utilisateurId: params.utilisateurId ?? null,
                identifiant: params.identifiant ?? null,
                utilisateurNom: params.utilisateurNom ?? null,
                typeEvenement: params.typeEvenement,
                motif: params.motif ?? null,
                sessionId: params.sessionId ?? null,
                ip: adresseClient(entetes),
                userAgent: entetes.get('user-agent'),
            }),
            signal: typeof AbortSignal?.timeout === 'function' ? AbortSignal.timeout(DELAI_MAX_MS) : undefined,
        });
    } catch (error) {
        console.warn('[supervision] événement de connexion non journalisé :', error);
    }
}
