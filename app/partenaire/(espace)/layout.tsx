export const dynamic = 'force-dynamic';

import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import CoquillePartenaire from '@/features/espace-partenaire/composants/coquille-partenaire';

export type ProfilPartenaire = {
  utilisateurId: string;
  email: string;
  nom: string | null;
  role: string | null;
  restaurantId: string;
  storeNom: string | null;
  storeLatitude: number | null;
  storeLongitude: number | null;
  rushOuvert: boolean;
  rushActive: boolean;
};

/**
 * Coquille de l'ESPACE PARTENAIRE — indépendante du layout ERP protégé (qui exige un
 * profil erp-backend et éjecterait toute session partenaire). Le profil est hydraté
 * serveur : cookie absent ou JWT refusé → retour au login, jamais d'écran à moitié vide.
 */
export default async function PartenaireLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('partenaire_token')?.value;
  if (!token) {
    redirect('/partenaire/connexion');
  }

  let profil: ProfilPartenaire | null = null;
  try {
    const reponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BACKEND_URL}/api/V1/turbo/resto/partenaire/profil`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
    );
    if (reponse.ok) {
      profil = (await reponse.json()) as ProfilPartenaire;
    }
  } catch {
    profil = null;
  }
  if (!profil) {
    redirect('/partenaire/connexion');
  }

  return <CoquillePartenaire profil={profil}>{children}</CoquillePartenaire>;
}
