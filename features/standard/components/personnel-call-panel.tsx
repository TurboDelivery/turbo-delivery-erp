'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Delete,
  History,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Search,
  Users,
  X,
} from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import { getUsers } from '@/src/actions/users.actions';

import { useAppel } from './appel-provider';
import { useAppelsQuery } from '../queries/standard.query';
import { IAppelLog } from '../types/standard.types';
import { formaterDuree, initialesDe } from '../utils/appel-ui.utils';

interface Contact {
  id: string;
  nom: string;
  sousTitre: string;
}

const TOUCHES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

/**
 * Panneau d'appel du personnel Turbo (style messagerie) : bouton flottant →
 * recherche + liste de contacts (appel audio in-app pair-à-pair) + clavier
 * (repli tel: pour un numéro externe). Visible seulement si la config
 * « appels entre personnel » est activée.
 */
export function PersonnelCallPanel() {
  const { appelerPersonnel, appelsPersonnelActifs, enAppel } = useAppel();
  const { data: session } = useSession();
  const moiId = session?.user?.id;

  const [ouvert, setOuvert] = useState(false);
  const [onglet, setOnglet] = useState<'contacts' | 'clavier' | 'journal'>('contacts');
  const [recherche, setRecherche] = useState('');
  const [numero, setNumero] = useState('');

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['personnel-contacts'],
    queryFn: () => getUsers(),
    enabled: ouvert && appelsPersonnelActifs,
    staleTime: 5 * 60 * 1000,
  });

  // Journal : MES appels (appelant ou appelé), rafraîchi à chaque ouverture
  // de l'onglet — 15 s de refetch pour voir un appel qui vient de se terminer.
  const journalActif = ouvert && onglet === 'journal' && !!moiId;
  // `journalActif` garde AUSSI le déclenchement de la requête, pas seulement son
  // intervalle. Ce panneau est monté dans le layout : sans cette garde, le journal
  // partait sur CHAQUE page protégée, panneau fermé, et même quand les appels entre
  // personnel sont désactivés en configuration (le `return null` est plus bas, donc
  // après les hooks).
  const {
    data: journal,
    isLoading: journalCharge,
    isError: journalErreur,
    isFetching: journalRecharge,
    refetch: rechargerJournal,
  } = useAppelsQuery(
    0,
    30,
    journalActif ? 15_000 : undefined,
    journalActif ? moiId : undefined,
    journalActif && appelsPersonnelActifs,
  );

  const contacts: Contact[] = useMemo(() => {
    const users = (data as any)?.content ?? [];
    return users
      .filter((u: any) => u && u.id && u.id !== moiId && u.status !== 0 && !u.deleted)
      .map((u: any) => {
        const nom = `${u.nom ?? ''} ${u.prenoms ?? ''}`.trim() || u.username || 'Utilisateur';
        return { id: u.id, nom, sousTitre: u.username || u.email || '' };
      })
      .sort((a: Contact, b: Contact) => a.nom.localeCompare(b.nom));
  }, [data, moiId]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) => c.nom.toLowerCase().includes(q) || c.sousTitre.toLowerCase().includes(q),
    );
  }, [contacts, recherche]);

  // Non affiché tant que la fonctionnalité n'est pas activée dans la config.
  if (!appelsPersonnelActifs) return null;

  const lancer = (c: Contact) => {
    if (enAppel) return;
    appelerPersonnel(c.id, c.nom);
    setOuvert(false);
  };

  const appelTel = () => {
    if (!numero.trim()) return;
    window.location.href = `tel:${numero.replace(/\s+/g, '')}`;
  };

  return (
    <>
      {/* Bouton flottant */}
      {!ouvert && (
        <button
          type="button"
          onClick={() => setOuvert(true)}
          aria-label="Appeler un membre du personnel"
          className="fixed bottom-6 left-6 z-90 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl ring-1 ring-white/10 transition hover:bg-emerald-500 active:scale-95"
        >
          <Phone className="h-6 w-6" />
        </button>
      )}

      {/* Panneau */}
      {ouvert && (
        <div className="fixed inset-x-0 bottom-0 z-95 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-80">
          <div className="flex max-h-[75vh] flex-col overflow-hidden bg-linear-to-b from-slate-800 to-slate-900 text-white shadow-2xl ring-1 ring-white/10 rounded-t-3xl sm:rounded-3xl">
            {/* En-tête */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-emerald-300" /> Appeler le personnel
              </span>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Onglets */}
            <div className="flex gap-1 px-3 pt-3">
              {(['contacts', 'clavier', 'journal'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOnglet(t)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    onglet === t ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
                  }`}
                >
                  {t === 'contacts' ? 'Contacts' : t === 'clavier' ? 'Clavier' : 'Journal'}
                </button>
              ))}
            </div>

            {onglet === 'journal' ? (
              <JournalAppels
                moiId={moiId}
                journal={(journal?.content ?? []) as IAppelLog[]}
                charge={journalCharge}
                enErreur={journalErreur}
                rechargement={journalRecharge}
                onReessayer={() => rechargerJournal()}
                onRappeler={(id, nom) => {
                  if (enAppel) return;
                  appelerPersonnel(id, nom);
                  setOuvert(false);
                }}
              />
            ) : onglet === 'contacts' ? (
              <>
                <div className="p-3">
                  <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                    <Search className="h-4 w-4 text-white/50" />
                    <input
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                      placeholder="Rechercher un collègue…"
                      className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-hidden"
                    />
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
                  {isLoading ? (
                    <p className="py-8 text-center text-sm text-white/40">Chargement…</p>
                  ) : isError ? (
                    // `dark` re-scope les variables HeroUI : le panneau est sombre en
                    // dur, sans cela le titre de EtatErreur serait noir sur noir.
                    <div className="dark">
                      <EtatErreur
                        quoi="les contacts"
                        onReessayer={() => refetch()}
                        enCours={isFetching}
                      />
                    </div>
                  ) : filtres.length === 0 ? (
                    <p className="py-8 text-center text-sm text-white/40">Aucun contact.</p>
                  ) : (
                    filtres.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => lancer(c)}
                        disabled={enAppel}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/10 disabled:opacity-40"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-600 text-sm font-bold">
                          {initialesDe(c.nom)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{c.nom}</span>
                          {c.sousTitre && (
                            <span className="block truncate text-[11px] text-white/40">{c.sousTitre}</span>
                          )}
                        </span>
                        <Phone className="h-4 w-4 shrink-0 text-emerald-300" />
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="p-4">
                <div className="mb-3 flex min-h-10 items-center justify-center rounded-xl bg-white/5 px-3 text-2xl font-light tracking-widest tabular-nums">
                  {numero || <span className="text-white/30">Numéro</span>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {TOUCHES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNumero((n) => (n.length < 20 ? n + t : n))}
                      className="rounded-xl bg-white/10 py-3 text-lg font-semibold transition hover:bg-white/20 active:scale-95"
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={appelTel}
                    disabled={!numero.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold transition hover:bg-emerald-500 disabled:opacity-40"
                  >
                    <Phone className="h-5 w-5" /> Appeler
                  </button>
                  <button
                    type="button"
                    onClick={() => setNumero((n) => n.slice(0, -1))}
                    disabled={!numero}
                    aria-label="Effacer"
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 disabled:opacity-40"
                  >
                    <Delete className="h-5 w-5" />
                  </button>
                </div>
                <p className="mt-2 text-center text-[11px] text-white/40">
                  Le clavier compose un appel téléphonique (repli). Les appels in-app se lancent depuis
                  l&apos;onglet Contacts.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** Ligne du journal : direction, nom, heure, durée — style sombre du panneau. */
function JournalAppels({
  moiId,
  journal,
  charge,
  enErreur,
  rechargement,
  onReessayer,
  onRappeler,
}: {
  moiId?: string;
  journal: IAppelLog[];
  charge: boolean;
  enErreur: boolean;
  rechargement: boolean;
  onReessayer: () => void;
  onRappeler: (id: string, nom: string) => void;
}) {
  if (charge) {
    return <p className="py-8 text-center text-sm text-white/40">Chargement…</p>;
  }
  if (enErreur) {
    // Sans ce cas, un journal injoignable affichait « Aucun appel pour le
    // moment », qui se lit comme un historique reellement vide.
    return (
      <div className="dark">
        <EtatErreur quoi="vos appels" onReessayer={onReessayer} enCours={rechargement} />
      </div>
    );
  }
  if (journal.length === 0) {
    return (
      <p className="flex flex-col items-center gap-2 py-8 text-center text-sm text-white/40">
        <History className="h-6 w-6" /> Aucun appel pour le moment.
      </p>
    );
  }
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-2">
      {journal.map((a) => {
        const sortant = a.appelantId === moiId;
        const manque = a.statut === 'MANQUE' || a.statut === 'REJETE';
        // L'AUTRE partie de l'appel, vue de moi.
        const nom = (sortant ? a.appeleNom : a.appelantNom) ?? 'Appel';
        const autreId = sortant ? a.appeleId : a.appelantId;
        const rappelable = !!autreId && a.contexte === 'PAIR_VERS_PAIR';
        const quand = new Date(a.declencheLe).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        const Direction = manque ? PhoneMissed : sortant ? PhoneOutgoing : PhoneIncoming;
        // Direction et issue en TOUTES LETTRES : la flèche seule ne se lit pas.
        const libelleDirection = manque
          ? a.statut === 'MANQUE'
            ? 'Manqué'
            : 'Rejeté'
          : sortant
            ? 'Sortant'
            : 'Entrant';
        return (
          <div
            key={a.id}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/10"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                manque
                  ? 'bg-rose-500/20 text-rose-300'
                  : sortant
                    ? 'bg-white/10 text-emerald-300'
                    : 'bg-sky-500/15 text-sky-300'
              }`}
            >
              <Direction className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-sm font-medium ${manque ? 'text-rose-200' : ''}`}>
                {nom}
              </span>
              <span className="block truncate text-[11px] text-white/40">
                <span className={manque ? 'text-rose-300' : sortant ? 'text-emerald-300/80' : 'text-sky-300/80'}>
                  {libelleDirection}
                </span>
                {' · '}
                {quand}
                {a.dureeSec != null && a.dureeSec > 0 && ` · ${formaterDuree(a.dureeSec)}`}
              </span>
            </span>
            {rappelable && (
              <button
                type="button"
                onClick={() => onRappeler(autreId!, nom)}
                aria-label={`Rappeler ${nom}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-emerald-300 transition hover:bg-emerald-600 hover:text-white"
              >
                <Phone className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
