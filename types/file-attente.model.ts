export interface FilleAttenteHistoriqueVM {
    restaurantId?: string
    restaurant?: string
    fileAttentes?: FilleAttenteVM[]
}

/**
 * Une ligne de la file d'attente du jour, telle que la renvoie
 * {@code GET /api/erp/file-attente/historique}.
 *
 * <p>{@code position} est le rang stocké en base. Il peut présenter des trous
 * (la sortie de file compacte les positions, mais des écritures concurrentes
 * laissent parfois des doublons) : l'affichage recalcule donc toujours le rang
 * à partir de l'ordre trié, il ne montre jamais {@code position} brut.</p>
 */
export interface FilleAttenteVM {
    id?: string
    /** Identifiant du livreur — clé de rapprochement avec l'annuaire. */
    livreurId?: string
    avatar?: string;
    nomComplet?: string;
    position?: number;
    dateJour?: string;
    heureJour?: ILocalDataTime | string | number[];
    /**
     * Type d'ASSIGNATION du livreur (TURBO / FREE / WAITING), et non son
     * contrat. La file ne concerne que les livreurs assignés : ce champ y vaut
     * donc TURBO pour tout le monde. Le type utile à l'exploitation
     * (Journalier, Indépendant, Superviseur-livreur) vient de l'annuaire —
     * cf. {@link IReferentielFileAttente}.
     */
    typeLivreur?: string;
    statut?: string;
}

export interface ILocalDataTime {
    hour?: number;
    minute?: number;
    second?: number;
    nano?: number;
}

export interface FileAttenteStatistiqueVM {
    coursier?: number;
    restaurant?: number;
    commandeEnAttente?: number;
    commandeTermine?: number;
}

/**
 * Un POSTE : un restaurant sur lequel au moins un livreur est assigné.
 *
 * <p>C'est l'univers de référence de l'écran. L'historique des files ne
 * remonte que les restaurants ayant au moins une personne en file — un poste
 * déserté en est, par construction, absent. Sans cet univers, l'alerte
 * « personne sur ce poste » resterait invisible, alors que c'est justement
 * l'information qui coûte des commandes.</p>
 */
export interface IPosteFileAttente {
    restaurantId: string;
    restaurant: string;
    /** Nombre de livreurs rattachés au poste (comptes actifs), en file ou non. */
    livreursAssignes: number;
}

/**
 * Référentiel de l'écran : la liste des postes et le type de contrat de chaque
 * livreur. Il bouge rarement — il est donc relu lentement, là où la file, elle,
 * est relue toutes les 30 secondes.
 */
export interface IReferentielFileAttente {
    postes: IPosteFileAttente[];
    /** livreurId → type de contrat (INDEPENDANT / JOURNALIER / SUPERVISEUR_LIVREUR). */
    typeParLivreur: Record<string, string>;
}
