import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Relais authentifié de l'espace partenaire vers main-backend.
 *
 * Le navigateur ne voit JAMAIS le JWT (cookie httpOnly) : chaque appel passe ici, qui
 * ajoute `Authorization: Bearer` côté serveur et ne relaie QUE les chemins de l'API
 * partenaire — pas un proxy générique vers le backend.
 */
const PREFIXE_AUTORISE = '/api/V1/turbo/resto/partenaire/';

async function relayer(request: NextRequest, chemins: string[], methode: 'GET' | 'POST') {
  const token = cookies().get('partenaire_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Session expirée' }, { status: 401 });
  }
  const chemin = chemins.map(encodeURIComponent).join('/');
  const cible = `${process.env.NEXT_PUBLIC_API_BACKEND_URL}${PREFIXE_AUTORISE}${chemin}${request.nextUrl.search}`;

  const entetes: Record<string, string> = { Authorization: `Bearer ${token}` };
  let corps: string | undefined;
  if (methode === 'POST') {
    entetes['Content-Type'] = 'application/json';
    corps = await request.text();
  }

  const reponse = await fetch(cible, { method: methode, headers: entetes, body: corps, cache: 'no-store' });
  const texte = await reponse.text();
  if (reponse.status === 401 || reponse.status === 403) {
    // JWT expiré ou révoqué : la session partenaire tombe, l'écran renverra au login.
    cookies().delete('partenaire_token');
  }
  return new NextResponse(texte, {
    status: reponse.status,
    headers: { 'Content-Type': reponse.headers.get('Content-Type') ?? 'application/json' },
  });
}

export async function GET(request: NextRequest, { params }: { params: { chemin: string[] } }) {
  return relayer(request, params.chemin, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: { chemin: string[] } }) {
  return relayer(request, params.chemin, 'POST');
}
