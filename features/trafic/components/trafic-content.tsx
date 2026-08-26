'use client';

import { useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button, Select, SelectItem, Tooltip } from '@heroui/react';
import { Navigation, RefreshCw, RotateCcw, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import TraficLivreurPanel from '@/features/trafic/components/trafic-livreur-panel';
import { TraficKpis } from '@/features/trafic/components/trafic-kpis';
import { TraficPointagesBanner } from '@/features/trafic/components/trafic-pointages-banner';
import EtatErreur from '@/components/commons/EtatErreur';
import { useTrafic } from '@/features/trafic/hooks/use-trafic';
import { useHauteurDisponible } from '@/hooks/use-hauteur-disponible';
import { traficKeyQuery } from '@/features/trafic/queries/index.query';
import { useQuartiersQuery } from '@/features/trafic/queries/quartier.query';
import { STATUT_TRAFIC_META, STATUTS_ORDONNES } from '@/features/trafic/utils/statut-trafic';
import { TURBOY_TYPE_OPTIONS } from '@/features/turboys/utils/type-livreur-display';

// Carte du trafic sur Google Maps (l'API a besoin du navigateur → ssr: false).
//
// Clé : celle du projet Chicken Nation, déjà réutilisée par le backend depuis la migration
// ORS → Google (décision owner). Elle sert donc à la fois aux appels serveur (Directions,
// géocodage, autocomplétion d'adresse) et, désormais, à cette carte côté navigateur.
//
// Conséquence à connaître, imposée par Google : une clé n'accepte qu'UN type de restriction
// d'application. Utilisée des deux côtés, elle ne peut donc être restreinte ni par référent
// (les appels serveur n'en envoient pas) ni par IP (le navigateur n'a pas l'IP du serveur) —
// elle reste lisible dans le source de la page. Le garde-fou praticable est la restriction
// par API + un plafond de quota côté console Google Cloud.
const MapTrafic = dynamic(() => import('@/components/dashboard/trafic/MapTrafic'), { ssr: false });

const SANS_FILTRE = 'TOUS';

/** Clé sélectionnée d'un Select HeroUI, sentinelle « TOUS » ramenée à vide. */
function lireCle(keys: 'all' | Set<React.Key>): string {
  if (keys === 'all') return '';
  const cle = Array.from(keys)[0];
  return !cle || cle === SANS_FILTRE ? '' : String(cle);
}

/** Chip de filtre — actif : fond sombre, texte blanc (langage de design ERP). */
function ChipFiltre({
  actif,
  onPress,
  children,
  titre,
}: {
  actif: boolean;
  onPress: () => void;
  children: React.ReactNode;
  titre?: string;
}) {
  return (
    <button
      type="button"
      title={titre}
      aria-pressed={actif}
      onClick={onPress}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        actif
          ? 'bg-[#17181C] text-white dark:bg-white dark:text-[#17181C]'
          : 'bg-default-100 text-default-600 hover:bg-default-200',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/**
 * Écran TRAFIC — supervision en temps réel.
 *
 * Règle de lecture, désormais unique : le SERVICE décide, la position illustre.
 * Le pointage de montée fait entrer le livreur dans la file du jour, et c'est
 * la file qui reçoit les courses. L'écran affiche donc exactement ce que
 * l'affectation utilise. « Hors zone » et « position ancienne » sont des
 * signalements posés sur un livreur, pas des statuts qui l'excluent.
 */
export default function TraficContent() {
  const {
    trafic,
    livreursFiltres,
    positions,
    filtres,
    majFiltre,
    reinitialiserFiltres,
    selectedLivreurId,
    focusOnLivreur,
    focusPosition,
    isError,
    isLoading,
    isFetching,
    dataUpdatedAt,
  } = useTrafic();
  const { data: quartiers } = useQuartiersQuery();
  const queryClient = useQueryClient();

  // La zone carte + liste tient dans ce qui reste de la fenêtre : sans cela, la liste
  // (jusqu'à 172 livreurs) dicte la hauteur de la rangée et la carte s'étire avec elle.
  const zoneCarteRef = useRef<HTMLDivElement>(null);
  const hauteurZoneCarte = useHauteurDisponible(zoneCarteRef);

  const quartiersActifs = useMemo(() => (quartiers ?? []).filter((q) => q.actif), [quartiers]);

  const optionsQuartier = useMemo(
    () => [
      { cle: SANS_FILTRE, libelle: 'Tous les quartiers' },
      ...quartiersActifs.map((q) => ({ cle: q.libelle, libelle: q.libelle })),
    ],
    [quartiersActifs],
  );

  const optionsType = useMemo(
    () => [
      { cle: SANS_FILTRE, libelle: 'Tous les types' },
      ...TURBOY_TYPE_OPTIONS.map((t) => ({ cle: t.value, libelle: t.label })),
    ],
    [],
  );

  const filtresActifs =
    filtres.statut !== 'TOUS' ||
    filtres.horsZoneSeulement ||
    !!filtres.quartier ||
    !!filtres.type ||
    !!filtres.recherche;

  const rafraichir = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: traficKeyQuery(), exact: false });
  }, [queryClient]);

  const heureMaj =
    dataUpdatedAt > 0
      ? new Date(dataUpdatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : null;

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Entête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-primary">Trafic — supervision en temps réel</h1>
          <p className="mt-1 max-w-3xl text-sm text-default-500">
            Le statut vient du service du jour : le pointage de montée fait entrer le livreur dans la
            file d&apos;attente, et c&apos;est cette file qui reçoit les courses. La position GPS
            illustre la carte, elle ne décide plus de la disponibilité.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-default-200/50 bg-white px-3.5 py-2 text-right dark:bg-content1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-default-500">
              En service
            </p>
            <p className="text-lg font-semibold leading-tight tabular-nums">
              {trafic.totalEnService}
              <span className="text-xs font-normal text-default-400"> / {trafic.totalLivreurs}</span>
            </p>
          </div>
          <Tooltip content={heureMaj ? `Dernière actualisation à ${heureMaj}` : 'Actualiser'} size="sm">
            <Button
              isIconOnly
              variant="flat"
              radius="lg"
              aria-label="Actualiser le trafic"
              isLoading={isFetching}
              onPress={rafraichir}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Ce qui bloque des livreurs hors de la file, en tête d'écran */}
      <TraficPointagesBanner />

      {/* Écran rafraîchi toutes les 30 s. Sans ce bloc, un échec de lecture faisait
          retomber les quatre compteurs à zéro et vidait la carte : le régulateur
          lisait « aucun livreur en service » alors que la flotte roulait. On dit
          que la LECTURE a échoué, et on masque les compteurs plutôt que d'afficher
          des zéros qui ressemblent à une mesure. */}
      {isError && (
        <EtatErreur
          quoi="le trafic livreurs"
          onReessayer={rafraichir}
          enCours={isFetching}
        />
      )}

      {/* Les quatre compteurs — et ce qu'ils veulent dire */}
      {!isError && (
      <TraficKpis
        compteurs={trafic.compteurs}
        statutActif={filtres.statut}
        onStatutChange={(statut) => majFiltre('statut', statut)}
        isLoading={isLoading}
      />
      )}

      {/* Filtres : le statut est exclusif, « hors zone » est transverse */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-default-200/50 bg-white p-3 dark:bg-content1">
        <ChipFiltre
          actif={filtres.statut === 'TOUS'}
          onPress={() => majFiltre('statut', 'TOUS')}
          titre="Afficher tous les statuts"
        >
          <Users className="h-3.5 w-3.5" aria-hidden />
          Tous les statuts
        </ChipFiltre>

        <ChipFiltre
          actif={filtres.horsZoneSeulement}
          onPress={() => majFiltre('horsZoneSeulement', !filtres.horsZoneSeulement)}
          titre="Un livreur peut être disponible ET loin de son poste : ce filtre traverse les statuts"
        >
          <Navigation className="h-3.5 w-3.5" aria-hidden />
          Seulement hors de leur zone
          <span className="tabular-nums opacity-70">({trafic.horsRayon})</span>
        </ChipFiltre>

        <span className="mx-1 hidden h-5 w-px bg-default-200 sm:block" aria-hidden />

        <Select
          aria-label="Filtrer par quartier"
          size="sm"
          radius="lg"
          className="w-44"
          selectedKeys={new Set([filtres.quartier || SANS_FILTRE])}
          onSelectionChange={(keys) => majFiltre('quartier', lireCle(keys))}
        >
          {optionsQuartier.map((o) => (
            <SelectItem key={o.cle} value={o.cle}>
              {o.libelle}
            </SelectItem>
          ))}
        </Select>

        <Select
          aria-label="Filtrer par type de livreur"
          size="sm"
          radius="lg"
          className="w-44"
          selectedKeys={new Set([filtres.type || SANS_FILTRE])}
          onSelectionChange={(keys) => majFiltre('type', lireCle(keys))}
        >
          {optionsType.map((o) => (
            <SelectItem key={o.cle} value={o.cle}>
              {o.libelle}
            </SelectItem>
          ))}
        </Select>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-default-500">
            <span className="font-semibold tabular-nums text-default-700">{livreursFiltres.length}</span>{' '}
            livreur{livreursFiltres.length > 1 ? 's' : ''} affiché
            {livreursFiltres.length > 1 ? 's' : ''}
          </span>
          {filtresActifs && (
            <Button
              size="sm"
              variant="light"
              radius="lg"
              startContent={<RotateCcw className="h-3.5 w-3.5" />}
              onPress={reinitialiserFiltres}
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* Carte + liste latérale */}
      {/* Hauteur = ce qui reste réellement de la fenêtre, mesuré (voir le hook). Un `calc()`
          écrit à la main réservait 27rem à l'en-tête et imposait un plancher de 480 px : sur
          une fenêtre courte, la carte dépassait le bas de l'écran et la page défilait.
          `grid-rows-[minmax(0,1fr)]` rend la rangée définie, sans quoi le `h-full` de la
          liste retombe sur « auto », son défilement interne ne s'enclenche pas et les cartes
          de livreurs allongent la rangée. Le `calc()` ne sert plus que de repli avant mesure. */}
      <div
        ref={zoneCarteRef}
        className="grid min-h-0 gap-3 lg:h-[calc(100vh-14rem)] lg:min-h-[320px] lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[minmax(0,1fr)]"
        style={hauteurZoneCarte ? { height: hauteurZoneCarte } : undefined}
      >
        <div className="relative h-[380px] min-h-0 overflow-hidden rounded-2xl border border-default-200/50 lg:h-full">
          <MapTrafic positions={positions} focusPosition={focusPosition} quartiers={quartiersActifs} />

          {/* Légende des pins — mêmes couleurs que les compteurs */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-[14px] border border-default-200/50 bg-white/95 px-3 py-2 shadow-sm backdrop-blur dark:bg-content1/95">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {STATUTS_ORDONNES.map((statut) => (
                <span key={statut} className="flex items-center gap-1.5 text-[10px] text-default-600">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUT_TRAFIC_META[statut].couleur }}
                  />
                  {STATUT_TRAFIC_META[statut].libelleCourt}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="h-[520px] min-h-0 lg:h-full">
          <TraficLivreurPanel
            livreurs={livreursFiltres}
            recherche={filtres.recherche}
            onRechercheChange={(valeur) => majFiltre('recherche', valeur)}
            selectedLivreurId={selectedLivreurId}
            onSelectLivreur={focusOnLivreur}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
