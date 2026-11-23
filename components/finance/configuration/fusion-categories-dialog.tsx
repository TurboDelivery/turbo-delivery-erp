'use client';

import { Button, Chip, Modal, Radio, RadioGroup, Spinner } from '@heroui-v3/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { GitMerge } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  donneesRattacheesCategoriesRequest,
  fusionnerCategoriesRequest,
  type ICategorieDonneesRattachees,
} from '@/features/depenses/apis/fusion-categorie.api';
import { ChampTexte } from '@/components/commons/champs-formulaire';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';
import { useInvalidateDepenseQuery } from '@/features/depenses/queries/category/index.query';
import { cn } from '@/lib/utils';

interface Props {
  ids: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}

const METRIQUES: { key: keyof ICategorieDonneesRattachees; label: string }[] = [
  { key: 'chargesFixes', label: 'Charges fixes' },
  { key: 'chargesVariables', label: 'Dépenses variables' },
  { key: 'depenses', label: 'Dépenses (décaissées)' },
];

/**
 * Fusion de categories de depense en doublon.
 *
 * <h3>Ce que l'operateur regarde en premier</h3>
 * <p>Le volume de donnees rattachees a chaque candidate : c'est lui, et rien d'autre, qui
 * decide laquelle on garde. Le choix se lit donc en fiches comparables, chiffres alignes
 * a droite en chasse tabulaire.</p>
 *
 * <h3>Ce qui appelle un geste</h3>
 * <p>Le bouton de fusion, qui SUPPRIME definitivement les categories perdantes : il prend
 * la teinte du danger, comme toute confirmation destructrice de cet ERP, et non l'accent
 * d'une action ordinaire. La marque « le plus de donnees » etait un jeton VERT : elle ne
 * felicite rien, elle informe, donc elle est neutre. La bordure d'accent, elle, dit
 * laquelle est retenue : elle appelle bien quelque chose, elle reste.</p>
 *
 * <p>Ce qui va disparaitre n'etait ecrit nulle part : on lisait « les 3 categories » et il
 * fallait deduire soi-meme lesquelles des trois. Elles sont nommees.</p>
 */
