'use client';

import { Button, Card, Separator, Tooltip } from '@heroui-v3/react';
import { ChevronLeft, ChevronRight, Plus, TriangleAlert } from 'lucide-react';
import React from 'react';

import type { IBandeauCarburant, IProgramme } from '@/features/turboys/types/programme.types';
import { couvertureSemaine } from '@/features/turboys/utils/couverture.utils';
import { lundiDeSemaine } from '@/features/turboys/utils/semaine.utils';
import { cn } from '@/lib/utils';
import { formatMontant } from '@/utils/format.utils';

/**
 * LE HAUT DE PAGE DE LA SEMAINE (§5.2, §7.3, §8.2).
 *
 * <h3>Ce que l'opérateur regarde en premier, et dans quel ordre</h3>
 *
 * <p>Trois questions, trois rangées, et rien d'autre :</p>
 * <ol>
 *   <li><b>quelle semaine ?</b> — la barre de semaine, avec ses dates. L'écran les
 *       taisait : « Semaine 48 » ne dit pas à quelqu'un qui prépare le planning du
 *       lendemain s'il est dedans.</li>
 *   <li><b>où en est-elle ?</b> — six cartes comparables, chacune un filtre. Six nombres
 *       du même poids visuel se comparent d'un regard ; les mêmes nombres en phrases
 *       côte à côte se lisent un par un.</li>
 *   <li><b>combien on décaisse ?</b> — le bandeau carburant, un total dominant et sa
 *       décomposition. L'argent se lit en chiffres alignés, pas en tuiles.</li>
 * </ol>
 *
 * <p><b>Une seule action principale</b>, à droite des cartes, et elle est contextuelle :
 * publier ce qui reste, ou, quand tout est publié, engager le carburant. L'écran en
 * portait sept de même poids ; il n'y a pourtant jamais qu'un geste qui fait avancer la
 * semaine.</p>
 *
 * <p><b>Les gestes de lot ont disparu du haut de page.</b> Ils n'apparaissent plus que
 * dans une barre de sélection, quand au moins une ligne est cochée (§5.2). Rien n'est
 * coché à l'ouverture, donc cette barre est absente à l'ouverture.</p>
 */

export interface EnteteSemaineProps {
  annee: number;
  semaine: number;
  onSemaine: (delta: number) => void;

  programmes: IProgramme[];
  /** Les compteurs déjà calculés par la liste, pour ne pas les recalculer deux fois. */
  compteurs: {
    aPublier: number;
    publies: number;
    refuses: number;
    journaliers: number;
    /** Livreurs qui desservent un autre site que leur base. Facultatif pour les bancs. */
    renforts?: number;
    /** Superviseurs-livreurs ayant au moins un jour de service. Facultatif pour les bancs. */
    superviseurs?: number;
    sansCarburant: number;
    avecSurplus: number;
    totalSurplus: number;
    /** Nombre de surplus vivants. Facultatif pour les bancs. */
    nbSurplus?: number;
    /** « Renfort autre site : 6 000 FCFA · Pic d'activité : 2 000 FCFA ». */
    surplusParMotif?: string;
  };
  /** Le bandeau carburant du serveur. `null` tant qu'il n'est pas lu. */
  bandeau?: IBandeauCarburant | null;
  bandeauEnCours?: boolean;
  /** Total carburant de la semaine, calculé côté écran : le repli quand le bandeau manque. */
  carburantEcran: number;

  /** La carte active, qui est aussi l'onglet de la liste. */
  filtre: string;
  onFiltre: (cle: string) => void;

  onNouveau: () => void;
  onImporter: () => void;
  /** L'action principale, ou `null` quand il n'y a rien à faire. */
  actionPrincipale?: React.ReactNode;
  /**
   * Ce qui se lit SOUS les montants : l'état de l'engagement comptable, la soumission
   * des surplus, la relance des preuves manquantes. Tout cela découle du bandeau et
   * n'a pas de sens ailleurs.
   */
  complementBandeau?: React.ReactNode;
  /**
   * Le bouton de relance des preuves Wave. Il se place À CÔTÉ du compteur de preuves, là où
   * on lit qu'il en manque ; sans compteur (bandeau non lu), il retombe sous le bandeau.
   */
  relancePreuves?: React.ReactNode;
  /** Écart du carburant avec la semaine précédente, en pourcentage ; null = inconnu. */
  ecartSemainePrecedente?: number | null;

