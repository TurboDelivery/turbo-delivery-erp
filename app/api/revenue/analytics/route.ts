import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const date = searchParams.get('date');

    console.log('API Revenue Analytics - Params:', { period, date });

    if (!period) {
      return NextResponse.json(
        { error: 'Le paramètre period est requis' },
        { status: 400 }
      );
    }

    // Construire l'URL de l'API backend
    const baseUrl = "http://backend-prod.turbodeliveryapp.com/api/finance/revenues/analytics";
    let url = `${baseUrl}?period=${period}`;
    
    if (date) {
      url += `&date=${date}`;
    }

    console.log('API Revenue Analytics - Backend URL:', url);

    // Faire l'appel à l'API backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('API Revenue Analytics - Backend Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Revenue Analytics - Backend Error:', errorText);
      throw new Error(`Erreur de l'API backend: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API Revenue Analytics - Success, data keys:', Object.keys(data));

    // Retourner les données au client
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur dans la route API revenue analytics:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des données de revenus',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
