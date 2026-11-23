// Module M2 — Export de la grille hebdomadaire des programmes (RG-26), au modèle du
// document papier des Opérations. Excel via `xlsx`, PDF via `jsPDF` (table dessinée à la
// main, même pattern de marque que features/men/utils/export-pdf.ts).

import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

import { COMPLEMENT_VIDE, IProgramme } from '../types/programme.types';
import { carburantAffiche, joursTravailles } from './carburant.utils';
import { estSeptSurSept, libelleJourInactif, OBSERVATION_SEPT_SUR_SEPT } from './jour.utils';
import { JOURS_SEMAINE } from './couverture.utils';
import { preuvesDuJour } from './preuves.utils';
import { lundiDeSemaine } from './semaine.utils';
import { getTurboyTypeDisplay } from './type-livreur-display';

/**
 * <h3>Ce que le document papier montre, et que l'export reproduit</h3>
 * <p>Le programme que les Opérations établissaient à la main ne liste pas quarante lignes
 * à plat : il regroupe les livreurs par site (la team, avec les partenaires qu'elle
 * dessert), donne un sous-total par site, isole la supervision, puis un grand total et
 * l'écart contre la semaine précédente. La recette du 09/09/2026 a refusé l'export plat.
 * Ce module produit la structure du papier, plus ce que le papier ne pouvait pas porter :
 * l'emploi du temps jour par jour, avec les repos mis en évidence, et une observation par
 * ligne.</p>
 *
 * <h3>Le sept jours sur sept</h3>
 * <p>Un livreur programmé sans jour de repos n'a pas pris son repos, et la direction veut
 * que ce point se lise sans recoupement : la ligne le dit, en toutes lettres.</p>
 */

const JOURS: Array<{ key: string; court: string }> = [
  { key: 'LUNDI', court: 'Lun' },
  { key: 'MARDI', court: 'Mar' },
  { key: 'MERCREDI', court: 'Mer' },
  { key: 'JEUDI', court: 'Jeu' },
  { key: 'VENDREDI', court: 'Ven' },
  { key: 'SAMEDI', court: 'Sam' },
  { key: 'DIMANCHE', court: 'Dim' },
];

const STATUT_LABEL: Record<string, string> = {
  BROUILLON: 'Brouillon',
  PLANIFIE: 'Planifié',
  NOTIFIE: 'Publié',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
};

const hhmm = (t?: string | null) => (t ?? '').slice(0, 5);

/**
 * Un nombre écrit en français, pour un PDF.
 *
 * <p>`toLocaleString('fr-FR')` sépare désormais les milliers par une ESPACE FINE
 * INSÉCABLE (U+202F). Les polices standard de jsPDF sont encodées en WinAnsi, qui ne
 * connaît pas ce caractère : « 20 000 » sortait imprimé « 20/000 ». Même piège pour le
 * signe moins typographique. On écrit donc avec les caractères que la police possède.</p>
 */
const nombre = (n: number) => n.toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');
const fcfa = (n: number) => `${nombre(n)} FCFA`;

/** Tout texte qui part dans le PDF passe par ici : aucun caractère hors WinAnsi. */
const winAnsi = (t: string) =>
  t.replace(/[\u202f\u00a0]/g, ' ').replace(/\u2212/g, '-').replace(/[\u2010-\u2015]/g, '-');

/**
 * Le montant d'un groupe, ou null quand AUCUNE de ses lignes ne porte de montant. Rien de
 * saisi n'est pas zéro franc : un sous-total à « 0 FCFA » se lit comme une décision, alors
 * que la saisie n'a simplement pas été faite.
 */
function montantGroupe(g: GroupeExport): number | null {
  return g.total === 0 && g.sansMontant === g.programmes.length ? null : g.total;
}

/** Le montant d'un groupe pour un export, prêt à écrire. */
export function libelleMontantGroupe(g: GroupeExport): string {
  const m = montantGroupe(g);
  return m === null ? '—' : fcfa(m);
}

function libelleType(p: IProgramme): string {
  return p.typeLivreur ? getTurboyTypeDisplay(p.typeLivreur).label : '';
}

/**
 * Le même type, en une colonne étroite. « Superviseur-livreur » ne tient pas dans les
 * 24 mm du PDF paysage et sortait coupé ; la section « Supervision » dit déjà le reste.
 */
function libelleTypeCourt(p: IProgramme): string {
  return p.typeLivreur === 'SUPERVISEUR_LIVREUR' ? 'Superviseur' : libelleType(p);
}

function libelleStatut(p: IProgramme): string {
  return STATUT_LABEL[p.statut ?? ''] ?? p.statut ?? '';
}

function jourDe(p: IProgramme, jourKey: string) {
  return p.jours?.find((x) => (x.jour ?? '').toUpperCase() === jourKey);
}

/** Cellule d'un jour : "10:00-22:00" si travaillé, sinon Repos, Absent ou Absence justifiée. */
function celluleJour(p: IProgramme, jourKey: string): string {
  const j = jourDe(p, jourKey);
  if (!j || !j.actif) return libelleJourInactif(j);
  return `${hhmm(j.debut)}-${hhmm(j.fin)}`;
}

/** Le carburant d'une ligne pour un export : le montant figé, sinon le prévisionnel, sinon rien. */
function carburantExport(p: IProgramme): number | '' {
  const { montant } = carburantAffiche(p);
  return montant === null ? '' : montant;
}

// ── Surplus et preuves dans l'export (§8.4) ───────────────────────────────────

/** « LUNDI » → « Lundi ». */
function jourLisible(jour: string): string {
  return jour.charAt(0) + jour.slice(1).toLowerCase();
}

const MOTIFS_LISIBLES: Record<string, string> = {
  AUTRE: 'Autre',
  LONGUE_DISTANCE: 'Longue distance',
  PIC_ACTIVITE: "Pic d'activité",
  RENFORT_AUTRE_SITE: 'Renfort autre site',
};

function libelleMotifSurplus(motif: string): string {
  return MOTIFS_LISIBLES[motif] ?? motif;
}

/** Le nom d'un site, ou son identifiant : jamais « undefined » dans un document lu. */
function nomDuSite(siteId: string | null | undefined, ctx: ContexteExport): string {
  if (!siteId) return '';
  return ctx.sites?.get(siteId)?.nom ?? siteId;
}

