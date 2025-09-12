
export interface JourCreneau {
    jour: string;       // Exemple : "LUNDI"
    date: string;       // Exemple : "2025-06-30"
    debut: string;      // Exemple : "08:00:00"
    fin: string;        // Exemple : "22:00:00"
    actif: boolean;     // Exemple : true / false
}

export interface CreneauID {
    id: string;
    debut: string;      // Date de début du créneau (YYYY-MM-DD)
    fin: string;        // Date de fin du créneau (YYYY-MM-DD)
    semainePassee: boolean;
    jours?: JourCreneau[]; // Tableau des jours liés au créneau
}

