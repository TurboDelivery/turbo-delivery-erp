'use client';

import React from 'react';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Select, SelectItem } from '@/components/heroui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { parseAsInteger, useQueryStates } from 'nuqs';
import { IProgramme } from '@/features/turboys/types/programme.types';
import { creerProgrammeAction, listerProgrammesSemaineAction } from '@/features/turboys/actions/programme.actions';
import { useLivreursListQuery } from '@/features/tickets/queries/livreur-list.query';
import { lireFichierProgrammes, telechargerModeleProgrammes } from '@/features/turboys/utils/programmes-import.utils';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
import { joursAvecDates } from './weekly-jours-editor';
import {
  useProgrammesSemaineQuery,
  useProgrammesIndependantsQuery,
  usePlanifierProgrammeMutation,
  usePublierProgrammeMutation,
  useSupprimerProgrammeMutation,
} from '@/features/turboys/queries/programme.query';
import { exporterProgrammesExcel, exporterProgrammesPdf } from '@/features/turboys/utils/programmes-export.utils';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { ErrorBoundary } from '@/components/common/error-boundary';
import EtatErreur from '@/components/commons/EtatErreur';
import { ProgrammesGrid } from './programmes-grid';
import { ProgrammeApercuModal } from './programme-apercu-modal';
import { ProgrammeFormModal } from './programme-form-modal';
import { AutosuffisancePanel } from './autosuffisance-panel';

const TYPE_OPTIONS = [
  { key: 'TOUS', label: 'Tous' },
  { key: 'JOURNALIER', label: getTurboyTypeDisplay('JOURNALIER').labelPlural },
  { key: 'SUPERVISEUR_LIVREUR', label: getTurboyTypeDisplay('SUPERVISEUR_LIVREUR').labelPlural },
  { key: 'INDEPENDANT', label: getTurboyTypeDisplay('INDEPENDANT').labelPlural },
];

/**
 * Numéro de semaine ALIGNÉ sur le backend : `WeekFields.of(Locale.FRANCE).weekOfYear()`
 * (lundi = 1er jour, 4 jours min, ANNÉE CALENDAIRE) — exactement ce que calcule
 * `Utilitaire.recupererSemaineAnneeActuelle()` côté serveur, donc ce que le scheduler
 * et l'app considèrent comme « cette semaine ». Validé contre jshell sur les bornes
 * d'année (ex. 2027-01-01 → (2027, 0), 2025-12-29 → (2025, 53)). En milieu d'année,
 * identique à l'ISO ; ne diffère qu'autour du Nouvel An.
 */
function semaineCouranteBackend(): { annee: number; semaine: number } {
  const now = new Date();
  const annee = now.getFullYear();
  const start = Date.UTC(annee, 0, 1);
  const cur = Date.UTC(annee, now.getMonth(), now.getDate());
  const doy = Math.floor((cur - start) / 86400000) + 1;
  const dow = ((now.getDay() + 6) % 7) + 1; // 1 = lundi … 7 = dimanche
  const weekStart = (((doy - dow) % 7) + 7) % 7;
  const offset = weekStart + 1 > 4 ? 7 - weekStart : -weekStart;
  const semaine = Math.floor((7 + offset + (doy - 1)) / 7);
  return { annee, semaine };
}

const CURRENT_WEEK = semaineCouranteBackend();