/** Les surplus VIVANTS d'un programme : un surplus annulé ne coûte rien. */
export function surplusExport(p: IProgramme): number {
  return Object.values((p.complement ?? COMPLEMENT_VIDE).surplusParJour ?? {})
    .flat()
    .filter((x) => !x.annule)
    .reduce((n, x) => n + (x.montant ?? 0), 0);
}

/**
 * Le total carburant d'un programme : dotation + surplus (RG-C04).
 *
 * <p>Rendu comme chaîne vide quand RIEN n'est saisi, et non zéro : un total à
 * « 0 FCFA » dans un tableau comptable se lit comme une décision, alors que la saisie
 * n'a simplement pas été faite.</p>
 */
export function totalCarburantExport(p: IProgramme): number | '' {
  const dotation = carburantExport(p);
  const surplus = surplusExport(p);
  if (dotation === '' && surplus === 0) return '';
  return (dotation === '' ? 0 : dotation) + surplus;
}

export interface ComptePreuvesExport {
  attendues: number;
  recues: number;
  validees: number;
  manquantes: number;
}

/**
 * Les preuves Wave d'un programme, sur les jours DÉJÀ PASSÉS (RG-W05).
 *
 * <p>Compter demain ferait apparaître des preuves manquantes pour un argent qui n'est
 * pas encore versé — et l'export, que la direction lit, annoncerait un retard qui
 * n'existe pas.</p>
 */
export function preuvesExport(p: IProgramme, aujourdhui = new Date()): ComptePreuvesExport {
  let attendues = 0;
  let recues = 0;
  let validees = 0;
  for (const jour of JOURS_SEMAINE) {
    const j = (p.jours ?? []).find((x) => x.jour === jour);
    if (!j?.date || new Date(j.date) > aujourdhui) continue;
    const e = preuvesDuJour(p, jour);
    if (e.etat === 'SANS_OBJET') continue;
    attendues += e.attendues;
    recues += e.recues;
    validees += e.validees;
  }
  return { attendues, manquantes: attendues - recues, recues, validees };
}

/** « 3/4 · 2 validées · 1 manquante », ou vide quand rien n'est attendu. */
export function libellePreuves(c: ComptePreuvesExport): string {
  if (c.attendues === 0) return '';
  const bouts = [`${c.recues}/${c.attendues}`, `${c.validees} validée${c.validees > 1 ? 's' : ''}`];
  if (c.manquantes > 0) bouts.push(`${c.manquantes} manquante${c.manquantes > 1 ? 's' : ''}`);
  return bouts.join(' · ');
}

/** Les partenaires desservis sur la semaine, sans doublon, dans l'ordre d'apparition. */
function postesDe(programmes: IProgramme[]): string[] {
  const noms: string[] = [];
  for (const p of programmes) {
    for (const j of p.jours ?? []) {
      for (const po of j.postes ?? []) {
        if (po.restaurantNom && !noms.includes(po.restaurantNom)) noms.push(po.restaurantNom);
      }
    }
  }
  return noms;
}

/**
 * Le poste où le livreur passe le plus de jours de la semaine.
 *
 * <p>C'est ce qui remplace le site quand aucun n'est rattaché, et c'est le cas de TOUS les
 * programmes de production au 10/09/2026 : `livreurs.site_partner_id` n'est renseigné nulle
 * part. Les postes desservis, eux, le sont, et ce sont eux qui nomment les teams du
 * document papier (« Team Faya » dessert Chicken Nation Faya). Sans ce repli, l'export
 * mettrait la flotte entière dans « Sans site rattaché ».</p>
 */
function postePrincipal(p: IProgramme): { id: string; nom: string } | null {
  const compte = new Map<string, { nom: string; n: number }>();
  for (const j of p.jours ?? []) {
    if (!j?.actif) continue;
    for (const po of j.postes ?? []) {
      if (!po.restaurantId) continue;
      const e = compte.get(po.restaurantId) ?? { n: 0, nom: po.restaurantNom ?? po.restaurantId };
      e.n += 1;
      compte.set(po.restaurantId, e);
    }
  }
  let meilleur: { id: string; nom: string; n: number } | null = null;
  for (const [id, e] of compte) {
    // À égalité, le nom décide : deux exports du même planning doivent donner le même
    // document.
    if (!meilleur || e.n > meilleur.n || (e.n === meilleur.n && e.nom.localeCompare(meilleur.nom, 'fr') < 0)) {
      meilleur = { id, n: e.n, nom: e.nom };
    }
  }
  return meilleur ? { id: meilleur.id, nom: meilleur.nom } : null;
}

/**
 * Ce qu'il faut savoir d'une ligne, en plus de ses jours.
 *
 * <p>Uniquement ce que la grille ne montre pas déjà : le repos non pris, un refus et son
 * motif, un carburant absent ou encore prévisionnel. Les absences constatées n'y figurent
 * pas — la cellule du jour écrit « Absent » en toutes lettres, et sur la semaine 37 de
 * production, où personne ne pointe, la colonne répétait « Absent lun. · Absent mar. ·
 * Absent mer. » sur chaque ligne sans rien apprendre.</p>
 */
export function observations(p: IProgramme): string[] {
  const o: string[] = [];
  if (estSeptSurSept(p.jours)) o.push(OBSERVATION_SEPT_SUR_SEPT);
  if (p.statut === 'REFUSE') o.push(p.motifRefus ? `Refusé : ${p.motifRefus}` : 'Refusé');
  const { fige, montant } = carburantAffiche(p);
  if (montant === null) o.push('Sans carburant');
  else if (!fige) o.push('Carburant prévisionnel');
  return o;
}

// ── Le regroupement du document papier ────────────────────────────────────────

export interface SiteExport {
  nom: string;
  commune?: string | null;
  localisation?: string | null;
}

export interface ContexteExport {
  /** Les sites connus, pour nommer et décrire un groupe. */
  sites?: ReadonlyMap<string, SiteExport>;
  /** Total carburant de la semaine précédente, pour l'écart. Null : pas de terme de comparaison. */
  carburantSemainePrecedente?: number | null;
}

