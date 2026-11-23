'use client';

import { Button, Card, Checkbox, Tooltip } from '@heroui-v3/react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, GitMerge, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { ColonneResponsive, TableauResponsive } from '@/components/commons/TableauResponsive';
import { FusionCategoriesDialog } from '@/components/finance/configuration/fusion-categories-dialog';
import { HistoriqueFusions } from '@/components/finance/configuration/historique-fusions';
import { ChampTexte } from '@/components/commons/champs-formulaire';
import {
  donneesRattacheesCategoriesRequest,
  historiqueCategorieRequest,
  historiqueFusionsRequest,
  type IFusionCategorie,
} from '@/features/depenses/apis/fusion-categorie.api';
import { normaliserTexte } from '@/features/finances-hub';
import { CategorieDetailModal } from '@/features/depenses/components/depense-list/detail/categorie-detail';
import { ModifierCategorieModal } from '@/features/depenses/components/modifier/modifier-categorie-modal';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';
import { useSupprimerCategorieDepenseMutation } from '@/features/depenses/queries/category/categorie-depense-mutation.query';
import { ICategorieDepense } from '@/features/depenses/types/categorie-depense.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

import { CreerCategorieModal } from './creer-categorie';

const formatDate = (dateString: string) => {
  if (!dateString) return '-';

  try {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return dateString;
  }
};

/**
 * La suppression d'une categorie, declenchee depuis sa ligne.
 *
 * <p>Le declencheur venait de `supprimer-categorie-modal.tsx`, qui le peint en pastille
 * `danger-soft`. Sur une liste, cette pastille se repete a chaque ligne : douze pastilles
 * rouges alignees verticalement, et le rouge cesse d'avertir de quoi que ce soit. Le
 * geste reste au meme endroit, atteignable du meme clic, et il ouvre exactement la meme
 * confirmation : c'est LA que le rouge porte, une fois, sur ce qui va reellement
 * disparaitre.</p>
 */
function SupprimerCategorie({ categorie }: { categorie: ICategorieDepense }) {
  const [ouvert, setOuvert] = useState(false);
  const { isPending, mutate } = useSupprimerCategorieDepenseMutation();

  return (
    <>
      <Tooltip>
        {/* Ni le mur ni le gris. En `danger-soft` au repos, cette corbeille se repetait sur
            chaque ligne du referentiel : dix pastilles rouges alignees, et le rouge ne
            previent plus de rien. Passee en neutre, elle devenait l'exacte jumelle des
            boutons qui CONSULTENT et MODIFIENT la ligne. Elle est donc neutre au repos et
            prend la teinte du danger des qu'on la vise, au pointeur comme au clavier :
            l'avertissement arrive au moment ou il sert, pas dix fois d'avance. */}
        <Button
          aria-label={`Supprimer la catégorie ${categorie.nomCategorie}`}
          className="hover:bg-danger-soft hover:text-danger-soft-foreground focus-visible:bg-danger-soft focus-visible:text-danger-soft-foreground"
          isIconOnly
          onPress={() => setOuvert(true)}
          size="sm"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
        <Tooltip.Content>Supprimer</Tooltip.Content>
      </Tooltip>

      <FenetreAction
        destructif
        enAttente={isPending}
        libelleAction={isPending ? 'Suppression…' : 'Supprimer'}
        onAction={() => mutate(categorie.id, { onSuccess: () => setOuvert(false) })}
        onFermer={() => setOuvert(false)}
        ouvert={ouvert}
        titre={`Supprimer ${categorie.nomCategorie} ?`}
      >
        <p className="text-sm text-muted">Cette action est irréversible.</p>

        <div className="rounded-lg border border-danger/25 bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          Toutes les dépenses rattachées à cette catégorie seront supprimées en même temps.
          {typeof categorie.totalDepense === 'number' && (
            <>
              {' '}
              Elles totalisent{' '}
              <span className="font-semibold tabular-nums">{formatCFA(categorie.totalDepense)}</span>
              .
            </>
          )}
        </div>
      </FenetreAction>
    </>
  );
}

