'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Skeleton, Tab, Tabs } from '@heroui/react';
import {
  AlertTriangle,
  CheckCircle2,
  Phone,
  PhoneIncoming,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

import { useAbility } from '@/hooks/use-ability';
import {
  IIncident,
  ILivreurTrafic,
  STANDARD_REFRESH_MS,
  useIncidentsQuery,
  useTraficLivreursQuery,
} from '@/features/standard';
import { MessagesPartenairesBouton } from '@/features/chat-partenaires';

import { AppelConfigModal } from './appel-config-modal';
import { AppelHistoriqueTable } from './appel-historique-table';
import { AppelRapideModal } from './appel-rapide-modal';
import { AppelsManquesPanel } from './appels-manques-panel';
import { IncidentCard } from './incident-card';
import { IncidentDetailModal } from './incident-detail-modal';
import { IncidentsHistorique } from './incidents-historique';
import { MotifsAdminModal } from './motifs-admin-modal';
import { StandardKpis } from './standard-kpis';
import { estAujourdhui } from '../utils/incident-ui.utils';

/**
 * Les incidents ouverts sont lus en une seule page volontairement large : sur un
 * poste d'urgence, un signalement qui attend ne doit JAMAIS être caché derrière
 * une pagination. Au-delà, l'écran le dit explicitement.
 */
const TAILLE_FILE = 50;

interface SectionProps {
  titre: string;
  sousTitre: string;
  point: string;
  total: number;
  children: React.ReactNode;
  /** Compteur de nouveautés (pastille cliquable pour acquitter). */
  nouveaux?: number;
  onAcquitter?: () => void;
}

function Section({ titre, sousTitre, point, total, children, nouveaux, onAcquitter }: SectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${point}`} />
        <h2 className="text-sm font-bold uppercase tracking-wide text-default-600">{titre}</h2>
        <span className="inline-flex items-center rounded-full bg-default-100 px-2 py-0.5 text-[11px] font-bold text-default-600">
          {total}
        </span>
        {!!nouveaux && nouveaux > 0 && (
          <button
            type="button"
            onClick={onAcquitter}
            className="inline-flex animate-pulse items-center rounded-full bg-[#E11D48] px-2.5 py-0.5 text-[11px] font-bold text-white"
            title="Marquer comme vus"
          >
            +{nouveaux} nouveau{nouveaux > 1 ? 'x' : ''}
          </button>
        )}
        <span className="text-xs text-default-400">· {sousTitre}</span>
      </div>
      {children}
    </section>
  );
}

function CartesFantomes({ nombre = 2 }: { nombre?: number }) {
  return (
    <div className="grid gap-3 2xl:grid-cols-2">
      {Array.from({ length: nombre }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-default-200/50 bg-white p-4 dark:bg-content1">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-[14px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5 rounded-md" />
              <Skeleton className="h-3 w-1/4 rounded-md" />
            </div>
          </div>
          <Skeleton className="mt-4 h-14 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function Vide({ message, ton = 'ok' }: { message: string; ton?: 'ok' | 'neutre' }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-default-200 bg-white px-4 py-6 dark:bg-content1">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          ton === 'ok' ? 'bg-[#1AA05A]/10 text-[#1AA05A]' : 'bg-default-200/60 text-default-400'
        }`}
      >
        <CheckCircle2 className="h-5 w-5" />
      </span>
      <p className="text-sm text-default-500">{message}</p>
    </div>
  );
}

/**
 * Poste de travail du STANDARD (module M7) : il reçoit les incidents signalés
 * par les livreurs et passe les appels.
 *
 * L'écran est hiérarchisé par URGENCE et non par date — ce que personne n'a pris
 * en charge d'abord, en rouge et en grand ; ce qui est en main ensuite ; ce qui
 * est réglé plié en bas. Il se rafraîchit tout seul toutes les 30 secondes et
 * signale par une pastille les signalements arrivés depuis l'ouverture.
 */
