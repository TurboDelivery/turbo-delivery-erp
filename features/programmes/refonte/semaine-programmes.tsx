'use client';

import { Button, Card, Checkbox, Chip, ComboBox, Dropdown, Input, Label, ListBox, SearchField, type Selection, Separator, Spinner, Table, ToggleButton, ToggleButtonGroup, Tooltip } from '@heroui-v3/react';
import { ChevronDown, MoreHorizontal, TriangleAlert } from 'lucide-react';
import React from 'react';

import { EnteteSemaine } from './entete-semaine';
import { VueCouverture } from './vue-couverture';

import { COMPLEMENT_VIDE, type IAutosuffisanceJour, type IBandeauCarburant, type IJourProgramme, type IProgramme, type StatutProgramme } from '@/features/turboys/types/programme.types';
import { carburantAffiche, totauxCarburant } from '@/features/turboys/utils/carburant.utils';
import { aRecuUnSurplus } from '@/features/turboys/utils/couverture.utils';
import { estSeptSurSept, OBSERVATION_SEPT_SUR_SEPT } from '@/features/turboys/utils/jour.utils';
import { finitApresMinuit } from '@/features/turboys/utils/jours-programme.utils';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { libelleWhatsApp } from '@/features/turboys/utils/whatsapp-statut.utils';
import { cn } from '@/lib/utils';
import { formatMontant } from '@/utils/format.utils';

/**
 * La semaine des programmes, refondue.
 *
 * <h3>Ce que l'écran demandait de faire, et ce qu'il coûtait</h3>
 * <p>Son but tient en une phrase : que chaque livreur ait, pour la semaine à venir, un
 * programme PUBLIÉ qu'il puisse accepter. Rien ne le disait. L'écran s'ouvrait sur un
 * titre, sept boutons de barre d'outils et deux filtres, puis une grille de douze
 * colonnes où chaque ligne portait quatre à cinq boutons de même poids visuel. Sur
 * quarante livreurs, cela faisait deux cents boutons, et « Publier » — le seul geste qui
 * fait avancer la semaine — se répétait quarante fois, une ligne après l'autre.</p>
 *
 * <h3>Les trois questions, et ce qu'elles changent</h3>
 * <ul>
 *   <li><b>Ce qu'on regarde en premier</b> : où en est la semaine. Combien de programmes
 *       attendent encore d'être publiés, et combien ont été REFUSÉS — un refus laisse un
 *       livreur sans semaine, c'est la seule urgence de cet écran et il n'était signalé
 *       que par une puce rouge au milieu d'une ligne.</li>
 *   <li><b>Ce qui appelle une action</b> : publier. Le geste devient un LOT — on coche,
 *       on publie une fois — et chaque ligne ne garde qu'un seul bouton, celui de son
 *       étape suivante ; le reste passe dans un menu. Cent soixante boutons disparaissent
 *       de l'écran sans qu'aucune capacité ne soit perdue, « Envoyer au livreur »
 *       comprise, qui était enterrée dans la fenêtre d'aperçu.</li>
 *   <li><b>La forme de la donnée</b> : une semaine de planning EST une grille, elle est
 *       conservée. Mais un jour de repos n'est pas une faute : il s'affichait en rouge,
 *       encadré, sur fond `bg-danger-50`, alors qu'une semaine normale en compte deux. Le
 *       repos devient un tiret, et la couleur revient à ce qu'elle doit dire.</li>
 * </ul>
 *
 * <h3>Ce qui apparaît, et qui n'existait pas</h3>
 * <p>La recherche par nom. Avec quarante lignes et deux filtres par catégorie, retrouver
 * un livreur se faisait à l'œil.</p>
 *
 * <h3>Le carburant</h3>
 * <p>Le document que les Opérations produisaient à la main portait, pour chaque livreur,
 * son carburant de la semaine, des sous-totaux par population, un grand total et l'écart
 * contre la semaine précédente. L'écran ne portait rien de cela. Il porte maintenant les
 * quatre, calculés depuis les programmes : le montant figé par le serveur quand le
 * programme est parti chez le livreur, le prévisionnel sinon. Le prévisionnel est en gris,
 * parce qu'il n'engage encore rien.</p>
 */

export interface SemaineProgrammesProps {
  programmes: IProgramme[];
  /** Créneaux déclarés par les indépendants via l'app — lecture seule. */
  independants: IProgramme[];
  autosuffisance: IAutosuffisanceJour[];
  annee: number;
  semaine: number;
  onSemaine: (delta: number) => void;

  typeFiltre: string;
  onTypeFiltre: (v: string) => void;
  typeOptions: { cle: string; libelle: string }[];
  partenaires: { id: string; nom: string }[];
  partenaireFiltre: string;
  onPartenaireFiltre: (v: string) => void;
  partenairesEnCours?: boolean;

  /**
   * Ouvrir l'aperçu sur ce programme.
   *
   * <p>Le second argument porte la POSITION DANS L'ORDRE AFFICHÉ, parce que seule la
   * liste la connaît : elle regroupe par base, met « À compléter » en premier et trie
   * par nom. L'appelant qui voudrait recalculer cet ordre devrait dupliquer ce
   * regroupement, et les flèches ‹ › du panneau finiraient par sauter des lignes ou
   * revenir en arrière.</p>
   */
  onApercu: (p: IProgramme, ordre?: { index: number; liste: IProgramme[] }) => void;
  /** Le carburant du programme, en un geste : un montant par jour travaillé. */
  onCarburant: (p: IProgramme) => void;
  /** Le même geste sur les lignes cochées. */
  onCarburantLot: (programmes: IProgramme[]) => void;
  onEditer: (p: IProgramme) => void;
  onPlanifier: (p: IProgramme) => void;
  onPublier: (p: IProgramme) => void;
  /** Envoyer (ou relancer) la notification au livreur. */
  onEnvoyer: (p: IProgramme) => void;
  /** Renvoyer par WhatsApp seulement, sans republier. */
  onRenvoyerWhatsApp: (p: IProgramme) => void;
  /** Qui a changé quoi sur ce programme, et quand. */
  onHistorique: (p: IProgramme) => void;
  /** Affecter à un autre site aujourd'hui (RG-S08). Absent = l'entrée n'apparaît pas. */
  onAffecterSite?: (p: IProgramme) => void;
  /** Dupliquer CE programme sur S+1 (§6.2). Absent = l'entrée n'apparaît pas. */
  onDupliquerSuivante?: (p: IProgramme) => void;
  onSupprimer: (p: IProgramme) => void;
  onNouveau: () => void;
  /** Publier d'un coup les programmes cochés. */
  onPublierLot: (ids: string[]) => void;

  /**
   * Ouvrir la duplication d'une semaine entière vers une autre, en brouillon.
   *
   * <p>Le nom garde « Precedente » pour ne pas casser les appelants, mais le geste ne
   * l'est plus : la fenetre laisse choisir la semaine source ET la semaine cible. Par
   * defaut, elle part de la semaine affichee vers la suivante.</p>
   */
  onDupliquerSemainePrecedente: () => void;
  onImporterFichier: () => void;
  onTelechargerModele: () => void;
  onExporterExcel: () => void;
  onExporterPdf: () => void;
  importEnCours?: boolean;
  lotEnCours?: boolean;

  idEnCours?: string | null;
  isLoading?: boolean;
  isError?: boolean;
  onReessayer?: () => void;

