import type {
  LivreurCategorie,
  LivreurTrafic,
  StatutTrafic,
  TraficLivreursResponse,
} from '@/features/trafic/types/trafic.type';

/** Livreur du trafic dont le statut et les drapeaux sont garantis renseignés. */
export interface LivreurTraficVue extends LivreurTrafic {
  statut: StatutTrafic;
  enFile: boolean;
  rangFile: number | null;
  horsRayonPoste: boolean;
  distancePosteMetres: number | null;
  positionAncienne: boolean;
  aPosition: boolean;
}

export interface TraficNormalise {
  /** Tous les livreurs, une seule fois chacun, statut résolu. */
  livreurs: LivreurTraficVue[];
  compteurs: Record<StatutTrafic, number>;
  /** Livreurs actuellement hors du rayon de leur poste (tous statuts confondus). */
  horsRayon: number;
  totalLivreurs: number;
  /** Ont pris leur service aujourd'hui : disponibles + en course + en pause. */
  totalEnService: number;
}

const liste = (categorie?: LivreurCategorie): LivreurTrafic[] => categorie?.liste ?? [];

function aUnePosition(l: LivreurTrafic): boolean {
  if (typeof l.aPosition === 'boolean') return l.aPosition;
  return l.position?.latitude !== 0 || l.position?.longitude !== 0;
}

function enrichir(l: LivreurTrafic, statut: StatutTrafic): LivreurTraficVue {
  const position = l.position ?? { latitude: 0, longitude: 0 };
  const distance = l.distancePosteMetres ?? l.distanceSiegeMetres ?? null;
  return {
    ...l,
    position,
    statut,
    enFile: l.enFile ?? statut === 'DISPONIBLE',
    rangFile: l.rangFile ?? null,
    // « Hors zone » n'a de sens que pour quelqu'un EN SERVICE. Le backend renseigne le
    // drapeau pour tout le monde, mais ne compte dans son alerte que les livreurs en
    // service (LivreurService : `horsRayonPoste && statut != HORS_SERVICE`). Sans cette
    // même règle ici, le compteur d'alerte affichait toute la flotte au repos — chacun
    // étant évidemment à plus de 500 m de son poste depuis chez lui.
    horsRayonPoste: (l.horsRayonPoste ?? false) && statut !== 'HORS_SERVICE',
    distancePosteMetres: distance,
    positionAncienne: l.positionAncienne ?? false,
    aPosition: aUnePosition(l),
  };
}

/**
 * Aplatit la réponse du backend en une liste unique.
 *
 * Le statut est déduit du BUCKET d'origine, pas du champ `statut` : les deux
 * disent la même chose côté backend, mais le bucket reste vrai même si un
 * déploiement décalé renvoie un ancien libellé. `horsRayon` n'est volontairement
 * pas un bucket de statut — c'est un drapeau posé sur des livreurs qui figurent
 * déjà dans l'un des quatre autres.
 */
export function normaliserTrafic(reponse?: TraficLivreursResponse | null): TraficNormalise {
  const parId = new Map<string, LivreurTraficVue>();

  const ajouter = (source: LivreurTrafic[], statut: StatutTrafic) => {
    source.forEach((l) => {
      if (!l?.livreurId || parId.has(l.livreurId)) return;
      parId.set(l.livreurId, enrichir(l, statut));
    });
  };

  ajouter(liste(reponse?.disponibles), 'DISPONIBLE');
  ajouter(liste(reponse?.enActivite), 'EN_COURSE');
  ajouter(liste(reponse?.enPause), 'EN_PAUSE');
  ajouter(liste(reponse?.horsService), 'HORS_SERVICE');
  // Repli : un backend antérieur à la refonte ne renvoie que le fourre-tout
  // `indisponibles`. Ces livreurs ne sont pas en file — donc hors service.
  ajouter(liste(reponse?.indisponibles), 'HORS_SERVICE');

  // Le drapeau hors-rayon, appliqué aux livreurs déjà classés.
  liste(reponse?.horsRayon).forEach((l) => {
    if (!l?.livreurId) return;
    const existant = parId.get(l.livreurId);
    if (existant) {
      existant.horsRayonPoste = true;
      if (existant.distancePosteMetres == null) {
        existant.distancePosteMetres = l.distancePosteMetres ?? l.distanceSiegeMetres ?? null;
      }
      return;
    }
    // Repli ancien backend : « hors rayon » y était un statut exclusif.
    parId.set(l.livreurId, { ...enrichir(l, 'DISPONIBLE'), horsRayonPoste: true });
  });

  const livreurs = Array.from(parId.values());
  const compteurs: Record<StatutTrafic, number> = {
    DISPONIBLE: 0,
    EN_COURSE: 0,
    EN_PAUSE: 0,
    HORS_SERVICE: 0,
  };
  let horsRayon = 0;
  livreurs.forEach((l) => {
    compteurs[l.statut] += 1;
    if (l.horsRayonPoste) horsRayon += 1;
  });

  return {
    livreurs,
    compteurs,
    horsRayon,
    totalLivreurs: reponse?.totalLivreurs ?? livreurs.length,
    totalEnService:
      compteurs.DISPONIBLE + compteurs.EN_COURSE + compteurs.EN_PAUSE,
  };
}
