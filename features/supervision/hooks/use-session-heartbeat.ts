'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

/**
 * Battement de cœur de présence ERP (SPEC-ERP-TURBO-AUDIT-v2.0, F1/F2).
 *
 * Rien dans l'existant ne dit qu'un utilisateur est devant son écran : le jeton ERP
 * vit 24 h et n'est pas révocable. Seul un signal périodique émis par l'onglet ouvert
 * permet d'affirmer une présence — et son absence, une absence.
 *
 * Le hook est volontairement silencieux de bout en bout : aucune erreur remontée à
 * l'écran, aucune exception propagée, aucun état React exposé. Une supervision en
 * panne ne doit jamais se voir depuis une page métier.
 */

/**
 * Une session = un onglet.
 *
 * `sessionStorage` (et non `localStorage`) parce que la supervision compte des
 * présences : deux onglets ouverts sur l'ERP, ce sont deux écrans réellement ouverts.
 * Le stockage survit aux rechargements de la page, ce qui est exactement ce qu'on
 * veut — une déconnexion forcée doit rester effective après un F5.
 */
export const CLE_SESSION_SUPERVISION = 'turbo.supervision.session-id';

/**
 * Miroir de l'identifiant de session dans un cookie de session (sans max-age).
 *
 * Le navigateur seul connaît l'identifiant de session ; or c'est une *server action*
 * qui traite la déconnexion volontaire et doit fermer la session côté serveur.
 * Ce cookie est le seul canal par lequel le serveur Next peut la connaître.
 * Il ne contient qu'un UUID de corrélation : aucune donnée personnelle, aucun secret.
 */
export const COOKIE_SESSION_SUPERVISION = 'turbo_erp_session';

/** Cadence du battement. Alignée sur le seuil ACTIF (5 min) du backend. */
const INTERVALLE_BATTEMENT_MS = 30_000;

/** Un battement qui traîne est un battement perdu : on n'attend pas plus. */
const DELAI_MAX_MS = 10_000;

const ENDPOINT_HEARTBEAT = '/api/erp/supervision/heartbeat';

type ReponseHeartbeat = {
    sessionId?: string | null;
    revoquee?: boolean;
};

function genererIdentifiant(): string {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
    } catch {
        /* contexte non sécurisé : on retombe sur le repli */
    }
    // Repli pour les contextes non sécurisés (http), où randomUUID n'existe pas.
    // Ce n'est qu'un identifiant de corrélation, pas un secret : le format UUID
    // suffit — le backend le désérialise en java.util.UUID.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (caractere) => {
        const aleatoire = (Math.random() * 16) | 0;
        const valeur = caractere === 'x' ? aleatoire : (aleatoire & 0x3) | 0x8;
        return valeur.toString(16);
    });
}

/** Lecture de l'identifiant de session courant. Utilisable depuis n'importe quel client. */
export function lireSessionSupervision(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.sessionStorage.getItem(CLE_SESSION_SUPERVISION);
    } catch {
        return null;
    }
}

function memoriserSession(identifiant: string): void {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.setItem(CLE_SESSION_SUPERVISION, identifiant);
    } catch {
        /* stockage indisponible (navigation privée verrouillée) : on continue sans */
    }
    try {
        document.cookie = `${COOKIE_SESSION_SUPERVISION}=${identifiant}; path=/; SameSite=Lax`;
    } catch {
        /* idem */
    }
}

function oublierSession(): void {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.removeItem(CLE_SESSION_SUPERVISION);
    } catch {
        /* ignoré */
    }
    try {
        document.cookie = `${COOKIE_SESSION_SUPERVISION}=; path=/; SameSite=Lax; max-age=0`;
    } catch {
        /* ignoré */
    }
}

function obtenirOuCreerSession(): string {
    const existant = lireSessionSupervision();
    if (existant) {
        // Le cookie miroir est réécrit à chaque battement : un onglet vivant garde
        // toujours un cookie à jour, même si un autre onglet l'a écrasé entre-temps.
        memoriserSession(existant);
        return existant;
    }
    const nouveau = genererIdentifiant();
    memoriserSession(nouveau);
    return nouveau;
}

/**
 * Monte le battement de cœur pour l'utilisateur connecté.
 *
 * À monter UNE SEULE FOIS dans l'application (cf. `SessionSupervisionProvider`) :
 * deux montages produiraient deux présences pour un seul écran.
 */