  independantsIsLoading?: boolean;
  independantsIsError?: boolean;
  onReessayerIndependants?: () => void;
  autosuffisanceIsLoading?: boolean;
  autosuffisanceIsError?: boolean;

  /** Total carburant de la semaine précédente, pour l'écart. Null : pas de terme de comparaison. */
  carburantSemainePrecedente?: number | null;
  /** La ligne d'engagement dans le circuit finance, rendue par l'appelant : elle porte ses propres requêtes. */
  engagement?: React.ReactNode;

  /** Le bandeau carburant du serveur (§8.2). Null tant qu'il n'est pas lu. */
  bandeau?: IBandeauCarburant | null;
  bandeauEnCours?: boolean;

  /**
   * L'envoi WhatsApp n'est pas configuré : un seul bandeau en tête de page (§5.2), au
   * lieu de la mention répétée sur chaque ligne.
   */
  whatsappNonConfigure?: boolean;
  onConfigurerWhatsApp?: () => void;

  /** Affecter un renfort sur un site, un jour, depuis la vue Couverture (RG-S08). */
  onAffecterRenfort?: (siteId: string, jour: string) => void;
  /** Ouvrir la configuration des couvertures (§8.5). */
  onConfigurerCouvertures?: () => void;
}

const JOURS = [
  { cle: 'LUNDI', court: 'Lun' },
  { cle: 'MARDI', court: 'Mar' },
  { cle: 'MERCREDI', court: 'Mer' },
  { cle: 'JEUDI', court: 'Jeu' },
  { cle: 'VENDREDI', court: 'Ven' },
  { cle: 'SAMEDI', court: 'Sam' },
  { cle: 'DIMANCHE', court: 'Dim' },
];

/*
 * Le vocabulaire de la maquette M2 ; le workflow backend reste
 * BROUILLON → PLANIFIE → NOTIFIE → ACCEPTE / REFUSE.
 *
 * `color` porte l'echelle semantique, `variant` l'intensite : c'est la convention posee
 * par `VisaDgaStatutBadge`. L'aplat est reserve aux deux etats qui tranchent — accepte,
 * refuse — et le fond doux aux etats de passage.
 */
const STATUT: Record<string, { libelle: string; couleur: 'default' | 'warning' | 'success' | 'danger'; plein: boolean }> = {
  BROUILLON: { couleur: 'default', libelle: 'Brouillon', plein: false },
  PLANIFIE: { couleur: 'default', libelle: 'Planifié', plein: false },
  NOTIFIE: { couleur: 'warning', libelle: 'Publié', plein: false },
  ACCEPTE: { couleur: 'success', libelle: 'Accepté', plein: true },
  REFUSE: { couleur: 'danger', libelle: 'Refusé', plein: true },
};

/*
 * Les colonnes de la grille, enumerees une seule fois.
 *
 * <p>React Aria EXIGE autant de cellules que de colonnes et leve sinon « Cell count must
 * match column count » — une exception qui fait tomber la page entiere en 500. Le
 * squelette de chargement comptait `JOURS.length + 4` la ou il en faut cinq de plus ; ni
 * `tsc` ni le build ne l'ont vu, seul l'ecran. Le compte se derive donc d'ici.</p>
 */
const COLONNES_GRILLE = ['coche', 'livreur', 'postes', ...JOURS.map((j) => j.cle), 'carburant', 'statut', 'actions'];

/** Les populations du document papier, dans son ordre. */
const TYPES_CARBURANT = ['JOURNALIER', 'SUPERVISEUR_LIVREUR', 'INDEPENDANT'];

/** Un écart signé : le signe fait partie du nombre, pas de la couleur. */
const formatEcart = (n: number) => (n === 0 ? formatMontant(0) : `${n > 0 ? '+' : '−'}${formatMontant(Math.abs(n))}`);

/** Les colonnes de la table des independants, en lecture seule. */
const COLONNES_INDEPENDANTS = ['livreur', ...JOURS.map((j) => j.cle)];

/** Les onglets de la liste (§5.2). « À compléter », « Renforts » et « Superviseurs » sont nouveaux. */
type Onglet = 'TOUS' | 'A_COMPLETER' | 'A_PUBLIER' | 'REFUSE' | 'SANS_CARBURANT' | 'RENFORTS' | 'SUPERVISEURS' | 'AVEC_SURPLUS';

/** Les deux lectures de la semaine (§5.2) : par livreur, ou par site. */
type Vue = 'LIVREURS' | 'COUVERTURE';

/**
 * À COMPLÉTER (RG-L01, RG-L03) : il manque quelque chose pour que le programme puisse
 * partir — le site, les horaires, ou le carburant.
 *
 * <p>Un superviseur-livreur sans base gérée y va aussi (RG-V04) : il n'est rattaché à
 * aucune base, mais il doit en gérer au moins une pour être publiable.</p>
 */
function estACompleter(p: IProgramme): boolean {
  const c = p.complement ?? COMPLEMENT_VIDE;
  if (p.typeLivreur === 'SUPERVISEUR_LIVREUR') {
    if ((c.basesGerees ?? []).length === 0) return true;
  } else if (!p.siteId) {
    return true;
  }
  const actifs = (p.jours ?? []).filter((j) => j.actif);
  if (actifs.length === 0) return true;
  if (actifs.some((j) => !j.debut || !j.fin)) return true;
  return estSansCarburant(p);
}

/** Le livreur dessert-il un site qui n'est pas sa base cette semaine ? (onglet Renforts, §3.2) */
function aDesRenforts(p: IProgramme): boolean {
  return ((p.complement ?? COMPLEMENT_VIDE).sitesDesservis ?? []).length > 0;
}

/** Publiable : le programme n'est pas encore parti chez le livreur. */
const estAPublier = (p: IProgramme) => p.statut === 'BROUILLON' || p.statut === 'PLANIFIE';

/** Sans carburant : aucun jour travaillé ne porte de montant, figé ou prévisionnel. */
const estSansCarburant = (p: IProgramme) => carburantAffiche(p).montant === null;

const hhmm = (t?: string | null) => (t ?? '').slice(0, 5);

/** Les partenaires desservis sur la semaine, toutes journées confondues. */
function postesSemaine(p: IProgramme): string[] {
  return Array.from(new Set((p.jours ?? []).flatMap((j) => (j.postes ?? []).map((po) => po.restaurantNom).filter((n): n is string => Boolean(n)))));
}

/**
 * Une journée.
 *
 * <p>Le repos s'affichait en capitales rouges dans un cadre `bg-danger-50`. Une semaine
 * normale compte deux jours de repos : l'écran signalait donc deux fautes par ligne, et
 * quatre-vingts sur une flotte de quarante. Un jour sans service est un tiret.</p>
 */
