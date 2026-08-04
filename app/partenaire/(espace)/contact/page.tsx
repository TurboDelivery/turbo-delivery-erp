'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Tab,
  Tabs,
  Textarea,
} from '@heroui/react';
import {
  Headset,
  MapPinned,
  MessageCircle,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

import { ecrirePartenaire, ErreurPartenaire, lirePartenaire } from '@/features/espace-partenaire/api';

/** EF-06 — Contact Turbo : chat avec le standard + appels (journal, rappel). */

const NUMERO_STANDARD = process.env.NEXT_PUBLIC_STANDARD_TELEPHONE ?? '+225 07 09 05 89 59';
const LIEN_TEL = `tel:${NUMERO_STANDARD.replace(/[^+\d]/g, '')}`;

type MessageStandard = {
  id: string;
  emetteur: 'PARTENAIRE' | 'STANDARD' | 'SYSTEME';
  contenu: string;
  courseId: string | null;
  accuseAt: string | null;
  creeLe: string;
};

type Appel = {
  id: string;
  sens: string;
  statut: 'DEMANDE_RAPPEL' | 'ABOUTI' | 'MANQUE';
  dureeSecondes: number | null;
  courseId: string | null;
  creeLe: string;
};

function heure(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function memeJour(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function libelleJour(iso: string): string {
  const date = new Date(iso);
  const aujourdHui = new Date();
  const hier = new Date();
  hier.setDate(aujourdHui.getDate() - 1);
  if (memeJour(date, aujourdHui)) return "Aujourd'hui";
  if (memeJour(date, hier)) return 'Hier';
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function dateCourte(iso: string): string {
  const date = new Date(iso);
  const aujourdHui = new Date();
  const hier = new Date();
  hier.setDate(aujourdHui.getDate() - 1);
  if (memeJour(date, aujourdHui)) return heure(iso);
  if (memeJour(date, hier)) return `Hier ${heure(iso)}`;
  return `${date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} ${heure(iso)}`;
}

function formaterDuree(secondes: number | null): string | null {
  if (!secondes || secondes <= 0) return null;
  const minutes = Math.floor(secondes / 60);
  const reste = secondes % 60;
  return minutes > 0 ? `${minutes} min ${String(reste).padStart(2, '0')}` : `${reste} s`;
}

const STATUTS_APPEL: Record<Appel['statut'], { libelle: string; classes: string }> = {
  DEMANDE_RAPPEL: { libelle: 'Rappel demandé', classes: 'bg-amber-50 text-amber-600' },
  ABOUTI: { libelle: 'Appel abouti', classes: 'bg-emerald-50 text-emerald-600' },
  MANQUE: { libelle: 'Appel manqué', classes: 'bg-red-50 text-red-500' },
};

function IconeAppel({ appel }: { appel: Appel }) {
  if (appel.statut === 'MANQUE') return <PhoneMissed className="h-4 w-4" aria-hidden />;
  if (appel.statut === 'DEMANDE_RAPPEL') return <PhoneCall className="h-4 w-4" aria-hidden />;
  return appel.sens === 'ENTRANT' ? (
    <PhoneIncoming className="h-4 w-4" aria-hidden />
  ) : (
    <PhoneOutgoing className="h-4 w-4" aria-hidden />
  );
}

function messageErreur(erreur: unknown): string {
  return erreur instanceof ErreurPartenaire ? erreur.message : 'Une erreur est survenue — réessayez';
}

/** Badge « course » cliquable quand un message est rattaché à une course. */
function BadgeCourse() {
  return (
    <Link
      href="/partenaire/courses"
      className="mb-1.5 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary"
    >
      <MapPinned className="h-3 w-3" aria-hidden /> Course
    </Link>
  );
}

export default function PageContact() {
  const [onglet, setOnglet] = useState<'chat' | 'appels'>('chat');

  // ----- Chat -----
  const [messages, setMessages] = useState<MessageStandard[]>([]);
  const [chargementChat, setChargementChat] = useState(true);
  const [erreurChat, setErreurChat] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const refFil = useRef<HTMLDivElement>(null);

  // ----- Appels -----
  const [appels, setAppels] = useState<Appel[]>([]);
  const [chargementAppels, setChargementAppels] = useState(true);
  const [modaleRappel, setModaleRappel] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [demandeEnCours, setDemandeEnCours] = useState(false);

  const chargerMessages = useCallback(async () => {
    try {
      const liste = await lirePartenaire<MessageStandard[]>('messages', { page: '0' });
      // L'API renvoie du plus récent au plus ancien → on affiche en ordre chronologique.
      setMessages([...liste].reverse());
      setErreurChat(null);
    } catch (erreur) {
      setErreurChat(messageErreur(erreur));
    } finally {
      setChargementChat(false);
    }
  }, []);

  const chargerAppels = useCallback(async () => {
    try {
      const liste = await lirePartenaire<Appel[]>('appels', { page: '0' });
      setAppels(liste);
    } catch {
      // Silencieux : le journal réessaie au prochain cycle.
    } finally {
      setChargementAppels(false);
    }
  }, []);

  useEffect(() => {
    chargerMessages();
    chargerAppels();
    const intervalleChat = setInterval(chargerMessages, 10_000);
    const intervalleAppels = setInterval(chargerAppels, 30_000);
    return () => {
      clearInterval(intervalleChat);
      clearInterval(intervalleAppels);
    };
  }, [chargerMessages, chargerAppels]);

  // À l'ouverture de l'onglet chat, tout est considéré lu (EF-06.6).
  useEffect(() => {
    if (onglet !== 'chat') return;
    ecrirePartenaire('messages/marquer-lus').catch(() => undefined);
  }, [onglet]);

  // Le fil reste calé en bas (nouveaux messages, retour sur l'onglet).
  useEffect(() => {
    const conteneur = refFil.current;
    if (conteneur) conteneur.scrollTop = conteneur.scrollHeight;
  }, [messages.length, onglet, chargementChat]);

  async function envoyer(evenement: FormEvent) {
    evenement.preventDefault();
    const contenu = brouillon.trim();
    if (!contenu || envoiEnCours) return;
    setEnvoiEnCours(true);
    try {
      await ecrirePartenaire('messages', { contenu });
      setBrouillon('');
      await chargerMessages();
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function accuser(id: string) {
    try {
      await ecrirePartenaire(`messages/${id}/accuser`);
      setMessages((precedents) =>
        precedents.map((message) =>
          message.id === id ? { ...message, accuseAt: new Date().toISOString() } : message,
        ),
      );
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    }
  }

  function tracerAppelSortant() {
    // L'appel part via tel: — on journalise sans bloquer la numérotation.
    ecrirePartenaire('appels/sortant', {})
      .then(chargerAppels)
      .catch(() => undefined);
  }

  async function demanderRappel() {
    if (demandeEnCours) return;
    setDemandeEnCours(true);
    try {
      await ecrirePartenaire('appels/rappel', {
        commentaire: commentaire.trim() || undefined,
      });
      setModaleRappel(false);
      setCommentaire('');
      toast.success('Le standard vous rappelle au plus vite');
      chargerAppels();
    } catch (erreur) {
      toast.error(messageErreur(erreur));
    } finally {
      setDemandeEnCours(false);
    }
  }

  // Hauteur bornée à la fenêtre (moins la barre basse mobile = pb-20 de la coquille) :
  // le fil de chat défile en interne et la zone de saisie reste toujours visible.
  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col p-4 sm:p-6 lg:h-[100dvh]">
      {/* En-tête standard */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
          <Headset className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold sm:text-base">Standard Turbo Delivery</p>
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            En ligne · répond en ~2 min
          </p>
        </div>
        <span className="hidden rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 sm:block">
          7 j/7 de 8 h à 23 h
        </span>
      </div>

      <Tabs
        aria-label="Contact Turbo"
        selectedKey={onglet}
        onSelectionChange={(cle) => setOnglet(cle === 'appels' ? 'appels' : 'chat')}
        color="primary"
        variant="solid"
        radius="lg"
        size="lg"
        fullWidth
        classNames={{ panel: 'flex min-h-0 flex-1 flex-col px-0 pb-0 pt-3' }}
      >
        {/* ============ CHAT ============ */}
        <Tab
          key="chat"
          title={
            <span className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" aria-hidden /> Chat
            </span>
          }
        >
          <div
            ref={refFil}
            className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-100/60 p-3 sm:p-4"
          >
            {chargementChat ? (
              <div className="flex h-full items-center justify-center py-10">
                <Spinner color="primary" label="Chargement des messages…" />
              </div>
            ) : erreurChat && messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
                <p className="text-sm text-gray-500">{erreurChat}</p>
                <Button size="lg" variant="flat" onPress={() => chargerMessages()}>
                  Réessayer
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-gray-400">
                <MessageCircle className="h-8 w-8" aria-hidden />
                <p className="text-sm">Aucun message — écrivez au standard ci-dessous.</p>
              </div>
            ) : (
              messages.map((message, indice) => {
                const jourPrecedent = indice > 0 ? libelleJour(messages[indice - 1].creeLe) : null;
                const jour = libelleJour(message.creeLe);
                return (
                  <div key={message.id}>
                    {jour !== jourPrecedent && (
                      <p className="my-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        {jour}
                      </p>
                    )}

                    {message.emetteur === 'SYSTEME' ? (
                      <div className="mx-auto mb-2.5 max-w-[92%] rounded-xl border border-gray-200 bg-white/80 p-3 text-center sm:max-w-[80%]">
                        {message.courseId && <BadgeCourse />}
                        <p className="text-xs leading-relaxed text-gray-600">{message.contenu}</p>
                        <p className="mt-1 text-[10px] text-gray-400">{heure(message.creeLe)}</p>
                        {message.accuseAt ? (
                          <p className="mt-2 text-xs font-medium text-gray-500">
                            👍 vu à {heure(message.accuseAt)}
                          </p>
                        ) : (
                          <button
                            onClick={() => accuser(message.id)}
                            className="mt-2 inline-flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                          >
                            👍 Accuser réception
                          </button>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`mb-2.5 max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[75%] ${
                          message.emetteur === 'PARTENAIRE'
                            ? 'ml-auto rounded-br-md bg-gray-900 text-white'
                            : 'rounded-bl-md border border-gray-200 bg-white text-gray-800'
                        }`}
                      >
                        {message.courseId && <BadgeCourse />}
                        <p className="whitespace-pre-wrap break-words">{message.contenu}</p>
                        <p
                          className={`mt-1 text-[10px] ${
                            message.emetteur === 'PARTENAIRE' ? 'text-white/60' : 'text-gray-400'
                          }`}
                        >
                          {heure(message.creeLe)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Zone de saisie */}
          <form onSubmit={envoyer} className="mt-3 flex items-center gap-2">
            <Input
              value={brouillon}
              onValueChange={setBrouillon}
              placeholder="Écrire au standard…"
              size="lg"
              radius="lg"
              variant="bordered"
              classNames={{ inputWrapper: 'bg-white' }}
              aria-label="Message au standard"
            />
            <Button
              type="submit"
              color="primary"
              radius="lg"
              size="lg"
              isIconOnly
              isLoading={envoiEnCours}
              isDisabled={!brouillon.trim()}
              aria-label="Envoyer le message"
            >
              <Send className="h-5 w-5" aria-hidden />
            </Button>
          </form>
        </Tab>

        {/* ============ APPELS ============ */}
        <Tab
          key="appels"
          title={
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4" aria-hidden /> Appels
            </span>
          }
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-2">
            {/* Joindre le standard */}
            <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
              <h2 className="text-sm font-bold">Joindre le standard</h2>
              <p className="mt-1 text-xs text-gray-500">
                Disponible 7 j/7 de 8 h à 23 h — pour toute question sur vos courses.
              </p>
              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <Button
                  as="a"
                  href={LIEN_TEL}
                  onPress={tracerAppelSortant}
                  size="lg"
                  radius="lg"
                  className="flex-1 bg-emerald-500 font-semibold text-white"
                  startContent={<Phone className="h-5 w-5" aria-hidden />}
                >
                  Appeler le standard
                </Button>
                <Button
                  size="lg"
                  radius="lg"
                  variant="bordered"
                  color="primary"
                  className="flex-1 font-semibold"
                  startContent={<PhoneCall className="h-5 w-5" aria-hidden />}
                  onPress={() => setModaleRappel(true)}
                >
                  Être rappelé
                </Button>
              </div>
              <p className="mt-3 text-center text-xs text-gray-400">
                Numéro direct : {NUMERO_STANDARD}
              </p>
            </section>

            {/* Journal des appels */}
            <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
              <h2 className="text-sm font-bold">Journal des appels</h2>
              <p className="mt-1 text-xs text-gray-500">
                Tous vos échanges avec Turbo sont conservés.
              </p>
              {chargementAppels ? (
                <div className="flex justify-center py-8">
                  <Spinner color="primary" />
                </div>
              ) : appels.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">Aucun appel pour le moment.</p>
              ) : (
                <ul className="mt-2 divide-y divide-gray-100">
                  {appels.map((appel) => {
                    const statut = STATUTS_APPEL[appel.statut] ?? {
                      libelle: appel.statut,
                      classes: 'bg-gray-100 text-gray-500',
                    };
                    const duree = formaterDuree(appel.dureeSecondes);
                    return (
                      <li key={appel.id} className="flex min-h-[56px] items-center gap-3 py-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${statut.classes}`}
                        >
                          <IconeAppel appel={appel} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{statut.libelle}</p>
                          <p className="truncate text-xs text-gray-500">
                            {appel.sens === 'ENTRANT' ? 'Appel entrant' : 'Appel sortant'} — standard
                            {duree ? ` · ${duree}` : ''}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-gray-400">
                          {dateCourte(appel.creeLe)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </Tab>
      </Tabs>

      {/* Modale « Être rappelé » */}
      <Modal
        isOpen={modaleRappel}
        onOpenChange={(ouvert) => {
          if (!demandeEnCours) setModaleRappel(ouvert);
        }}
        placement="center"
        radius="lg"
      >
        <ModalContent>
          <ModalHeader className="flex-col gap-1 pb-1">
            Être rappelé
            <span className="text-xs font-normal text-gray-500">
              Le standard vous rappelle dès que possible au numéro de votre compte.
            </span>
          </ModalHeader>
          <ModalBody>
            <Textarea
              value={commentaire}
              onValueChange={setCommentaire}
              label="Commentaire (facultatif)"
              placeholder="Ex. : question sur ma course en cours…"
              minRows={2}
              radius="lg"
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button
              size="lg"
              radius="lg"
              variant="flat"
              onPress={() => setModaleRappel(false)}
              isDisabled={demandeEnCours}
            >
              Annuler
            </Button>
            <Button
              size="lg"
              radius="lg"
              color="primary"
              className="font-semibold"
              onPress={demanderRappel}
              isLoading={demandeEnCours}
              startContent={!demandeEnCours ? <PhoneCall className="h-4 w-4" aria-hidden /> : null}
            >
              Demander le rappel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
