'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { parseAsInteger, useQueryStates } from 'nuqs';
import React from 'react';
import { toast } from 'sonner';

import { AffectationSiteDialog } from './affectation-site-dialog';
import { CarburantRapideModal } from './carburant-rapide-modal';
import { DuplicationSemaineDialog } from './duplication-semaine-dialog';
import { EngagementCarburantConnecte } from './engagement-carburant';
import { ProgrammeApercuPanneau } from './programme-apercu-panneau';
import { ProgrammeFormModal } from './programme-form-modal';
import { ProgrammeHistoriqueModal } from './programme-historique-modal';
import { SoumissionSurplusConnectee } from './soumission-surplus';
import { SurplusCarburantDialog } from './surplus-carburant-dialog';
import { joursAvecDates } from './weekly-jours-editor';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { useAbility } from '@/hooks/use-ability';
import { SemaineProgrammes } from '@/features/programmes/refonte/semaine-programmes';
import { useLivreursListQuery } from '@/features/tickets/queries/livreur-list.query';
import { creerProgrammeAction } from '@/features/turboys/actions/programme.actions';
import {
  useAutosuffisanceSemaineQuery,
  useBandeauCarburantQuery,
  useDupliquerSurSemaineSuivanteMutation,
  useDupliquerSemaineMutation,
  useEnvoyerProgrammeMutation,
  usePlanifierProgrammeMutation,
  useProgrammesIndependantsQuery,
  useProgrammesSemaineQuery,
  usePublierProgrammeMutation,
  useRenvoyerWhatsAppMutation,
  useSupprimerProgrammeMutation,
} from '@/features/turboys/queries/programme.query';
import { IProgramme } from '@/features/turboys/types/programme.types';
import { totauxCarburant } from '@/features/turboys/utils/carburant.utils';
import {
  type ContexteExport,
  exporterProgrammesExcel,
  exporterProgrammesPdf,
} from '@/features/turboys/utils/programmes-export.utils';
import {
  lireFichierProgrammes,
  telechargerModeleProgrammes,
} from '@/features/turboys/utils/programmes-import.utils';
import { semaineCourante, semaineDecalee, semainePrecedente } from '@/features/turboys/utils/semaine.utils';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';

/**
 * Les programmes hebdomadaires.
 *
 * <p>La conception et ses raisons sont documentées dans
 * `features/programmes/refonte/semaine-programmes.tsx`, qui porte le rendu. Ce fichier
 * ne fait plus que la lecture, les écritures et les deux imports.</p>
 */

const TYPE_OPTIONS = [
  { cle: 'TOUS', libelle: 'Tous' },
  { cle: 'JOURNALIER', libelle: getTurboyTypeDisplay('JOURNALIER').labelPlural },
  { cle: 'SUPERVISEUR_LIVREUR', libelle: getTurboyTypeDisplay('SUPERVISEUR_LIVREUR').labelPlural },
  { cle: 'INDEPENDANT', libelle: getTurboyTypeDisplay('INDEPENDANT').labelPlural },
];

/*
 * Le calendrier des semaines vit dans `semaine.utils.ts`, aligné sur le backend
 * (WeekFields FRANCE, année calendaire). Ce fichier calculait le numéro courant
 * correctement, mais changeait de semaine avec un 52 écrit en dur : depuis la semaine 1,
 * « précédente » sautait la 53 des années qui en ont une, et « suivante » depuis la 53
 * renvoyait sur la même semaine sous un autre nom.
 */
const CURRENT_WEEK = semaineCourante();

