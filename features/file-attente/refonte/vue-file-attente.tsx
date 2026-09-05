'use client';

import {
  Alert,
  Button,
  Card,
  SearchField,
  Spinner,
  ToggleButton,
  ToggleButtonGroup,
} from '@heroui-v3/react';
import { AlertTriangle, Map, RefreshCw, Store } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { FileAttenteKpis } from '@/app/(protected)/file-attente/components/file-attente-kpis';
import { PosteFileCard } from '@/app/(protected)/file-attente/components/poste-file-card';
import type {
  FileAttenteKpis as Kpis,
  PosteFileVue,
} from '@/app/(protected)/file-attente/hooks/use-file-attente-vue';
import { pluriel } from '@/app/(protected)/file-attente/utils/file-attente.utils';

function CarteSquelette() {
  return <div className="h-52 animate-pulse rounded-2xl bg-surface-secondary" />;
}

/**
 * Écran FILE D'ATTENTE — la vue de référence du mécanisme d'affectation.
 *
 * <p>Depuis la refonte de juillet 2026, la file n'est plus un sous-produit du
 * GPS : elle est alimentée par le POINTAGE et c'est elle, et elle seule, qui
 * décide qui reçoit la prochaine course. Cet écran doit donc montrer exactement
 * ce que l'affectation utilise — l'ordre réel, poste par poste — et signaler en
 * premier les postes où il n'y a personne, puisque c'est le seul cas où
 * l'exploitation peut encore agir.</p>
 *
 * <h3>Ce qui change au passage en v3</h3>
 * <p>La hiérarchie de l'écran était déjà juste, elle est conservée telle quelle. C'est le
 * MATÉRIAU qui change : les deux puces de filtre étaient un `<button>` écrit à la main,
 * et le filtre actif y portait `bg-surface-secondary text-white` — du blanc sur une
 * surface claire, donc illisible en thème clair. Elles deviennent un
 * `ToggleButtonGroup`. Les deux bandeaux d'avertissement, peints à la main en
 * `bg-warning-50/70` et `bg-danger-50/70` — des teintes de l'ANCIENNE palette, muettes
 * dans le thème actuel — deviennent des `Alert`. Toute l'échelle `default-*` laisse la
 * place aux jetons du thème.</p>
 */
export interface VueFileAttenteProps {
  postes: PosteFileVue[];
  kpis: Kpis;
  /** L'instant de référence des temps d'attente, figé par le hook. */
  maintenant: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  /** Le référentiel des postes n'a pas pu être lu : le compte des déserts est partiel. */
  universeIncomplet: boolean;
  rafraichir: () => Promise<unknown>;
}

export function VueFileAttente({
  postes,
  kpis,
  maintenant,
  isLoading,
  isFetching,
  isError,
  universeIncomplet,
  rafraichir,
}: VueFileAttenteProps) {
  const [recherche, setRecherche] = useState('');
  const [seulementDeserts, setSeulementDeserts] = useState(false);
  // Le bouton ne tourne QUE sur une demande explicite : le rafraîchissement
  // automatique toutes les 30 s le ferait clignoter en permanence, et un
  // opérateur finirait par ne plus voir l'indicateur du tout.
  const [rafraichissementDemande, setRafraichissementDemande] = useState(false);

  const actualiser = async () => {
    setRafraichissementDemande(true);
    try {
      await rafraichir();
    } finally {
      setRafraichissementDemande(false);
    }
  };

  const postesFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return postes.filter((poste) => {
      if (seulementDeserts && !poste.desert) return false;
      if (!terme) return true;
      if (poste.restaurant.toLowerCase().includes(terme)) return true;
      return poste.file.some((ligne) => ligne.nomComplet.toLowerCase().includes(terme));
    });
  }, [postes, recherche, seulementDeserts]);

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Entête — la phrase qui explique le mécanisme est volontairement au-dessus
          de tout le reste : un opérateur qui découvre l'écran doit comprendre
          comment on entre et on sort de la file avant de lire un seul chiffre. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">File d&apos;attente</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Un livreur entre dans la file en pointant sa montée, et en sort en se mettant en pause
            ou en pointant sa fin de service. L&apos;ordre ci-dessous est celui dans lequel les
            courses sont distribuées, poste par poste.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/*
           * `as={Link}` etait une prop de la v2 : sur un Button v3 elle est ignoree EN
           * SILENCE et le bouton ne naviguait plus. Le lien porte le bouton.
           */}
          <Link href="/trafic">
            <Button size="sm" variant="outline">
              <Map aria-hidden="true" className="size-4" />
              Carte Trafic
            </Button>
          </Link>
          <Button isPending={rafraichissementDemande} onPress={actualiser} size="sm" variant="primary">
            {rafraichissementDemande ? (
              <Spinner size="sm" />
            ) : (
              <RefreshCw aria-hidden="true" className="size-4" />
            )}
            Actualiser
          </Button>
        </div>
      </div>

      <FileAttenteKpis isLoading={isLoading} kpis={kpis} />

      {universeIncomplet && !isLoading && (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              La liste des postes n&apos;a pas pu être lue : seuls les partenaires ayant au moins un
              livreur en file sont affichés. Le compte des postes sans livreur est donc incomplet.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {isError && !isLoading && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              La file d&apos;attente n&apos;a pas pu être relue. L&apos;écran montre la dernière
              situation connue — ne l&apos;utilisez pas pour arbitrer une affectation avant de
              l&apos;avoir actualisé.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          aria-label="Rechercher un partenaire ou un livreur"
          className="w-full sm:max-w-xs"
          onChange={setRecherche}
          value={recherche}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Rechercher un partenaire ou un livreur" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <ToggleButtonGroup
          onSelectionChange={(s) => {
            const v = Array.from(s)[0];
            if (v) setSeulementDeserts(v === 'deserts');
          }}
          selectedKeys={new Set([seulementDeserts ? 'deserts' : 'tous'])}
          selectionMode="single"
        >
          <ToggleButton id="tous">Tous les postes ({postes.length})</ToggleButton>
          <ToggleButton id="deserts">Sans livreur ({kpis.postesDeserts})</ToggleButton>
        </ToggleButtonGroup>

        <span className="ms-auto text-[11px] text-muted">
          {isFetching ? 'Mise à jour…' : 'Actualisation automatique toutes les 30 secondes'}
        </span>
      </div>

      {/* Postes */}
      {isLoading ? (
        <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CarteSquelette key={index} />
          ))}
        </div>
      ) : postesFiltres.length === 0 ? (
        <Card>
          <Card.Content className="items-center gap-2 py-16 text-center text-muted">
            <Store aria-hidden="true" className="size-7" />
            <p className="text-sm">
              {postes.length === 0
                ? "Aucun poste à afficher : personne n'est en file et aucune assignation n'a pu être lue."
                : 'Aucun poste ne correspond à ce filtre.'}
            </p>
          </Card.Content>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-muted">
            {postesFiltres.length} {pluriel(postesFiltres.length, 'poste')}{' '}
            {pluriel(postesFiltres.length, 'affiché')} — les postes sans livreur sont présentés en
            premier.
          </p>
          {/* `items-start` : sans lui, la carte d'un poste déserté s'étirerait à
              la hauteur de la file la plus longue de sa rangée — un grand vide
              blanc là où il faut au contraire un signal court et net. */}
          <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {postesFiltres.map((poste) => (
              <PosteFileCard key={poste.restaurantId} maintenant={maintenant} poste={poste} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
