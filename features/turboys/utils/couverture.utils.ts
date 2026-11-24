import type { IProgramme } from '@/features/turboys/types/programme.types';

/**
 * LA COUVERTURE DES SITES : qui est prévu où, et quel jour personne ne l'est.
 *
 * <p>C'est le calcul qui alimente trois choses : la carte « Sites couverts », la carte
 * « Trous de couverture » (§5.2) et la vue Couverture elle-même (§5.2, dernier point).
 * Il vit ici, pur et testé, parce que c'est une arithmétique dont une erreur ne se voit
 * pas : une case qui affiche 2 au lieu de 3 ne lève rien, et personne ne recompte.</p>
 *
 * <h3>Les deux décisions de fond</h3>
 *
 * <p><b>Un superviseur-livreur ne compte dans les présents d'aucun site</b> (CA-43). Il
 * gère des bases, il n'y tient pas un poste : l'y compter ferait croire un site couvert
 * alors que personne n'y livre.</p>
 *
 * <p><b>Les sites considérés sont ceux du programme de la semaine</b>, bases et sites
 * desservis confondus — pas le catalogue des partenaires. Avec le catalogue, une semaine
 * à quatre programmes afficherait des centaines de trous sur des sites où personne n'a
 * jamais prévu personne : le chiffre serait vrai et inutilisable. Ici un trou désigne un
 * site que la semaine prévoit de servir, et qui reste sans personne un jour donné.</p>
 */

/** Les sept jours, dans l'ordre où l'écran les lit. */
export const JOURS_SEMAINE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'] as const;

export type JourCle = (typeof JOURS_SEMAINE)[number];

export interface LigneCouverture {
  siteId: string;
  /** Nombre de livreurs prévus, par jour. Toujours les sept clés. */
  parJour: Record<string, number>;
  /**
   * Les présences de chaque jour : le clic sur une case les liste.
   *
   * ⚠ La clé est `livreurId ?? id du programme`. `livreurId` est nullable sur le modèle,
   * et un programme orphelin compte quand même comme une présence prévue — on ne peut
   * simplement pas la nommer. Prendre `livreurId` seul l'aurait fait disparaître du
   * comptage, donc d'un trou de couverture.
   */
  livreursParJour: Record<string, string[]>;
  /** Jours à zéro. Un site sans aucun trou est « couvert ». */
  trous: number;
}

export interface Couverture {
  lignes: LigneCouverture[];
  /** Sites qui ont au moins un livreur CHAQUE jour. */
  sitesCouverts: number;
  /** Sites que la semaine prévoit de servir (au moins un livreur, un jour au moins). */
  sitesAuProgramme: number;
  /**
   * Les sites SUIVIS : ceux au programme, plus ceux rangés dans un secteur. C'est le
   * dénominateur de « Sites couverts ».
   */
  sitesSuivis: number;
  /** Sites rangés dans un secteur où PERSONNE n'est prévu de la semaine : 7 trous chacun. */
  sitesSansPersonne: number;
  /** Couples site × jour sans personne. */
  trous: number;
}

/**
 * Les sites où ce programme place le livreur, pour un jour donné.
 *
 * <p>Les sites du jour l'emportent quand ils sont renseignés ; à défaut, le livreur est
 * à sa base. C'est la règle de RG-S03 : cocher des sites pour un jour précise la semaine,
 * ne rien cocher la laisse telle quelle.</p>
 */
export function sitesDuJour(p: IProgramme, jour: string): string[] {
  const duJour = p.complement?.sitesParJour?.[jour];
  if (Array.isArray(duJour) && duJour.length > 0) return duJour;
  return p.siteId ? [p.siteId] : [];
}

/** Le jour est-il travaillé ? Un repos, une absence constatée, un jour inconnu : non. */
function jourTravaille(p: IProgramme, jour: string): boolean {
  const j = (p.jours ?? []).find((x) => x.jour === jour);
  return !!j && j.actif === true;
}

/**
 * La couverture de la semaine, site par site et jour par jour.
 *
 * <p>`catalogue` : les sites rangés dans un secteur (décision du 24/11, choix C). Ils sont
 * suivis MÊME quand personne n'y est prévu. Sans eux, un site oublié n'avait pas de ligne :
 * il n'était ni couvert ni compté comme trou, et c'était l'oubli le plus grave que l'écran
 * ne savait pas montrer. Le catalogue complet des partenaires n'est PAS pris : la plupart ne
 * sont pas des bases de livreurs, et la carte se serait remplie de faux trous.</p>
 */
