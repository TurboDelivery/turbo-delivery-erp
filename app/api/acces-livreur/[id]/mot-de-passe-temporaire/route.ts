import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { normalizeRole } from '@/lib/casl/ability';

export const runtime = 'nodejs';

/**
 * Le relais du seul geste capable de rouvrir l'accès d'un livreur.
 *
 * <h3>Pourquoi un relais, et pas un appel direct depuis l'écran</h3>
 * <p>`/api/acces-livreur/**` n'est pas ouvert côté main-backend, et ne doit pas l'être :
 * il ÉCRIT un identifiant. Le navigateur ne peut donc pas l'appeler. Ce relais tourne
 * côté serveur, vérifie la session NextAuth, puis rejoue l'appel avec une clé de service
 * que le navigateur ne voit jamais — elle n'est pas préfixée `NEXT_PUBLIC_`, donc Next ne
 * l'inline pas dans le bundle client.</p>
 *
 * <h3>Ce qu'il apporte que la ligne de commande n'avait pas</h3>
 * <p>L'identité. Les premiers déblocages ont été faits depuis le serveur, avec un
 * `X-User-Id` de zéros : l'historique du compte dit « on ne sait pas qui ». Ici l'auteur
 * vient de la session VÉRIFIÉE, pas d'un en-tête que l'appelant remplit. Une imputation
 * tirée d'un en-tête libre n'est pas une imputation.</p>
 *
 * <p>⚠ Sans `ACCES_LIVREUR_SERVICE_KEY` posée sur ce conteneur, le relais refuse de sortir
 * et le DIT. Sortir sans clé reviendrait en 401 depuis le backend, et ferait chercher le
 * défaut du mauvais côté.</p>
 */

const BASE = process.env.NEXT_PUBLIC_API_BACKEND_URL ?? '';
const CLE = process.env.ACCES_LIVREUR_SERVICE_KEY ?? '';

export async function POST(
  _requete: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const utilisateur = session?.user as { id?: string; role?: unknown } | undefined;
  if (!utilisateur?.id) {
    return NextResponse.json({ message: 'Session expirée.' }, { status: 401 });
  }

  if (!CLE || !BASE) {
    return NextResponse.json(
      {
        message:
          "La clé de service n'est pas configurée sur ce serveur. Poser " +
          'ACCES_LIVREUR_SERVICE_KEY côté ERP, et la même valeur en ' +
          'ACCESLIVREUR_SERVICE_KEY côté backend.',
      },
      { status: 503 },
    );
  }

  const { id } = await ctx.params;

  const reponse = await fetch(`${BASE}/api/acces-livreur/${id}/mot-de-passe-temporaire`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'X-Service-Key': CLE,
      // L'auteur vient de la session vérifiée ci-dessus, jamais du client.
      'X-User-Id': utilisateur.id,
      'X-User-Roles': normalizeRole(
        utilisateur.role as string | { libelle?: string } | null | undefined,
      ) ?? '',
    },
    method: 'POST',
  });

  const texte = await reponse.text();
  return new NextResponse(texte || null, {
    headers: { 'Content-Type': reponse.headers.get('Content-Type') ?? 'application/json' },
    status: reponse.status,
  });
}
