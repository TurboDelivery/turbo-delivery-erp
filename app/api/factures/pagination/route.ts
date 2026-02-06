import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Récupérer les paramètres de l'URL
    const { searchParams } = new URL(request.url);
    
    // Construire l'URL de l'API externe
    const baseUrl = 'http://backend-prod.turbodeliveryapp.com/api/erp/factures/pagination';
    const externalUrl = `${baseUrl}?${searchParams.toString()}`;
    
    console.log('🔍 Proxy API - URL externe:', externalUrl);
    
    // Faire l'appel à l'API externe
    const response = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Ajouter d'autres headers si nécessaire
      },
    });
    
    if (!response.ok) {
      console.error('❌ Proxy API - Erreur réponse:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Erreur API externe: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Récupérer les données
    const data = await response.json();
    console.log('✅ Proxy API - Données récupérées:', data.content?.length, 'éléments');
    
    // Retourner les données avec headers CORS
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('❌ Proxy API - Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur proxy' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