export function StandardControlCenter() {
  const ability = useAbility();
  const canRead = ability.can('read', 'Incident');
  const canUpdate = ability.can('update', 'Incident');

  const [selected, setSelected] = useState<IIncident | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [motifsOpen, setMotifsOpen] = useState(false);
  const [appelOpen, setAppelOpen] = useState(false);
  const [configAppelOpen, setConfigAppelOpen] = useState(false);
  const [rechargeManuelle, setRechargeManuelle] = useState(false);

  // Trois files lues séparément : les deux qui demandent une action le sont en
  // entier, la troisième ne sert qu'au comptage du jour.
  const recus = useIncidentsQuery('RECU', 0, TAILLE_FILE, { refetchInterval: STANDARD_REFRESH_MS });
  const enCours = useIncidentsQuery('EN_COURS', 0, TAILLE_FILE, { refetchInterval: STANDARD_REFRESH_MS });
  const journee = useIncidentsQuery(undefined, 0, TAILLE_FILE, { refetchInterval: STANDARD_REFRESH_MS });
  const trafic = useTraficLivreursQuery();

  const listeRecus = useMemo(() => recus.data?.content ?? [], [recus.data]);
  const listeEnCours = useMemo(() => enCours.data?.content ?? [], [enCours.data]);

  const incidentsDuJour = useMemo(
    () => (journee.data?.content ?? []).filter((i) => estAujourdhui(i.signaleLe)),
    [journee.data],
  );

  // Fiche terrain du livreur (photo, téléphone, statut de service). Le statut
  // vient du SERVICE : « Disponible » = présent dans la file du jour, donc
  // réellement joignable pour une course — pas un drapeau coché à la main.
  const livreursParId = useMemo(() => {
    const index = new Map<string, ILivreurTrafic>();
    const t = trafic.data;
    if (!t) return index;
    [t.disponibles, t.enActivite, t.enPause, t.horsService].forEach((bucket) => {
      (bucket?.liste ?? []).forEach((l) => index.set(l.livreurId, l));
    });
    return index;
  }, [trafic.data]);

  // ── Veille : un incident arrivé pendant que l'écran est ouvert doit se voir ──
  const vusRef = useRef<Set<string> | null>(null);
  const [nouveaux, setNouveaux] = useState<ReadonlySet<string>>(new Set());
  const clefRecus = listeRecus.map((i) => i.id).join('|');
  // On n'amorce la veille qu'une fois la PREMIÈRE réponse reçue : amorcer sur la
  // liste vide du chargement ferait passer tout l'existant pour des nouveautés.
  const fileChargee = recus.isSuccess;

  useEffect(() => {
    if (!fileChargee) return;
    const ids = clefRecus ? clefRecus.split('|') : [];
    if (vusRef.current === null) {
      // Premier chargement : l'existant n'est pas une « nouveauté ».
      vusRef.current = new Set(ids);
      return;
    }
    const inconnus = ids.filter((id) => !vusRef.current!.has(id));
    if (inconnus.length === 0) return;
    inconnus.forEach((id) => vusRef.current!.add(id));
    setNouveaux((prev) => {
      const suivant = new Set(prev);
      inconnus.forEach((id) => suivant.add(id));
      return suivant;
    });
  }, [clefRecus, fileChargee]);

  // Un incident pris en charge quitte la file : sa pastille n'a plus lieu d'être.
  const nouveauxVisibles = useMemo(
    () => listeRecus.filter((i) => nouveaux.has(i.id)).length,
    [listeRecus, nouveaux],
  );

  const acquitter = () => setNouveaux(new Set());

  const rafraichir = async () => {
    setRechargeManuelle(true);
    try {
      await Promise.all([recus.refetch(), enCours.refetch(), journee.refetch(), trafic.refetch()]);
    } finally {
      setRechargeManuelle(false);
    }
  };

  const ouvrirDetail = (incident: IIncident) => {
    setSelected(incident);
    setDetailOpen(true);
  };

  if (!canRead) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-2 py-24 text-default-400">
        <AlertTriangle className="h-8 w-8" />
        <p>Vous n&apos;avez pas accès au centre de contrôle STANDARD.</p>
      </div>
    );
  }

  const totalRecus = recus.data?.totalElements ?? listeRecus.length;
  const totalEnCours = enCours.data?.totalElements ?? listeEnCours.length;
  const chargementInitial = recus.isLoading || enCours.isLoading;

  return (
    <div className="w-full space-y-5">
      {/* Entête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-primary">
            Centre de contrôle — STANDARD
            {totalRecus > 0 && (
              <span className="inline-flex items-center rounded-full bg-[#E11D48]/10 px-2.5 py-1 text-xs font-bold text-[#B4123B]">
                {totalRecus} en attente
              </span>
            )}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-default-500">
            Incidents signalés par les livreurs et appels du standard (CDC RG-24). Écran trié par
            urgence, rafraîchi automatiquement toutes les 30 secondes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="bg-[#1AA05A] font-semibold text-white"
            startContent={<Phone className="h-4 w-4" />}
            onPress={() => setAppelOpen(true)}
          >
            Appeler un livreur
          </Button>
          <Button
            variant="flat"
            startContent={<RefreshCw className="h-4 w-4" />}
            isLoading={rechargeManuelle}
            onPress={rafraichir}
          >
            Actualiser
          </Button>
          {canUpdate && (
            <Button
              variant="flat"
              startContent={<SlidersHorizontal className="h-4 w-4" />}
              onPress={() => setMotifsOpen(true)}
            >
              Motifs
            </Button>
          )}
          {canUpdate && (
            <Button
              variant="flat"
              startContent={<PhoneIncoming className="h-4 w-4" />}
              onPress={() => setConfigAppelOpen(true)}
            >
              Répondants
            </Button>
          )}
          {/* Accès discret au chat partenaires (Demande de Coursier) + pastille non-lus. */}
          <MessagesPartenairesBouton />
        </div>
      </div>

      <StandardKpis
        nonPrisEnCharge={totalRecus}
        enTraitement={totalEnCours}
        duJour={incidentsDuJour.length}
        duJourPlafonne={incidentsDuJour.length >= TAILLE_FILE}
        livreursEnCourse={trafic.data?.enActivite.total ?? 0}
        livreursDisponibles={trafic.data?.disponibles.total ?? 0}
        nouveaux={nouveauxVisibles}
        isLoading={chargementInitial}
      />

      <Tabs aria-label="Sections du centre STANDARD" color="primary" variant="underlined" size="lg">
        <Tab
          key="incidents"
          title={
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Incidents
              {totalRecus > 0 && (
                <span className="inline-flex items-center rounded-full bg-[#E11D48] px-1.5 py-0.5 text-[11px] font-bold text-white">
                  {totalRecus}
                </span>
              )}
            </span>
          }
        >
          <div className="space-y-6 pt-3">
            {/* 1 — Personne ne s'en occupe encore : le seul bloc qui doit crier. */}
            <Section
              titre="À prendre en charge"
              sousTitre="aucun agent n'a encore ouvert ces signalements"
              point="bg-[#E11D48]"
              total={totalRecus}
              nouveaux={nouveauxVisibles}
              onAcquitter={acquitter}
            >
              {recus.isLoading ? (
                <CartesFantomes />
              ) : listeRecus.length === 0 ? (
                <Vide message="Aucun incident en attente : tous les signalements ont été pris en charge." />
              ) : (
                <>
                  <div className="grid gap-3 2xl:grid-cols-2">
                    {listeRecus.map((inc) => (
                      <IncidentCard
                        key={inc.id}
                        incident={inc}
                        livreur={livreursParId.get(inc.livreurId)}
                        estNouveau={nouveaux.has(inc.id)}
                        canUpdate={canUpdate}
                        onOuvrir={ouvrirDetail}
                      />
                    ))}
                  </div>
                  {totalRecus > listeRecus.length && (
                    <p className="text-xs text-default-400">
                      {listeRecus.length} affichés sur {totalRecus} — traitez-les pour voir les
                      suivants.
                    </p>
                  )}
                </>
              )}
            </Section>

            {/* 2 — En main : suivi, moins fort visuellement. */}
            <Section
              titre="En cours de traitement"
              sousTitre="un agent a la main dessus"
              point="bg-[#D97706]"
              total={totalEnCours}
            >
              {enCours.isLoading ? (
                <CartesFantomes nombre={1} />
              ) : listeEnCours.length === 0 ? (
                <Vide message="Aucun incident en cours de traitement." ton="neutre" />
              ) : (
                <div className="grid gap-3 2xl:grid-cols-2">
                  {listeEnCours.map((inc) => (
                    <IncidentCard
                      key={inc.id}
                      incident={inc}
                      livreur={livreursParId.get(inc.livreurId)}
                      canUpdate={canUpdate}
                      onOuvrir={ouvrirDetail}
                    />
                  ))}
                </div>
              )}
            </Section>

            {/* 3 — Réglé : plié. */}
            <IncidentsHistorique onOuvrir={ouvrirDetail} />
          </div>
        </Tab>

        <Tab
          key="appels"
          title={
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Appels
            </span>
          }
        >
          {/* Journal STANDARD — appels tel: + audio in-app LUNION (colonne « Écouter » pour les EN_COURS) */}
          <div className="space-y-4 pt-3">
            <AppelsManquesPanel />
            <AppelHistoriqueTable />
          </div>
        </Tab>
      </Tabs>

      <IncidentDetailModal
        incident={selected}
        livreur={selected ? livreursParId.get(selected.livreurId) : undefined}
        isOpen={detailOpen}
        onOpenChange={setDetailOpen}
        canUpdate={canUpdate}
      />
      <MotifsAdminModal isOpen={motifsOpen} onOpenChange={setMotifsOpen} />
      <AppelRapideModal isOpen={appelOpen} onOpenChange={setAppelOpen} />
      <AppelConfigModal isOpen={configAppelOpen} onOpenChange={setConfigAppelOpen} />
    </div>
  );
}
