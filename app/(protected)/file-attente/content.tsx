'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/heroui';
import { AlertTriangle, Map, RefreshCw, Search, Store } from 'lucide-react';

import { useAbility } from '@/hooks/use-ability';

import { FileAttenteKpis } from './components/file-attente-kpis';
import { PosteFileCard } from './components/poste-file-card';
import { useFileAttenteVue } from './hooks/use-file-attente-vue';
import { pluriel } from './utils/file-attente.utils';

/** Chip de filtre : actif = fond sombre, inactif = gris clair. */
function ChipFiltre({
  actif,
  onPress,
  children,
}: {
  actif: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={actif}
      className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
        actif
          ? 'bg-[#17181C] text-white'
          : 'bg-default-100 text-default-600 hover:bg-default-200'
      }`}
    >
      {children}
    </button>
  );
}

function CarteSquelette() {
  return (
    <div className="h-52 animate-pulse rounded-2xl border border-default-200/50 bg-default-100/60" />
  );
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
 */
export default function FileAttenteContent() {
  const ability = useAbility();
  const { postes, kpis, maintenant, isLoading, isFetching, isError, universeIncomplet, rafraichir } =
    useFileAttenteVue();

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

  if (!ability.can('read', 'Trafic')) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-default-400">
        <AlertTriangle className="h-8 w-8" />
        <p>Vous n&apos;avez pas accès au suivi des files d&apos;attente.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Entête — la phrase qui explique le mécanisme est volontairement au-dessus
          de tout le reste : un opérateur qui découvre l'écran doit comprendre
          comment on entre et on sort de la file avant de lire un seul chiffre. */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">File d&apos;attente</h1>
          <p className="mt-1 max-w-3xl text-sm text-default-500">
            Un livreur entre dans la file en pointant sa montée, et en sort en se mettant en pause
            ou en pointant sa fin de service. L&apos;ordre ci-dessous est celui dans lequel les
            courses sont distribuées, poste par poste.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            as={Link}
            href="/trafic"
            size="sm"
            variant="flat"
            startContent={<Map className="h-4 w-4" />}
          >
            Carte Trafic
          </Button>
          <Button
            size="sm"
            color="primary"
            startContent={rafraichissementDemande ? undefined : <RefreshCw className="h-4 w-4" />}
            isLoading={rafraichissementDemande}
            onPress={actualiser}
          >
            Actualiser
          </Button>
        </div>
      </div>

      <FileAttenteKpis kpis={kpis} isLoading={isLoading} />

      {universeIncomplet && !isLoading && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-warning-200 bg-warning-50/70 p-3 text-xs text-default-600 dark:border-warning-500/30 dark:bg-warning-500/10">
          <AlertTriangle size={15} className="mt-px shrink-0 text-warning-600" />
          <p>
            La liste des postes n&apos;a pas pu être lue : seuls les partenaires ayant au moins un
            livreur en file sont affichés. Le compte des postes sans livreur est donc incomplet.
          </p>
        </div>
      )}

      {isError && !isLoading && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-danger-200 bg-danger-50/70 p-3 text-xs text-default-600 dark:border-danger-500/30 dark:bg-danger-500/10">
          <AlertTriangle size={15} className="mt-px shrink-0 text-danger-600" />
          <p>
            La file d&apos;attente n&apos;a pas pu être relue. L&apos;écran montre la dernière
            situation connue — ne l&apos;utilisez pas pour arbitrer une affectation avant de
            l&apos;avoir actualisé.
          </p>
        </div>
      )}

      {/* Filtres */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Input
          value={recherche}
          onValueChange={setRecherche}
          isClearable
          onClear={() => setRecherche('')}
          size="sm"
          placeholder="Rechercher un partenaire ou un livreur"
          startContent={<Search size={16} className="text-default-400" />}
          className="w-full sm:max-w-xs"
          aria-label="Rechercher un partenaire ou un livreur"
        />
        <div className="flex items-center gap-2">
          <ChipFiltre actif={!seulementDeserts} onPress={() => setSeulementDeserts(false)}>
            Tous les postes ({postes.length})
          </ChipFiltre>
          <ChipFiltre actif={seulementDeserts} onPress={() => setSeulementDeserts(true)}>
            Sans livreur ({kpis.postesDeserts})
          </ChipFiltre>
        </div>
        <span className="ml-auto text-[11px] text-default-400">
          {isFetching ? 'Mise à jour…' : 'Actualisation automatique toutes les 30 secondes'}
        </span>
      </div>

      {/* Postes */}
      <div className="mt-4">
        {isLoading ? (
          <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <CarteSquelette key={index} />
            ))}
          </div>
        ) : postesFiltres.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-default-200 py-16 text-center text-default-400">
            <Store className="h-7 w-7" />
            <p className="text-sm">
              {postes.length === 0
                ? "Aucun poste à afficher : personne n'est en file et aucune assignation n'a pu être lue."
                : 'Aucun poste ne correspond à ce filtre.'}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-2 text-[11px] text-default-400">
              {postesFiltres.length} {pluriel(postesFiltres.length, 'poste')}{' '}
              {pluriel(postesFiltres.length, 'affiché')} — les postes sans livreur sont présentés en
              premier.
            </p>
            {/* `items-start` : sans lui, la carte d'un poste déserté s'étirerait à
              la hauteur de la file la plus longue de sa rangée — un grand vide
              blanc là où il faut au contraire un signal court et net. */}
          <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {postesFiltres.map((poste) => (
                <PosteFileCard key={poste.restaurantId} poste={poste} maintenant={maintenant} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
