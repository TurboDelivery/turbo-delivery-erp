import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Connexion de l'ESPACE PARTENAIRE — volontairement hors NextAuth.
 *
 * La session ERP (NextAuth) est bâtie sur les comptes erp-backend ; y greffer un second
 * type de compte aurait exigé de toucher au layout protégé, au client HTTP (déconnexion
 * sur 401) et à CASL — trois régressions possibles sur l'ERP pour un espace qui n'en
 * partage aucun écran. À la place : le JWT restaurant émis par main-backend
 * (POST /api/V1/turbo/resto/user/login) est posé dans un cookie httpOnly dédié, lu
 * uniquement par les routes /api/partenaire/* et le layout /partenaire.
 */
const DUREE_SESSION_SECONDES = 60 * 60 * 12; // le JWT backend expire avant

export async function POST(request: NextRequest) {
  let corps: { email?: string; password?: string };
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ message: 'Requête invalide' }, { status: 400 });
  }
  if (!corps.email || !corps.password) {
    return NextResponse.json({ message: 'E-mail et mot de passe requis' }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_API_BACKEND_URL;
  if (!base) {
    return NextResponse.json({ message: 'Service indisponible' }, { status: 503 });
  }

  const reponse = await fetch(`${base}/api/V1/turbo/resto/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: corps.email, password: corps.password }),
    cache: 'no-store',
  });

  if (!reponse.ok) {
    // Message unique : ne pas dire si c'est l'e-mail ou le mot de passe.
    return NextResponse.json({ message: 'Identifiants incorrects' }, { status: 401 });
  }

  const { token } = (await reponse.json()) as { token?: string };
  if (!token) {
    return NextResponse.json({ message: 'Identifiants incorrects' }, { status: 401 });
  }

  cookies().set('partenaire_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DUREE_SESSION_SECONDES,
  });
  return NextResponse.json({ ok: true });
}