export interface GroupeExport {
  cle: string;
  /** Le nom du site, vide quand aucun site n'est rattaché. */
  siteNom: string;
  /** « Site KFC Angré », « Sans site rattaché », « Supervision ». */
  titre: string;
  /** « Cocody · Dessert KFC Angré, Chicken Angré ». */
  sousTitre: string;
  programmes: IProgramme[];
  total: number;
  sansMontant: number;
}

export interface SectionsExport {
  livreurs: GroupeExport[];
  supervision: GroupeExport[];
  nbLivreurs: number;
  totalLivreurs: number;
  nbSupervision: number;
  totalSupervision: number;
  total: number;
  previsionnel: number;
  sansMontant: number;
  septSurSept: number;
  independants: number;
}

const parNom = (a: IProgramme, b: IProgramme) => (a.livreurNom ?? '').localeCompare(b.livreurNom ?? '', 'fr');

function groupe(cle: string, siteNom: string, titre: string, lieu: string, programmes: IProgramme[]): GroupeExport {
  let total = 0;
  let sansMontant = 0;
  for (const p of programmes) {
    const { montant } = carburantAffiche(p);
    if (montant === null) sansMontant += 1;
    else total += montant;
  }
  // Le nom du groupe ne se répète pas dans la liste de ce qu'il dessert.
  const postes = postesDe(programmes).filter((n) => n !== siteNom);
  const dessert = postes.length > 0 ? `Dessert ${postes.slice(0, 6).join(', ')}${postes.length > 6 ? '…' : ''}` : '';
  return {
    cle,
    programmes: [...programmes].sort(parNom),
    sansMontant,
    siteNom,
    sousTitre: [lieu, dessert].filter(Boolean).join(' · '),
    titre,
    total,
  };
}

/**
 * Les livreurs par site, la supervision à part, et les totaux du pied de page.
 *
 * <p>Un livreur rejoint le groupe de son site quand il en a un, sinon celui de son poste
 * principal de la semaine, sinon le groupe « Sans site ni poste ». Les superviseurs font
 * leur propre section, comme sur le document papier.</p>
 */
export function regrouperPourExport(programmes: IProgramme[], ctx: ContexteExport = {}): SectionsExport {
  const parSite = new Map<string, { nom: string; deduit: boolean; programmes: IProgramme[] }>();
  const superviseurs: IProgramme[] = [];
  for (const p of programmes) {
    if (p.typeLivreur === 'SUPERVISEUR_LIVREUR') {
      superviseurs.push(p);
      continue;
    }
    const poste = p.siteId ? null : postePrincipal(p);
    const cle = p.siteId ?? (poste ? `poste:${poste.id}` : '');
    const nom = p.siteId ? (ctx.sites?.get(p.siteId)?.nom ?? 'Site inconnu') : (poste?.nom ?? '');
    const e = parSite.get(cle) ?? { deduit: !p.siteId && !!poste, nom, programmes: [] };
    e.programmes.push(p);
    parSite.set(cle, e);
  }

  const livreurs = Array.from(parSite.entries())
    .map(([cle, e]) => {
      const site = cle && !e.deduit ? ctx.sites?.get(cle) : undefined;
      const titre = cle === '' ? 'Sans site ni poste' : e.deduit ? e.nom : `Site ${e.nom}`;
      const lieu = e.deduit ? 'Groupé d’après les postes desservis' : site?.commune || site?.localisation || '';
      return groupe(cle, e.nom, titre, lieu, e.programmes);
    })
    .sort((a, b) => {
      if (!a.cle !== !b.cle) return a.cle ? -1 : 1;
      return a.titre.localeCompare(b.titre, 'fr');
    });

  const supervision = superviseurs.length > 0 ? [groupe('SUPERVISION', '', 'Supervision', 'Superviseurs-livreurs', superviseurs)] : [];

  let previsionnel = 0;
  for (const p of programmes) {
    const { fige, montant } = carburantAffiche(p);
    if (montant !== null && !fige) previsionnel += montant;
  }
  const totalLivreurs = livreurs.reduce((t, g) => t + g.total, 0);
  const totalSupervision = supervision.reduce((t, g) => t + g.total, 0);
  return {
    independants: programmes.filter((p) => p.typeLivreur === 'INDEPENDANT').length,
    livreurs,
    nbLivreurs: livreurs.reduce((n, g) => n + g.programmes.length, 0),
    nbSupervision: superviseurs.length,
    previsionnel,
    sansMontant: programmes.filter((p) => carburantAffiche(p).montant === null).length,
    septSurSept: programmes.filter((p) => estSeptSurSept(p.jours)).length,
    supervision,
    total: totalLivreurs + totalSupervision,
    totalLivreurs,
    totalSupervision,
  };
}

/** « du 7 au 13 septembre 2026 ». */
function periodeSemaine(annee: number, semaine: number): string {
  const lundi = lundiDeSemaine(annee, semaine);
  const dimanche = new Date(lundi);
  dimanche.setUTCDate(lundi.getUTCDate() + 6);
  const jour = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', timeZone: 'UTC' });
  const long = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC', year: 'numeric' });
  const memeMois = lundi.getUTCMonth() === dimanche.getUTCMonth();
  return memeMois ? `du ${jour(lundi)} au ${long(dimanche)}` : `du ${long(lundi)} au ${long(dimanche)}`;
}

const effectif = (s: SectionsExport) =>
  [
    `${s.nbLivreurs + s.nbSupervision} programme${s.nbLivreurs + s.nbSupervision > 1 ? 's' : ''}`,
    s.independants > 0 ? `${s.independants} indépendant${s.independants > 1 ? 's' : ''}` : '',
    s.septSurSept > 0 ? `${s.septSurSept} en 7 j/7, repos à compenser` : '',
    s.sansMontant > 0 ? `${s.sansMontant} sans carburant` : '',
    s.previsionnel > 0 ? `${nombre(s.previsionnel)} FCFA encore prévisionnels` : '',
  ]
    .filter(Boolean)
    .join(', ');

