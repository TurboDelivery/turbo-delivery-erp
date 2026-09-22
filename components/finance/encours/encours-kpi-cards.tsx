'use client';

import { AlarmClock, TrendingUp, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  IEncoursGlobal,
  IEncoursReleve,
  computeKpis,
  formatFcfa,
  formatNombre,
} from '@/features/encours';

import { calculerRetard } from './encours-derive';

/** « 2026-09-05T10:00:00 » devient « 05/09/2026 a 10:00 ». Chaine vide si illisible. */
function formatDateGeneration(brut?: string | null): string {
  if (!brut) return '';
  const date = new Date(brut);
  if (Number.isNaN(date.getTime())) return '';
  const jour = String(date.getDate()).padStart(2, '0');
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const heure = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${jour}/${mois}/${date.getFullYear()} à ${heure}:${minute}`;
}

/** Au-dessus, on encaisse : la couleur du taux passe au vert. */
const SEUIL_ENCAISSE = 70;

/** En dessous, le recouvrement decroche : le palier est dit sous le chiffre. */
const SEUIL_ALERTE = 40;

function Figure({
  couleur,
  icone: Icone,
  libelle,
  note,
  valeur,
}: {
  /** Classe de couleur du CHIFFRE. Absente, il se lit en `foreground` : un montant informe. */
  couleur?: string;
  icone: LucideIcon;
  libelle: string;
  note: string;
  valeur: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 md:px-3 md:first:pl-0 md:last:pr-0">
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
        <Icone aria-hidden="true" className="size-3.5 shrink-0" />
        {libelle}
      </span>
      <span
        className={cn(
          'truncate text-xl font-semibold leading-tight tabular-nums',
          couleur ?? 'text-foreground',
        )}
      >
        {valeur}
      </span>
      <span className="truncate text-[11px] text-muted">{note}</span>
    </div>
  );
}

/**
 * Ce que le releve dit en un coup d'oeil.
 *
 * <h3>La couleur</h3>
 * <p>Quatre cartes de meme taille, dont deux peintes au rouge de marque : le total
 * facture et le reste a payer. Or le rouge de cet ERP est reserve a ce qui appelle un
 * geste, et un total facture n'appelle aucun geste. Quand tout est rouge, le rouge ne
 * dit plus rien. Un seul chiffre est colore ici, et c'est celui qu'on peut traiter
 * aujourd'hui : le montant EN RETARD, absent de l'ecran alors que la charge utile le
 * portait deja, eparpille dans une colonne de puces.</p>
 *
 * <h3>La hauteur</h3>
 * <p>Trois `CarteStat` mesurent 118 px chacune, plus la ligne de compteurs : 165 px de
 * bandeau. Sur une fenetre de 563 px, additionnes au titre et aux filtres, il ne restait
 * pas 150 px au releve, qui est le travail. Le bandeau tient maintenant en 105 px : meme
 * hierarchie, memes chiffres, un seul bloc au lieu de quatre. `CarteStat` impose `p-4` et
 * un chiffre en `text-2xl` ; il lui manque une variante dense, et c'est un composant
 * partage que ce lot ne touche pas.</p>
 *
 * <p>Aucun chiffre ne disparait : les avances, les compteurs et la date de generation
 * informent, ils passent sous le trait au lieu de porter le poids d'une carte. La date de
 * generation ne s'affichait nulle part. Le total facture, lui, se lit sous le reste a
 * payer, dont il est la reference - et une seule fois : il etait ecrit DEUX fois dans ce
 * bandeau, a 45 px d'ecart.</p>
 */
export function EncoursKpiCards({
  autresComposantesGlobales,
  global,
  prestations,
  releve,
}: {
  /**
   * L'exposition GLOBALE, tous exercices et tous filtres confondus.
   *
   * <p>Quand elle est là, ce sont SES chiffres que les trois cartes affichent, et le
   * bandeau porte un repère qui le dit. Absente — lecture en échec, backend d'une
   * version antérieure — on retombe sur le relevé filtré : un bandeau muet vaut mieux
   * qu'un bandeau vide.</p>
   */
  global?: IEncoursGlobal;
  /**
   * Les autres composantes du CA à encaisser, TOUTES périodes confondues.
   *
   * <p>Elles entrent dans le « Reste à payer » global, comme le demande le cahier
   * des charges : ce que l'entreprise attend, c'est la somme des deux. Mais elles
   * n'entrent PAS dans le taux, qui mesure le recouvrement des FACTURES — une
   * prestation n'est pas une facture, et les mélanger ferait bouger un taux pour
   * une raison qui n'est pas le recouvrement.</p>
   */
  autresComposantesGlobales?: number;
  /**
   * Les autres composantes du CA de la periode. Absentes (filtre partenaire pose, ou
   * lecture en echec), la ligne n'apparait pas : mieux vaut ne rien dire que d'annoncer
   * zero pour une valeur qu'on n'a pas lue.
   */
  prestations?: { montantAEncaisser: number; nbAEncaisser: number };
  releve: IEncoursReleve;
}) {
  const duReleve = computeKpis(releve);
  const retardReleve = calculerRetard(releve);

  /*
   * Trois STOCKS, et un stock ne se borne pas a une periode.
   *
   * <p>« Reste a payer », « En retard » et « Taux de recouvrement » decrivent un etat a
   * un instant, pas ce qui s'est passe pendant un mois. Les recalculer avec le filtre
   * les mettait a ZERO des qu'on choisissait un mois calme — et un zero se lit comme une
   * mesure, pas comme une absence. Le meme defaut avait affiche « Montant restant :
   * 0 FCFA » sur l'ecran des investissements alors que 6,2 M etaient reellement dus.</p>
   *
   * <p>⚠ Le bandeau et le tableau du dessous parlent donc de deux perimetres. C'est
   * voulu, et c'est dangereux tant qu'on ne le dit pas : le repere ci-dessous n'est pas
   * decoratif, il est ce qui rend la chose honnete.</p>
   */
  const vueGlobale = Boolean(global);
  const facture = global ? global.totalFacture : duReleve.facture;
  const resteFactures = global ? global.totalRestant : duReleve.reste;
  const autresComposantes = vueGlobale ? (autresComposantesGlobales ?? 0) : 0;
  const reste = resteFactures + autresComposantes;
  /*
   * DEUX taux, parce qu'ils ne disent pas la même chose.
   *
   * <p>Une déduction réduit le solde d'une facture sans qu'un franc soit entré en
   * caisse. Les compter comme du recouvrement laissait croire à un encaissement qui
   * n'a jamais eu lieu — c'est le constat qui ouvre le cahier des charges.</p>
   *
   * <p>Le <b>taux de recouvrement</b> ne compte que le CASH. C'est lui qu'on affiche
   * en grand : c'est la seule trésorerie réellement rentrée.</p>
   *
   * <p>Le <b>taux de résorption</b> ajoute les déductions. Il mesure la réduction de
   * l'exposition, ce qui est utile, mais il ne dit rien de la caisse. Il se lit sous
   * le chiffre, jamais à sa place.</p>
   *
   * <p>⚠ `resteFactures` est DÉJÀ net de déductions côté serveur : `facture − reste`
   * vaut donc cash + déductions. Le cash s'obtient en retirant les déductions une
   * fois, pas deux.</p>
   */
  const deductionsAppliquees = global ? global.totalDeductions : 0;
  const resorbe = facture - resteFactures;
  const recouvre = resorbe - deductionsAppliquees;
  const taux = facture > 0 ? Math.round((recouvre / facture) * 100) : 0;
  const tauxResorption = facture > 0 ? Math.round((resorbe / facture) * 100) : 0;
  const deductions = duReleve.deductions;
  const retard = global
    ? {
        montant: global.totalRetard,
        nbFactures: global.nbFacturesRetard,
        nbPartenaires: global.nbStoresRetard,
      }
    : retardReleve;

  /*
   * TROIS paliers, comme avant, mais deux teintes seulement.
   *
   * <p>Le rouge de marque appartient a l'unique chiffre sur lequel on peut agir
   * aujourd'hui, le montant en retard ; peindre aussi le taux le diluerait. Seulement,
   * retirer la teinte du palier bas revenait a retirer le PALIER : un taux de 39 % et un
   * taux de 69 % se lisaient a l'identique alors que le premier est une alerte. Le
   * troisieme palier se dit donc en toutes lettres, sous le chiffre : c'est aussi la
   * seule forme que lit un operateur qui distingue mal les couleurs.</p>
   *
   * <p>Rien de facture, rien a juger : sur un releve vide, l'ambre dirait « attention »
   * a propos de rien.</p>
   */
  const couleurTaux =
    facture === 0
      ? undefined
      : taux >= SEUIL_ENCAISSE
        ? 'text-success-soft-foreground'
        : 'text-warning-soft-foreground';
  const noteTaux =
    facture > 0 && taux < SEUIL_ALERTE
      ? `${formatFcfa(recouvre)} encaissés · sous ${SEUIL_ALERTE} %`
      : `${formatFcfa(recouvre)} encaissés`;

  // Le total facture se lit deja sous « Reste a payer », qui le prend pour reference :
  // l'ecrire une seconde fois 45 px plus bas, c'est la phrase repetee du retour.
  // ⚠ Cette ligne decrit le RELEVE FILTRE, pas les cartes au-dessus. Depuis que les
  // trois chiffres sont globaux, les deux blocs ne parlent plus du meme ensemble : sans
  // ce premier mot, « 12 partenaires » se lirait comme le perimetre des cartes.
  const contexte: string[] = [
    ...(vueGlobale ? ['Relevé filtré ci-dessous :'] : []),
    `Avances & déductions ${formatFcfa(deductions)} (registre ${releve.annee})`,
    `${formatNombre(releve.nbPartenaires)} partenaire${releve.nbPartenaires > 1 ? 's' : ''}`,
    `${formatNombre(releve.nbStores)} point${releve.nbStores > 1 ? 's' : ''} de vente`,
    `${formatNombre(releve.nbFactures)} facture${releve.nbFactures > 1 ? 's' : ''}`,
  ];

  // La date de generation etait dans la charge utile et n'apparaissait nulle part : un
  // etat financier sans date d'arrete ne peut pas etre confronte a un autre.
  const genere = formatDateGeneration(releve.dateGeneration);
  if (genere) contexte.push(`Relevé du ${genere}`);

  /*
   * Les autres composantes du CA (prestations hors livraison) comptent dans le chiffre
   * d'affaires, donc dans la carte « Encours » du tableau de bord, sans jamais apparaitre
   * sur cet ecran. Elles ne sont PAS versees dans « Reste a payer » ni dans le taux de
   * recouvrement : ces deux chiffres parlent des factures partenaires, et les y melanger
   * deplacerait deux indicateurs que l'operateur lit deja. Elles se disent a cote, et le
   * total des deux est ecrit en clair.
   */
  const aEncaisser = prestations?.montantAEncaisser ?? 0;

  return (
    <div className="rounded-large border border-separator bg-surface px-4 py-3">
      {/*
       * Le repere. Il ne decore pas : il est la condition pour que des cartes globales
       * au-dessus d'un tableau filtre ne mentent pas. Elargir la portee des chiffres sans
       * le dire ne supprime pas l'ambiguite, il la deplace.
       */}
      {vueGlobale && (
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
          Vue globale — tous exercices, tous filtres confondus
        </p>
      )}
      {/*
       * `md:` et non `lg:` : la fenetre reelle des postes fait 1000 px de large, le seuil
       * `lg` (1024) ne s'y ouvre jamais et les trois chiffres retombaient sur deux lignes.
       */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-0 md:divide-x md:divide-separator">
        <Figure
          icone={Wallet}
          libelle="Reste à payer"
          note={
            autresComposantes > 0
              ? `${formatFcfa(resteFactures)} de factures + ${formatFcfa(autresComposantes)} d'autres composantes`
              : `sur ${formatFcfa(facture)} facturé`
          }
          valeur={formatFcfa(reste)}
        />
        <Figure
          couleur={retard.montant > 0 ? 'text-danger-soft-foreground' : undefined}
          icone={AlarmClock}
          libelle="En retard"
          note={
            retard.nbFactures > 0
              ? `${formatNombre(retard.nbFactures)} facture${retard.nbFactures > 1 ? 's' : ''} chez ${formatNombre(retard.nbPartenaires)} partenaire${retard.nbPartenaires > 1 ? 's' : ''}`
              : 'aucune facture en retard'
          }
          valeur={formatFcfa(retard.montant)}
        />
        <Figure
          couleur={couleurTaux}
          icone={TrendingUp}
          libelle="Taux de recouvrement"
          note={
            deductionsAppliquees > 0
              ? `${noteTaux} · résorption ${tauxResorption} % avec les déductions`
              : autresComposantes > 0
                ? `${noteTaux} · sur les factures`
                : noteTaux
          }
          valeur={`${taux} %`}
        />
      </div>

      {/*
       * Sous le trait : ce qui situe le releve. Ces chiffres ne se comparent pas entre eux
       * et n'appellent aucun geste ; une carte de la taille des trois autres leur donnait
       * un poids qu'ils n'ont pas.
       */}
      {/*
       * ⚠ Plus de « Total encours » ici, et ce n'est pas un allègement : c'était FAUX.
       *
       * <p>Cette ligne annonçait `reste + aEncaisser`. Depuis que les autres composantes
       * sont versées dans le « Reste à payer » du bandeau, elles y étaient comptées une
       * SECONDE fois : l'écran affichait 13 989 545 là où la vérité est 13 359 545, soit
       * 630 000 de dette inventée. Le total, c'est la carte ; cette ligne ne fait plus
       * que dire de quoi elle est composée.</p>
       */}
      {prestations && autresComposantes > 0 ? (
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 border-t border-separator pt-1.5 text-xs tabular-nums">
          <span className="text-muted">dont autres composantes du CA</span>
          <span className="font-semibold text-foreground">{formatFcfa(autresComposantes)}</span>
          <span className="text-muted">
            ({formatNombre(prestations.nbAEncaisser)} ligne
            {prestations.nbAEncaisser > 1 ? 's' : ''})
          </span>
        </p>
      ) : null}

      {/* Resserre : sur la fenetre reelle des postes (563 px de haut), chaque ligne prise
          ici est une ligne de moins pour le tableau, qui est l'objet de l'ecran. */}
      <p className="mt-2 border-t border-separator pt-1.5 text-[11px] leading-snug tabular-nums text-muted">
        {contexte.join(' · ')}
      </p>
    </div>
  );
}
