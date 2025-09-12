export interface PaginatedResponse<T> {
    content: T[];
    number: number; // page courante
    size: number;   // taille de page
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}
