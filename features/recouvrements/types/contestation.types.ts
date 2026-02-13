import { IFacture } from '@/features/recouvrements/types/facture.types';

export interface IContestation {
    id: string;
    facture: IFacture;
    description: string;
    statut: 'RESOLUE' | 'ACTIVE';
    createdAt: string;
}

export interface IContestationSearchParams {
    factureId: string;
    debut?: string;
    fin?: string;
    page: number;
    size: number;
}