/**
 * Le cumul des depenses d'une categorie.
 *
 * <p>⚠ Ce montant etait, jusqu'au 22/11/2026, un COMPTEUR entretenu coup par coup cote
 * serveur : ajoute a la creation d'une depense, retranche a la modification, au marquage
 * paye et a la suppression, chaque soustraction bornee par `Math.max(0, ...)`. Il ne
 * pouvait que deriver, et il derivait : le decaissement, devenu le seul chemin de creation
 * d'une depense, ne le touchait pas du tout. Un total negatif ne disait donc rien du
 * metier, et la liste le rendait en noir comme un total sain.</p>
 *
 * <p>Le serveur le CALCULE desormais a la lecture, depuis les lignes de `depenses` : somme
 * des montants rattaches a la categorie, tout l'historique, tous les statuts. L'avertissement
 * reste en place parce qu'il ne coute rien et qu'il reste vrai dans un cas : un montant
 * negatif saisi sur une ligne. Mais il ne doit plus se declencher par derive.</p>
 */
function MontantCumule({ valeur }: { valeur: number }) {
  if (!(typeof valeur === 'number' && valeur < 0)) return <>{formatCFA(valeur)}</>;

  return (
    <span
      className="inline-flex items-center justify-end gap-1.5 text-warning-soft-foreground"
      title="Total négatif : le cumul de cette catégorie est la somme de ses lignes, l'une au moins porte un montant négatif."
    >
      <AlertTriangle aria-hidden="true" className="size-3.5 shrink-0" />
      {formatCFA(valeur)}
    </span>
  );
}

/**
 * Le referentiel des categories de depense.
 *
 * <h3>Ce que l'operateur regarde en premier</h3>
 * <p>Le nom. C'est par lui qu'il reconnait un doublon, et c'est le doublon qui l'amene
 * ici. Il etait enferme dans une pastille grise, qui le donne a lire comme un jeton
 * technique et non comme un libelle saisi par quelqu'un : c'est du texte, il est ecrit
 * comme du texte, et la description qui le distingue d'un homonyme est dessous, au lieu
 * de n'exister que dans la fiche de detail.</p>
 *
 * <h3>Ce qui appelle un geste</h3>
 * <p>Ajouter une categorie, et fusionner des doublons. Les cases a cocher alimentent la
 * fusion, mais la barre qui porte ce geste etait rangee dans l'en-tete de la carte, loin
 * des cases, et ne disait pas qu'il en fallait DEUX : cocher une ligne donnait un bouton
 * inerte sans explication. La barre est contre le tableau, elle dit ce qui manque, et
 * l'accent n'arrive dessus qu'au moment ou le geste devient possible.</p>
 *
 * <h3>La forme naturelle</h3>
 * <p>Un tableau : les montants d'une categorie a l'autre se comparent en colonne, chasse
 * tabulaire, alignes a droite. Le composant de la maison rend des cartes sur telephone et
 * sait dire un echec de lecture autrement que par une liste vide.</p>
 */
/**
 * L'historique d'une catégorie : sa création, ses renommages, ce qu'elle a absorbé.
 *
 * <p>Deux sources fondues en une suite datée : l'audit central (création, renommages,
 * description), qui retenait déjà chaque modification avec ses valeurs avant et après, et
 * le journal des fusions (ce qu'elle a absorbé). Si l'audit ne répond pas, l'écran le DIT :
 * une liste sans renommage se lirait « jamais renommée ».</p>
 */
