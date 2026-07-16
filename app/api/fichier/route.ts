import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Proxy de fichiers (documents livreur) : rapatrie un fichier servi par le backend
 * et le renvoie EN INLINE (affichage direct dans un iframe/onglet) — le backend
 * force parfois `Content-Disposition: attachment`, ce qui déclenche un téléchargement
 * au lieu d'afficher. Le proxy résout aussi le CORS (fetch côté serveur).
 *
 * - `?u=<url absolue backend>` : le fichier à servir (host whitelisté).
 * - `?dl=1&nom=<nom>` : forcer le TÉLÉCHARGEMENT (attachment) au lieu de l'inline.
 */
const HOSTS_AUTORISES = new Set<string>(
  [
    'backend-prod.turbodeliveryapp.com',
    (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_API_BACKEND_URL ?? '').hostname;
      } catch {
        return '';
      }
    })(),
  ].filter(Boolean),
);

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u');
  const dl = req.nextUrl.searchParams.get('dl');
  const nom = (req.nextUrl.searchParams.get('nom') ?? 'document').replace(/[\r\n"]/g, '');

  if (!u) return new NextResponse('Paramètre "u" manquant', { status: 400 });

  let cible: URL;
  try {
    cible = new URL(u);
  } catch {
    return new NextResponse('URL invalide', { status: 400 });
  }
  if (cible.protocol !== 'https:' || !HOSTS_AUTORISES.has(cible.hostname)) {
    return new NextResponse('Hôte non autorisé', { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(cible.toString(), { cache: 'no-store' });
  } catch {
    return new NextResponse('Fichier inaccessible', { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new NextResponse('Fichier introuvable', { status: upstream.status || 404 });
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
  const disposition = dl ? `attachment; filename="${nom}"` : 'inline';

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': disposition,
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
