import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Garde de session. Cette route relaie des donnees financieres : sans ce controle,
 * elle les servait a tout appelant, y compris hors de l'ERP.
 */
async function refuserSiNonConnecte() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const refus = await refuserSiNonConnecte();
  if (refus) return refus;

  try {
    // Récupérer les paramètres de l'URL
    const { searchParams } = new URL(request.url);
    
    // Construire l'URL de l'API externe
    const baseUrl = 'https://backend-prod.turbodeliveryapp.com/api/finance/global/stats';
    const externalUrl = `${baseUrl}?${searchParams.toString()}`;
    
    // Faire l'appel à l'API externe
    const response = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('❌ Proxy Stats API - Erreur réponse:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Erreur API externe: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Récupérer les données
    const data = await response.json();
   
    
    // Retourner les données avec headers CORS
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Proxy Stats API - Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur proxy' },
      { status: 500 }
    );
  }
}