  isLoading?: boolean;
  isError?: boolean;
}

/** Les dates d'une semaine, telles qu'on les dit : « 23 → 29 novembre ». */
export function libelleDatesSemaine(annee: number, semaine: number): string {
  const lundi = lundiDeSemaine(annee, semaine);
  const dimanche = new Date(lundi);
  dimanche.setUTCDate(lundi.getUTCDate() + 6);

  const jour = (d: Date) => d.getUTCDate();
  const mois = (d: Date) => d.toLocaleDateString('fr-FR', { month: 'long', timeZone: 'UTC' });

  // Un seul nom de mois quand la semaine n'en franchit pas la limite : « 23 → 29
  // novembre », et non « 23 novembre → 29 novembre », qui se lit deux fois.
  return mois(lundi) === mois(dimanche)
    ? `${jour(lundi)} → ${jour(dimanche)} ${mois(dimanche)}`
    : `${jour(lundi)} ${mois(lundi)} → ${jour(dimanche)} ${mois(dimanche)}`;
}

/**
 * Une carte indicateur, cliquable comme filtre.
 *
 * <p>Un bouton et non un div : ces cartes filtrent, donc elles se tabulent, s'activent à
 * l'espace et annoncent leur état. `aria-pressed` porte le fait qu'un filtre est posé —
 * sans lui, un lecteur d'écran ne distingue pas la carte active.</p>
 */
function CarteIndicateur({
  actif,
  alerte = false,
  detail,
  onPress,
  titre,
  valeur,
  survol,
}: {
  actif: boolean;
  alerte?: boolean;
  detail?: React.ReactNode;
  onPress?: () => void;
  survol?: React.ReactNode;
  titre: string;
  valeur: React.ReactNode;
}) {
  const corps = (
    <button
      aria-pressed={actif}
      className={cn(
        'flex w-full flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        actif ? 'border-primary bg-primary/5' : 'border-default-200 bg-content1 hover:border-default-400',
        !onPress && 'cursor-default hover:border-default-200',
      )}
      onClick={onPress}
      type="button"
    >
      <span className="text-xs font-medium text-muted">{titre}</span>
      <span className={cn('text-xl font-bold tabular-nums leading-tight', alerte ? 'text-danger-soft-foreground' : 'text-foreground')}>
        {valeur}
      </span>
      {detail ? <span className="text-xs leading-tight text-muted">{detail}</span> : <span className="text-xs leading-tight">&nbsp;</span>}
    </button>
  );

  if (!survol) return corps;
  return (
    <Tooltip>
      {corps}
      <Tooltip.Content className="max-w-xs">{survol}</Tooltip.Content>
    </Tooltip>
  );
}

/** Un terme du bandeau carburant : un libellé, un montant, et de quoi le situer. */
function TermeBandeau({
  libelle,
  montant,
  note,
  ton = 'neutre',
}: {
  libelle: string;
  montant: number;
  note?: string;
  ton?: 'neutre' | 'surplus' | 'eteint';
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted">{libelle}</span>
      <span
        className={cn(
          'text-sm font-semibold tabular-nums',
          ton === 'surplus' && 'text-warning-soft-foreground',
          ton === 'eteint' && 'text-muted',
          ton === 'neutre' && 'text-foreground',
        )}
      >
        {formatMontant(montant)}
      </span>
      {note ? <span className="text-xs text-muted">{note}</span> : null}
    </div>
  );
}