function CelluleJour({ jour, p, nomSite }: { jour?: IJourProgramme; nomSite: Map<string, string>; p: IProgramme }) {
  const c = p.complement ?? COMPLEMENT_VIDE;

  if (!jour?.actif) {
    /*
     * RG-L02 — DEUX ÉTATS, ET DEUX SEULEMENT.
     *
     * Il y en avait trois, sans qu'on sache lequel on lisait : « — », « Absent », et une
     * case vide. Le tiret disait le repos, « Absent » venait de la clôture nocturne, et
     * la case vide un jour jamais saisi. La décision du 22/11 tranche : le programme dit
     * ce qui est PRÉVU, et « Absent » — qui désigne un livreur programmé qui ne s'est pas
     * présenté — n'a rien à y faire. Il reste visible dans le pointage, qui est son
     * écran. Un jour non saisi d'un brouillon s'affiche en Repos.
     */
    return (
      <span className="flex justify-center">
        <Chip color="warning" size="sm" variant="soft">
          <Chip.Label>Repos</Chip.Label>
        </Chip>
      </span>
    );
  }

  const sites = c.sitesParJour?.[jour.jour] ?? [];
  // §3.2 — un repère quand le livreur ne travaille pas sur sa base ce jour-là. C'est le
  // renfort : l'information que rien n'enregistrait et qui a motivé toute cette spec.
  const ailleurs = sites.filter((s) => s !== p.siteId);
  const surplus = (c.surplusParJour?.[jour.jour] ?? []).filter((s) => !s.annule);
  const totalSurplus = surplus.reduce((n, s) => n + (s.montant ?? 0), 0);

  return (
    <span className="flex flex-col items-center gap-0.5 leading-tight">
      <Chip color="success" size="sm" variant="soft">
        <Chip.Label className="tabular-nums">
          {hhmm(jour.debut)}–{hhmm(jour.fin)}
          {finitApresMinuit(jour) ? ' +1' : ''}
        </Chip.Label>
      </Chip>
      {ailleurs.length > 0 && (
        <span className="text-[11px] text-warning">
          → {ailleurs.map((s) => nomSite.get(s) ?? s).join(', ')}
        </span>
      )}
      {totalSurplus > 0 && <span className="text-[11px] tabular-nums text-warning">+{formatMontant(totalSurplus)}</span>}
    </span>
  );
}

/**
 * Le carburant d'une ligne.
 *
 * <p>Figé par le serveur : en pleine couleur. Encore prévisionnel : en gris, avec la
 * mention, parce qu'il changera si les Ops retouchent le programme avant publication. Un
 * programme sans aucun montant rend un tiret, pas « 0 FCFA » — rien de saisi n'est pas
 * zéro franc.</p>
 */
function CelluleCarburant({ onCombler, p }: { onCombler?: () => void; p: IProgramme }) {
  const { fige, montant } = carburantAffiche(p);
  const surplus = totalSurplusVivant(p);

  /*
   * RG-L03 — ce qui manque SE VOIT, et se corrige d'un clic.
   *
   * « Sans carburant » s'écrivait « — », en gris, comme le reste : sur trente-huit
   * lignes, les quatre programmes incomplets ne ressortaient pas. C'est une pastille
   * orange, et un clic ouvre la fenêtre sur le champ manquant.
   */
  if (montant === null) {
    return (
      <span className="flex justify-end">
        <Chip className={onCombler ? 'cursor-pointer' : ''} color="warning" onClick={onCombler} size="sm" variant="soft">
          <Chip.Label>Sans carburant</Chip.Label>
        </Chip>
      </span>
    );
  }

  /*
   * RG-L05 — le montant en NOIR, aligné à droite, en chasse tabulaire.
   *
   * C'était le chiffre le plus important de la ligne et le moins lisible : petit, gris,
   * avec « prévisionnel » écrit dessous sur toutes les lignes. L'état du programme suffit
   * à dire si le montant est figé ; il passe en mention discrète, et seulement quand il
   * ne l'est pas.
   */
  return (
    <span className="block text-end leading-tight">
      <span className="block font-medium tabular-nums text-foreground">{formatMontant(montant)}</span>
      {surplus > 0 && <span className="block text-[11px] tabular-nums text-warning">+ {formatMontant(surplus)} surplus</span>}
      {!fige && <span className="block text-[11px] text-muted">prévu</span>}
    </span>
  );
}

/** Les surplus non annulés d'un programme (RG-C04). Les annulés restent visibles ailleurs, pas ici. */
function totalSurplusVivant(p: IProgramme): number {
  const parJour = (p.complement ?? COMPLEMENT_VIDE).surplusParJour ?? {};
  return Object.values(parJour)
    .flat()
    .filter((s) => !s.annule)
    .reduce((n, s) => n + (s.montant ?? 0), 0);
}

/** L'étape suivante du programme, celle qui fait avancer la semaine. */
function ProchainGeste({ enCours, onPlanifier, onPublier, p }: { enCours: boolean; onPlanifier: () => void; onPublier: () => void; p: IProgramme }) {
  if (p.statut === 'BROUILLON') {
    return (
      <Button isPending={enCours} onPress={onPlanifier} size="sm" variant="outline">
        Planifier
      </Button>
    );
  }
  if (p.statut === 'PLANIFIE') {
    return (
      <Button isPending={enCours} onPress={onPublier} size="sm" variant="primary">
        {enCours ? <Spinner size="sm" /> : null}
        Publier
      </Button>
    );
  }
  return null;
}

/**
 * L'en-tête d'un groupe (RG-L01) : le site, son nombre de livreurs, son carburant, et
 * les livreurs présents par jour.
 *
 * <p>⚠ C'est une ligne de tableau ORDINAIRE, avec exactement autant de cellules que de
 * colonnes. Le Table v3 n'expose pas de colSpan, et un compte qui diverge fait tomber la
 * page entière en 500 — c'est écrit noir sur blanc plus haut, à propos de
 * COLONNES_GRILLE. Loin d'être une contrainte subie, les sept cellules de jour portent
 * précisément les présents du groupe, que la règle demande.</p>
 */
function LigneGroupe({ groupe }: { groupe: { cle: string; programmes: IProgramme[]; titre: string } }) {
  const totaux = totauxCarburant(groupe.programmes);
  const presents = (cle: string) =>
    groupe.programmes.filter((p) => (p.jours ?? []).some((j) => (j.jour ?? '').toUpperCase() === cle && j.actif)).length;

  return (
    <Table.Row className="bg-surface-secondary" id={`g-${groupe.cle}`}>
      <Table.Cell className="pe-0">{''}</Table.Cell>
      <Table.Cell>
        <span className="block text-sm font-semibold text-foreground">{groupe.titre}</span>
        <span className="block text-xs text-muted tabular-nums">
          {groupe.programmes.length} livreur{groupe.programmes.length > 1 ? 's' : ''}
        </span>
      </Table.Cell>
      <Table.Cell>{''}</Table.Cell>
      {JOURS.map((j) => {
        const n = presents(j.cle);
        return (
          <Table.Cell className="px-2 text-center" key={j.cle}>
            {/* Une case à zéro est en rouge : ce jour-là, personne n'est prévu ici. */}
            <span className={cn('text-xs font-medium tabular-nums', n === 0 ? 'text-danger' : 'text-muted')}>{n}</span>
          </Table.Cell>
        );
      })}
      <Table.Cell>
        <span className="block text-end text-xs font-semibold tabular-nums text-foreground">
          {totaux.total > 0 ? formatMontant(totaux.total) : ''}
        </span>
      </Table.Cell>
      <Table.Cell>{''}</Table.Cell>
      <Table.Cell>{''}</Table.Cell>
    </Table.Row>
  );
}