export function couvertureSemaine(programmes: IProgramme[], catalogue: readonly string[] = []): Couverture {
  // Un superviseur-livreur gère des bases, il ne tient pas de poste : il ne compte dans
  // les présents d'aucun site (CA-43). Ses bases gérées n'entrent donc pas non plus dans
  // les sites à couvrir — personne n'y est attendu de son fait.
  const livreurs = programmes.filter((p) => p.typeLivreur !== 'SUPERVISEUR_LIVREUR');

  const parSite = new Map<string, LigneCouverture>();
  const ligne = (siteId: string): LigneCouverture => {
    const existante = parSite.get(siteId);
    if (existante) return existante;
    const neuve: LigneCouverture = {
      livreursParJour: Object.fromEntries(JOURS_SEMAINE.map((j) => [j, [] as string[]])),
      parJour: Object.fromEntries(JOURS_SEMAINE.map((j) => [j, 0])),
      siteId,
      trous: 0,
    };
    parSite.set(siteId, neuve);
    return neuve;
  };

  /*
   * Deux passes, et c'est nécessaire. La première déclare les sites que la semaine
   * prévoit de servir, y compris un site desservi un seul jour : sans elle, ce site
   * n'aurait pas de ligne et ses six autres jours vides passeraient inaperçus. La
   * seconde compte.
   */
  for (const p of livreurs) {
    if (p.siteId) ligne(p.siteId);
    for (const s of p.complement?.sitesDesservis ?? []) ligne(s);
    for (const j of JOURS_SEMAINE) {
      for (const s of p.complement?.sitesParJour?.[j] ?? []) ligne(s);
    }
  }

  const sitesAuProgramme = parSite.size;
  // Les sites du catalogue s'ajoutent APRÈS : on sait ainsi lesquels n'ont aucun programme.
  for (const s of catalogue) ligne(s);

  for (const p of livreurs) {
    for (const j of JOURS_SEMAINE) {
      if (!jourTravaille(p, j)) continue;
      for (const siteId of sitesDuJour(p, j)) {
        const l = ligne(siteId);
        // Un même livreur ne compte qu'une fois par case, même si le site figure deux
        // fois dans ses sites du jour.
        const cle = p.livreurId ?? p.id;
        if (l.livreursParJour[j].includes(cle)) continue;
        l.livreursParJour[j].push(cle);
        l.parJour[j] += 1;
      }
    }
  }

  const lignes = Array.from(parSite.values());
  let trous = 0;
  let sitesCouverts = 0;
  let sitesSansPersonne = 0;
  for (const l of lignes) {
    l.trous = JOURS_SEMAINE.filter((j) => l.parJour[j] === 0).length;
    trous += l.trous;
    if (l.trous === 0) sitesCouverts += 1;
    if (l.trous === JOURS_SEMAINE.length) sitesSansPersonne += 1;
  }

  return { lignes, sitesAuProgramme, sitesCouverts, sitesSansPersonne, sitesSuivis: lignes.length, trous };
}

/**
 * Les bases qu'un superviseur-livreur gère un jour donné, et combien sur son total.
 *
 * <p>CA-44 : le mercredi, ne cocher que deux bases sur trois doit s'afficher « 2 bases
 * sur 3 ». La case d'un superviseur ne compte donc pas des livreurs, mais des bases —
 * et son dénominateur vient de la semaine, pas du jour.</p>
 */
export function basesDuJour(p: IProgramme, jour: string): { total: number; tenues: number } {
  const total = (p.complement?.basesGerees ?? []).length;
  const duJour = p.complement?.sitesParJour?.[jour];
  const tenues = Array.isArray(duJour) && duJour.length > 0 ? duJour.length : total;
  return { total, tenues };
}

/** Les livreurs qui ont reçu au moins un surplus non annulé (clic sur la carte Surplus, §7.3). */
export function aRecuUnSurplus(p: IProgramme): boolean {
  const parJour = p.complement?.surplusParJour ?? {};
  return Object.values(parJour).some((liste) => (liste ?? []).some((s) => !s.annule));
}