export default function ProgrammesSection() {
  const [{ annee, semaine }, setWeek] = useQueryStates({
    annee: parseAsInteger.withDefault(CURRENT_WEEK.annee),
    semaine: parseAsInteger.withDefault(CURRENT_WEEK.semaine),
  });

  const { data, isLoading, isError } = useProgrammesSemaineQuery(annee, semaine);
  const independantsQuery = useProgrammesIndependantsQuery(annee, semaine);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<IProgramme | null>(null);
  const [apercu, setApercu] = React.useState<IProgramme | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const planifier = usePlanifierProgrammeMutation();
  const publier = usePublierProgrammeMutation();
  const supprimer = useSupprimerProgrammeMutation();

  const changeWeek = (delta: number) => {
    let s = semaine + delta;
    let a = annee;
    if (s < 1) {
      a -= 1;
      s = 52;
    } else if (s > 53) {
      a += 1;
      s = 1;
    }
    setWeek({ annee: a, semaine: s });
  };

  const runAction = async (id: string, fn: (id: string) => Promise<unknown>) => {
    setPendingId(id);
    try {
      await fn(id);
    } catch {
      // erreur déjà signalée par le toast de la mutation
    } finally {
      setPendingId(null);
    }
  };

  const demanderSuppression = (p: IProgramme) => {
    const ok = window.confirm(
      `Supprimer le programme de ${p.livreurNom ?? 'ce livreur'} (semaine ${p.semaine}/${p.annee}) ?`,
    );
    if (ok) runAction(p.id, supprimer.mutateAsync);
  };

  const [typeFiltre, setTypeFiltre] = React.useState<string>('TOUS');
  const [partenaireFiltre, setPartenaireFiltre] = React.useState<string>('TOUS');
  const restaurantsQuery = useQuery({
    queryKey: ['restaurants', 'all', 'programmes'],
    queryFn: getAllRestaurants,
    staleTime: 5 * 60 * 1000,
  });
  const restaurants = React.useMemo(
    () => (restaurantsQuery.data ?? []).map((r) => ({ id: r.id, nom: r.nomEtablissement })),
    [restaurantsQuery.data],
  );
  const livreursQuery = useLivreursListQuery();
  const programmesFiltres = React.useMemo(() => {
    // Durcissement : une réponse non-tableau (erreur backend renvoyée en 200,
    // shape inattendue…) ne doit jamais faire planter `.filter` au rendu.
    let liste = Array.isArray(data) ? data : [];
    if (typeFiltre !== 'TOUS') liste = liste.filter((p) => (p.typeLivreur ?? '') === typeFiltre);
    if (partenaireFiltre !== 'TOUS') {
      liste = liste.filter((p) =>
        (p.jours ?? []).some((j) => (j.postes ?? []).some((po) => po.restaurantId === partenaireFiltre)),
      );
    }
    return liste;
  }, [data, typeFiltre, partenaireFiltre]);

  // Importer = copier le planning de la semaine précédente (brouillons), pour
  // les livreurs qui n'ont pas déjà un programme cette semaine. Orchestré côté
  // front via creer + joursAvecDates (recalcule les dates de la semaine cible).
  const qc = useQueryClient();
  const [importing, setImporting] = React.useState(false);
  const copierSemainePrecedente = async () => {
    let srcAnnee = annee;
    let srcSemaine = semaine - 1;
    if (srcSemaine < 1) {
      srcAnnee -= 1;
      srcSemaine = 52;
    }
    setImporting(true);
    try {
      const sources = await listerProgrammesSemaineAction(srcAnnee, srcSemaine);
      const dejaPresent = new Set((data ?? []).map((p) => p.livreurId));
      const aCreer = sources.filter((p) => p.livreurId && !dejaPresent.has(p.livreurId));
      if (aCreer.length === 0) {
        toast.info(`Rien à importer depuis la semaine ${srcSemaine}/${srcAnnee}.`);
        return;
      }
      let ok = 0;
      for (const src of aCreer) {
        const r = await creerProgrammeAction({
          livreurId: src.livreurId!,
          annee,
          semaine,
          jours: joursAvecDates(src.jours, annee, semaine),
        });
        if (r.success) ok += 1;
      }
      await qc.invalidateQueries({ queryKey: ['programme'] });
      toast.success(`${ok} programme(s) importé(s) depuis la semaine ${srcSemaine}/${srcAnnee}.`);
    } catch {
      toast.error("Échec de l'import depuis la semaine précédente.");
    } finally {
      setImporting(false);
    }
  };

  // Import par fichier (.xlsx/.csv) : correspondance livreur par matricule puis
  // téléphone, création de brouillons pour la semaine affichée.
  const fileRef = React.useRef<HTMLInputElement>(null);
  const onFichier = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const lignes = await lireFichierProgrammes(file);
      const normMat = (s?: string | null) => (s ?? '').trim().toUpperCase();
      const normTel = (s?: string | null) => (s ?? '').replace(/\D/g, '').slice(-10);
      const parMat = new Map<string, string>();
      const parTel = new Map<string, string>();
      for (const l of livreursQuery.data ?? []) {
        if (l.matricule) parMat.set(normMat(l.matricule), l.id);
        if (l.telephone) parTel.set(normTel(l.telephone), l.id);
      }
      const dejaPresent = new Set((data ?? []).map((p) => p.livreurId));
      let ok = 0;
      let nonTrouves = 0;
      let ignores = 0;
      for (const lg of lignes) {
        const id =
          (lg.matricule && parMat.get(normMat(lg.matricule))) ||
          (lg.telephone && parTel.get(normTel(lg.telephone))) ||
          null;
        if (!id) {
          nonTrouves += 1;
          continue;
        }
        if (dejaPresent.has(id)) {
          ignores += 1;
          continue;
        }
        const r = await creerProgrammeAction({
          livreurId: id,
          annee,
          semaine,
          jours: joursAvecDates(lg.jours, annee, semaine),
        });
        if (r.success) ok += 1;
        dejaPresent.add(id);
      }
      await qc.invalidateQueries({ queryKey: ['programme'] });
      const details = [nonTrouves ? `${nonTrouves} non trouvé(s)` : '', ignores ? `${ignores} déjà présent(s)` : '']
        .filter(Boolean)
        .join(', ');
      toast.success(`${ok} programme(s) importé(s)${details ? ` (${details})` : ''}.`);
    } catch {
      toast.error('Fichier illisible ou format invalide.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="rounded-xl border border-default-200 bg-white p-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">Programmes hebdomadaires</h2>
          <p className="text-sm text-default-500">
            Planification des journaliers / superviseurs — semaine {semaine} / {annee}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="flat" onPress={() => changeWeek(-1)}>
            ← Sem. préc.
          </Button>
          <Button size="sm" variant="flat" onPress={() => changeWeek(1)}>
            Sem. suiv. →
          </Button>
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" variant="flat" isLoading={importing}>
                Importer
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Options d'import">
              <DropdownItem key="copier" onPress={copierSemainePrecedente}>
                Copier la semaine précédente
              </DropdownItem>
              <DropdownItem key="fichier" onPress={() => fileRef.current?.click()}>
                Importer un fichier (.xlsx, .csv)
              </DropdownItem>
              <DropdownItem
                key="modele"
                onPress={() =>
                  telechargerModeleProgrammes(
                    (livreursQuery.data ?? []).map((l) => ({
                      matricule: l.matricule,
                      telephone: l.telephone,
                      nom: `${l.prenoms ?? ''} ${l.nom ?? ''}`.trim(),
                    })),
                  )
                }
              >
                Télécharger le modèle
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={onFichier} />
          <Button
            size="sm"
            variant="flat"
            onPress={() => exporterProgrammesExcel(programmesFiltres, annee, semaine)}
            isDisabled={programmesFiltres.length === 0}
          >
            Exporter Excel
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() =>
              exporterProgrammesPdf(
                programmesFiltres,
                annee,
                semaine,
                TYPE_OPTIONS.find((o) => o.key === typeFiltre)?.label ?? 'Tous',
              )
            }
            isDisabled={programmesFiltres.length === 0}
          >
            Exporter PDF
          </Button>
          <Button color="primary" onPress={() => setCreateOpen(true)}>
            Nouveau programme
          </Button>
        </div>
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select
          aria-label="Filtrer par type de livreur"
          label="Type"
          size="sm"
          className="w-56"
          selectedKeys={new Set([typeFiltre])}
          onSelectionChange={(keys) => setTypeFiltre((Array.from(keys)[0] as string) ?? 'TOUS')}
        >
          {TYPE_OPTIONS.map((o) => (
            <SelectItem key={o.key}>{o.label}</SelectItem>
          ))}
        </Select>
        <Select
          aria-label="Filtrer par partenaire"
          label="Partenaire"
          size="sm"
          className="w-64"
          isLoading={restaurantsQuery.isLoading}
          selectedKeys={new Set([partenaireFiltre])}
          onSelectionChange={(keys) => setPartenaireFiltre((Array.from(keys)[0] as string) ?? 'TOUS')}
        >
          {[{ id: 'TOUS', nom: 'Tous les partenaires' }, ...restaurants].map((r) => (
            <SelectItem key={r.id}>{r.nom}</SelectItem>
          ))}
        </Select>
      </div>

      {/* Boundary rekeyé par semaine : un rendu qui throw sur les données d'une
          semaine n'emporte plus toute la page — et naviguer réarme l'affichage. */}
      <ErrorBoundary
        resetKey={`${annee}-${semaine}`}
        title="Impossible d'afficher les programmes de cette semaine"
      >
        <ProgrammesGrid
          programmes={programmesFiltres}
          emptyContent={
            isLoading ? 'Chargement…' : isError ? 'Erreur de chargement des programmes' : 'Aucun programme pour cette semaine'
          }
          onApercu={(p) => setApercu(p)}
          onEdit={(p) => setEditing(p)}
          onPlanifier={(p) => runAction(p.id, planifier.mutateAsync)}
          onPublier={(p) => runAction(p.id, publier.mutateAsync)}
          onDelete={demanderSuppression}
          pendingId={pendingId}
        />

        <AutosuffisancePanel annee={annee} semaine={semaine} />

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-default-700">
            Indépendants — créneaux déclarés via l&apos;app (lecture seule)
          </h3>
          {/* listerIndependantsAction relance desormais au lieu de rendre un tableau
              vide : sans cette branche, une lecture en echec affichait « Aucun
              independant declare cette semaine », lu comme une semaine sans creneau. */}
          {independantsQuery.isError ? (
            <EtatErreur
              quoi="les créneaux déclarés par les indépendants"
              onReessayer={() => void independantsQuery.refetch()}
              enCours={independantsQuery.isFetching}
            />
          ) : (
            <ProgrammesGrid
              readOnly
              programmes={Array.isArray(independantsQuery.data) ? independantsQuery.data : []}
              emptyContent={
                independantsQuery.isLoading ? 'Chargement…' : 'Aucun indépendant déclaré cette semaine'
              }
            />
          )}
        </div>
      </ErrorBoundary>

      <ProgrammeFormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        anneeInitiale={annee}
        semaineInitiale={semaine}
      />
      <ProgrammeFormModal
        isOpen={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        programme={editing}
        anneeInitiale={annee}
        semaineInitiale={semaine}
      />
      <ProgrammeApercuModal
        programme={apercu}
        annee={annee}
        semaine={semaine}
        isOpen={!!apercu}
        onOpenChange={(open) => {
          if (!open) setApercu(null);
        }}
      />
    </section>
  );
}
