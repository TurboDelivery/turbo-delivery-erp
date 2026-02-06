
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
    nomInvestisseur?: string;
    debut?: Date;
    fin?: Date;
}

export interface CommissionFixe {
    id: number,
    date: string,
    restaurant: string,
    localisation: string,
    commission: string,
}



