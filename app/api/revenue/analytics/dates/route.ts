import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const debut = searchParams.get('debut');
    const fin = searchParams.get('fin');

 

    if (!debut || !fin) {
      return NextResponse.json(
        { error: 'Les paramètres debut et fin sont requis' },
        { status: 400 }
      );
    }

    // Construire l'URL de l'API backend
    const url = `http://backend-prod.turbodeliveryapp.com/api/finance/revenues/analytics/dates?debut=${debut}&fin=${fin}`;
    


    // Faire l'appel à l'API backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

   

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Revenue Dates - Backend Error:', errorText);
      throw new Error(`Erreur de l'API backend: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
   

    // Retourner les données au client
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur dans la route API revenue dates:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des données de revenus',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
