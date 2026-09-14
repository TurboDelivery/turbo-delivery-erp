interface Creneau {
    debut: string;  
    fin: string;   
  }
  
  interface Etat {
    date: string;   
    jour: string;   
    statut: string; 
  }
  
  interface LivreurPerformanceBirdEndTorubo {
    id: string;            
    avatarUrl: string;       
    nomComplet: string;    
    /**
     * Le creneau de la semaine, NUL quand aucun emploi du temps n'a ete cree pour ce
     * livreur sur la periode.
     *
     * <p>Le type le declarait non nullable, et deux endroits lisaient `creneau.debut`
     * sans garde : le jour ou le serveur rendra les livreurs non planifies - exigence 2.2
     * du cahier des charges « Performance de la Flotte » - la page serait tombee. Le type
     * ment moins cher que l'ecran ne tombe.</p>
     */
    creneau: Creneau | null;
    etats: Etat[];         
    performance: number | null;
    commission: number;    
    prime: number;
    /**
     * Nombre de courses terminées sur la période.
     *
     * <p>L'indicateur d'activité principal du cahier des charges « Performance de la
     * Flotte ». Servi par le backend depuis le 14/09/2026 ; optionnel dans le type pour
     * qu'une réponse mise en cache avant cette date ne fasse pas tomber l'écran.</p>
     */
    nbTickets?: number;
  }
  