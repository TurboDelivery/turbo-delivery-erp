import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { normalizeRole } from '@/lib/casl/ability';

export const runtime = 'nodejs';

/**
 * Le relais de la base de données clients.
 *
 * <h3>Pourquoi il existe</h3>
 * <p>L'ERP n'a aucun justificatif que main-backend accepte. Son filtre JWT valide des
 * jetons de LIVREUR, signés avec le secret de ce service, et erp-backend signe avec un
 * autre secret. C'est pour cela que `api-client-http.tsx` n'envoie délibérément pas
 * d'en-tête `Authorization` vers le service `backend`, et pourquoi tous les appels ERP qui
 * fonctionnent aujourd'hui passent par un préfixe ouvert en `permitAll`.</p>
 *
 * <p>`/api/bdd-clients/**` n'est pas ouvert, et ne doit pas l'être : il sert les numéros
 * de téléphone de tous les clients finaux. Ce relais est donc la seule porte. Il tourne
 * CÔTÉ SERVEUR : il vérifie la session NextAuth, puis rejoue l'appel vers main-backend
 * avec une clé de service que le navigateur ne voit jamais.</p>
 *
 * <h3>Ce qu'il garantit</h3>
 * <ul>
 *   <li>pas de session ERP valide, pas d'appel : 401 avant toute sortie ;</li>
 *   <li>la clé n'est jamais servie au navigateur — elle n'est pas préfixée
 *       `NEXT_PUBLIC_`, donc Next ne l'inline pas dans le bundle client ;</li>
 *   <li>l'identité vient de la session vérifiée ici, pas d'un en-tête que l'appelant
 *       aurait posé : un navigateur ne peut pas se déclarer DG.</li>
 * </ul>
 *
 * <p>⚠ Sans `BDD_CLIENTS_SERVICE_KEY` posée sur ce conteneur, le relais refuse de sortir
 * et le dit. Une clé absente ne doit pas se traduire par un appel sans clé, qui reviendrait
 * en 401 sans que personne ne sache pourquoi.</p>
 */

const BASE = process.env.NEXT_PUBLIC_API_BACKEND_URL ?? '';
const CLE = process.env.BDD_CLIENTS_SERVICE_KEY ?? '';

/** Les méthodes que ce relais accepte. Tout le reste est refusé, pas relayé. */
const METHODES = new Set(['GET', 'POST', 'PUT', 'DELETE']);

async function relayer(requete: NextRequest, chemin: string[]) {
  if (!METHODES.has(requete.method)) {
    return NextResponse.json({ message: 'Méthode non autorisée.' }, { status: 405 });
  }

  const session = await auth();
  const utilisateur = session?.user as { id?: string; role?: unknown } | undefined;
  if (!utilisateur) {
    return NextResponse.json({ message: 'Session expirée.' }, { status: 401 });
  }

  if (!CLE || !BASE) {
    // On le DIT plutôt que de sortir sans clé : un 401 venu du backend ferait chercher
    // le défaut du mauvais côté.
    return NextResponse.json(
      {
        message:
          "La clé de service de la base clients n'est pas configurée sur ce serveur. " +
          'Poser BDD_CLIENTS_SERVICE_KEY côté ERP et bddclients.service-key côté backend.',
      },
      { status: 503 },
    );
  }

  const url = new URL(`${BASE}/api/bdd-clients/${chemin.join('/')}`);
  requete.nextUrl.searchParams.forEach((v, k) => url.searchParams.append(k, v));

  /*
   * ⚠ Le rôle est NORMALISÉ avant d'être relayé, jamais envoyé tel qu'il est écrit.
   *
   * La session porte le LIBELLÉ saisi en base : « Agent de saisie », « Chargé
   * Marketing », « Directeur des opérations ». Le backend en fait
   * `ROLE_` + majuscules, ce qui donnait `ROLE_AGENT DE SAISIE` là où ses gardes
   * attendent `ROLE_STANDARD`. Aucune garde n'aurait reconnu personne, et toutes
   * auraient refusé — le module se serait fermé à tout le monde le jour où la clé de
   * service serait posée.
   *
   * `normalizeRole` est la table d'alias de CASL, donc la MÊME que celle qui décide
   * de l'affichage. Deux tables finiraient par diverger, et l'écran montrerait alors
   * ce que le serveur refuse.
   *
   * Un libellé inconnu rend `null` : on relaie une chaîne vide, le backend retombe
   * sur `ROLE_ERP`, et ses gardes refusent. C'est le bon sens du défaut.
   */
  const role =
    normalizeRole(
      utilisateur.role as string | { libelle?: string } | null | undefined,
    ) ?? '';

  const corps =
    requete.method === 'GET' || requete.method === 'DELETE'
      ? undefined
      : await requete.text();

  const reponse = await fetch(url, {
    body: corps,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'X-Service-Key': CLE,
      'X-User-Id': utilisateur.id ?? '',
      'X-User-Roles': role,
    },
    method: requete.method,
  });

  const texte = await reponse.text();
  return new NextResponse(texte || null, {
    headers: { 'Content-Type': reponse.headers.get('Content-Type') ?? 'application/json' },
    status: reponse.status,
  });
}

export async function GET(requete: NextRequest, ctx: { params: Promise<{ chemin: string[] }> }) {
  return relayer(requete, (await ctx.params).chemin);
}

export async function POST(requete: NextRequest, ctx: { params: Promise<{ chemin: string[] }> }) {
  return relayer(requete, (await ctx.params).chemin);
}

export async function PUT(requete: NextRequest, ctx: { params: Promise<{ chemin: string[] }> }) {
  return relayer(requete, (await ctx.params).chemin);
}

export async function DELETE(requete: NextRequest, ctx: { params: Promise<{ chemin: string[] }> }) {
  return relayer(requete, (await ctx.params).chemin);
}
