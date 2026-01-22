
// investissements

export interface IInvestissement {
    id: string;
    nomInvestisseur: string;
    montant: number;
    dateInvestissement: string;
    deadline: string;
}

export interface IInvestissementParams {
    page?: number;
    limit?: number;
    search?: string;
    dateInvestissement?: string;
    deadline?: string;
    nomInvestisseur?: string;
    montant?: number;
}

export interface CommissionFixe {
    id: number,
    date: string,
    restaurant: string,
    localisation: string,
    commission: string,
}



