import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Récupérer les paramètres de l'URL
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Construire l'URL de l'API externe
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const externalUrl = `http://backend-prod.turbodeliveryapp.com/api/finance/investissements/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    console.log('=== API PROXY INVESTISSEMENT STATS ===');
    console.log('External URL:', externalUrl);
    console.log('Params:', { startDate, endDate });

    // Appeler l'API externe
    const response = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Ajouter d'autres headers si nécessaire
      },
    });

    console.log('External response status:', response.status);
    console.log('External response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('External error response:', errorText);
      
      return NextResponse.json(
        { error: `Failed to fetch investissement stats: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('External response data:', data);
    console.log('=== FIN API PROXY ===');

    // Retourner les données de l'API externe
    return NextResponse.json(data);

  } catch (error) {
    console.error('API proxy error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