export function SemaineProgrammes({
  programmes,
  independants,
  autosuffisance,
  annee,
  semaine,
  onSemaine,
  typeFiltre,
  onTypeFiltre,
  typeOptions,
  partenaires,
  partenaireFiltre,
  onPartenaireFiltre,
  partenairesEnCours = false,
  onApercu,
  onCarburant,
  onCarburantLot,
  onEditer,
  onPlanifier,
  onPublier,
  onEnvoyer,
  onRenvoyerWhatsApp,
  onHistorique,
  onAffecterSite,
  onDupliquerSuivante,
  onSupprimer,
  onNouveau,
  onPublierLot,
  onDupliquerSemainePrecedente,
  onImporterFichier,
  onTelechargerModele,
  onExporterExcel,
  onExporterPdf,
  importEnCours = false,
  lotEnCours = false,
  idEnCours = null,
  isLoading = false,
  isError = false,
  onReessayer,
  independantsIsLoading = false,
  independantsIsError = false,
  onReessayerIndependants,
  autosuffisanceIsLoading = false,
  autosuffisanceIsError = false,
  carburantSemainePrecedente = null,
  engagement = null,
  bandeau = null,
  bandeauEnCours = false,
  whatsappNonConfigure = false,
  onConfigurerWhatsApp,
  onAffecterRenfort,
  onConfigurerCouvertures,
}: SemaineProgrammesProps) {
  const [recherche, setRecherche] = React.useState('');
  const [seulement, setSeulement] = React.useState<Onglet>('TOUS');
  /** RG-L01 — « Sans regroupement » revient à la liste simple, et un tri par colonne reste possible. */
  const [grouper, setGrouper] = React.useState(true);
  /** Par livreur, ou par site (§5.2). La liste reste l'entrée par défaut : c'est elle qu'on vient éditer. */
  const [vue, setVue] = React.useState<Vue>('LIVREURS');
  const [coches, setCoches] = React.useState<Selection>(new Set());
  /** Le nom d'un site par son identifiant : la grille l'écrit sur chaque ligne. */
  const nomSite = React.useMemo(() => new Map(partenaires.map((x) => [x.id, x.nom])), [partenaires]);

  /*
   * La selection ne survit ni au changement de semaine ni a un echec de lecture :
   * la case « Tout cocher » restait cochee au-dessus d'un tableau vide, et des
   * identifiants de la semaine precedente restaient en memoire.
   */
  React.useEffect(() => {
    setCoches(new Set());
  }, [annee, semaine, isError, isLoading]);

  const lignes = React.useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return programmes.filter((p) => {
      if (q && !(p.livreurNom ?? '').toLowerCase().includes(q)) return false;
      if (seulement === 'A_PUBLIER' && !estAPublier(p)) return false;
      if (seulement === 'REFUSE' && p.statut !== 'REFUSE') return false;
      if (seulement === 'SANS_CARBURANT' && !estSansCarburant(p)) return false;
      if (seulement === 'A_COMPLETER' && !estACompleter(p)) return false;
      if (seulement === 'RENFORTS' && !aDesRenforts(p)) return false;
      if (seulement === 'SUPERVISEURS' && p.typeLivreur !== 'SUPERVISEUR_LIVREUR') return false;
      if (seulement === 'AVEC_SURPLUS' && !aRecuUnSurplus(p)) return false;
      return true;
    });
  }, [programmes, recherche, seulement]);

  /**
   * RG-L01 — LE REGROUPEMENT.
   *
   * <p>Avec trente-huit programmes, la liste arrivait en vrac : superviseur, journaliers
   * et « Sans site » mélangés, et deux livreurs d'une même base jamais côte à côte. Trois
   * groupes désormais, dans cet ordre : ce qui est à compléter d'abord, parce que c'est
   * le travail qui reste ; les superviseurs-livreurs ensuite, qui ne sont rattachés à
   * aucune base (RG-V03) ; puis une base par groupe, de A à Z.</p>
   *
   * <p>⚠ L'en-tête de groupe est une LIGNE DE TABLEAU ordinaire, avec autant de cellules
   * que de colonnes. Le Table v3 n'expose pas de colSpan, et une ligne au mauvais compte
   * fait tomber la page entière en 500. Ce n'est pas une contrainte subie : les sept
   * cellules de jour portent justement les « livreurs présents » du groupe, que RG-L01
   * demande.</p>
   */
  const groupes = React.useMemo(() => {
    const parCle = new Map<string, { cle: string; programmes: IProgramme[]; titre: string }>();
    for (const p of lignes) {
      let cle: string;
      let titre: string;
      if (estACompleter(p)) {
        cle = '0-a-completer';
        titre = 'À compléter';
      } else if (p.typeLivreur === 'SUPERVISEUR_LIVREUR') {
        cle = '1-superviseurs';
        titre = 'Superviseurs-livreurs';
      } else {
        const nom = p.siteId ? (nomSite.get(p.siteId) ?? p.siteId) : 'Sans site';
        cle = `2-${nom.toLocaleLowerCase('fr')}`;
        titre = nom;
      }
      const g = parCle.get(cle) ?? { cle, programmes: [], titre };
      g.programmes.push(p);
      parCle.set(cle, g);
    }
    const ordonnes = Array.from(parCle.values()).sort((a, b) => a.cle.localeCompare(b.cle, 'fr'));
    for (const g of ordonnes) {
      g.programmes.sort((a, b) => (a.livreurNom ?? '').localeCompare(b.livreurNom ?? '', 'fr'));
    }
    return ordonnes;
  }, [lignes, nomSite]);

  /** Les lignes effectivement rendues, en-têtes de groupe compris, dans l'ordre d'affichage. */
  const aPlat = React.useMemo(
    () => (grouper ? groupes.flatMap((g) => [{ groupe: g, type: 'groupe' as const }, ...g.programmes.map((p) => ({ p, type: 'ligne' as const }))]) : lignes.map((p) => ({ p, type: 'ligne' as const }))),
    [grouper, groupes, lignes],
  );

  /**
   * Les programmes DANS L'ORDRE OÙ L'ÉCRAN LES MONTRE, en-têtes de groupe retirés.
   *
   * <p>C'est ce que les flèches ‹ › de l'aperçu suivent. Dérivé de `aPlat` et non de
   * `lignes` : avec le regroupement actif, l'ordre affiché n'est pas l'ordre du filtre —
   * « À compléter » passe devant, les superviseurs ensuite, puis une base par groupe.</p>
   */
  const ordreAffiche = React.useMemo(
    () => aPlat.filter((e): e is { p: IProgramme; type: 'ligne' } => e.type === 'ligne').map((e) => e.p),
    [aPlat],
  );

  const aPublier = React.useMemo(() => programmes.filter(estAPublier), [programmes]);
  const refuses = React.useMemo(() => programmes.filter((p) => p.statut === 'REFUSE'), [programmes]);
  const compteACompleter = React.useMemo(() => programmes.filter(estACompleter).length, [programmes]);
  const compteRenforts = React.useMemo(() => programmes.filter(aDesRenforts).length, [programmes]);
  const compteSuperviseurs = React.useMemo(
    () => programmes.filter((p) => p.typeLivreur === 'SUPERVISEUR_LIVREUR').length,
    [programmes],
  );
  const carburant = React.useMemo(() => totauxCarburant(programmes), [programmes]);

  /*
   * Les compteurs des cartes (§5.2). Calculés sur TOUS les programmes de la semaine, et
   * non sur les lignes filtrées : une carte qui changerait de valeur selon le filtre posé
   * ne serait plus un indicateur de la semaine mais un décompte de l'écran, et cliquer
   * dessus ferait fondre son propre nombre.
   */
  const comptePublies = React.useMemo(
    () => programmes.filter((p) => p.statut === 'NOTIFIE' || p.statut === 'ACCEPTE').length,
    [programmes],
  );
  /** Le programme ne concerne que les journaliers (§5.2, 2e carte). */
  const compteJournaliers = React.useMemo(
    () => programmes.filter((p) => p.typeLivreur === 'JOURNALIER').length,
    [programmes],
  );
  const compteSansCarburant = React.useMemo(() => programmes.filter(estSansCarburant).length, [programmes]);
  const compteAvecSurplus = React.useMemo(() => programmes.filter(aRecuUnSurplus).length, [programmes]);
  /** Les surplus VIVANTS de la semaine : un surplus annulé ne coûte rien (RG-C04). */
  const totalSurplusSemaine = React.useMemo(
    () => programmes.reduce((t, p) => t + totalSurplusVivant(p), 0),
    [programmes],
  );
  const ecart = carburantSemainePrecedente === null || carburantSemainePrecedente === undefined ? null : carburant.total - carburantSemainePrecedente;

  /*
   * La selection porte maintenant DEUX gestes : publier, et poser le carburant. Toute
   * ligne se coche. Chaque bouton dit son propre compte — « Publier les 5 publiables
   * coches », « Carburant des 14 coches » — et la case ne ment plus, parce qu'elle ne
   * pretend plus vouloir dire « publiable ». Avant, seules les lignes publiables se
   * cochaient : une semaine deja publiee ne pouvait recevoir son carburant qu'une ligne
   * a la fois.
   */
  const programmesCoches = React.useMemo(
    () => (coches === 'all' ? lignes : lignes.filter((p) => coches.has(p.id))),
    [coches, lignes],
  );

  const idsCoches = React.useMemo(() => programmesCoches.filter(estAPublier).map((p) => p.id), [programmesCoches]);

  const maxAutosuffisance = Math.max(1, ...autosuffisance.map((j) => j.total));

  /**
   * L'ACTION PRINCIPALE, UNE SEULE, ET CONTEXTUELLE (§5.2).
   *
   * <p>L'écran portait sept boutons de même poids dans sa barre d'outils. Il n'y a
   * pourtant jamais qu'un geste qui fait avancer la semaine : publier ce qui reste, puis,
   * quand tout est parti, engager le carburant en comptabilité. Le bouton dit lequel, et
   * son nombre : « Publier 3 programmes » ne demande pas d'aller compter.</p>
   *
   * <p>L'engagement reste possible programme par programme depuis le menu d'une ligne
   * (§5.2) : attendre que TOUTE la semaine soit publiée n'est pas une règle, c'est
   * seulement le cas le plus fréquent.</p>
   */
  const actionPrincipale = React.useMemo(() => {
    if (isLoading || isError) return null;
    if (aPublier.length > 0) {
      return (
        <Button
          className="w-full"
          isPending={lotEnCours}
          onPress={() => onPublierLot(aPublier.map((p) => p.id))}
          variant="primary"
        >
          {lotEnCours ? <Spinner size="sm" /> : null}
          Publier {aPublier.length} programme{aPublier.length > 1 ? 's' : ''}
        </Button>
      );
    }
    return engagement;
  }, [aPublier, engagement, isError, isLoading, lotEnCours, onPublierLot]);

  return (
    <div className="flex flex-col gap-4">
      {/*
       * ⚠ UN SEUL BANDEAU WHATSAPP, en tête de page (§5.2). La mention se répétait sur
       * CHAQUE ligne : trente-huit fois le même avertissement de configuration, qui
       * finissait par ne plus rien signaler. Le statut d'envoi, lui, reste sur la ligne,
       * parce qu'il est propre à chaque livreur.
       */}
      {whatsappNonConfigure && (
        <Card className="border-warning/40 bg-warning/5">
          <Card.Content className="flex-row flex-wrap items-center gap-3 py-2.5">
            <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-warning-soft-foreground" />
            <p className="flex-1 text-sm text-foreground">
              Envoi WhatsApp non configuré : les livreurs ne reçoivent pas leur programme. Le réglage se fait
              côté serveur.
            </p>
            {/* ⚠ Pas de bouton par défaut : cet ERP n'a pas d'écran de configuration WhatsApp,
                et un bouton qui n'ouvre rien serait pire que son absence. */}
            {onConfigurerWhatsApp ? (
              <Button onPress={onConfigurerWhatsApp} size="sm" variant="outline">
                Configurer
              </Button>
            ) : null}
          </Card.Content>
        </Card>
      )}

      {/* ── LE HAUT DE PAGE ─────────────────────────────────────────────────────── */}
      <EnteteSemaine
        actionPrincipale={actionPrincipale}
        annee={annee}
        bandeau={bandeau}
        bandeauEnCours={bandeauEnCours}
        carburantEcran={carburant.total}
        compteurs={{
          aPublier: aPublier.length,
          avecSurplus: compteAvecSurplus,
          journaliers: compteJournaliers,
          publies: comptePublies,
          refuses: refuses.length,
          sansCarburant: compteSansCarburant,
          totalSurplus: totalSurplusSemaine,
        }}
        filtre={seulement}
        isError={isError}
        isLoading={isLoading}
        onFiltre={(cle) => {
          // La carte « Trous de couverture » n'est pas un filtre de liste : elle ouvre la
          // vue qui montre les trous. Les autres cartes filtrent.
          if (cle === 'TROUS') {
            setVue('COUVERTURE');
            return;
          }
          setSeulement(cle as Onglet);
        }}
        onImporter={onDupliquerSemainePrecedente}
        onNouveau={onNouveau}
        onSemaine={onSemaine}
        programmes={programmes}
        semaine={semaine}
      />

      {/*
       * LA BARRE DE SÉLECTION (§5.2). Elle n'existe que quand quelque chose est coché,
       * et rien ne l'est à l'ouverture. « Carburant des cochés » était un bouton
       * permanent qui, sans sélection, ne pouvait rien faire : il occupait la place et
       * l'attention d'une action principale sans en être une.
       */}
      {programmesCoches.length > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <Card.Content className="flex-row flex-wrap items-center gap-2 py-2.5">
            <span className="text-sm font-medium text-foreground">
              {programmesCoches.length} sélectionné{programmesCoches.length > 1 ? 's' : ''}
            </span>
            <Separator className="hidden h-5 sm:block" orientation="vertical" />
            {idsCoches.length > 0 && (
              <Button isPending={lotEnCours} onPress={() => onPublierLot(idsCoches)} size="sm" variant="primary">
                {lotEnCours ? <Spinner size="sm" /> : null}
                Publier {idsCoches.length}
              </Button>
            )}
            <Button onPress={() => onCarburantLot(programmesCoches)} size="sm" variant="outline">
              Carburant ({formatMontant(totauxCarburant(programmesCoches).total)})
            </Button>
            <Button onPress={onExporterExcel} size="sm" variant="outline">
              Exporter
            </Button>
            <Button className="ms-auto" onPress={() => setCoches(new Set())} size="sm" variant="ghost">
              Annuler la sélection
            </Button>
          </Card.Content>
        </Card>
      )}

      {/*
       * LA BARRE D'OUTILS. Sept controles de meme poids ; il en reste quatre, et
       * les deux exports tiennent dans un menu — ce sont deux formats du meme geste.
       */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          {/* La recherche par nom n'existait pas : on cherchait a l'oeil. */}
          <SearchField className="w-full sm:w-64" onChange={setRecherche} value={recherche}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Rechercher un livreur…" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          {/*
           * Des ComboBox et non des Select : la liste des partenaires depasse la
           * centaine, et dans ce projet tout ce qui est une liste se cherche.
           */}
          <ComboBox className="w-full sm:w-48" onSelectionChange={(c) => onTypeFiltre(String(c ?? 'TOUS'))} selectedKey={typeFiltre}>
            <Label>Type</Label>
            <ComboBox.InputGroup>
              <Input placeholder="Tous" />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox items={typeOptions}>
                {(o: { cle: string; libelle: string }) => (
                  <ListBox.Item id={o.cle} textValue={o.libelle}>
                    {o.libelle}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>

          <ComboBox className="w-full sm:w-56" onSelectionChange={(c) => onPartenaireFiltre(String(c ?? 'TOUS'))} selectedKey={partenaireFiltre}>
            <Label>Partenaire</Label>
            <ComboBox.InputGroup>
              <Input placeholder={partenairesEnCours ? 'Chargement…' : 'Tous'} />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox items={[{ id: 'TOUS', nom: 'Tous les partenaires' }, ...partenaires]}>
                {(o: { id: string; nom: string }) => (
                  <ListBox.Item id={o.id} textValue={o.nom}>
                    {o.nom}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Dropdown>
            <Button isPending={importEnCours} variant="outline">
              {importEnCours ? <Spinner size="sm" /> : null}
              Importer
              <ChevronDown aria-hidden="true" className="size-4" />
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu
                aria-label="Options d’import"
                onAction={(k) => {
                  if (k === 'dupliquer') onDupliquerSemainePrecedente();
                  if (k === 'fichier') onImporterFichier();
                  if (k === 'modele') onTelechargerModele();
                }}
              >
                <Dropdown.Item id="dupliquer">Dupliquer une semaine…</Dropdown.Item>
                <Dropdown.Item id="fichier">Importer un fichier (.xlsx, .csv)</Dropdown.Item>
                <Dropdown.Item id="modele">Télécharger le modèle</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>

          <Dropdown>
            <Button isDisabled={lignes.length === 0} variant="outline">
              Exporter
              <ChevronDown aria-hidden="true" className="size-4" />
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu aria-label="Format d’export" onAction={(k) => (k === 'excel' ? onExporterExcel() : onExporterPdf())}>
                <Dropdown.Item id="excel">Excel</Dropdown.Item>
                <Dropdown.Item id="pdf">PDF</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>

      {/*
       * Les onglets (§5.2). Trois sont nouveaux : « À compléter », qui rassemble ce qui
       * empêche la semaine de partir ; « Renforts », les livreurs qui desservent un site
       * hors de leur base ; « Superviseurs », qui n'étaient repérables nulle part.
       *
       * Chacun porte son compte : un onglet vide se voit sans avoir à cliquer dedans.
       */}
      <div className="flex flex-wrap items-center gap-2">
        <ToggleButtonGroup
          onSelectionChange={(sel) => {
            const v = Array.from(sel)[0];
            if (v) setSeulement(String(v) as Onglet);
          }}
          selectedKeys={new Set([seulement])}
          selectionMode="single"
        >
          <ToggleButton id="TOUS">Tous</ToggleButton>
          <ToggleButton id="A_COMPLETER">À compléter {compteACompleter > 0 ? compteACompleter : ''}</ToggleButton>
          <ToggleButton id="A_PUBLIER">À publier {aPublier.length > 0 ? aPublier.length : ''}</ToggleButton>
          <ToggleButton id="REFUSE">Refusés {refuses.length > 0 ? refuses.length : ''}</ToggleButton>
          <ToggleButton id="SANS_CARBURANT">Sans carburant</ToggleButton>
          <ToggleButton id="RENFORTS">Renforts {compteRenforts > 0 ? compteRenforts : ''}</ToggleButton>
          <ToggleButton id="SUPERVISEURS">Superviseurs {compteSuperviseurs > 0 ? compteSuperviseurs : ''}</ToggleButton>
          <ToggleButton id="AVEC_SURPLUS">Surplus {compteAvecSurplus > 0 ? compteAvecSurplus : ''}</ToggleButton>
        </ToggleButtonGroup>

        {/*
         * LA BASCULE DE VUE (§5.2). Deux lectures de la même semaine : par livreur, pour
         * éditer, et par site, pour savoir qui est où. La seconde répond à la question du
         * terrain, que trente-huit lignes de livreurs ne permettaient pas de poser.
         */}
        <ToggleButtonGroup
          className="ms-auto"
          onSelectionChange={(sel) => {
            const v = Array.from(sel)[0];
            if (v) setVue(String(v) as Vue);
          }}
          selectedKeys={new Set([vue])}
          selectionMode="single"
        >
          <ToggleButton id="LIVREURS">Livreurs</ToggleButton>
          <ToggleButton id="COUVERTURE">Couverture</ToggleButton>
        </ToggleButtonGroup>

        {vue === 'LIVREURS' ? (
          <Button onPress={() => setGrouper((g) => !g)} size="sm" variant="ghost">
            {grouper ? 'Sans regroupement' : 'Regrouper par base'}
          </Button>
        ) : null}
      </div>

      {/* ── LA COUVERTURE (§5.2) : les sites en lignes, les jours en colonnes ───── */}
      {vue === 'COUVERTURE' && (
        <VueCouverture
          isLoading={isLoading}
          nomSite={nomSite}
          onAffecterRenfort={onAffecterRenfort}
          onConfigurer={onConfigurerCouvertures}
          programmes={programmes}
        />
      )}

      {/* ── LA GRILLE ────────────────────────────────────────────────────────────── */}
      {vue === 'LIVREURS' && (
      <Card>
        <Card.Content className="p-0">
          <Table>
            {/* RG-L08 — plus de boîte à défilement. Il y en avait DEUX, celle-ci et celle de
                la page : huit lignes visibles sur trente-huit, et deux ascenseurs à manœuvrer
                pour lire une semaine. La page défile seule ; l'en-tête des jours reste collé
                par les classes sticky des colonnes. */}
            <Table.ScrollContainer>
              <Table.Content
                aria-label={`Programmes hebdomadaires de la semaine ${semaine} de ${annee}`}
                className="min-w-[64rem]"
                onSelectionChange={setCoches}
                selectedKeys={coches}
                selectionMode="multiple"
              >
                <Table.Header>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary pe-0" id="coche">
                    <Checkbox aria-label="Tout cocher" slot="selection">
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                  </Table.Column>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary" id="livreur" isRowHeader>
                    Livreur
                  </Table.Column>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary" id="postes">
                    Site · Postes
                  </Table.Column>
                  {JOURS.map((j) => (
                    <Table.Column className="sticky top-0 z-20 bg-surface-secondary px-2 text-center" id={j.cle} key={j.cle}>
                      {j.court}
                    </Table.Column>
                  ))}
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary text-end" id="carburant">
                    Carburant
                  </Table.Column>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary" id="statut">
                    Statut
                  </Table.Column>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary" id="actions">
                    {''}
                  </Table.Column>
                </Table.Header>

                <Table.Body
                  renderEmptyState={() =>
                    isLoading ? null : (
                      <div className="flex flex-col items-center gap-3 py-10 text-center">
                        {isError ? (
                          <>
                            <p className="text-sm text-foreground">Les programmes n’ont pas pu être lus.</p>
                            {onReessayer && (
                              <Button onPress={onReessayer} size="sm" variant="outline">
                                Réessayer
                              </Button>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted">
                            {seulement === 'A_PUBLIER'
                              ? 'Tous les programmes de la semaine sont publiés.'
                              : seulement === 'REFUSE'
                                ? 'Aucun refus cette semaine.'
                                : seulement === 'SANS_CARBURANT'
                                  ? 'Tous les programmes ont leur carburant.'
                                  : 'Aucun programme pour cette semaine.'}
                          </p>
                        )}
                      </div>
                    )
                  }
                >
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {COLONNES_GRILLE.map((c) => (
                            <Table.Cell key={`sq-${i}-${c}`}>
                              <div className="h-4 animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isError || isLoading ? [] : aPlat).map((item) => {
                    if (item.type === 'groupe') {
                      return <LigneGroupe groupe={item.groupe} key={`g-${item.groupe.cle}`} />;
                    }
                    const p = item.p;
                    const enCours = idEnCours === p.id;
                    const s = STATUT[p.statut ?? ''] ?? {
                      couleur: 'default' as const,
                      libelle: p.statut ?? '—',
                      plein: false,
                    };
                    return (
                      <Table.Row id={p.id} key={p.id}>
                        <Table.Cell className="pe-0">
                          <Checkbox aria-label={`Cocher ${p.livreurNom ?? 'ce programme'}`} slot="selection">
                            <Checkbox.Content>
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                            </Checkbox.Content>
                          </Checkbox>
                        </Table.Cell>

                        <Table.Cell>
                          <span className="block max-w-[12rem] truncate font-medium">{p.livreurNom ?? '—'}</span>
                          {p.typeLivreur && <span className="block text-xs text-muted">{getTurboyTypeDisplay(p.typeLivreur).label}</span>}
                          {/*
                           * Sept jours travailles : le repos n'a pas ete pris, et il se regle.
                           * La direction veut le lire sans recoupement, ligne par ligne.
                           */}
                          {estSeptSurSept(p.jours) && (
                            <Tooltip>
                              <Chip className="mt-1" color="warning" size="sm" variant="soft">
                                <Chip.Label>7 j/7, repos à compenser</Chip.Label>
                              </Chip>
                              <Tooltip.Content>{OBSERVATION_SEPT_SUR_SEPT}</Tooltip.Content>
                            </Tooltip>
                          )}
                        </Table.Cell>

                        <Table.Cell>
                          {(() => {
                            /*
                             * Le site de la semaine d'abord, les postes desservis dessous. Un poste
                             * qui EST le site ne se repete pas : la cellule affichait deux fois le
                             * meme nom, l'un sous l'autre.
                             */
                            const site = p.siteId ? (nomSite.get(p.siteId) ?? 'Site inconnu') : null;
                            const autresPostes = postesSemaine(p).filter((n) => n !== site);
                            return (
                              <>
                                <span className="block max-w-[14rem] truncate text-xs font-medium text-foreground">
                                  {site ?? 'Sans site'}
                                  {site && p.siteDeLaSemaine ? <span className="font-normal text-muted"> · cette semaine</span> : null}
                                </span>
                                {autresPostes.length > 0 ? (
                                  <span className="block max-w-[14rem] truncate text-xs text-muted">{autresPostes.join(' · ')}</span>
                                ) : null}
                              </>
                            );
                          })()}
                        </Table.Cell>

                        {JOURS.map((j) => (
                          <Table.Cell className="px-2" key={j.cle}>
                            <CelluleJour
                              jour={(p.jours ?? []).find((x) => (x.jour ?? '').toUpperCase() === j.cle)}
                              nomSite={nomSite}
                              p={p}
                            />
                          </Table.Cell>
                        ))}

                        <Table.Cell className="text-xs">
                          <CelluleCarburant onCombler={() => onEditer(p)} p={p} />
                        </Table.Cell>

                        <Table.Cell>
                          <div className="flex flex-col items-start gap-1">
                            {/*
                             * RG-L06 — la pastille de statut OUVRE le programme.
                             *
                             * Chaque ligne portait un bouton « Planifier », poussé tout à
                             * droite après un grand vide : trente-sept clics pour publier une
                             * semaine. L'action principale du haut de page les publie
                             * désormais d'un coup, et la pastille remplace le bouton comme
                             * porte d'entrée. Rien n'est perdu : le menu « … » porte le reste.
                             */}
                            <Chip
                              className="cursor-pointer"
                              color={s.couleur}
                              onClick={() => onEditer(p)}
                              size="sm"
                              variant={s.plein ? 'primary' : 'soft'}
                            >
                              <Chip.Label>{s.libelle}</Chip.Label>
                            </Chip>
                            {/*
                             * Le motif du refus etait cache dans un `title`
                             * sur le mot « Refusé » : la raison pour
                             * laquelle un livreur n'a pas de semaine ne se
                             * survole pas, elle se lit.
                             */}
                            {p.statut === 'REFUSE' && p.motifRefus && <span className="max-w-[14rem] text-xs text-muted">{p.motifRefus}</span>}
                            {/*
                             * Ce que l'envoi WhatsApp a donne : parti, ou pourquoi pas.
                             *
                             * ⚠ SAUF « non configuré », qui n'est pas propre a ce livreur : c'est
                             * un reglage de l'ERP, le meme pour les trente-huit lignes. Repete
                             * ici, il occupait chaque ligne pour dire trente-huit fois la meme
                             * chose, et finissait par ne plus rien signaler. Il est desormais
                             * dans le bandeau unique du haut de page (§5.2). Le reste — envoye,
                             * echec, pas de numero — reste ici, parce que c'est propre au livreur.
                             */}
                            {(() => {
                              if (p.whatsappStatut === 'NON_CONFIGURE') return null;
                              const w = libelleWhatsApp(p);
                              if (!w) return null;
                              return (
                                <span className={cn('max-w-[14rem] text-[11px] leading-tight', w.ton === 'attention' ? 'text-warning-soft-foreground' : 'text-muted')}>
                                  {w.texte}
                                </span>
                              );
                            })()}
                          </div>
                        </Table.Cell>

                        <Table.Cell>
                          {/*
                           * §6.2 — LE MENU EN QUATRE GROUPES : consulter, modifier,
                           * transmettre, supprimer.
                           *
                           * Les sept entrées étaient à plat, sans ordre : « Aperçu »
                           * voisinait « Supprimer », et deux entrées d'envoi ne disaient
                           * ni par quel canal partait la première, ni si le programme
                           * était déjà parti. Elles fusionnent (RG-M01) : le canal par
                           * défaut est la notification dans l'application, WhatsApp reste
                           * une entrée à part, grisée tant qu'il n'est pas configuré.
                           *
                           * « Planifier » descend ici depuis la ligne (RG-L06) et n'est
                           * PAS supprimé : c'est lui qui met un programme dans la file
                           * que le travail du dimanche soir publie tout seul. Le retirer
                           * aurait fermé la publication automatique sans le dire.
                           *
                           * RG-M06 : ce qui est interdit au profil ne s'affiche pas, ce
                           * qui est permis mais impossible à cet instant est grisé.
                           */}
                          <div className="flex items-center justify-end gap-1">
                            <Dropdown>
                              <Button aria-label={`Actions pour ${p.livreurNom ?? 'ce programme'}`} isIconOnly size="sm" variant="ghost">
                                <MoreHorizontal aria-hidden="true" className="size-4" />
                              </Button>
                              <Dropdown.Popover>
                                <Dropdown.Menu
                                  aria-label="Actions du programme"
                                  disabledKeys={[
                                    ...(estAPublier(p) || p.statut === 'REFUSE' ? [] : ['supprimer']),
                                    // Le WhatsApp seul ne se renvoie que sur un programme deja parti.
                                    ...(estAPublier(p) ? ['whatsapp'] : []),
                                    // Planifier n'a de sens que sur un brouillon.
                                    ...(p.statut === 'BROUILLON' ? [] : ['planifier']),
                                    // L'affectation en cours d'operations suppose la semaine partie (RG-S08).
                                    ...(estAPublier(p) ? ['affecter'] : []),
                                  ]}
                                  onAction={(k) => {
                                    if (k === 'apercu') {
                                      onApercu(p, {
                                        index: ordreAffiche.findIndex((x) => x.id === p.id),
                                        liste: ordreAffiche,
                                      });
                                    }
                                    if (k === 'historique') onHistorique(p);
                                    if (k === 'editer') onEditer(p);
                                    if (k === 'carburant') onCarburant(p);
                                    if (k === 'planifier') onPlanifier(p);
                                    if (k === 'affecter') onAffecterSite?.(p);
                                    if (k === 'dupliquer') onDupliquerSuivante?.(p);
                                    if (k === 'envoyer') onEnvoyer(p);
                                    if (k === 'whatsapp') onRenvoyerWhatsApp(p);
                                    if (k === 'supprimer') onSupprimer(p);
                                  }}
                                >
                                  <Dropdown.Section>
                                    <Dropdown.Item id="apercu">Aperçu</Dropdown.Item>
                                    <Dropdown.Item id="historique">Historique</Dropdown.Item>
                                  </Dropdown.Section>
                                  <Dropdown.Section>
                                    <Dropdown.Item id="editer">Modifier le programme</Dropdown.Item>
                                    <Dropdown.Item id="carburant">Ajuster le carburant</Dropdown.Item>
                                    <Dropdown.Item id="planifier">Planifier pour dimanche</Dropdown.Item>
                                    {onAffecterSite ? (
                                      <Dropdown.Item id="affecter">Affecter à un autre site aujourd’hui</Dropdown.Item>
                                    ) : null}
                                    {onDupliquerSuivante ? (
                                      <Dropdown.Item id="dupliquer">Dupliquer sur la semaine suivante</Dropdown.Item>
                                    ) : null}
                                  </Dropdown.Section>
                                  <Dropdown.Section>
                                    <Dropdown.Item id="envoyer">
                                      {estAPublier(p) ? 'Envoyer au livreur' : 'Renvoyer au livreur'}
                                    </Dropdown.Item>
                                    <Dropdown.Item id="whatsapp">Renvoyer par WhatsApp</Dropdown.Item>
                                  </Dropdown.Section>
                                  <Dropdown.Section>
                                    <Dropdown.Item id="supprimer">Supprimer le programme</Dropdown.Item>
                                  </Dropdown.Section>
                                </Dropdown.Menu>
                              </Dropdown.Popover>
                            </Dropdown>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>
      )}

      {/*
       * L'AUTOSUFFISANCE (RG-32), en jetons du theme : les barres etaient peintes
       * en `bg-primary` et `bg-secondary`, deux jetons de l'ancienne bibliotheque
       * qui ne disent plus rien dans le nouveau theme.
       */}
      <Card>
        <Card.Content className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">Livreurs actifs par jour</span>
            <div className="flex items-center gap-3 text-xs text-muted">
              {/*
               * Deux intensites du MEME ton : c'est une seule quantite — les
               * livreurs actifs du jour — coupee en deux. `bg-surface-tertiary`
               * pour les planifies etait du gris sur le gris de la piste :
               * la moitie du graphique ne se voyait pas.
               */}
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-accent/40" /> Indépendants
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-accent" /> Planifiés
              </span>
            </div>
          </div>

          {autosuffisanceIsLoading ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : autosuffisanceIsError ? (
            <p className="py-4 text-center text-sm text-muted">L’autosuffisance n’a pas pu être lue.</p>
          ) : (
            <div className="flex items-end justify-between gap-2">
              {autosuffisance.map((j) => (
                <div className="flex flex-1 flex-col items-center gap-1" key={j.jour}>
                  <span className="text-xs font-medium tabular-nums text-foreground">{j.total}</span>
                  <span
                    className="flex h-24 w-full max-w-[44px] flex-col justify-end overflow-hidden rounded-md bg-surface-secondary"
                    title={`${j.independants} indépendant(s), ${j.planifies} planifié(s)`}
                  >
                    <span className="block w-full bg-accent" style={{ height: `${(j.planifies / maxAutosuffisance) * 100}%` }} />
                    <span className="block w-full bg-accent/40" style={{ height: `${(j.independants / maxAutosuffisance) * 100}%` }} />
                  </span>
                  <span className="text-xs text-muted">{JOURS.find((x) => x.cle === j.jour)?.court ?? j.jour}</span>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* ── LES INDEPENDANTS, en lecture seule ───────────────────────────────────── */}
      <Card>
        <Card.Content className="gap-3 p-0">
          <div className="px-4 pt-4">
            <span className="text-sm font-semibold text-foreground">Indépendants — créneaux déclarés depuis l’app</span>
            <p className="text-xs text-muted">Lecture seule : ces créneaux viennent du livreur, pas des Opérations.</p>
          </div>

          <Table>
            <Table.ScrollContainer className="max-h-[24rem] overflow-y-auto">
              <Table.Content aria-label="Créneaux déclarés par les indépendants" className="min-w-[52rem]">
                <Table.Header>
                  <Table.Column className="sticky top-0 z-20 bg-surface-secondary" id="livreur" isRowHeader>
                    Livreur
                  </Table.Column>
                  {JOURS.map((j) => (
                    <Table.Column className="sticky top-0 z-20 bg-surface-secondary px-2 text-center" id={j.cle} key={j.cle}>
                      {j.court}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body
                  renderEmptyState={() =>
                    independantsIsLoading ? null : (
                      <div className="flex flex-col items-center gap-3 py-8 text-center">
                        {/*
                         * Un echec de lecture ne se dit pas « aucun
                         * independant » : c'est le message d'une semaine
                         * sans creneau, et l'equipe en conclurait qu'il
                         * n'y a personne.
                         */}
                        {independantsIsError ? (
                          <>
                            <p className="text-sm text-foreground">Les créneaux déclarés n’ont pas pu être lus.</p>
                            {onReessayerIndependants && (
                              <Button onPress={onReessayerIndependants} size="sm" variant="outline">
                                Réessayer
                              </Button>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted">Aucun indépendant déclaré cette semaine.</p>
                        )}
                      </div>
                    )
                  }
                >
                  {independantsIsLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <Table.Row id={`sqi-${i}`} key={`sqi-${i}`}>
                          {COLONNES_INDEPENDANTS.map((c) => (
                            <Table.Cell key={`sqi-${i}-${c}`}>
                              <div className="h-4 animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(independantsIsError || independantsIsLoading ? [] : independants).map((p) => (
                    <Table.Row id={p.id} key={p.id}>
                      <Table.Cell>
                        <span className="block max-w-[14rem] truncate">{p.livreurNom ?? '—'}</span>
                      </Table.Cell>
                      {JOURS.map((j) => (
                        <Table.Cell className="px-2" key={j.cle}>
                          <CelluleJour
                            jour={(p.jours ?? []).find((x) => (x.jour ?? '').toUpperCase() === j.cle)}
                            nomSite={nomSite}
                            p={p}
                          />
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>
    </div>
  );
}

export type { StatutProgramme };
