'use client';

import { Button, Input, Label, SearchField, Separator, TextField } from '@heroui-v3/react';
import { ChevronRight, Plus, Trash2, X } from 'lucide-react';
import React from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import {
  useEnregistrerGroupeMutation,
  useGroupesSitesQuery,
  useSupprimerGroupeMutation,
  type GenreGroupe,
} from '@/features/turboys/queries/groupes-sites.query';
import type { IGroupeSites } from '@/features/turboys/types/programme.types';
import { cn } from '@/lib/utils';

/**
 * CONFIGURER LES SECTEURS ET LES COUVERTURES (SPEC §8.5, §8.6).
 *
 * <h3>Une seule fenêtre pour les deux</h3>
 *
 * <p>Un secteur et une couverture se configurent exactement pareil : on nomme, on
 * affecte des sites. Deux fenêtres auraient divergé — l'une aurait reçu la recherche de
 * sites et pas l'autre. Le mot change dans les libellés, c'est tout.</p>
 *
 * <h3>Les deux décisions d'interface</h3>
 *
 * <p><b>Le choix d'un site se fait par RECHERCHE</b> (RG-K08). Avec plus de cent
 * partenaires, une liste à cocher demande de faire défiler et de reconnaître un nom au
 * passage ; on tape trois lettres.</p>
 *
 * <p><b>Un site déjà placé ailleurs le DIT</b>, avec le nom de son groupe actuel :
 * « déplacer depuis Abidjan Sud ». Le serveur déplace sans se plaindre, et sans cette
 * mention l'opérateur viderait un autre secteur sans s'en apercevoir.</p>
 */

export interface ConfigurationGroupesDialogProps {
  genre: GenreGroupe;
  /** Tous les partenaires, pour la recherche. */
  sites: { id: string; nom: string }[];
  /** RG-K07. Faux : la fenêtre se lit, elle ne se modifie pas. */
  peutModifier: boolean;
  ouvert: boolean;
  onFermer: () => void;
}

