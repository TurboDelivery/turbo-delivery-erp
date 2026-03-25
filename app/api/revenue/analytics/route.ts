import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

   

    if (!period) {
      return NextResponse.json(
        { error: 'Le paramètre period est requis' },
        { status: 400 }
      );
    }

    // Construire l'URL de l'API backend
    let url = "http://backend-prod.turbodeliveryapp.com/api/finance/revenues/analytics/periode";
    
    // Ajouter les paramètres selon le type de période
    const params = new URLSearchParams();
    
    if (startDate && endDate) {
      // Pour les plages personnalisées - utiliser des paramètres séparés
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    } else if (date) {
      // Pour une date spécifique
      params.append('date', date);
    }
    
    // Toujours ajouter la période - convertir en majuscules pour l'enum Java
    const periodValue = period.toUpperCase();
    params.append('period', periodValue);
    
    url += `?${params.toString()}`;



    // Faire l'appel à l'API backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });



    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Revenue Analytics - Backend Error:', errorText);
      console.error('API Revenue Analytics - Response Headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`Erreur de l'API backend: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

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