// ── Excel ─────────────────────────────────────────────────────────────────────
export function exporterProgrammesExcel(programmes: IProgramme[], annee: number, semaine: number, ctx: ContexteExport = {}): void {
  const s = regrouperPourExport(programmes, ctx);
  /*
   * §8.4 — la colonne « Carburant » devient TROIS colonnes, plus les preuves Wave.
   *
   * ⚠ Dotation et surplus ne se cumulent pas dans une seule colonne : la comptabilité
   * doit pouvoir dire ce qui était prévu et ce qui a été ajouté, et un total unique
   * efface définitivement la distinction.
   */
  const entete = [
    'Site',
    'Livreur',
    'Type',
    'Statut',
    ...JOURS.map((j) => j.court),
    'Jours travaillés',
    'Dotation prévue (FCFA)',
    'Surplus accordés (FCFA)',
    'Total carburant (FCFA)',
    'Preuves Wave',
    'Observations',
  ];
  const vide = (n: number) => Array.from({ length: n }, () => '');
  const lignes: (string | number)[][] = [];

  const ecrireGroupe = (g: GroupeExport) => {
    lignes.push([g.titre.toUpperCase(), g.sousTitre, ...vide(entete.length - 2)]);
    for (const p of g.programmes) {
      const surplus = surplusExport(p);
      lignes.push([
        g.siteNom,
        p.livreurNom ?? '',
        libelleType(p),
        libelleStatut(p),
        ...JOURS.map((j) => celluleJour(p, j.key)),
        joursTravailles(p.jours),
        carburantExport(p),
        // Un surplus à zéro reste VIDE : « 0 » dans une colonne d'argent se lit comme
        // un surplus refusé, pas comme un surplus jamais demandé.
        surplus > 0 ? surplus : '',
        totalCarburantExport(p),
        libellePreuves(preuvesExport(p)),
        observations(p).join(' ; '),
      ]);
    }
    const m = montantGroupe(g);
    const surplusGroupe = g.programmes.reduce((n, p) => n + surplusExport(p), 0);
    const preuvesGroupe = g.programmes.reduce(
      (acc, p) => {
        const c = preuvesExport(p);
        return {
          attendues: acc.attendues + c.attendues,
          manquantes: acc.manquantes + c.manquantes,
          recues: acc.recues + c.recues,
          validees: acc.validees + c.validees,
        };
      },
      { attendues: 0, manquantes: 0, recues: 0, validees: 0 },
    );
    lignes.push([
      `Sous-total ${g.titre}`,
      `${g.programmes.length} ligne${g.programmes.length > 1 ? 's' : ''}`,
      ...vide(entete.length - 7),
      m === null ? '' : m,
      surplusGroupe > 0 ? surplusGroupe : '',
      m === null && surplusGroupe === 0 ? '' : (m ?? 0) + surplusGroupe,
      libellePreuves(preuvesGroupe),
      g.sansMontant > 0 ? `${g.sansMontant} sans montant` : '',
    ]);
  };

  s.livreurs.forEach(ecrireGroupe);
  const surplusTous = programmes.reduce((n, p) => n + surplusExport(p), 0);
  const surplusLivreurs = s.livreurs.flatMap((g) => g.programmes).reduce((n, p) => n + surplusExport(p), 0);
  const surplusSupervision = s.supervision.flatMap((g) => g.programmes).reduce((n, p) => n + surplusExport(p), 0);

  lignes.push(['SOUS-TOTAL LIVREURS', `${s.nbLivreurs} livreur${s.nbLivreurs > 1 ? 's' : ''}`, ...vide(entete.length - 7), s.totalLivreurs, surplusLivreurs > 0 ? surplusLivreurs : '', s.totalLivreurs + surplusLivreurs, '', '']);
  s.supervision.forEach(ecrireGroupe);
  if (s.nbSupervision > 0) {
    lignes.push(['SOUS-TOTAL SUPERVISION', `${s.nbSupervision} superviseur${s.nbSupervision > 1 ? 's' : ''}`, ...vide(entete.length - 7), s.totalSupervision, surplusSupervision > 0 ? surplusSupervision : '', s.totalSupervision + surplusSupervision, '', '']);
  }
  const preuvesTous = programmes.reduce(
    (acc, p) => {
      const c = preuvesExport(p);
      return {
        attendues: acc.attendues + c.attendues,
        manquantes: acc.manquantes + c.manquantes,
        recues: acc.recues + c.recues,
        validees: acc.validees + c.validees,
      };
    },
    { attendues: 0, manquantes: 0, recues: 0, validees: 0 },
  );
  lignes.push([
    'GRAND TOTAL CARBURANT SEMAINE',
    '',
    ...vide(entete.length - 7),
    s.total,
    surplusTous > 0 ? surplusTous : '',
    s.total + surplusTous,
    libellePreuves(preuvesTous),
    s.previsionnel > 0 ? `dont ${s.previsionnel} prévisionnels` : '',
  ]);
  const prec = ctx.carburantSemainePrecedente;
  if (prec !== null && prec !== undefined) {
    lignes.push(['Écart vs semaine précédente', `précédente : ${prec}`, ...vide(entete.length - 7), s.total - prec, '', '', '', '']);
  }
  lignes.push(['Effectif', effectif(s), ...vide(entete.length - 2)]);

  const feuille = XLSX.utils.aoa_to_sheet([entete, ...lignes]);
  feuille['!cols'] = [{ wch: 22 }, { wch: 26 }, { wch: 18 }, { wch: 11 }, ...JOURS.map(() => ({ wch: 13 })), { wch: 9 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 26 }, { wch: 48 }];

  const parSite = XLSX.utils.aoa_to_sheet([
    ['Site', 'Livreurs', 'Carburant (FCFA)', 'Dessert'],
    ...s.livreurs.map((g) => [g.titre, g.programmes.length, montantGroupe(g) ?? '', g.sousTitre]),
    ...s.supervision.map((g) => [g.titre, g.programmes.length, montantGroupe(g) ?? '', g.sousTitre]),
    ['Grand total', s.nbLivreurs + s.nbSupervision, s.total, ''],
  ]);
  parSite['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 16 }, { wch: 60 }];

  /*
   * ANNEXE « DÉTAIL DES SURPLUS » (§8.4).
   *
   * Une colonne de totaux ne suffit pas à la comptabilité : elle doit pouvoir dire
   * POURQUOI 15 000 FCFA ont été ajoutés, livreur par livreur. Sans cette annexe,
   * l'écart entre le prévu et le payé n'a aucune explication dans le document.
   */
  const lignesSurplus: (string | number)[][] = [];
  for (const p of programmes) {
    for (const [jour, liste] of Object.entries((p.complement ?? COMPLEMENT_VIDE).surplusParJour ?? {})) {
      for (const su of liste ?? []) {
        lignesSurplus.push([
          p.livreurNom ?? '',
          jourLisible(jour),
          nomDuSite(su.siteId, ctx),
          libelleMotifSurplus(su.motif),
          su.commentaire ?? '',
          su.montant ?? 0,
          // Un surplus ANNULÉ figure, barré d'un mot : le retirer ferait disparaître
          // une décision qui a existé, et son annulation est justement ce qui explique
          // un écart entre deux versions de l'export.
          su.annule ? `Annulé${su.motifAnnulation ? ` : ${su.motifAnnulation}` : ''}` : 'Accordé',
        ]);
      }
    }
  }

  /*
   * ANNEXE « PREUVES DE VERSEMENT WAVE » (§8.4).
   *
   * Une preuve attendue par ligne, y compris celles qui MANQUENT : une annexe qui ne
   * listerait que les captures reçues ne dirait jamais ce qu'il reste à réclamer.
   */
  const lignesPreuves: (string | number)[][] = [];
  const aujourdhui = new Date();
  for (const p of programmes) {
    const complement = p.complement ?? COMPLEMENT_VIDE;
    for (const jour of JOURS_SEMAINE) {
      const j = (p.jours ?? []).find((x) => x.jour === jour);
      if (!j?.actif || !j.date || new Date(j.date) > aujourdhui) continue;

      const versements: { montant: number; surplusId: string | null; nature: string }[] = [];
      if ((j.montantCarburant ?? 0) > 0) {
        versements.push({ montant: j.montantCarburant ?? 0, nature: 'Dotation', surplusId: null });
      }
      for (const su of (complement.surplusParJour?.[jour] ?? []).filter((x) => !x.annule)) {
        versements.push({ montant: su.montant ?? 0, nature: 'Surplus', surplusId: su.id });
      }

      for (const v of versements) {
        const captures = (complement.preuvesParJour?.[jour] ?? []).filter(
          (x) => (x.surplusId ?? null) === v.surplusId,
        );
        const vivante = captures.find((x) => x.statut !== 'REJETEE') ?? null;
        lignesPreuves.push([
          p.livreurNom ?? '',
          jourLisible(jour),
          v.nature,
          v.montant,
          vivante?.referenceTransaction ?? '',
          vivante?.envoyeLe ? new Date(vivante.envoyeLe).toLocaleString('fr-FR') : '',
          vivante == null
            ? 'Manquante'
            : vivante.statut === 'VALIDEE'
              ? 'Validée'
              : 'Reçue, à valider',
        ]);
      }
    }
  }

  const classeur = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(classeur, feuille, `S${semaine}-${annee}`);
  XLSX.utils.book_append_sheet(classeur, parSite, 'Par site');

  if (lignesSurplus.length > 0) {
    const f = XLSX.utils.aoa_to_sheet([
      ['Livreur', 'Jour', 'Site', 'Motif', 'Commentaire', 'Montant (FCFA)', 'État'],
      ...lignesSurplus,
      ['Total', '', '', '', '', surplusTous, ''],
    ]);
    f['!cols'] = [{ wch: 26 }, { wch: 12 }, { wch: 28 }, { wch: 22 }, { wch: 38 }, { wch: 16 }, { wch: 34 }];
    XLSX.utils.book_append_sheet(classeur, f, 'Détail des surplus');
  }

  if (lignesPreuves.length > 0) {
    const f = XLSX.utils.aoa_to_sheet([
      ['Livreur', 'Jour', 'Nature', 'Montant (FCFA)', 'ID de transaction', 'Envoyée le', 'État'],
      ...lignesPreuves,
    ]);
    f['!cols'] = [{ wch: 26 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 28 }, { wch: 20 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(classeur, f, 'Preuves Wave');
  }

  XLSX.writeFile(classeur, `programmes_${annee}_S${semaine}.xlsx`);
}

// ── PDF ───────────────────────────────────────────────────────────────────────
const RED = [220, 38, 38] as const;
const YELLOW = [250, 204, 21] as const;
const DARK = [30, 30, 30] as const;
const GRAY = [100, 100, 100] as const;
const LIGHT = [241, 245, 249] as const;
const BAND = [229, 233, 239] as const;
const REPOS = [226, 229, 234] as const;
const BORDER = [210, 218, 230] as const;

interface ColPdf {
  header: string;
  w: number;
  value: (p: IProgramme) => string;
  /** Un montant s'aligne a droite. */
  droite?: boolean;
  /**
   * Une cellule de jour : l'heure de début au-dessus de l'heure de fin, centrées, et le
   * repos mis en évidence. Écrire « 08:00-17:30 » sur une seule ligne demanderait 25 mm
   * par jour, soit 175 mm des 283 utiles : les horaires sortaient tronqués en
   * « 08:00-17… ». La grille de l'écran empile déjà les deux heures.
   */
  jour?: boolean;
  /** Le texte peut prendre deux lignes. */
  multiligne?: boolean;
}

/*
 * 269 mm : la largeur d'une A4 paysage (297) moins les deux marges de 14. La table
 * mesurait 283 et touchait le bord droit de la feuille, sans marge ni pour le tableau ni
 * pour les cartes du pied.
 */
const COLS_PDF: ColPdf[] = [
  { header: 'Livreur', w: 36, value: (p) => p.livreurNom ?? '—' },
  { header: 'Type', w: 24, value: libelleTypeCourt },
  ...JOURS.map((j) => ({ header: j.court, w: 13, value: (p: IProgramme) => celluleJour(p, j.key), jour: true })),
  { header: 'Jours', w: 11, value: (p) => String(joursTravailles(p.jours)), droite: true },
  { header: 'Carburant', w: 22, value: (p) => { const { montant } = carburantAffiche(p); return montant === null ? '—' : nombre(montant); }, droite: true },
  { header: 'Observations', w: 85, value: (p) => observations(p).join(' · '), multiligne: true },
];

const TABLE_W = COLS_PDF.reduce((s, c) => s + c.w, 0);
const START_X = 14;
const ROW_H = 9;
const HEADER_H = 9;
const GROUP_H = 9;
const HEADER_BAND_H = 26;
const PAGE_MARGIN_BOTTOM = 15;

/** Le document, prêt à enregistrer ou à joindre. */
function construirePdfProgrammes(
  programmes: IProgramme[],
  annee: number,
  semaine: number,
  filtreLabel: string,
  ctx: ContexteExport = {},
): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const s = regrouperPourExport(programmes, ctx);

  /** Écrire dans le document : le texte est assaini, jamais tronqué au petit bonheur. */
  const ecrire = (texte: string, x: number, y: number, opts?: { align?: 'right' | 'center'; largeur?: number }) => {
    let t = winAnsi(texte);
    if (opts?.largeur) {
      // On mesure au lieu de deviner : « Superviseur-livreur » sortait coupé sur une
      // colonne où il tenait, et un nom court était coupé sur une autre où il ne tenait pas.
      while (t.length > 1 && doc.getTextWidth(t) > opts.largeur) t = `${t.slice(0, -2)}…`;
    }
    doc.text(t, x, y, opts?.align ? { align: opts.align } : undefined);
  };

  function drawPageHeader() {
    doc.setFillColor(...RED);
    doc.rect(0, 0, pageW, HEADER_BAND_H, 'F');
    doc.setFillColor(...YELLOW);
    doc.rect(0, HEADER_BAND_H - 3, pageW, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    ecrire(`Programme hebdomadaire des teams, semaine ${semaine} / ${annee}`, START_X, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 230, 150);
    ecrire(
      `Livreurs par site · Supervision · ${periodeSemaine(annee, semaine)}   •   Type : ${filtreLabel}   •   ${programmes.length} programme(s)   •   Établi le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      START_X,
      19,
    );

    /*
     * LE BANDEAU CARBURANT DANS L'EN-TÊTE (§8.4), à droite du titre.
     *
     * La direction lit ce document sans l'écran à côté. Le total à décaisser, sa
     * dotation et ses surplus doivent y être AVANT le tableau : chercher le total en
     * bas de la dernière page est exactement ce qu'on évite en l'écrivant ici.
     */
    const surplusTotal = programmes.reduce((n, prog) => n + surplusExport(prog), 0);
    const aDecaisser = s.total + surplusTotal;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    ecrire(`${nombre(aDecaisser)} FCFA à décaisser`, pageW - START_X, 12, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 230, 150);
    ecrire(
      `Dotation ${nombre(s.total)}   •   Surplus ${nombre(surplusTotal)}`
        + `   •   Journaliers ${nombre(s.totalLivreurs)}   •   Superviseurs ${nombre(s.totalSupervision)}`,
      pageW - START_X,
      19,
      { align: 'right' },
    );

    doc.setTextColor(...DARK);
  }

  function drawTableHeader(y: number): number {
    doc.setFillColor(...RED);
    doc.roundedRect(START_X, y, TABLE_W, HEADER_H, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    let x = START_X;
    for (const col of COLS_PDF) {
      if (col.droite) ecrire(col.header, x + col.w - 2.5, y + 6, { align: 'right' });
      else if (col.jour) ecrire(col.header, x + col.w / 2, y + 6, { align: 'center' });
      else ecrire(col.header, x + 2.5, y + 6);
      x += col.w;
    }
    doc.setTextColor(...DARK);
    return y + HEADER_H;
  }

  function nouvellePage(avecEntete = true): number {
    doc.addPage();
    drawPageHeader();
    // Le pied du document n'est pas un tableau : une page qui ne porte que les totaux ne
    // redessine pas une ligne d'en-tête au-dessus de rien.
    const y = avecEntete ? drawTableHeader(HEADER_BAND_H + 4) : HEADER_BAND_H + 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    return y;
  }

  function assurerPlace(y: number, h: number, avecEntete = true): number {
    return y + h > pageH - PAGE_MARGIN_BOTTOM ? nouvellePage(avecEntete) : y;
  }

  function drawGroupe(y: number, g: GroupeExport): number {
    y = assurerPlace(y, GROUP_H + ROW_H);
    doc.setFillColor(...BAND);
    doc.rect(START_X, y, TABLE_W, GROUP_H, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    const titre = g.titre.toUpperCase();
    ecrire(titre, START_X + 2.5, y + 6);
    if (g.sousTitre) {
      const largeurTitre = doc.getTextWidth(titre);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      ecrire(g.sousTitre, START_X + 2.5 + largeurTitre + 4, y + 6, { largeur: TABLE_W - largeurTitre - 10 });
    }
    y += GROUP_H;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    g.programmes.forEach((p, i) => {
      const obs = doc.splitTextToSize(winAnsi(COLS_PDF[COLS_PDF.length - 1].value(p)), COLS_PDF[COLS_PDF.length - 1].w - 5) as string[];
      const lignesObs = obs.slice(0, 2);
      const h = lignesObs.length > 1 ? ROW_H + 3.5 : ROW_H;
      y = assurerPlace(y, h);
      if (i % 2 === 0) {
        doc.setFillColor(...LIGHT);
        doc.rect(START_X, y, TABLE_W, h, 'F');
      }
      doc.setDrawColor(...BORDER);
      doc.line(START_X, y + h, START_X + TABLE_W, y + h);

      let x = START_X;
      for (const col of COLS_PDF) {
        const raw = col.value(p);
        if (col.jour) {
          const travaille = raw.includes('-');
          if (!travaille) {
            // Le repos et l'absence se voient : la cellule est grisée. Pas de rouge, un
            // jour sans service n'est pas une faute.
            doc.setFillColor(...REPOS);
            doc.rect(x + 0.6, y + 0.6, col.w - 1.2, h - 1.2, 'F');
            doc.setTextColor(...GRAY);
            ecrire(raw, x + col.w / 2, y + h / 2 + 1.2, { align: 'center', largeur: col.w - 3 });
          } else {
            const [debut, fin] = raw.split('-');
            doc.setTextColor(...DARK);
            ecrire(debut, x + col.w / 2, y + h / 2 - 0.6, { align: 'center' });
            doc.setTextColor(...GRAY);
            ecrire(fin, x + col.w / 2, y + h / 2 + 2.8, { align: 'center' });
          }
          x += col.w;
          continue;
        }
        doc.setTextColor(...DARK);
        if (col.multiligne) {
          lignesObs.forEach((l, k) => ecrire(l, x + 2.5, y + 5.2 + k * 3.5));
        } else if (col.droite) {
          ecrire(raw, x + col.w - 2.5, y + 5.2, { align: 'right', largeur: col.w - 5 });
        } else {
          ecrire(raw, x + 2.5, y + 5.2, { largeur: col.w - 5 });
        }
        x += col.w;
      }
      y += h;
    });

    // Le sous-total du groupe, comme sur le papier.
    y = assurerPlace(y, ROW_H);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    ecrire(`Sous-total ${g.titre}`, START_X + 2.5, y + 5.2, { largeur: 56 });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    ecrire(`${g.programmes.length} ligne${g.programmes.length > 1 ? 's' : ''}${g.sansMontant > 0 ? `, ${g.sansMontant} sans montant` : ''}`, START_X + 60, y + 5.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    ecrire(libelleMontantGroupe(g), START_X + TABLE_W - 2.5, y + 5.2, { align: 'right' });
    doc.setDrawColor(...BORDER);
    doc.line(START_X, y + ROW_H, START_X + TABLE_W, y + ROW_H);
    doc.setFont('helvetica', 'normal');
    return y + ROW_H;
  }

  function drawSectionTotal(y: number, libelle: string, montant: number): number {
    y = assurerPlace(y, ROW_H + 1);
    doc.setFillColor(...BAND);
    doc.rect(START_X, y, TABLE_W, ROW_H, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    ecrire(libelle.toUpperCase(), START_X + 2.5, y + 5.7);
    ecrire(fcfa(montant), START_X + TABLE_W - 2.5, y + 5.7, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    return y + ROW_H + 2;
  }

  drawPageHeader();
  let y = drawTableHeader(HEADER_BAND_H + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  for (const g of s.livreurs) y = drawGroupe(y, g);
  if (s.livreurs.length > 0) y = drawSectionTotal(y, `Sous-total livreurs (${s.nbLivreurs})`, s.totalLivreurs);
  for (const g of s.supervision) y = drawGroupe(y, g);
  if (s.supervision.length > 0) y = drawSectionTotal(y, `Sous-total supervision (${s.nbSupervision})`, s.totalSupervision);

  // Le pied du document papier : trois cartes, le grand total, l'écart, l'effectif.
  y = assurerPlace(y + 2, 26, false);
  const cartes: Array<{ libelle: string; montant: number; fort?: boolean }> = [
    { libelle: `Livreurs (${s.nbLivreurs})`, montant: s.totalLivreurs },
    { libelle: `Supervision (${s.nbSupervision})`, montant: s.totalSupervision },
    { fort: true, libelle: 'GRAND TOTAL CARBURANT DE LA SEMAINE', montant: s.total },
  ];
  const carteW = TABLE_W / cartes.length;
  cartes.forEach((c, i) => {
    const x = START_X + i * carteW;
    if (c.fort) {
      doc.setFillColor(...DARK);
      doc.rect(x, y, carteW, 14, 'F');
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(...LIGHT);
      doc.rect(x, y, carteW, 14, 'F');
      doc.setTextColor(...GRAY);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    ecrire(c.libelle, x + carteW / 2, y + 5, { align: 'center', largeur: carteW - 6 });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(c.fort ? 11 : 9.5);
    if (!c.fort) doc.setTextColor(...DARK);
    ecrire(fcfa(c.montant), x + carteW / 2, y + 11, { align: 'center' });
  });
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  const prec = ctx.carburantSemainePrecedente;
  const lignesPied: string[] = [];
  if (prec !== null && prec !== undefined) {
    const ecart = s.total - prec;
    lignesPied.push(`Écart vs programme précédent (${fcfa(prec)}) : ${ecart === 0 ? '0' : `${ecart > 0 ? '+' : '-'}${nombre(Math.abs(ecart))}`} FCFA`);
  }
  lignesPied.push(`Effectif : ${effectif(s)}.`);
  lignesPied.forEach((l, k) => ecrire(l, START_X + 2.5, y + k * 4));

  const totalPages = doc.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    ecrire('Turbo Delivery · Direction des Opérations · Document interne', START_X, pageH - 7);
    ecrire(`Page ${pg} / ${totalPages}`, pageW - 28, pageH - 7);
    doc.setFillColor(...RED);
    doc.rect(0, pageH - 5, pageW, 5, 'F');
  }

  return doc;
}

export function exporterProgrammesPdf(
  programmes: IProgramme[],
  annee: number,
  semaine: number,
  filtreLabel = 'Tous',
  ctx: ContexteExport = {},
): void {
  construirePdfProgrammes(programmes, annee, semaine, filtreLabel, ctx).save(`programmes_${annee}_S${semaine}.pdf`);
}

/**
 * Le même document en mémoire, pour le joindre en justificatif à l'engagement du
 * carburant : le circuit finance exige une pièce, et celle-ci est celle qui dit d'où vient
 * le total.
 */
export function pdfProgrammesBlob(
  programmes: IProgramme[],
  annee: number,
  semaine: number,
  filtreLabel = 'Programmes publiés',
  ctx: ContexteExport = {},
): Blob {
  return construirePdfProgrammes(programmes, annee, semaine, filtreLabel, ctx).output('blob');
}

// ── PDF individuel (un livreur) ────────────────────────────────────────────────
const JOURS_LONG: Array<{ key: string; label: string }> = [
  { key: 'LUNDI', label: 'Lundi' },
  { key: 'MARDI', label: 'Mardi' },
  { key: 'MERCREDI', label: 'Mercredi' },
  { key: 'JEUDI', label: 'Jeudi' },
  { key: 'VENDREDI', label: 'Vendredi' },
  { key: 'SAMEDI', label: 'Samedi' },
  { key: 'DIMANCHE', label: 'Dimanche' },
];

/** Document portrait « X, voici ton programme cette semaine » pour un livreur. Sans carburant. */
export function exporterProgrammeIndividuelPdf(programme: IProgramme, annee: number, semaine: number, siteNom?: string | null): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const nom = programme.livreurNom ?? '—';
  const prenom = (programme.livreurNom ?? '').split(' ')[0] || 'Bonjour';

  doc.setFillColor(...RED);
  doc.rect(0, 0, pageW, 30, 'F');
  doc.setFillColor(...YELLOW);
  doc.rect(0, 27, pageW, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Mon programme', 14, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 230, 150);
  doc.text(`${nom}${programme.typeLivreur ? ' • ' + libelleType(programme) : ''}  •  Semaine ${semaine} / ${annee}`, 14, 22);
  doc.setTextColor(...DARK);

  let y = 44;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${prenom}, voici ton programme cette semaine`, 14, y);
  y += 7;
  if (siteNom) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text(`Site : ${siteNom}`, 14, y);
    doc.setTextColor(...DARK);
    y += 4;
  }
  y += 3;

  doc.setFontSize(11);
  for (const jr of JOURS_LONG) {
    const j = programme.jours?.find((x) => (x.jour ?? '').toUpperCase() === jr.key);
    const repos = !j || !j.actif;
    doc.setDrawColor(...BORDER);
    doc.line(14, y + 8, pageW - 14, y + 8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(jr.label, 16, y + 5.5);
    doc.setFont('helvetica', 'normal');
    if (repos) {
      // Le repos etait peint en ROUGE : un jour sans service n'est pas une alerte, et
      // sur une semaine a deux repos le document en montrait deux. Gris, comme a l'ecran.
      doc.setTextColor(...GRAY);
      doc.text(libelleJourInactif(j), pageW - 16, y + 5.5, { align: 'right' });
    } else {
      doc.setTextColor(...DARK);
      doc.text(`${hhmm(j!.debut)} – ${hhmm(j!.fin)}`, pageW - 16, y + 5.5, { align: 'right' });
    }
    y += 11;
  }

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(
    `Exporté le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    14,
    y + 6,
  );

  doc.save(`programme_${nom.replace(/\s+/g, '_')}_S${semaine}.pdf`);
}

// ── Détail des surplus carburant (§7, annexe de l'export §8.4) ────────────────

/**
 * Le détail des surplus d'une semaine, en PDF.
 *
 * <p>C'est le justificatif de la charge de soumission : le circuit finance exige une
 * pièce à la création d'une charge, et celle-ci doit dire d'où vient le total — qui,
 * quel jour, quel site, quel motif, accordé par qui. Un montant global sans ce détail
 * n'est pas approuvable : le DGA ne saurait pas ce qu'il vise.</p>
 *
 * <p>⚠ Tout texte passe par {@code winAnsi}. L'espace fine insécable que
 * {@code toLocaleString('fr-FR')} insère dans un montant s'imprime « 20/000 » dans la
 * police par défaut de jsPDF — un montant faux, et personne ne le relit.</p>
 */
export function pdfSurplusBlob(
  surplus: Array<{
    livreurNom: string;
    jour: string;
    siteNom: string;
    montant: number;
    motif: string;
    commentaire?: string | null;
  }>,
  annee: number,
  semaine: number,
): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const x0 = 14;
  const largeur = pageW - 2 * x0;

  doc.setFillColor(...RED);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(winAnsi(`Surplus carburant — semaine ${semaine} / ${annee}`), x0, 11);

  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const total = surplus.reduce((n, s) => n + (s.montant ?? 0), 0);
  doc.text(
    winAnsi(
      `${surplus.length} surplus accordé${surplus.length > 1 ? 's' : ''} pendant la semaine, ${fcfa(total)} au total. `
        + `Distinct de la dotation, engagée avant la semaine.`,
    ),
    x0,
    26,
    { maxWidth: largeur },
  );

  const colonnes = [
    { header: 'Livreur', w: 42 },
    { header: 'Jour', w: 22 },
    { header: 'Site', w: 44 },
    { header: 'Motif', w: 36 },
    { header: 'Montant', w: 24, droite: true },
  ];

  let y = 36;
  const enTete = () => {
    doc.setFillColor(...BAND);
    doc.rect(x0, y, largeur, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    let x = x0;
    for (const c of colonnes) {
      doc.text(winAnsi(c.header), c.droite ? x + c.w - 2 : x + 2, y + 5.4, { align: c.droite ? 'right' : 'left' });
      x += c.w;
    }
    y += 8;
    doc.setFont('helvetica', 'normal');
  };
  enTete();

  for (const [i, s] of surplus.entries()) {
    // Le saut de page REFAIT l'en-tête : sans lui, la deuxième page est une colonne de
    // chiffres sans nom, et c'est celle que la comptabilité archive.
    if (y > pageH - 24) {
      doc.addPage();
      y = 16;
      enTete();
    }
    if (i % 2 === 1) {
      doc.setFillColor(...LIGHT);
      doc.rect(x0, y, largeur, 7, 'F');
    }
    const valeurs = [
      s.livreurNom,
      s.jour.charAt(0) + s.jour.slice(1).toLowerCase(),
      s.siteNom,
      s.commentaire ? `${s.motif} — ${s.commentaire}` : s.motif,
      nombre(s.montant),
    ];
    let x = x0;
    doc.setFontSize(8);
    for (const [k, c] of colonnes.entries()) {
      doc.text(winAnsi(valeurs[k] ?? ''), c.droite ? x + c.w - 2 : x + 2, y + 4.8, {
        align: c.droite ? 'right' : 'left',
        maxWidth: c.w - 4,
      });
      x += c.w;
    }
    doc.setDrawColor(...BORDER);
    doc.line(x0, y + 7, x0 + largeur, y + 7);
    y += 7;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(winAnsi('Total'), x0 + 2, y + 6);
  doc.text(winAnsi(fcfa(total)), x0 + largeur - 2, y + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(winAnsi('Turbo Delivery · Direction des Opérations · Document interne'), x0, pageH - 7);

  return doc.output('blob');
}
