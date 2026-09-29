'use client';

import React from 'react';

import { parseAsString, useQueryState } from 'nuqs';

import { Checkbox } from '@heroui-v3/react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { FicheClientPanneau } from '@/components/bdd-clients/fiche/fiche-client-panneau';
import {
  useBddClientsFilters,
  useExporterMutation,
  useMesDroitsQuery,
} from '@/features/bdd-clients';

import { ClientsFiltres } from './clients-filtres';
import { ClientsKpiCards } from './clients-kpi-cards';
import { ClientsTable } from './clients-table';

/**
 * La base de données clients.
 *
 * <h3>Ce que regarde l'opérateur</h3>
 * <p>Il vient chercher des gens : « qui revient chez nous », « qui a consenti », « qui
 * n'a pas encore été appelé ». La liste est donc l'objet de l'écran et prend tout le pli ;
 * les quatre cartes et les filtres tiennent au-dessus, sur deux bandes, parce que chaque
 * rangée qu'ils prennent est une ligne de clients qu'il ne voit plus.</p>
 *
 * <h3>Ce qui appelle une action, ici, c'est presque rien</h3>
 * <p>Cet écran informe. Aucune couleur d'alerte, aucun accent sur un statut : un client
 * « à qualifier » attend un appel, il n'est pas en faute. Le seul repère coloré est le
 * badge des fidèles, qui est l'information commerciale que la base existe pour produire.</p>
 */
export function ClientsView() {
  const { filtres } = useBddClientsFilters();
  const exporterMutation = useExporterMutation();
  const { data: droits } = useMesDroitsQuery();

  /*
   * ⚠ Deux dévoilements SÉPARÉS, et c'est voulu.
   *
   * Afficher les numéros à l'écran est un geste de travail : on enchaîne des appels.
   * Les mettre dans un fichier est un geste de diffusion : le fichier sort, circule, et
   * ne revient pas. Les coupler ferait exporter en clair par accident, parce qu'on
   * avait dévoilé l'écran une heure plus tôt pour une autre raison.
   */
  const [numerosVisibles, setNumerosVisibles] = React.useState(false);
  const [exportOuvert, setExportOuvert] = React.useState(false);
  const [exportEnClair, setExportEnClair] = React.useState(false);

  const lancerExport = () => {
    exporterMutation.mutate(
      { enClair: exportEnClair && Boolean(droits?.peutVoirEnClair), filtres },
      {
        onSettled: () => {
          setExportOuvert(false);
          // ⚠ La case se REDÉCOCHE. Laissée cochée, le prochain export partirait en
          // clair sans que personne ne l'ait redemandé.
          setExportEnClair(false);
        },
      },
    );
  };

  /*
   * La fiche ouverte vit dans l'URL, mais HORS de l'objet de filtres.
   *
   * Dans l'URL parce qu'un lien vers une fiche doit se partager et survivre a un
   * rechargement. Hors des filtres parce que la cle de cache de la liste EST l'objet de
   * filtres : y ajouter la fiche ouverte rechargerait toute la liste a chaque ouverture
   * de panneau.
   */
  const [ficheOuverte, setFicheOuverte] = useQueryState(
    'bcFiche',
    parseAsString.withDefault('').withOptions({ clearOnDefault: true }),
  );

  /*
   * ⚠ La selection N'EST PAS remontee ici.
   *
   * Premiere version : deux `useEffect` la faisaient monter du tableau vers cette vue,
   * qui portait la barre d'actions. Le tableau des identifiants et la fonction de
   * vidage etaient recrees a chaque rendu, donc chaque effet en declenchait un autre —
   * React error #185, page entiere en 500, build vert et tsc muet. La barre se rend
   * desormais la ou la selection vit.
   */
  return (
    <section className="flex flex-col gap-3">
      <ClientsKpiCards />
      <ClientsFiltres
        enClair={numerosVisibles}
        onBasculerNumeros={() => setNumerosVisibles((p) => !p)}
        onExporter={() => setExportOuvert(true)}
        peutVoirEnClair={Boolean(droits?.peutVoirEnClair)}
      />
      <ClientsTable
        enClair={numerosVisibles}
        onOuvrir={(id) => void setFicheOuverte(id)}
      />
      <FicheClientPanneau
        clientId={ficheOuverte || null}
        onFermer={() => void setFicheOuverte('')}
      />

      <FenetreAction
        enAttente={exporterMutation.isPending}
        libelleAction="Exporter"
        onAction={lancerExport}
        onFermer={() => setExportOuvert(false)}
        ouvert={exportOuvert}
        titre="Exporter la base clients"
      >
        <p className="text-sm text-foreground">
          Le fichier porte tout le résultat du filtre, pas seulement la page affichée.
        </p>
        {droits?.peutVoirEnClair ? (
          <div className="flex flex-col gap-1 rounded-medium border border-separator bg-surface-secondary p-3">
            <Checkbox isSelected={exportEnClair} onChange={setExportEnClair}>
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <span className="text-sm">Numéros de téléphone complets</span>
              </Checkbox.Content>
            </Checkbox>
            <p className="text-xs text-muted">
              Sans cette case, les numéros sortent masqués et le fichier ne sert pas à
              appeler. Avec, il porte les numéros de tous les clients du filtre : il sort
              de l&apos;entreprise et ne revient pas. L&apos;export est inscrit au journal
              à votre nom, et le nom du fichier dit ce qu&apos;il contient.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted">
            Les numéros sortiront masqués : votre profil n&apos;est pas habilité à les
            voir en clair.
          </p>
        )}
      </FenetreAction>
    </section>
  );
}
