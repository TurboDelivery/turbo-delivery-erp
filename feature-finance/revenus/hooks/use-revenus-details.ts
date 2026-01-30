import { useQuery } from '@tanstack/react-query'

type PeriodeType = "jour" | "semaine" | "mois" | "annee" | "personnalise"

interface RevenusDetailsParams {
    periode: PeriodeType
    dateDebut?: string
    dateFin?: string
}

interface RevenusDetailsResponse {
    livraisons: any[]
    commissions: any[]
}

const buildRevenusDetailsUrl = (params: RevenusDetailsParams): string => {
    const baseUrl = 'http://backend-prod.turbodeliveryapp.com/api/finance/revenus/details'
    const urlParams = new URLSearchParams()
    urlParams.append('periode', params.periode)
    if (params.dateDebut) urlParams.append('dateDebut', params.dateDebut)
    if (params.dateFin) urlParams.append('dateFin', params.dateFin)
    return `${baseUrl}?${urlParams.toString()}`
}

const fetchRevenusDetails = async (params: RevenusDetailsParams): Promise<RevenusDetailsResponse> => {
    const url = buildRevenusDetailsUrl(params)
    console.log('Appel API Details URL:', url)
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        })
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`)
        }
        
        return response.json()
    } catch (error) {
        console.error('Details Fetch error:', error)
        // Fallback avec données mockées
        return {
            livraisons: Array.from({ length: 20 }, (_, i) => ({
                id: `liv_${i + 1}`,
                commission: Math.floor(Math.random() * 5000) + 1000,
                createdAt: new Date().toISOString()
            })),
            commissions: Array.from({ length: 10 }, (_, i) => ({
                id: `com_${i + 1}`,
                commission: Math.floor(Math.random() * 3000) + 500,
                createdAt: new Date().toISOString()
            }))
        }
    }
}

export const useRevenusDetails = (params: RevenusDetailsParams) => {
    return useQuery({
        queryKey: ['revenus-details', params],
        queryFn: () => fetchRevenusDetails(params),
        enabled: !!params.periode,
        staleTime: 5 * 60 * 1000,
    })
}
