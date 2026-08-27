'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import {
    FileAttenteStatistiqueVM,
    FilleAttenteHistoriqueVM,
    IPosteFileAttente,
    IReferentielFileAttente,
} from '@/types/file-attente.model';

const BASE_URL = '/api/erp/file-attente';

const fileAttenteEndpoints = {
    fetchFilleAttente: { endpoint: `${BASE_URL}/historique`, method: 'GET' },
    statistiqueFileAttente: { endpoint: `${BASE_URL}/statistique`, method: "GET" },
    /** Livreurs assignés (type TURBO) avec leur restaurant : donne l'univers des postes. */
    livreursAssignes: { endpoint: '/api/erp/livreur/statut/tous-assigne', method: 'GET' },
    /** Annuaire complet : seul endroit qui porte le type de CONTRAT du livreur. */
    annuaireLivreurs: { endpoint: '/api/erp/livreur/infos', method: 'GET' },
};


export async function fetchFilleAttente(): Promise<FilleAttenteHistoriqueVM[]> {
    try {
        const data = await apiClientHttp.request<FilleAttenteHistoriqueVM[]>({
            endpoint: fileAttenteEndpoints.fetchFilleAttente.endpoint,
            method: fileAttenteEndpoints.fetchFilleAttente.method,
            service: 'backend',
        });

        return Array.isArray(data) ? data : [];
    } catch (error) {
        // Une lecture qui ECHOUE n'est pas une file VIDE. En avalant l'erreur, cette
        // action rendait les deux cas indiscernables : `isError` ne passait jamais a
        // vrai et l'ecran annoncait « aucun livreur en file » sur une panne, ce qui
        // envoie le regulateur chercher un probleme qui n'existe pas.
        throw error;
    }
}

export async function fetchStatistiqueFilleAttente(): Promise<FileAttenteStatistiqueVM | null> {
    try {
        const data = await apiClientHttp.request<FileAttenteStatistiqueVM>({
            endpoint: fileAttenteEndpoints.statistiqueFileAttente.endpoint,
            method: fileAttenteEndpoints.statistiqueFileAttente.method,
            service: 'backend',
        });

        return data;
    } catch (error) {
        // Une lecture qui ECHOUE n'est pas une file VIDE. En avalant l'erreur, cette
        // action rendait les deux cas indiscernables : `isError` ne passait jamais a
        // vrai et l'ecran annoncait « aucun livreur en file » sur une panne, ce qui
        // envoie le regulateur chercher un probleme qui n'existe pas.
        throw error;
    }
}

/** Forme brute d'un livreur assigné (Page<LivreurStatutVm> côté backend). */
interface LivreurAssigneBrut {
    livreurId?: string;
    restaurantId?: string | null;
    restaurantLibelle?: string | null;
    status?: number | null;
}

/** Forme brute de l'annuaire (LivreurVm) — on n'en garde que deux champs. */
interface LivreurAnnuaireBrut {
    id?: string;
    typeLivreur?: string | null;
}

/**
 * Référentiel de l'écran File d'attente : la liste des POSTES et le type de
 * contrat de chaque livreur.
 *
 * <p>Deux appels regroupés côté serveur, dont on ne renvoie au navigateur que
 * l'essentiel (quelques centaines d'octets au lieu de l'annuaire entier).</p>
 *
 * <p>Pourquoi l'univers des postes ne peut pas venir de la file elle-même :
 * {@code /file-attente/historique} groupe les lignes de la file par restaurant.
 * Un poste où plus personne n'attend n'a plus aucune ligne, donc disparaît
 * complètement de la réponse. C'est pourtant l'information la plus urgente de
 * l'écran — un poste sans livreur ne peut servir aucune commande. On reconstruit
 * donc l'univers à partir des livreurs assignés.</p>
 *
 * <p>Jamais bloquant : si l'un des deux appels échoue, on rend ce qu'on a. La
 * file reste lisible sans son référentiel, elle perd seulement les postes
 * déserts et les types de contrat.</p>
 */
export async function fetchReferentielFileAttente(): Promise<IReferentielFileAttente> {
    const [assignes, annuaire] = await Promise.all([
        apiClientHttp
            .request<{ content?: LivreurAssigneBrut[] }>({
                endpoint: fileAttenteEndpoints.livreursAssignes.endpoint,
                method: fileAttenteEndpoints.livreursAssignes.method,
                // Une seule page : la flotte assignée tient très largement dans 1000 lignes.
                params: { page: 0, size: 1000 },
                service: 'backend',
            })
            .catch(() => null),
        apiClientHttp
            .request<LivreurAnnuaireBrut[]>({
                endpoint: fileAttenteEndpoints.annuaireLivreurs.endpoint,
                method: fileAttenteEndpoints.annuaireLivreurs.method,
                service: 'backend',
            })
            .catch(() => null),
    ]);

    const parPoste = new Map<string, IPosteFileAttente>();
    for (const livreur of assignes?.content ?? []) {
        const restaurantId = livreur?.restaurantId;
        if (!restaurantId) continue;
        // `status === 0` = compte désactivé. Le compter comme effectif du poste
        // ferait croire à une couverture qui n'existe plus. Un statut absent est
        // en revanche conservé : mieux vaut compter un livreur en trop que
        // déclarer un poste pourvu à tort.
        if (livreur?.status === 0) continue;

        const existant = parPoste.get(restaurantId);
        if (existant) {
            existant.livreursAssignes += 1;
            continue;
        }
        parPoste.set(restaurantId, {
            restaurantId,
            restaurant: livreur?.restaurantLibelle?.trim() || 'Partenaire sans nom',
            livreursAssignes: 1,
        });
    }

    const typeParLivreur: Record<string, string> = {};
    for (const livreur of annuaire ?? []) {
        if (livreur?.id && livreur?.typeLivreur) {
            typeParLivreur[livreur.id] = livreur.typeLivreur;
        }
    }

    return { postes: Array.from(parPoste.values()), typeParLivreur };
}