export function EnteteSemaine({
  annee,
  semaine,
  onSemaine,
  programmes,
  compteurs,
  bandeau = null,
  bandeauEnCours = false,
  carburantEcran,
  filtre,
  onFiltre,
  onNouveau,
  onImporter,
  actionPrincipale = null,
  complementBandeau = null,
  relancePreuves = null,
  ecartSemainePrecedente = null,
  isLoading = false,
  isError = false,
}: EnteteSemaineProps) {
  const couverture = React.useMemo(() => couvertureSemaine(programmes), [programmes]);

  /*
   * Le total à décaisser vient du serveur quand il est là, parce que lui seul connaît
   * les surplus accordés et la dotation FIGÉE à la publication. À défaut — bandeau en
   * cours de lecture, ou en échec — on affiche le total calculé à l'écran plutôt qu'un
   * tiret : c'est le même ordre de grandeur, et un écran vide ne renseigne personne.
   */
  const totalADecaisser = bandeau?.totalADecaisser ?? carburantEcran;
  const indisponible = isError || isLoading;

  const bascule = (cle: string) => () => onFiltre(filtre === cle ? 'TOUS' : cle);

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-semibold text-foreground">Programme de la semaine</h1>
      {/* ── 1. QUELLE SEMAINE ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex items-center gap-1">
            <Button aria-label="Semaine précédente" isIconOnly onPress={() => onSemaine(-1)} size="sm" variant="ghost">
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Button>
            <span className="whitespace-nowrap text-base font-semibold text-foreground">
              Semaine {semaine} / {annee}
            </span>
            <Button aria-label="Semaine suivante" isIconOnly onPress={() => onSemaine(1)} size="sm" variant="ghost">
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
          {/* Les dates : « Semaine 48 » seul ne dit pas si on est dedans. */}
          <span className="text-sm text-muted">{libelleDatesSemaine(annee, semaine)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onPress={onImporter} size="sm" variant="outline">
            Dupliquer la semaine précédente
          </Button>
          <Button onPress={onNouveau} size="sm" variant="primary">
            <Plus aria-hidden="true" className="size-4" />
            Nouveau programme
          </Button>
        </div>
      </div>

      {/* ── 2. OÙ EN EST-ELLE ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {/*
           * LES SIX CARTES SONT DES PORTES (maquette). Trois ne menaient nulle part, et la
           * première remettait la liste sur « Tous », ce que l'onglet du même nom fait déjà.
           * Chacune ouvre ce que son chiffre désigne : les programmes à publier, les
           * renforts, la vue Couverture, les lignes sans carburant, les surplus.
           */}
          <CarteIndicateur
            actif={filtre === 'A_PUBLIER'}
            detail={
              indisponible ? null : (
                <>
                  {compteurs.publies} publiés · {compteurs.aPublier} à publier
                  {` · ${compteurs.refuses} refusé${compteurs.refuses > 1 ? 's' : ''}`}
                </>
              )
            }
            onPress={bascule('A_PUBLIER')}
            titre="Programmes"
            valeur={indisponible ? '—' : programmes.length}
          />

          <CarteIndicateur
            actif={filtre === 'RENFORTS'}
            detail={
              indisponible || compteurs.superviseurs === undefined
                ? null
                : `+ ${compteurs.superviseurs} superviseur${compteurs.superviseurs > 1 ? 's' : ''}-livreur${compteurs.superviseurs > 1 ? 's' : ''} · ${compteurs.renforts ?? 0} en renfort`
            }
            onPress={bascule('RENFORTS')}
            survol="Les journaliers qui ont au moins un jour de service. Un clic montre ceux qui desservent un autre site que leur base."
            titre="Journaliers programmés"
            valeur={indisponible ? '—' : compteurs.journaliers}
          />

          <CarteIndicateur
            actif={false}
            detail={indisponible ? null : `sur ${couverture.sitesAuProgramme} au programme`}
            survol="Un site est couvert quand au moins un livreur y est prévu chacun des sept jours. Les sites comptés sont ceux que la semaine prévoit de servir, bases et sites desservis confondus."
            onPress={() => onFiltre('TROUS')}
            titre="Sites couverts"
            valeur={indisponible ? '—' : couverture.sitesCouverts}
          />

          <CarteIndicateur
            actif={filtre === 'TROUS'}
            alerte={couverture.trous > 0}
            detail={indisponible ? null : couverture.trous > 0 ? 'site × jour sans personne' : 'tous les jours couverts'}
            onPress={couverture.trous > 0 ? bascule('TROUS') : undefined}
            survol="Un couple site × jour où aucun livreur n'est prévu. Un clic montre les sites concernés dans la vue Couverture."
            titre="Trous de couverture"
            valeur={
              indisponible ? (
                '—'
              ) : couverture.trous > 0 ? (
                <span className="flex items-center gap-1.5">
                  <TriangleAlert aria-hidden="true" className="size-4" />
                  {couverture.trous}
                </span>
              ) : (
                0
              )
            }
          />

          {/* Sans bandeau, « 0 engagé » serait une affirmation : on ne sait pas, on écrit —. */}
          <CarteIndicateur
            detail={
              indisponible || !bandeau ? null : (
                <>
                  {bandeau.montantEngage != null ? <>sur {formatMontant(totalADecaisser)} à décaisser</> : 'rien d’engagé pour l’instant'}
                  {/* « vs semaine précédente » (maquette). Le signe moins est le vrai (U+2212),
                      pas un trait d'union : dans une colonne de chiffres ils n'ont pas la
                      même largeur. */}
                  {ecartSemainePrecedente !== null ? (
                    <span className="block tabular-nums">
                      vs semaine précédente : {ecartSemainePrecedente > 0 ? '+' : ecartSemainePrecedente < 0 ? '−' : ''}
                      {Math.abs(ecartSemainePrecedente)} %
                    </span>
                  ) : null}
                </>
              )
            }
            survol="Ce qui est réellement passé en charge dans le circuit finance, rapporté au total à décaisser de la semaine. Un engagement peut se faire programme par programme."
            actif={filtre === 'SANS_CARBURANT'}
            onPress={bascule('SANS_CARBURANT')}
            titre="Carburant engagé"
            valeur={indisponible || !bandeau ? '—' : formatMontant(bandeau.montantEngage ?? 0)}
          />

          {/*
           * La sixième carte (§7.3). En orange DÈS QU'IL Y EN A : un surplus est une
           * décision qui coûte, et la voir se perd dans une rangée de nombres gris.
           * Sans surplus, elle reste affichée en gris — l'absence est une information.
           */}
          <CarteIndicateur
            actif={filtre === 'AVEC_SURPLUS'}
            detail={
              indisponible ? null : compteurs.totalSurplus > 0 ? (
                <>
                  {compteurs.nbSurplus !== undefined ? `${compteurs.nbSurplus} surplus · ` : ''}
                  {compteurs.avecSurplus} livreur{compteurs.avecSurplus > 1 ? 's' : ''}
                  {bandeau && bandeau.dotationValidee > 0
                    ? ` · +${Math.round((compteurs.totalSurplus / bandeau.dotationValidee) * 1000) / 10}% de la dotation`
                    : ''}
                </>
              ) : (
                'aucun cette semaine'
              )
            }
            onPress={compteurs.totalSurplus > 0 ? bascule('AVEC_SURPLUS') : undefined}
            survol={compteurs.surplusParMotif ? `Par motif : ${compteurs.surplusParMotif}` : undefined}
            titre="Surplus carburant"
            valeur={
              indisponible ? (
                '—'
              ) : (
                <span className={cn(compteurs.totalSurplus > 0 && 'text-warning-soft-foreground')}>
                  {formatMontant(compteurs.totalSurplus)}
                </span>
              )
            }
          />
        </div>

        {/* L'ACTION PRINCIPALE, seule, à droite des cartes. */}
        {actionPrincipale ? (
          <div className="flex shrink-0 items-center lg:w-56 lg:items-stretch">{actionPrincipale}</div>
        ) : null}
      </div>

      {/* ── 3. COMBIEN ON DÉCAISSE (§8.2) ────────────────────────────────── */}
      {!indisponible && programmes.length > 0 && (
        <Card>
          <Card.Content className="gap-3 py-3">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <div className="flex flex-col">
                <span className="text-xs text-muted">Carburant à décaisser, surplus compris</span>
                <span className="text-2xl font-bold tabular-nums leading-tight text-foreground">
                  {bandeauEnCours && !bandeau ? '…' : formatMontant(totalADecaisser)}
                </span>
              </div>

              {/*
               * ⚠ LA DÉCOMPOSITION N'EXISTE QUE SI LE SERVEUR L'A DONNÉE. Avec un repli à
               * zéro, le bandeau affichait « 180 000 à décaisser » au-dessus de quatre
               * termes à 0 : une somme que ses propres parties contredisent, et qui donne
               * à croire que les surplus et la part des superviseurs sont nuls alors
               * qu'ils sont seulement inconnus. Une phrase vaut mieux que quatre zéros.
               */}
              {bandeau ? (
                <>
                  <Separator className="hidden h-10 sm:block" orientation="vertical" />

                  <TermeBandeau libelle="Dotation validée initialement" montant={bandeau.dotationValidee} />
                  <TermeBandeau
                    libelle="Total surplus"
                    montant={bandeau.totalSurplus}
                    ton={bandeau.totalSurplus > 0 ? 'surplus' : 'eteint'}
                  />

                  <Separator className="hidden h-10 sm:block" orientation="vertical" />

                  <TermeBandeau
                    libelle="Journaliers"
                    montant={bandeau.totalJournaliers}
                    note={`${bandeau.nbProgrammesJournaliers} programme${bandeau.nbProgrammesJournaliers > 1 ? 's' : ''}`}
                  />
                  <TermeBandeau
                    libelle="Superviseurs-livreurs"
                    montant={bandeau.totalSuperviseurs}
                    note={`${bandeau.nbProgrammesSuperviseurs} programme${bandeau.nbProgrammesSuperviseurs > 1 ? 's' : ''}`}
                  />
                </>
              ) : (
                <span className="text-xs text-muted">
                  {bandeauEnCours
                    ? 'Détail en cours de lecture…'
                    : 'Total calculé à l’écran. Le détail — dotation validée, surplus, répartition — vient du serveur.'}
                </span>
              )}

              {/*
               * Les preuves Wave, à droite du bandeau. Elles ne portent que sur les jours
               * DÉJÀ PASSÉS des programmes publiés : une preuve attendue pour demain
               * apparaîtrait manquante alors que l'argent n'est pas encore versé.
               */}
              {bandeau && bandeau.preuvesAttendues > 0 && (
                <>
                  <Separator className="hidden h-10 sm:block" orientation="vertical" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted">Preuves Wave</span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {/* RG-W05 : « reçues x / y », puis validées et manquantes. Le chiffre
                        affiché était celui des validées, sous le nom « reçues » de la spec. */}
                    {bandeau.preuvesRecues} / {bandeau.preuvesAttendues} reçues
                    </span>
                    <span className="text-xs text-muted tabular-nums">
                      {bandeau.preuvesValidees} validée{bandeau.preuvesValidees > 1 ? 's' : ''}
                    </span>
                    {bandeau.preuvesManquantes > 0 ? (
                      <span className="text-xs font-medium text-danger-soft-foreground">
                        {bandeau.preuvesManquantes} manquante{bandeau.preuvesManquantes > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">aucune manquante</span>
                    )}
                  </div>
                  {/* La relance, À CÔTÉ du compteur qui dit qu'il en manque (maquette). Elle
                      vivait sous le bandeau, loin du chiffre qui la justifie. */}
                  {relancePreuves}
                </>
              )}
            </div>

            {complementBandeau || (relancePreuves && !(bandeau && bandeau.preuvesAttendues > 0)) ? (
              <>
                <Separator />
                {complementBandeau}
                {/* Sans compteur (bandeau non lu), la relance garde sa place d'avant plutôt
                    que de disparaître. */}
                {bandeau && bandeau.preuvesAttendues > 0 ? null : relancePreuves}
              </>
            ) : null}
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