export function ConfigurationGroupesDialog({
  genre,
  sites,
  peutModifier,
  ouvert,
  onFermer,
}: ConfigurationGroupesDialogProps) {
  const groupesQuery = useGroupesSitesQuery(genre);
  const enregistrer = useEnregistrerGroupeMutation(genre);
  const supprimer = useSupprimerGroupeMutation(genre);

  const mot = genre === 'secteurs' ? 'secteur' : 'couverture';
  const groupes = React.useMemo(() => groupesQuery.data ?? [], [groupesQuery.data]);

  /** Le groupe en cours d'édition, ou `'NOUVEAU'` pour une création. */
  const [edite, setEdite] = React.useState<string | null>(null);
  const [nom, setNom] = React.useState('');
  const [siteIds, setSiteIds] = React.useState<string[]>([]);
  const [recherche, setRecherche] = React.useState('');

  const nomSite = React.useMemo(() => new Map(sites.map((s) => [s.id, s.nom])), [sites]);

  /** Le groupe actuel de chaque site : c'est ce qui permet de dire « déplacer depuis ». */
  const groupeDuSite = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const g of groupes) {
      for (const id of g.siteIds) m.set(id, g.nom);
    }
    return m;
  }, [groupes]);

  React.useEffect(() => {
    if (!ouvert) {
      setEdite(null);
      setRecherche('');
    }
  }, [ouvert]);

  const ouvrirEdition = (g: IGroupeSites | null) => {
    setEdite(g?.id ?? 'NOUVEAU');
    setNom(g?.nom ?? '');
    setSiteIds(g?.siteIds ?? []);
    setRecherche('');
  };

  const resultats = React.useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return sites
      .filter((s) => !siteIds.includes(s.id))
      .filter((s) => (q ? s.nom.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }, [recherche, siteIds, sites]);

  const enregistrerGroupe = () => {
    if (!nom.trim()) return;
    enregistrer.mutate(
      {
        id: edite === 'NOUVEAU' ? undefined : (edite ?? undefined),
        payload: { nom: nom.trim(), siteIds },
      },
      { onSuccess: () => setEdite(null) },
    );
  };

  const demanderSuppression = (g: IGroupeSites) => {
    const ok = window.confirm(
      `Supprimer le ${mot} « ${g.nom} » ?\n\n`
        + `Ses ${g.siteIds.length} site(s) ne seront pas supprimés : ils passeront « Sans ${mot} ».`,
    );
    if (ok) supprimer.mutate(g.id);
  };

  // ── La fenêtre d'édition d'un groupe ────────────────────────────────────────
  if (edite) {
    return (
      <FenetreAction
        actionInactive={!nom.trim() || !peutModifier}
        enAttente={enregistrer.isPending}
        libelleAction="Enregistrer"
        libelleFermer="Retour"
        onAction={enregistrerGroupe}
        onFermer={() => setEdite(null)}
        ouvert={ouvert}
        titre={edite === 'NOUVEAU' ? `Nouveau ${mot}` : `Modifier le ${mot}`}
      >
        <div className="flex flex-col gap-4">
          <TextField isDisabled={!peutModifier} onChange={setNom} value={nom}>
            <Label>Nom</Label>
            <Input placeholder={genre === 'secteurs' ? 'Abidjan Nord' : 'Zone 4'} />
          </TextField>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              Sites du {mot} ({siteIds.length})
            </span>
            {siteIds.length === 0 ? (
              <p className="text-sm text-muted">Aucun site pour l’instant.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {siteIds.map((id) => (
                  <li
                    className="inline-flex items-center gap-1 rounded-full border border-default-200 bg-content1 py-0.5 pe-1 ps-2.5 text-sm"
                    key={id}
                  >
                    {nomSite.get(id) ?? id}
                    {peutModifier ? (
                      <button
                        aria-label={`Retirer ${nomSite.get(id) ?? id}`}
                        className="rounded-full p-0.5 text-muted hover:text-foreground"
                        onClick={() => setSiteIds((avant) => avant.filter((x) => x !== id))}
                        type="button"
                      >
                        <X aria-hidden="true" className="size-3.5" />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {peutModifier && (
            <>
              <Separator />
              {/* RG-K08 — on tape, la liste se filtre. Avec plus de cent partenaires,
                  une liste à cocher demande de faire défiler et de reconnaître un nom
                  au passage. */}
              <SearchField onChange={setRecherche} value={recherche}>
                <Label>Ajouter un site</Label>
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Taper quelques lettres du site…" />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>

              <ul className="flex flex-col divide-y divide-separator">
                {resultats.length === 0 ? (
                  <li className="py-2 text-sm text-muted">
                    {recherche.trim() ? 'Aucun site ne correspond.' : 'Tous les sites sont déjà placés ici.'}
                  </li>
                ) : (
                  resultats.map((s) => {
                    const actuel = groupeDuSite.get(s.id);
                    return (
                      <li key={s.id}>
                        <button
                          className="flex w-full items-center gap-2 py-2 text-left text-sm hover:bg-default-100"
                          onClick={() => {
                            setSiteIds((avant) => [...avant, s.id]);
                            setRecherche('');
                          }}
                          type="button"
                        >
                          <Plus aria-hidden="true" className="size-4 shrink-0 text-muted" />
                          <span className="flex-1 truncate text-foreground">{s.nom}</span>
                          {/* ⚠ Dire d'où il vient. Le serveur déplace sans se plaindre,
                              et sans cette mention on viderait un autre groupe sans le
                              savoir. */}
                          {actuel && actuel !== nom ? (
                            <span className="shrink-0 text-xs text-warning-soft-foreground">
                              déplacer depuis {actuel}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </>
          )}
        </div>
      </FenetreAction>
    );
  }

  // ── La liste des groupes ────────────────────────────────────────────────────
  return (
    <FenetreAction
      libelleFermer="Fermer"
      onFermer={onFermer}
      ouvert={ouvert}
      titre={genre === 'secteurs' ? 'Secteurs' : 'Couvertures'}
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          {genre === 'secteurs'
            ? 'Les secteurs alimentent les onglets, les groupes de la liste et ceux de l’export.'
            : 'Les couvertures regroupent les sites dans la grille site × jour.'}{' '}
          Un site appartient à un seul {mot} : l’ajouter ailleurs l’y déplace.
        </p>

        {!peutModifier && (
          <p className="text-xs text-muted">
            Votre profil consulte cette configuration. Sa modification revient à la direction et au chef aux
            opérations.
          </p>
        )}

        <Separator />

        {groupesQuery.isLoading ? (
          <p className="text-sm text-muted">Lecture…</p>
        ) : groupes.length === 0 ? (
          <p className="text-sm text-muted">
            Aucun {mot} pour l’instant. Tous les sites sont « Sans {mot} ».
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-separator">
            {groupes.map((g) => (
              <li className="flex items-center gap-2 py-2" key={g.id}>
                <button
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 text-left',
                    !peutModifier && 'cursor-default',
                  )}
                  onClick={() => ouvrirEdition(g)}
                  type="button"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{g.nom}</span>
                    <span className="block text-xs text-muted">
                      {g.siteIds.length} site{g.siteIds.length > 1 ? 's' : ''}
                      {g.siteIds.length > 0
                        ? ` · ${g.siteIds.map((id) => nomSite.get(id) ?? id).slice(0, 3).join(', ')}${g.siteIds.length > 3 ? '…' : ''}`
                        : ''}
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
                </button>
                {peutModifier ? (
                  <Button
                    aria-label={`Supprimer ${g.nom}`}
                    isIconOnly
                    onPress={() => demanderSuppression(g)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {peutModifier && (
          <Button onPress={() => ouvrirEdition(null)} variant="outline">
            <Plus aria-hidden="true" className="size-4" />
            Nouveau {mot}
          </Button>
        )}
      </div>
    </FenetreAction>
  );
}
