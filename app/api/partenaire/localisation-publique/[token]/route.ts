import { NextRequest, NextResponse } from 'next/server';

/* ═══════════════════════════════════════════════════════════════════════════════════
 * ⚠ DOUBLON TEMPORAIRE — se supprime EN MÊME TEMPS que app/l/[token]/page.tsx
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Ce relais n'existe que parce que la page app/l/[token] a été remise dans l'ERP à
 * titre de continuité : c'est elle, et elle seule, qui l'appelle. La version de
 * référence est dans le portail V3 (turbo-partner-v3, features/localisation-client).
 *
 * Condition de suppression, identique à celle de la page : le jour où
 * TURBO_PARTENAIRE_BASE_LIEN_LOCALISATION pointe sur partner.turbodeliveryapp.com.
 * Voir l'en-tête de app/l/[token]/page.tsx pour le détail et l'historique.
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

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
