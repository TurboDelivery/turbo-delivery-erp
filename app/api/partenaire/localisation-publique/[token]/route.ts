import { NextRequest, NextResponse } from 'next/server';

/**
 * Relais PUBLIC de la page /l/[token] vers les endpoints publics de localisation du
 * backend. Sans authentification — le token à usage unique est le seul secret, et le
 * backend applique déjà réponses uniformes + validation. Le relais évite d'exposer
 * l'URL du backend et garde la page sur le même domaine (géolocalisation navigateur).
 */
const BASE = () => `${process.env.NEXT_PUBLIC_API_BACKEND_URL}/api/public/localisation/`;

function tokenValide(token: string): boolean {
  return /^[A-Z0-9]{8,24}$/i.test(token);
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  if (!tokenValide(params.token)) {
    return NextResponse.json({ message: 'Lien invalide' }, { status: 404 });
  }
  const reponse = await fetch(BASE() + encodeURIComponent(params.token), { cache: 'no-store' });
  const texte = await reponse.text();
  return new NextResponse(texte, { status: reponse.status, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  if (!tokenValide(params.token)) {
    return NextResponse.json({ message: 'Lien invalide' }, { status: 404 });
  }
  const corps = await request.text();
  const reponse = await fetch(BASE() + encodeURIComponent(params.token), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: corps,
    cache: 'no-store',
  });
  const texte = await reponse.text();
  return new NextResponse(texte, { status: reponse.status, headers: { 'Content-Type': 'application/json' } });
}
