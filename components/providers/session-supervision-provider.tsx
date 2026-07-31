'use client';

import { useSessionHeartbeat } from '@/features/supervision/hooks/use-session-heartbeat';

/**
 * Point de montage unique du battement de cœur de présence
 * (SPEC-ERP-TURBO-AUDIT-v2.0, F1/F2).
 *
 * Ne rend rien : c'est un provider au sens « effet monté une fois », pas au sens
 * contexte React. Il doit être monté dans le layout protégé, sous le provider
 * d'authentification (`SessionProvider`, monté par le layout racine) dont le hook
 * lit l'identité, et EN DEHORS de `ProtectedPage` — un utilisateur qui atterrit sur
 * un écran interdit reste un utilisateur connecté, sa présence doit continuer d'être
 * remontée.
 *
 * Ne jamais l'instancier deux fois : chaque instance produirait une présence
 * distincte pour un seul et même écran.
 */
export function SessionSupervisionProvider() {
    useSessionHeartbeat();
    return null;
}

export default SessionSupervisionProvider;