export function FusionCategoriesDialog({ ids, isOpen, onOpenChange, onDone }: Props) {
  const { data: session } = useSession();
  const userId = session?.user?.id as string | undefined;
  const invalider = useInvalidateDepenseQuery();

  const { data, isError, isLoading } = useQuery({
    queryKey: ['categorie-donnees-rattachees', ...[...ids].sort()],
    queryFn: () => donneesRattacheesCategoriesRequest(ids),
    enabled: isOpen && ids.length >= 2,
    staleTime: 30 * 1000,
  });

  const cats = useMemo(() => data ?? [], [data]);
  // Defaut : garder la categorie qui porte le PLUS de donnees (total le plus eleve).
  const suggereId = useMemo(() => {
    if (cats.length === 0) return '';
    return [...cats].sort((a, b) => b.total - a.total)[0].id;
  }, [cats]);

  const [gardeId, setGardeId] = useState('');
  useEffect(() => {
    if (isOpen && suggereId) setGardeId(suggereId);
  }, [isOpen, suggereId]);

  /*
   * TEMPS 2 (maquette) : le libellé et la description FINAUX de la catégorie gardée. Ils
   * partent du nom de celle qu'on garde, et se réinitialisent si l'on change de gardée —
   * sinon on fusionnerait dans B en gardant le nom tapé pour A.
   */
  const [libelle, setLibelle] = useState('');
  const [description, setDescription] = useState('');
  useEffect(() => {
    const gardee = cats.find((c) => c.id === gardeId);
    setLibelle(gardee?.nomCategorie ?? '');
    setDescription(gardee?.description ?? '');
  }, [gardeId, cats]);

  /** Le code secret à 4 chiffres. Vérifié par le SERVEUR ; l'écran ne fait que le transmettre. */
  const [code, setCode] = useState('');
  useEffect(() => {
    if (!isOpen) setCode('');
  }, [isOpen]);

  // Les MONTANTS viennent du référentiel (déjà en cache) : le point d'accès de comparaison
  // ne rend que des nombres de lignes.
  const { categories: referentiel } = useCategorieDepense();
  const montantDe = (id: string) => referentiel.find((c) => c.id === id)?.totalDepense ?? 0;
  const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
  const apresN = cats.reduce((s, c) => s + c.chargesFixes + c.chargesVariables, 0);
  const apresMontant = cats.reduce((s, c) => s + montantDe(c.id), 0);

  const aSupprimer = useMemo(() => cats.filter((c) => c.id !== gardeId), [cats, gardeId]);

  const fusion = useMutation({
    mutationFn: () => {
      const supprimeIds = ids.filter((id) => id !== gardeId);
      return fusionnerCategoriesRequest(gardeId, supprimeIds, userId ?? '', {
        codeSecret: code,
        descriptionFinale: description,
        libelleFinal: libelle,
      });
    },
    onSuccess: async () => {
      // Le message dit ce qui a bougé, chiffré (maquette). L'annulation se trouve dans
      // l'onglet « Fusionnées », juste à côté.
      toast.success(
        `${cats.length} catégories fusionnées dans ${libelle.trim().toUpperCase()} · ${apresN} dépenses réaffectées · ${fcfa(apresMontant)}. Annulation possible dans l'onglet « Fusionnées ».`,
      );
      await invalider();
      onOpenChange(false);
      onDone?.();
    },
    onError: (e: unknown) => {
      toast.error(`Échec de la fusion : ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    },
  });

  const pretALire = !isLoading && !isError && cats.length >= 2;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-3xl">
            <Modal.Header>
              <Modal.Heading className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <GitMerge aria-hidden="true" className="size-5" />
                  Fusionner {cats.length || ids.length} catégories
                </span>
                <span className="text-xs font-normal text-muted">
                  Les dépenses changent de catégorie. Montants, dates, statuts et validations ne
                  bougent pas.
                </span>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10">
                  <Spinner />
                  <p className="text-sm text-muted">Analyse des données rattachées…</p>
                </div>
              ) : isError ? (
                <p className="py-6 text-center text-sm text-danger-soft-foreground">
                  Impossible de charger les données rattachées.
                </p>
              ) : cats.length < 2 ? (
                <p className="py-6 text-center text-sm text-muted">
                  Une fusion demande au moins deux catégories.
                </p>
              ) : (
                <>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">1 · Catégorie à conserver</p>
                <RadioGroup onChange={setGardeId} value={gardeId}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {cats.map((c) => {
                      const estSuggere = c.id === suggereId && c.total > 0;
                      const estGarde = c.id === gardeId;
                      return (
                        /*
                         * ⚠ LA CARTE ENTIERE EST LA CIBLE, et non sa seule bande de titre.
                         *
                         * Le <Radio> n'enveloppait que le nom et la description ; le bloc
                         * de metriques, qui fait les trois quarts de la hauteur et qui est
                         * precisement ce qu'on lit pour arbitrer, etait un frere HORS de
                         * la zone cliquable. Il fallait viser la bande du haut pour
                         * choisir, en croyant cliquer sur une carte qui en a tout l'air.
                         */
                        <Radio
                          className={cn(
                            // ⚠ `flex-wrap` ICI, sur la carte : c'est ELLE le conteneur flex (mesuré), et sans
                            // retour à la ligne le bloc du nom tombait à 0 px de large, écrasé par
                            // les compteurs en pleine largeur qui venaient se superposer à lui.
                            'w-full flex-wrap items-start rounded-xl border p-3 transition-colors',
                            estGarde ? 'border-accent bg-accent-soft/30' : 'border-separator',
                          )}
                          key={c.id}
                          value={c.id}
                        >
                            {/* `flex-wrap` : le bloc des compteurs est en pleine largeur et doit passer SOUS
                                le nom. Sans retour à la ligne il restait sur la même rangée et se
                                superposait à la description — vu à l'écran, sur la carte gardée. */}
                            <Radio.Content className="flex w-full flex-wrap items-start gap-x-3">
                              <Radio.Control className="mt-1">
                                <Radio.Indicator />
                              </Radio.Control>
                              <span className="flex min-w-0 flex-1 flex-col items-start">
                                <span className="flex flex-wrap items-center gap-1.5">
                                  <span className="truncate text-sm font-semibold text-foreground">
                                    {c.nomCategorie}
                                  </span>
                                  {estSuggere && (
                                    <Chip size="sm" variant="soft">
                                      <Chip.Label>Le plus de données</Chip.Label>
                                    </Chip>
                                  )}
                                </span>
                                {c.description && (
                                  <span className="truncate text-xs text-muted">{c.description}</span>
                                )}
                              </span>
                              <span className="mt-3 flex w-full flex-col gap-1 border-t border-separator pt-2">
                                {METRIQUES.map((m) => (
                                  <span className="flex justify-between text-xs" key={m.key}>
                                    <span className="text-muted">{m.label}</span>
                                    <span className="font-medium tabular-nums text-foreground">
                                      {c[m.key] as number}
                                    </span>
                                  </span>
                                ))}
                                <span className="flex justify-between border-t border-separator pt-1 text-xs font-semibold">
                                  <span className="text-muted">Total lignes</span>
                                  <span className="tabular-nums text-foreground">{c.total}</span>
                                </span>
                              </span>
                            </Radio.Content>
                          </Radio>
                      );
                    })}
                  </div>
                </RadioGroup>

                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  2 · Libellé et description finaux
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ChampTexte label="Libellé" onChange={setLibelle} valeur={libelle} />
                  <ChampTexte
                    label="Description"
                    onChange={setDescription}
                    placeholder="Ce qu'on met dans cette catégorie"
                    valeur={description}
                  />
                </div>

                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">3 · Aperçu d&apos;impact</p>
                {/* Un document qui se LIT (lignes fixes, ni tri ni sélection) : un <table>
                    simple, comme l'état financier — l'exception documentée du projet. */}
                {/* ⚠ `shrink-0` : le corps de la fenêtre est une colonne flex à hauteur bornée, et un
                    enfant qui défile (`overflow-x-auto`) y a une hauteur minimale de ZÉRO. Dès que
                    le contenu dépassait l'écran, c'est ce tableau qui était écrasé à 2 px au lieu
                    que le corps défile : l'aperçu d'impact disparaissait sans un mot. */}
                <div className="shrink-0 overflow-x-auto rounded-lg border border-separator">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-secondary text-xs text-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold" scope="col">Catégorie</th>
                        <th className="px-3 py-2 text-left font-semibold" scope="col">Rôle</th>
                        <th className="px-3 py-2 text-right font-semibold" scope="col">Dépenses</th>
                        <th className="px-3 py-2 text-right font-semibold" scope="col">Fixes / variables</th>
                        <th className="px-3 py-2 text-right font-semibold" scope="col">Modèles récurrents</th>
                        <th className="px-3 py-2 text-right font-semibold" scope="col">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cats.map((c) => (
                        <tr className="border-t border-separator" key={c.id}>
                          <th className="px-3 py-2 text-left font-medium" scope="row">{c.nomCategorie}</th>
                          <td className="px-3 py-2">
                            <Chip color={c.id === gardeId ? 'success' : 'default'} size="sm" variant="soft">
                              <Chip.Label>{c.id === gardeId ? 'Conservée' : 'Absorbée'}</Chip.Label>
                            </Chip>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{c.chargesFixes + c.chargesVariables}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-muted">
                            {c.chargesFixes} / {c.chargesVariables}
                          </td>
                          {/* Les charges fixes ACTIVES : elles reviennent à chaque cycle, et
                              leurs prochaines dépenses iront dans la catégorie conservée. */}
                          <td className="px-3 py-2 text-right tabular-nums text-muted">
                            {c.modelesRecurrents ?? '—'}
                          </td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums">{fcfa(montantDe(c.id))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted">
                  Après fusion :{' '}
                  <b className="text-foreground">
                    1 catégorie · {apresN} dépenses · {fcfa(apresMontant)}
                  </b>
                  . Le total des dépenses de chaque mois reste identique : il est contrôlé avant et
                  après, et tout est annulé au moindre écart.
                </p>

                <div className="mt-1 flex flex-col gap-1 sm:max-w-xs">
                  <label className="text-xs font-medium text-muted" htmlFor="code-fusion">
                    Votre code secret de validation
                  </label>
                  <input
                    autoComplete="off"
                    className="rounded-lg border border-separator bg-surface px-3 py-2 text-base tracking-[0.4em] tabular-nums"
                    id="code-fusion"
                    inputMode="numeric"
                    maxLength={4}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    type="password"
                    value={code}
                  />
                  <span className="text-[11px] text-muted">
                    Distinct du mot de passe · même mécanisme que les déductions
                  </span>
                </div>
                </>
              )}

              {/*
               * La confirmation etait un `<input type="checkbox">` BRUT dans un `<label>`
               * peint en `bg-warning-50 text-warning-800` : deux teintes de l'ancienne
               * palette pour un avertissement qui, lui, dit bien quelque chose.
               */}
              {/* Le bouton restait inerte sans un mot quand la session ne portait pas
                  d'identifiant : l'en-tete X-User-Id part vide et le serveur refuse. */}
              {pretALire && !userId && (
                <p className="text-xs text-danger-soft-foreground">
                  Session incomplète : impossible d&apos;identifier l&apos;auteur de la fusion.
                  Reconnectez-vous.
                </p>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button
                isDisabled={fusion.isPending}
                onPress={() => onOpenChange(false)}
                variant="ghost"
              >
                Annuler
              </Button>
              <Button
                isDisabled={!gardeId || code.length !== 4 || libelle.trim() === '' || cats.length < 2 || !userId}
                isPending={fusion.isPending}
                onPress={() => fusion.mutate()}
                variant="danger"
              >
                {fusion.isPending ? (
                  <Spinner size="sm" />
                ) : (
                  <GitMerge aria-hidden="true" className="size-4" />
                )}
                Fusionner dans {libelle.trim().toUpperCase() || 'cette catégorie'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
