'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Avatar, Button, Input, Skeleton, Spinner } from '@heroui/react';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  MessageSquare,
  MessagesSquare,
  Phone,
  Search,
  SendHorizontal,
  ThumbsUp,
} from 'lucide-react';

import { useAbility } from '@/hooks/use-ability';
import { useHauteurDisponible } from '@/hooks/use-hauteur-disponible';
import { useRestaurantsListQuery } from '@/features/restaurants';

import { useEnvoyerMessageMutation, useMarquerLusMutation, useMessagesQuery, useNonLusQuery } from '../queries/chat-partenaires.query';
import { IMessagePartenaire } from '../types/chat-partenaires.types';
import { ConsignerAppelModal } from './consigner-appel-modal';

/** Assez large pour couvrir tous les partenaires (~64 en réel) en une lecture. */
const TAILLE_LISTE_PARTENAIRES = 500;

interface Conversation {
  restaurantId: string;
  nom: string;
  logoUrl?: string;
  nonLus: number;
}

function formaterDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const aujourdhui = new Date();
  const memeJour =
    d.getFullYear() === aujourdhui.getFullYear() &&
    d.getMonth() === aujourdhui.getMonth() &&
    d.getDate() === aujourdhui.getDate();
  if (memeJour) return heure;
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} ${heure}`;
}

/** Bulle d'un message du fil. SYSTEME est volontairement discret (journal, pas discussion). */
function BulleMessage({ message }: { message: IMessagePartenaire }) {
  if (message.emetteur === 'SYSTEME') {
    return (
      <div className="flex justify-center">
        <div className="max-w-[85%] rounded-xl bg-default-100/70 px-3 py-1.5 text-center">
          <p className="text-xs text-default-500">{message.contenu}</p>
          <p className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-default-400">
            {formaterDate(message.creeLe)}
            <span className="mx-0.5">·</span>
            {message.accuseAt ? (
              <span className="inline-flex items-center gap-0.5 text-[#1AA05A]" title={`Accusé le ${formaterDate(message.accuseAt)}`}>
                <ThumbsUp className="h-3 w-3" /> vu
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5" title="Le partenaire n'a pas encore accusé réception">
                <ThumbsUp className="h-3 w-3 opacity-40" /> pas encore vu
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  const estStandard = message.emetteur === 'STANDARD';
  return (
    <div className={`flex ${estStandard ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
          estStandard
            ? 'rounded-br-md bg-primary text-white'
            : 'rounded-bl-md bg-default-100 text-foreground'
        }`}
      >
        {message.courseId && (
          <p className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${estStandard ? 'text-white/70' : 'text-default-400'}`}>
            Course {message.courseId.slice(0, 8)}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words text-sm">{message.contenu}</p>
        <p
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
            estStandard ? 'text-white/70' : 'text-default-400'
          }`}
        >
          {formaterDate(message.creeLe)}
          {estStandard &&
            (message.luPartenaire ? (
              <CheckCheck className="h-3.5 w-3.5" aria-label="Lu par le partenaire" />
            ) : (
              <Check className="h-3.5 w-3.5 opacity-60" aria-label="Envoyé" />
            ))}
        </p>
      </div>
    </div>
  );
}

/**
 * Chat STANDARD ↔ partenaires (module Demande de Coursier) : à gauche les
 * conversations (les non-lus d'abord), à droite le fil du partenaire choisi.
 * L'écran tient dans la fenêtre (poste de travail) : chaque colonne fait
 * défiler son propre contenu, le fil est rafraîchi toutes les 15 secondes.
 */
export function ChatPartenairesContent() {
  const ability = useAbility();
  const canRead = ability.can('read', 'Incident');
  const { data: session } = useSession();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');
  const [brouillon, setBrouillon] = useState('');
  const [appelOpen, setAppelOpen] = useState(false);

  const restaurants = useRestaurantsListQuery({ page: 0, limit: TAILLE_LISTE_PARTENAIRES });
  const nonLus = useNonLusQuery(canRead);
  const fil = useMessagesQuery(selectedId);
  const envoyer = useEnvoyerMessageMutation();
  const marquerLus = useMarquerLusMutation();

  // ── Conversations : tous les partenaires connus + ceux qui n'existeraient que
  // dans les compteurs (partenaire supprimé ou liste indisponible) ────────────
  const conversations = useMemo<Conversation[]>(() => {
    const compteurs = new Map((nonLus.data ?? []).map((n) => [n.restaurantId, n.nonLus]));
    const liste: Conversation[] = (restaurants.data?.content ?? []).map((r) => ({
      restaurantId: r.id,
      nom: r.nomEtablissement || 'Partenaire',
      logoUrl: r.logo_Url || r.logo || undefined,
      nonLus: compteurs.get(r.id) ?? 0,
    }));
    const connus = new Set(liste.map((c) => c.restaurantId));
    compteurs.forEach((total, restaurantId) => {
      if (!connus.has(restaurantId)) {
        liste.push({ restaurantId, nom: `Partenaire ${restaurantId.slice(0, 8)}`, nonLus: total });
      }
    });
    const q = recherche.trim().toLowerCase();
    return liste
      .filter((c) => !q || c.nom.toLowerCase().includes(q))
      .sort((a, b) => b.nonLus - a.nonLus || a.nom.localeCompare(b.nom));
  }, [restaurants.data, nonLus.data, recherche]);

  const selection = useMemo(
    () => conversations.find((c) => c.restaurantId === selectedId) ?? null,
    [conversations, selectedId],
  );

  const totalNonLus = useMemo(
    () => (nonLus.data ?? []).reduce((somme, n) => somme + n.nonLus, 0),
    [nonLus.data],
  );

  // ── Fil affiché : pages DESC aplaties, dédoublonnées, remises en ordre chrono ─
  const messages = useMemo(() => {
    const parId = new Map<string, IMessagePartenaire>();
    (fil.data?.pages ?? []).flat().forEach((m) => {
      if (!parId.has(m.id)) parId.set(m.id, m);
    });
    return Array.from(parId.values()).sort(
      (a, b) => new Date(a.creeLe).getTime() - new Date(b.creeLe).getTime(),
    );
  }, [fil.data]);

  // ── Marquer lus à l'ouverture, et quand des messages arrivent conversation ouverte ─
  const nonLusSelection = selection?.nonLus ?? 0;
  const marquerLusMutate = marquerLus.mutate;
  useEffect(() => {
    if (selectedId && nonLusSelection > 0) {
      marquerLusMutate(selectedId);
    }
  }, [selectedId, nonLusSelection, marquerLusMutate]);

  // ── Défilement : coller au bas quand un NOUVEAU message arrive (pas quand on
  // remonte l'historique via « messages plus anciens ») ────────────────────────
  const filRef = useRef<HTMLDivElement | null>(null);
  const dernierIdRef = useRef<string | null>(null);
  const dernierMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  useEffect(() => {
    const dernierId = dernierMessage?.id ?? null;
    if (dernierId && dernierId !== dernierIdRef.current) {
      dernierIdRef.current = dernierId;
      const zone = filRef.current;
      if (zone) zone.scrollTop = zone.scrollHeight;
    }
  }, [dernierMessage]);

  useEffect(() => {
    // Changement de conversation : on repart du bas du fil.
    dernierIdRef.current = null;
    setBrouillon('');
  }, [selectedId]);

  const envoyerMessage = () => {
    const contenu = brouillon.trim();
    if (!selectedId || !contenu || envoyer.isLoading) return;
    const auteurId = session?.user?.id;
    envoyer.mutate(
      { restaurantId: selectedId, dto: { contenu, ...(auteurId ? { auteurId } : {}) } },
      { onSuccess: () => setBrouillon('') },
    );
  };

  // ── Hauteur du poste de travail : mesurée, jamais devinée en calc(100vh-X) ──
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const hauteur = useHauteurDisponible(zoneRef);

  if (!canRead) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-2 py-24 text-default-400">
        <MessagesSquare className="h-8 w-8" />
        <p>Vous n&apos;avez pas accès aux messages partenaires.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Entête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              as={Link}
              href="/trafic/standard"
              variant="light"
              size="sm"
              startContent={<ArrowLeft className="h-4 w-4" />}
              className="text-default-500"
            >
              Standard
            </Button>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
              Messages partenaires
              {totalNonLus > 0 && (
                <span className="inline-flex items-center rounded-full bg-[#E11D48]/10 px-2.5 py-1 text-xs font-bold text-[#B4123B]">
                  {totalNonLus} non lu{totalNonLus > 1 ? 's' : ''}
                </span>
              )}
            </h1>
          </div>
          <p className="mt-1 text-sm text-default-500">
            Discussions avec les partenaires du module Demande de Coursier, rafraîchies toutes les
            15 secondes.
          </p>
        </div>
      </div>

      {/* Poste de travail : deux colonnes qui défilent chacune à l'intérieur */}
      <div
        ref={zoneRef}
        className="grid min-h-[320px] gap-3 lg:grid-cols-[300px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]"
        style={hauteur ? { height: hauteur } : undefined}
      >
        {/* Colonne conversations */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-default-200/60 bg-white dark:bg-content1">
          <div className="border-b border-default-100 p-3">
            <Input
              size="sm"
              placeholder="Rechercher un partenaire…"
              value={recherche}
              onValueChange={setRecherche}
              startContent={<Search className="h-4 w-4 text-default-400" />}
              isClearable
              onClear={() => setRecherche('')}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {restaurants.isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 flex-1 rounded-md" />
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-center text-sm text-default-400">Aucun partenaire trouvé.</p>
            ) : (
              conversations.map((c) => {
                const actif = c.restaurantId === selectedId;
                return (
                  <button
                    key={c.restaurantId}
                    type="button"
                    onClick={() => setSelectedId(c.restaurantId)}
                    className={`flex w-full items-center gap-3 border-b border-default-100/70 px-3 py-2.5 text-left transition-colors ${
                      actif ? 'bg-primary/10' : 'hover:bg-default-100/60'
                    }`}
                  >
                    <Avatar src={c.logoUrl} name={c.nom} size="sm" className="shrink-0" />
                    <span className={`min-w-0 flex-1 truncate text-sm ${c.nonLus > 0 ? 'font-semibold' : 'font-medium'}`}>
                      {c.nom}
                    </span>
                    {c.nonLus > 0 && (
                      <span className="inline-flex min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#E11D48] px-1.5 py-0.5 text-[11px] font-bold text-white">
                        {c.nonLus}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Colonne fil */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-default-200/60 bg-white dark:bg-content1">
          {!selection ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-default-400">
              <MessageSquare className="h-8 w-8" />
              <p className="text-sm">Choisissez une conversation pour afficher les messages.</p>
            </div>
          ) : (
            <>
              {/* Entête de conversation */}
              <div className="flex items-center gap-3 border-b border-default-100 px-4 py-2.5">
                <Avatar src={selection.logoUrl} name={selection.nom} size="sm" />
                <p className="min-w-0 flex-1 truncate font-semibold">{selection.nom}</p>
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<Phone className="h-4 w-4" />}
                  onPress={() => setAppelOpen(true)}
                >
                  Consigner un appel
                </Button>
              </div>

              {/* Fil */}
              <div ref={filRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
                {fil.hasNextPage && (
                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      variant="light"
                      isLoading={fil.isFetchingNextPage}
                      onPress={() => fil.fetchNextPage()}
                      className="text-default-400"
                    >
                      Messages plus anciens
                    </Button>
                  </div>
                )}
                {fil.isLoading ? (
                  <div className="flex justify-center py-10">
                    <Spinner color="primary" label="Chargement du fil…" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-default-400">
                    Aucun message avec ce partenaire pour l&apos;instant.
                  </p>
                ) : (
                  messages.map((m) => <BulleMessage key={m.id} message={m} />)
                )}
              </div>

              {/* Saisie */}
              <div className="border-t border-default-100 p-3">
                <div className="flex items-end gap-2">
                  <Input
                    placeholder={`Écrire à ${selection.nom}…`}
                    value={brouillon}
                    onValueChange={setBrouillon}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        envoyerMessage();
                      }
                    }}
                  />
                  <Button
                    isIconOnly
                    color="primary"
                    aria-label="Envoyer le message"
                    isLoading={envoyer.isLoading}
                    isDisabled={!brouillon.trim()}
                    onPress={envoyerMessage}
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ConsignerAppelModal
        restaurantId={selectedId}
        restaurantNom={selection?.nom ?? ''}
        isOpen={appelOpen}
        onOpenChange={setAppelOpen}
      />
    </div>
  );
}