export default function ProgrammesSection() {
  const [{ annee, semaine }, setWeek] = useQueryStates({
    annee: parseAsInteger.withDefault(CURRENT_WEEK.annee),
    semaine: parseAsInteger.withDefault(CURRENT_WEEK.semaine),
  });

  const { data, isError, isLoading, refetch } = useProgrammesSemaineQuery(annee, semaine);
  const independantsQuery = useProgrammesIndependantsQuery(annee, semaine);
  const autosuffisanceQuery = useAutosuffisanceSemaineQuery(annee, semaine);
  // Le bandeau du haut de page (§8.2) : lui seul connaît les surplus accordés et la
  // dotation FIGÉE à la publication, que l'écran ne peut pas recalculer.
  const bandeauQuery = useBandeauCarburantQuery(annee, semaine);

  // L'écart de carburant contre la semaine précédente : le document papier le donnait,
  // avec sa raison. La raison reste à l'opérateur ; le chiffre, lui, se calcule.
  const precedente = semainePrecedente(annee, semaine);
  const precedenteQuery = useProgrammesSemaineQuery(precedente.annee, precedente.semaine);
  const carburantSemainePrecedente = React.useMemo(() => {
    if (!Array.isArray(precedenteQuery.data) || precedenteQuery.data.length === 0) return null;
    return totauxCarburant(precedenteQuery.data).total;
  }, [precedenteQuery.data]);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<IProgramme | null>(null);
  /**
   * L'aperçu : le programme regardé, et l'ordre dans lequel l'écran le montrait.
   *
   * <p>L'ordre vient de la liste, qui seule connaît son regroupement. Les flèches ‹ › du
   * panneau s'y déplacent sans le fermer.</p>
   */
  const [apercu, setApercu] = React.useState<{ index: number; liste: IProgramme[] } | null>(null);
  const programmeApercu = apercu ? (apercu.liste[apercu.index] ?? null) : null;
  const [historiqueDe, setHistoriqueDe] = React.useState<IProgramme | null>(null);
  const [carburantDe, setCarburantDe] = React.useState<IProgramme[]>([]);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [lotEnCours, setLotEnCours] = React.useState(false);
  /**
   * Le surplus de carburant (§7.2).
   *
   * ⚠ RG-C03 / CA-36 : l'entrée de menu N'APPARAÎT PAS pour un profil non habilité. Pas
   * grisée — absente. Le serveur refuse de toute façon, mais proposer un geste qu'on
   * n'a pas le droit de faire est une promesse qu'on ne tient pas.
   */
  const ability = useAbility();
  const peutAccorderSurplus = ability.can('accorder-surplus', 'ProgrammeLivreur');
  const [surplusDe, setSurplusDe] = React.useState<IProgramme | null>(null);
  /** Le jour pré-rempli quand le geste vient d'une ligne de l'éditeur. */
  const [surplusJour, setSurplusJour] = React.useState<string | null>(null);

  /** Affectation en cours d'opérations (§3.3) : le programme visé, et ce que la case cliquée disait. */
  const [affectation, setAffectation] = React.useState<{
    prefill: { jour?: string; siteId?: string } | null;
    programme: IProgramme;
  } | null>(null);

  const planifier = usePlanifierProgrammeMutation();
  const publier = usePublierProgrammeMutation();
  const envoyer = useEnvoyerProgrammeMutation();
  const renvoyerWhatsApp = useRenvoyerWhatsAppMutation();
  const supprimer = useSupprimerProgrammeMutation();
  const dupliquerSuivante = useDupliquerSurSemaineSuivanteMutation();

  const changeWeek = (delta: number) => setWeek(semaineDecalee(annee, semaine, delta));

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

  /*
   * Publier en LOT. Le backend ne publie qu'un programme à la fois ; la boucle est ici,
   * séquentielle pour ne pas ouvrir quarante requêtes d'un coup, et le compte des échecs
   * est rendu. Sans elle, lancer une semaine de quarante livreurs demandait quarante
   * clics.
   */
  const publierLot = async (ids: string[]) => {
    if (ids.length === 0 || lotEnCours) return;
    setLotEnCours(true);
    let ok = 0;
    let echecs = 0;
    try {
      for (const id of ids) {
        try {
          await publier.mutateAsync(id);
          ok += 1;
        } catch {
          echecs += 1;
        }
      }
      if (echecs === 0) {
        toast.success(`${ok} programme(s) publié(s).`);
      } else {
        toast.warning(`${ok} publié(s), ${echecs} en échec.`);
      }
    } finally {
      setLotEnCours(false);
    }
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
  const nomSite = React.useMemo(() => new Map(restaurants.map((r) => [r.id, r.nom])), [restaurants]);
  // Ce que les exports savent des sites : le nom, la commune, pour les en-têtes de groupe.
  const contexteExport = React.useMemo<ContexteExport>(
    () => ({
      carburantSemainePrecedente,
      sites: new Map(
        (restaurantsQuery.data ?? []).map((r) => [r.id, { commune: r.commune, localisation: r.localisation, nom: r.nomEtablissement }]),
      ),
    }),
    [restaurantsQuery.data, carburantSemainePrecedente],
  );
  const livreursQuery = useLivreursListQuery();

  /*
   * UN SEUL BANDEAU WHATSAPP (§5.2). La mention se répétait sur chaque ligne : trente-huit
   * fois le même avertissement, qui finissait par ne plus rien signaler.
   *
   * ⚠ Pas de bouton « Configurer » : cet ERP n'a AUCUN écran de configuration WhatsApp —
   * le réglage vit côté serveur. Un bouton qui n'ouvre rien serait pire que son absence,
   * et le bandeau dit donc où est le réglage plutôt que de prétendre y mener.
   */
  const whatsappNonConfigure = React.useMemo(
    () => (Array.isArray(data) ? data : []).some((p) => p.whatsappStatut === 'NON_CONFIGURE'),
    [data],
  );

  const programmesFiltres = React.useMemo(() => {
    // Durcissement : une réponse non-tableau (erreur backend renvoyée en 200,
    // shape inattendue…) ne doit jamais faire planter `.filter` au rendu.
    let liste = Array.isArray(data) ? data : [];
    if (typeFiltre !== 'TOUS') liste = liste.filter((p) => (p.typeLivreur ?? '') === typeFiltre);
    if (partenaireFiltre !== 'TOUS') {
      // Un partenaire est le site de la semaine, ou l'un des postes desservis.
      liste = liste.filter(
        (p) =>
          p.siteId === partenaireFiltre ||
          (p.jours ?? []).some((j) => (j.postes ?? []).some((po) => po.restaurantId === partenaireFiltre)),
      );
    }
    return liste;
  }, [data, typeFiltre, partenaireFiltre]);

  /*
   * Dupliquer la semaine précédente. Le geste était une boucle côté client qui créait un
   * brouillon par livreur manquant ; il passe au serveur, en une transaction, avec la
   * règle validée par la direction : la cible doit être VIDE, la duplication n'écrase
   * rien. Ce qui est copié : jours, horaires, postes, carburant par jour, site de la
   * semaine. Le repos suit la semaine source et se déplace ensuite ligne par ligne.
   */
  const qc = useQueryClient();
  const [importing, setImporting] = React.useState(false);
  const [dupliquerOuvert, setDupliquerOuvert] = React.useState(false);
  const dupliquer = useDupliquerSemaineMutation(() => setDupliquerOuvert(false));

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
          annee,
          jours: joursAvecDates(lg.jours, annee, semaine),
          livreurId: id,
          semaine,
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
    <>
      <input accept=".xlsx,.csv" className="hidden" onChange={onFichier} ref={fileRef} type="file" />

      {/* Boundary rekeyé par semaine : un rendu qui throw sur les données d'une
          semaine n'emporte plus toute la page — et naviguer réarme l'affichage. */}
      <ErrorBoundary
        resetKey={`${annee}-${semaine}`}
        title="Impossible d'afficher les programmes de cette semaine"
      >
        <SemaineProgrammes
          annee={annee}
          bandeau={bandeauQuery.data ?? null}
          bandeauEnCours={bandeauQuery.isLoading}
          autosuffisance={Array.isArray(autosuffisanceQuery.data) ? autosuffisanceQuery.data : []}
          autosuffisanceIsError={autosuffisanceQuery.isError}
          autosuffisanceIsLoading={autosuffisanceQuery.isLoading}
          carburantSemainePrecedente={carburantSemainePrecedente}
          engagement={
            <div className="flex w-full flex-col gap-2">
              <EngagementCarburantConnecte
                annee={annee}
                contexteExport={contexteExport}
                programmes={Array.isArray(data) ? data : []}
                semaine={semaine}
              />
              {/* La soumission des surplus, SOUS l'engagement : c'est l'étape d'après,
                  et elle ne s'affiche que si la semaine a eu des surplus. */}
              <SoumissionSurplusConnectee
                annee={annee}
                nomSite={nomSite}
                programmes={Array.isArray(data) ? data : []}
                semaine={semaine}
              />
            </div>
          }
          idEnCours={pendingId}
          importEnCours={importing}
          independants={Array.isArray(independantsQuery.data) ? independantsQuery.data : []}
          independantsIsError={independantsQuery.isError}
          independantsIsLoading={independantsQuery.isLoading}
          isError={isError}
          isLoading={isLoading}
          lotEnCours={lotEnCours}
          onAffecterRenfort={(siteId, jour) => {
            /*
             * Depuis une case de la vue Couverture : on connaît le site et le jour, pas
             * encore QUI y envoyer. On propose le premier livreur publié qui travaille ce
             * jour-là et n'est pas déjà sur ce site — la fenêtre laisse changer.
             */
            const candidat = (Array.isArray(data) ? data : []).find(
              (p) =>
                (p.statut === 'NOTIFIE' || p.statut === 'ACCEPTE') &&
                (p.jours ?? []).some((j) => j.jour === jour && j.actif) &&
                !(p.complement?.sitesParJour?.[jour] ?? []).includes(siteId) &&
                p.siteId !== siteId,
            );
            if (!candidat) {
              toast.warning('Aucun livreur publié ne travaille ce jour-là en dehors de ce site.');
              return;
            }
            setAffectation({ prefill: { jour, siteId }, programme: candidat });
          }}
          onAffecterSite={(p) => setAffectation({ prefill: null, programme: p })}
          onApercu={(p, ordre) =>
            setApercu(
              ordre && ordre.index >= 0
                ? ordre
                : // Repli : l'appelant n'a pas d'ordre à donner, le panneau s'ouvre seul
                  // et ses flèches sont inactives plutôt qu'absentes.
                  { index: 0, liste: [p] },
            )
          }
          onCarburant={(p) => setCarburantDe([p])}
          onCarburantLot={setCarburantDe}
          onDupliquerSemainePrecedente={() => setDupliquerOuvert(true)}
          onDupliquerSuivante={(p) => runAction(p.id, dupliquerSuivante.mutateAsync)}
          onEditer={setEditing}
          onEnvoyer={(p) => runAction(p.id, envoyer.mutateAsync)}
          onExporterExcel={() => exporterProgrammesExcel(programmesFiltres, annee, semaine, contexteExport)}
          onExporterPdf={() =>
            exporterProgrammesPdf(
              programmesFiltres,
              annee,
              semaine,
              TYPE_OPTIONS.find((o) => o.cle === typeFiltre)?.libelle ?? 'Tous',
              contexteExport,
            )
          }
          onHistorique={setHistoriqueDe}
          onRenvoyerWhatsApp={(p) => runAction(p.id, renvoyerWhatsApp.mutateAsync)}
          onImporterFichier={() => fileRef.current?.click()}
          onNouveau={() => setCreateOpen(true)}
          onPartenaireFiltre={setPartenaireFiltre}
          onPlanifier={(p) => runAction(p.id, planifier.mutateAsync)}
          onPublier={(p) => runAction(p.id, publier.mutateAsync)}
          onPublierLot={publierLot}
          onReessayer={() => void refetch()}
          onReessayerIndependants={() => void independantsQuery.refetch()}
          onSemaine={changeWeek}
          onSupprimer={demanderSuppression}
          onSurplus={
            peutAccorderSurplus
              ? (p) => {
                  setSurplusJour(null);
                  setSurplusDe(p);
                }
              : undefined
          }
          onTelechargerModele={() =>
            telechargerModeleProgrammes(
              (livreursQuery.data ?? []).map((l) => ({
                matricule: l.matricule,
                nom: `${l.prenoms ?? ''} ${l.nom ?? ''}`.trim(),
                telephone: l.telephone,
              })),
            )
          }
          onTypeFiltre={setTypeFiltre}
          partenaireFiltre={partenaireFiltre}
          partenaires={restaurants}
          partenairesEnCours={restaurantsQuery.isLoading}
          programmes={programmesFiltres}
          semaine={semaine}
          typeFiltre={typeFiltre}
          typeOptions={TYPE_OPTIONS}
          whatsappNonConfigure={whatsappNonConfigure}
        />
      </ErrorBoundary>

      <ProgrammeFormModal
        anneeInitiale={annee}
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        semaineInitiale={semaine}
      />
      <ProgrammeFormModal
        anneeInitiale={annee}
        isOpen={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        /*
         * Depuis une ligne de jour de l'éditeur. La fenêtre de surplus s'ouvre PAR-DESSUS
         * celle d'édition et ne la ferme pas : les modifications en cours de saisie ne
         * sont pas perdues, et on revient dessus en fermant le surplus.
         */
        onSurplusJour={
          peutAccorderSurplus && editing
            ? (jour) => {
                setSurplusJour(jour);
                setSurplusDe(editing);
              }
            : undefined
        }
        programme={editing}
        semaineInitiale={semaine}
      />
      <CarburantRapideModal
        isOpen={carburantDe.length > 0}
        onOpenChange={(open) => {
          if (!open) setCarburantDe([]);
        }}
        programmes={carburantDe}
      />
      <ProgrammeApercuPanneau
        annee={annee}
        nomSite={nomSite}
        onEditer={(p) => {
          setApercu(null);
          setEditing(p);
        }}
        onFermer={() => setApercu(null)}
        onPrecedent={apercu && apercu.index > 0 ? () => setApercu({ ...apercu, index: apercu.index - 1 }) : undefined}
        onSuivant={
          apercu && apercu.index < apercu.liste.length - 1
            ? () => setApercu({ ...apercu, index: apercu.index + 1 })
            : undefined
        }
        position={apercu && apercu.liste.length > 1 ? { index: apercu.index, total: apercu.liste.length } : null}
        programme={programmeApercu}
        semaine={semaine}
        telephone={(livreursQuery.data ?? []).find((l) => l.id === programmeApercu?.livreurId)?.telephone ?? null}
      />
      <ProgrammeHistoriqueModal
        isOpen={!!historiqueDe}
        onOpenChange={(open) => {
          if (!open) setHistoriqueDe(null);
        }}
        programme={historiqueDe}
        sites={nomSite}
      />
      <SurplusCarburantDialog
        jourInitial={surplusJour}
        onFermer={() => {
          setSurplusDe(null);
          setSurplusJour(null);
        }}
        programme={surplusDe}
        sites={restaurants}
      />
      <AffectationSiteDialog
        onFermer={() => setAffectation(null)}
        prefill={affectation?.prefill ?? null}
        programme={affectation?.programme ?? null}
        sites={restaurants}
      />
      <DuplicationSemaineDialog
        enAttente={dupliquer.isPending}
        onDupliquer={(source, cible) =>
          dupliquer.mutate({
            annee: cible.annee,
            depuisAnnee: source.annee,
            depuisSemaine: source.semaine,
            semaine: cible.semaine,
          })
        }
        onFermer={() => setDupliquerOuvert(false)}
        ouvert={dupliquerOuvert}
        semaineAffichee={{ annee, semaine }}
      />
    </>
  );
}