export function useSessionHeartbeat(): void {
    const { data: session, status } = useSession();
    const pathname = usePathname();

    const utilisateurId = session?.user?.id ?? null;

    const routeRef = useRef<string | null>(null);
    const routePrecedenteRef = useRef<string | null>(null);
    /** Évite d'empiler les battements si le réseau est lent. */
    const enVolRef = useRef(false);
    /** Une fois la déconnexion déclenchée, plus rien ne repart. */
    const revoqueeRef = useRef(false);

    const battre = useCallback(async (): Promise<void> => {
        if (status !== 'authenticated' || !utilisateurId) return;
        if (revoqueeRef.current) return;
        if (enVolRef.current) return;
        // Un onglet caché n'est pas une présence : on ne compte pas comme actif un
        // onglet oublié en arrière-plan.
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

        const baseUrl = process.env.NEXT_PUBLIC_API_BACKEND_URL;
        if (!baseUrl) return;

        enVolRef.current = true;
        try {
            const sessionId = obtenirOuCreerSession();
            const reponse = await fetch(`${baseUrl}${ENDPOINT_HEARTBEAT}`, {
                method: 'POST',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': utilisateurId,
                },
                body: JSON.stringify({
                    sessionId,
                    route: routeRef.current,
                    routePrecedente: routePrecedenteRef.current,
                }),
                signal: typeof AbortSignal?.timeout === 'function' ? AbortSignal.timeout(DELAI_MAX_MS) : undefined,
            });

            if (!reponse.ok) return;

            const corps = (await reponse.json().catch(() => null)) as ReponseHeartbeat | null;
            if (!corps) return;

            // Le serveur est maître de l'identifiant : au tout premier battement il
            // ouvre une session et renvoie SON identifiant, qu'on adopte. Sans cela,
            // le X-Session-Id des appels métier ne correspondrait à aucune session.
            if (corps.sessionId && corps.sessionId !== sessionId) {
                memoriserSession(corps.sessionId);
            }

            if (corps.revoquee === true) {
                // Déconnexion forcée depuis l'écran de supervision (ou expiration).
                // C'est le SEUL mécanisme qui la rend effective : le jeton ERP est
                // stateless et reste cryptographiquement valide côté serveur.
                revoqueeRef.current = true;
                oublierSession();
                // `redirectTo` et non `callbackUrl` : ce dernier est déprécié en v5.
                await signOut({ redirectTo: '/auth' });
            }
        } catch {
            /* réseau, timeout, backend indisponible : silence total */
        } finally {
            enVolRef.current = false;
        }
    }, [status, utilisateurId]);

    // Changement d'écran : battement immédiat. C'est ce qui alimente la colonne
    // « page en cours » de l'écran de supervision, sans attendre les 30 s.
    useEffect(() => {
        if (!pathname) return;
        if (routeRef.current !== pathname) {
            routePrecedenteRef.current = routeRef.current;
            routeRef.current = pathname;
        }
        void battre();
    }, [pathname, battre]);

    // Battement périodique, suspendu quand l'onglet passe en arrière-plan.
    useEffect(() => {
        if (status !== 'authenticated' || !utilisateurId) return;
        if (typeof document === 'undefined') return;

        let minuteur: ReturnType<typeof setInterval> | null = null;

        const demarrer = () => {
            if (minuteur === null) {
                minuteur = setInterval(() => {
                    void battre();
                }, INTERVALLE_BATTEMENT_MS);
            }
        };
        const arreter = () => {
            if (minuteur !== null) {
                clearInterval(minuteur);
                minuteur = null;
            }
        };
        const surVisibilite = () => {
            if (document.visibilityState === 'visible') {
                void battre();
                demarrer();
            } else {
                arreter();
            }
        };

        if (document.visibilityState === 'visible') demarrer();
        document.addEventListener('visibilitychange', surVisibilite);

        return () => {
            arreter();
            document.removeEventListener('visibilitychange', surVisibilite);
        };
    }, [status, utilisateurId, battre]);

    // Démontage = sortie de la zone protégée, c'est-à-dire déconnexion volontaire
    // (le layout protégé reste monté sur toute navigation interne). On oublie alors
    // l'identifiant : sans cela, une reconnexion dans le même onglet réutiliserait
    // une session fermée côté serveur et l'utilisateur serait éjecté au premier
    // battement. Un simple rechargement de page, lui, ne déclenche pas ce nettoyage
    // (le navigateur détruit le contexte JS sans exécuter les effets) : la détection
    // de déconnexion forcée survit donc au F5.
    useEffect(() => {
        return () => {
            oublierSession();
        };
    }, []);
}