function HistoriqueCategorie({ categorie, fusions }: { categorie: ICategorieDepense; fusions: IFusionCategorie[] }) {
  const { data, isError, isLoading } = useQuery({
    queryFn: () => historiqueCategorieRequest(categorie.id),
    queryKey: ['depenses', 'categories', 'historique', categorie.id],
    staleTime: 30 * 1000,
  });

  const texte = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : '—');
  const lignes: { cle: string; quand: string; quoi: string }[] = [];
  for (const e of data ?? []) {
    const avant = e.valeursAvant ?? {};
    const apres = e.valeursApres ?? {};
    const par = e.utilisateur?.trim() ? ` par ${e.utilisateur.trim()}` : '';
    if (e.typeAction === 'CREATION') {
      lignes.push({ cle: 'Créée', quand: e.occurredAt, quoi: par.trim() });
    } else if ('nomCategorie' in apres && texte(avant.nomCategorie) !== texte(apres.nomCategorie)) {
      lignes.push({
        cle: 'Renommée',
        quand: e.occurredAt,
        quoi: `${texte(avant.nomCategorie)} → ${texte(apres.nomCategorie)}${par}`,
      });
    } else if ('description' in apres) {
      lignes.push({ cle: 'Description modifiée', quand: e.occurredAt, quoi: par.trim() });
    }
  }
  for (const f of fusions.filter((x) => x.categorieCibleId === categorie.id)) {
    lignes.push({
      cle: 'A absorbé',
      quand: f.createdAt,
      quoi: `« ${f.categorieSourceNom} »${f.annuleeAt ? ` (fusion annulée le ${formatDate(f.annuleeAt)})` : ''}`,
    });
  }
  // L'audit ne connaît pas les catégories créées avant lui : la date du référentiel reste
  // alors la seule trace de la création, et on la donne.
  if (!lignes.some((l) => l.cle === 'Créée')) {
    lignes.push({ cle: 'Créée', quand: categorie.createdAt, quoi: '' });
  }
  lignes.sort((a, b) => (a.quand < b.quand ? 1 : -1));

  return (
    <div className="flex flex-col gap-2 text-sm">
      {isLoading && <p className="text-muted">Lecture de l&apos;historique…</p>}
      {isError && (
        <p className="text-danger-soft-foreground">
          L&apos;historique des renommages n&apos;a pas pu être lu. Ce qui suit vient du référentiel seul.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {lignes.map((l, i) => (
          <li className="flex flex-wrap gap-x-2" key={`${l.quand}-${i}`}>
            <span className="tabular-nums text-muted">{formatDate(l.quand)}</span>
            <span>
              <b>{l.cle}</b>
              {l.quoi ? ` ${l.cle === 'Renommée' ? ': ' : ''}${l.quoi}` : ''}
            </span>
          </li>
        ))}
      </ul>
      {!isLoading && !isError && !lignes.some((l) => l.cle === 'Renommée') && (
        <p className="text-xs text-muted">Aucun renommage enregistré.</p>
      )}
    </div>
  );
}

export function CategorieDepenseList() {
  const { categories, isError, isFetching, isLoading, refetch } = useCategorieDepense();

  const [sel, setSel] = useState<Set<string>>(new Set());
  const [fusionOpen, setFusionOpen] = useState(false);
  /** Actives ou Fusionnées (maquette) : deux populations, deux onglets, chacune avec son compte. */
  const [onglet, setOnglet] = useState<'actives' | 'fusionnees'>('actives');
  const [recherche, setRecherche] = useState('');
  const [historiqueDe, setHistoriqueDe] = useState<ICategorieDepense | null>(null);

  // Même clé que <HistoriqueFusions /> : une seule lecture, partagée par le cache.
  const fusionsQ = useQuery({
    queryFn: historiqueFusionsRequest,
    queryKey: ['depenses', 'fusions', 'historique'],
    staleTime: 60 * 1000,
  });
  const fusions = fusionsQ.data ?? [];
  const nbFusionnees = fusions.filter((f) => !f.annuleeAt).length;

  /*
   * LE NOMBRE DE DÉPENSES PAR CATÉGORIE (colonne « Dépenses » de la maquette). Le serveur
   * le sait déjà : c'est le point d'accès que la fusion interroge pour comparer deux
   * doublons. Une seule requête pour tout le référentiel.
   */
  const idsCategories = useMemo(() => categories.map((c) => c.id).sort(), [categories]);
  const comptesQ = useQuery({
    enabled: idsCategories.length > 0,
    queryFn: () => donneesRattacheesCategoriesRequest(idsCategories),
    queryKey: ['depenses', 'categories', 'donnees-rattachees', idsCategories.join(',')],
    staleTime: 60 * 1000,
  });
  const nbDepenses = useMemo(
    () => new Map((comptesQ.data ?? []).map((d) => [d.id, d.chargesFixes + d.chargesVariables])),
    [comptesQ.data],
  );
  const nomsCategories = useMemo(() => new Map(categories.map((c) => [c.id, c.nomCategorie])), [categories]);

  /** La recherche porte sur le nom ET la description, sans accents ni casse (maquette). */
  const visibles = useMemo(() => {
    const q = normaliserTexte(recherche.trim());
    return q ? categories.filter((c) => normaliserTexte(`${c.nomCategorie} ${c.description ?? ''}`).includes(q)) : categories;
  }, [categories, recherche]);
  const basculer = (id: string, coche: boolean) =>
    setSel((precedent) => {
      const suivant = new Set(precedent);
      if (coche) suivant.add(id);
      else suivant.delete(id);
      return suivant;
    });

  // Une categorie supprimee ou fusionnee laissait son identifiant dans la selection : la
  // fusion suivante serait partie avec un identifiant qui n'existe plus.
  useEffect(() => {
    setSel((precedent) => {
      if (precedent.size === 0) return precedent;
      const vivants = new Set(categories.map((c) => c.id));
      const suivant = new Set(Array.from(precedent).filter((id) => vivants.has(id)));
      return suivant.size === precedent.size ? precedent : suivant;
    });
  }, [categories]);

  const colonnes: readonly ColonneResponsive<ICategorieDepense>[] = [
    {
      cle: 'nom',
      identite: true,
      libelle: 'Catégorie',
      rendu: (c) => (
        <div className="flex min-w-0 items-start gap-2">
          {/*
           * `slot={null}` : dans un `Table` v3, toute case est branchee d'office sur le
           * contexte de selection de la table, qui exige `slot="selection"` et fait
           * tomber la page en 500 sans lui. Ici la selection est celle de l'ecran, lue
           * par la fusion de doublons : on sort donc du contexte.
           */}
          <Checkbox
            aria-label={`Sélectionner ${c.nomCategorie} pour une fusion`}
            isSelected={sel.has(c.id)}
            onChange={(coche) => basculer(c.id, coche)}
            slot={null}
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
            </Checkbox.Content>
          </Checkbox>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{c.nomCategorie}</span>
            {c.description && <span className="truncate text-xs text-muted">{c.description}</span>}
          </span>
        </div>
      ),
    },
    {
      cle: 'date',
      libelle: 'Créée le',
      // Le JOUR seul (maquette) : l'heure de création d'une catégorie n'apprend rien, et elle
      // cassait la cellule sur deux lignes.
      rendu: (c) => <span className="whitespace-nowrap tabular-nums">{formatDate(c.createdAt).slice(0, 10)}</span>,
    },
    {
      cle: 'nombre',
      libelle: 'Dépenses',
      nombre: true,
      rendu: (c) => <span className="tabular-nums">{nbDepenses.has(c.id) ? nbDepenses.get(c.id) : '—'}</span>,
    },
    {
      cle: 'total',
      libelle: 'Total des dépenses',
      nombre: true,
      rendu: (c) => <MontantCumule valeur={c.totalDepense} />,
    },
    {
      actions: true,
      cle: 'actions',
      libelle: 'Actions',
      rendu: (c) => (
        // `flex-nowrap` : empilées, les actions triplaient la hauteur de CHAQUE ligne. Sur un
        // écran étroit c'est le tableau qui défile, pas la ligne qui s'étire.
        <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
          <CategorieDetailModal categorie={c} />
          <ModifierCategorieModal categorieDepense={c} />
          <Button onPress={() => setHistoriqueDe(c)} size="sm" variant="ghost">
            Historique
          </Button>
          <SupprimerCategorie categorie={c} />
        </div>
      ),
    },
  ];

  const assezPourFusionner = sel.size >= 2;

  return (
    <div className="w-full">
      <Card>
        <Card.Header className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <Card.Title>Catégories de dépenses</Card.Title>
            <div className="flex gap-1.5" role="tablist">
              {(
                [
                  ['actives', 'Actives', isLoading || isError ? null : categories.length],
                  ['fusionnees', 'Fusionnées', fusionsQ.isLoading || fusionsQ.isError ? null : nbFusionnees],
                ] as const
              ).map(([cle, libelle, n]) => (
                <button
                  aria-selected={onglet === cle}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${onglet === cle ? 'bg-surface text-foreground shadow-xs ring-1 ring-separator' : 'text-muted hover:text-foreground'}`}
                  key={cle}
                  onClick={() => setOnglet(cle)}
                  role="tab"
                  type="button"
                >
                  {libelle}
                  {n != null && (
                    <span className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${onglet === cle ? 'bg-accent-soft text-accent-soft-foreground' : 'bg-surface-secondary text-muted'}`}>
                      {n}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
            {onglet === 'actives' && (
              <div className="w-full sm:w-64">
                <ChampTexte
                  label="Rechercher une catégorie"
                  onChange={setRecherche}
                  placeholder="Rechercher une catégorie, ex. moto"
                  valeur={recherche}
                />
              </div>
            )}
            <CreerCategorieModal />
          </div>
        </Card.Header>

        {onglet === 'actives' && sel.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-separator pt-2">
            <span className="text-sm text-foreground">
              <span className="font-semibold tabular-nums">{sel.size}</span> catégorie{sel.size > 1 ? 's' : ''}{' '}
              sélectionnée{sel.size > 1 ? 's' : ''}
              <span className="text-muted">
                {' · '}
                {assezPourFusionner
                  ? 'Choisissez ensuite la catégorie à conserver'
                  : 'Cochez au moins 2 catégories pour fusionner'}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <Button
                isDisabled={!assezPourFusionner}
                onPress={() => setFusionOpen(true)}
                size="sm"
                variant={assezPourFusionner ? 'primary' : 'secondary'}
              >
                <GitMerge aria-hidden="true" className="size-4" />
                Fusionner
              </Button>
              <Button onPress={() => setSel(new Set())} size="sm" variant="ghost">
                Annuler la sélection
              </Button>
            </div>
          </div>
        )}

        <Card.Content>
          {onglet === 'actives' ? (
            <TableauResponsive
              cleLigne={(c) => c.id}
              colonnes={colonnes}
              enChargement={isLoading}
              enCoursDeRelance={isFetching}
              erreur={isError}
              libelle="Catégories de dépenses"
              lignes={visibles}
              onReessayer={() => refetch()}
              quoi="les catégories de dépenses"
              vide={recherche.trim() ? `Aucune catégorie ne correspond à « ${recherche.trim()} »` : 'Aucune catégorie'}
            />
          ) : (
            /* L'onglet FUSIONNÉES (maquette) : en lecture seule, avec ce dans quoi chacune a
               été fusionnée, et l'annulation. C'était une carte posée sous la liste, qu'on
               ne trouvait qu'en faisant défiler. */
            <HistoriqueFusions nomsCategories={nomsCategories} />
          )}
        </Card.Content>
      </Card>

      {/*
        * L'HISTORIQUE D'UNE CATÉGORIE (maquette). Il dit ce que les données savent : sa
        * création, et ce qu'elle a absorbé par fusion.
        *
        * ⚠ Les RENOMMAGES n'y figurent pas : le serveur ne les enregistre pas encore, et
        * l'écran le dit au lieu de laisser croire qu'il n'y en a jamais eu.
        */}
      <FenetreAction
        libelleFermer="Fermer"
        onFermer={() => setHistoriqueDe(null)}
        ouvert={historiqueDe !== null}
        titre={`Historique de ${historiqueDe?.nomCategorie ?? ''}`}
      >
        {historiqueDe && <HistoriqueCategorie categorie={historiqueDe} fusions={fusions} />}
      </FenetreAction>


      <FusionCategoriesDialog
        ids={Array.from(sel)}
        isOpen={fusionOpen}
        onDone={() => setSel(new Set())}
        onOpenChange={setFusionOpen}
      />
    </div>
  );
}
