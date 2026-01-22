export interface ICategorieDepense {
    id: string;
    nomCategorie: string;
    description?: string;
    totalDepense: number;
    createdAt: string;
    updatedAt: string;
}

export interface ICategorieDepenseParams {
    nomCategorie?: string;
    page?: number;
    limit?: number;
}

export interface ICategorieDepenseStatsResponse {
    total: number,
}