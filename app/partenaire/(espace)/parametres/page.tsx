'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Switch,
} from '@heroui/react';
import { KeyRound, Lock, MapPinned, Plus, ShieldCheck, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { ecrirePartenaire, ErreurPartenaire, lirePartenaire } from '@/features/espace-partenaire/api';
import { useProfilPartenaire } from '@/features/espace-partenaire/composants/coquille-partenaire';

/** EF-08 / RG-10 — Paramètres du store : Mode Rush (acte Manager, PIN), PIN, zones & tarifs. */

type EtatRush = {
  active: boolean;
  ouvertMaintenant: boolean;
  plagesHoraires: string | null;
  restreintAuxPlages: boolean;
  zonesFavorites: string | null;
  envoiSansClient: boolean;
  pinDefini: boolean;
};

type Zone = {
  id: string | number;
  zone: string;
  nom: string;
  tarifFcfa: number;
  latitude: number;
  longitude: number;
};

type Plage = { debut: string; fin: string };

const PLAGES_PAR_DEFAUT: Plage[] = [
  { debut: '12:00', fin: '14:00' },
  { debut: '19:00', fin: '21:00' },
];

const ROLES_MANAGER = ['OWNER', 'ADMIN', 'MANAGER'];

function formatFcfa(montant: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(montant)} F`;
}

function chiffresSeuls(valeur: string): string {
  return valeur.replace(/\D/g, '').slice(0, 4);
}

function lirePlages(brut: string | null): Plage[] {
  if (!brut) return PLAGES_PAR_DEFAUT;
  try {
    const liste = JSON.parse(brut);
    if (!Array.isArray(liste)) return PLAGES_PAR_DEFAUT;
    const plages = liste
      .filter((p) => p && typeof p.debut === 'string' && typeof p.fin === 'string')
      .map((p) => ({ debut: p.debut, fin: p.fin }))
      .slice(0, 4);
    return plages.length > 0 ? plages : PLAGES_PAR_DEFAUT;
  } catch {
    return PLAGES_PAR_DEFAUT;
  }
}

function lireFavorites(brut: string | null): [string, string, string] {
  let ids: string[] = [];
  if (brut) {
    try {
      const liste = JSON.parse(brut);
      if (Array.isArray(liste)) ids = liste.map((v) => String(v));
    } catch {
      ids = [];
    }
  }
  return [ids[0] ?? '', ids[1] ?? '', ids[2] ?? ''];
}

export default function PageParametres() {
  const profil = useProfilPartenaire();
  const estManager = ROLES_MANAGER.includes((profil.role ?? '').toUpperCase());

  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);
  const [rush, setRush] = useState<EtatRush | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);

  // Formulaire Rush
  const [active, setActive] = useState(false);
  const [plages, setPlages] = useState<Plage[]>(PLAGES_PAR_DEFAUT);
  const [restreintAuxPlages, setRestreintAuxPlages] = useState(true);
  const [favorites, setFavorites] = useState<[string, string, string]>(['', '', '']);
  const [envoiSansClient, setEnvoiSansClient] = useState(false);
  const modifieRef = useRef(false);

  // Modale PIN (enregistrement du paramétrage)
  const [modalePinOuverte, setModalePinOuverte] = useState(false);
  const [pin, setPin] = useState('');
  const [erreurPin, setErreurPin] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const modaleRef = useRef(false);

  // Carte Code PIN Manager
  const [ancienPin, setAncienPin] = useState('');
  const [nouveauPin, setNouveauPin] = useState('');
  const [confirmationPin, setConfirmationPin] = useState('');
  const [erreurCartePin, setErreurCartePin] = useState<string | null>(null);
  const [envoiPin, setEnvoiPin] = useState(false);

  const appliquerEtat = useCallback((etat: EtatRush) => {
    setRush(etat);
    setActive(etat.active);
    setPlages(lirePlages(etat.plagesHoraires));
    setRestreintAuxPlages(etat.restreintAuxPlages);
    setFavorites(lireFavorites(etat.zonesFavorites));
    setEnvoiSansClient(etat.envoiSansClient);
    modifieRef.current = false;
  }, []);

  const chargerTout = useCallback(async () => {
    setErreurChargement(null);
    try {
      const [etat, listeZones] = await Promise.all([
        lirePartenaire<EtatRush>('rush'),
        lirePartenaire<Zone[]>('zones'),
      ]);
      appliquerEtat(etat);
      setZones(listeZones);
    } catch (e) {
      setErreurChargement(
        e instanceof ErreurPartenaire ? e.message : 'Une erreur est survenue — réessayez',
      );
    } finally {
      setChargement(false);
    }
  }, [appliquerEtat]);

  useEffect(() => {
    chargerTout();
  }, [chargerTout]);

  // Rafraîchissement périodique : uniquement quand le formulaire n'est pas en cours d'édition.
  useEffect(() => {
    const intervalle = setInterval(() => {
      if (modifieRef.current || modaleRef.current) return;
      lirePartenaire<EtatRush>('rush')
        .then(appliquerEtat)
        .catch(() => undefined);
    }, 15_000);
    return () => clearInterval(intervalle);
  }, [appliquerEtat]);

  function toucher() {
    modifieRef.current = true;
  }

  function majPlage(index: number, champ: keyof Plage, valeur: string) {
    toucher();
    setPlages((courantes) =>
      courantes.map((p, i) => (i === index ? { ...p, [champ]: valeur } : p)),
    );
  }

  function ajouterPlage() {
    toucher();
    setPlages((courantes) =>
      courantes.length >= 4 ? courantes : [...courantes, { debut: '', fin: '' }],
    );
  }

  function retirerPlage(index: number) {
    toucher();
    setPlages((courantes) =>
      courantes.length <= 1 ? courantes : courantes.filter((_, i) => i !== index),
    );
  }

  function majFavorite(index: number, cle: string) {
    toucher();
    setFavorites((courantes) => {
      const suivantes = [...courantes] as [string, string, string];
      suivantes[index] = cle === 'aucune' ? '' : cle;
      return suivantes;
    });
  }

  function ouvrirModalePin() {
    setPin('');
    setErreurPin(null);
    setModalePinOuverte(true);
    modaleRef.current = true;
  }

  function fermerModalePin() {
    setModalePinOuverte(false);
    modaleRef.current = false;
  }

  async function confirmerEnregistrement() {
    if (pin.length !== 4) return;
    setEnregistrement(true);
    setErreurPin(null);
    const plagesValides = plages.filter((p) => p.debut && p.fin);
    const idsFavorites = favorites
      .filter((cle) => cle !== '')
      .map((cle) => zones.find((z) => String(z.id) === cle)?.id ?? cle);
    try {
      await ecrirePartenaire('rush', {
        pin,
        active,
        plagesHoraires: JSON.stringify(plagesValides),
        restreintAuxPlages,
        zonesFavorites: JSON.stringify(idsFavorites),
        envoiSansClient,
      });
      fermerModalePin();
      toast.success('Paramétrage du Mode Rush enregistré');
      const etat = await lirePartenaire<EtatRush>('rush');
      appliquerEtat(etat);
    } catch (e) {
      // RG-10 : l'erreur serveur est affichée telle quelle (« Code PIN refusé »), sans indice.
      setErreurPin(e instanceof ErreurPartenaire ? e.message : 'Une erreur est survenue — réessayez');
    } finally {
      setEnregistrement(false);
    }
  }

  async function soumettrePin() {
    setErreurCartePin(null);
    if (nouveauPin.length !== 4) {
      setErreurCartePin('Le nouveau PIN doit comporter exactement 4 chiffres.');
      return;
    }
    if (nouveauPin !== confirmationPin) {
      setErreurCartePin('Les deux saisies du nouveau PIN ne correspondent pas.');
      return;
    }
    setEnvoiPin(true);
    try {
      await ecrirePartenaire(
        'rush/pin',
        rush?.pinDefini ? { nouveauPin, ancienPin } : { nouveauPin },
      );
      toast.success(rush?.pinDefini ? 'Code PIN modifié' : 'Code PIN défini');
      setAncienPin('');
      setNouveauPin('');
      setConfirmationPin('');
      const etat = await lirePartenaire<EtatRush>('rush');
      appliquerEtat(etat);
    } catch (e) {
      setErreurCartePin(
        e instanceof ErreurPartenaire ? e.message : 'Une erreur est survenue — réessayez',
      );
    } finally {
      setEnvoiPin(false);
    }
  }

  if (chargement) {
    return (
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <Spinner color="primary" label="Chargement des paramètres…" />
      </main>
    );
  }

  if (erreurChargement || !rush) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 sm:p-6">
        <p className="text-center text-sm text-gray-600">
          {erreurChargement ?? 'Une erreur est survenue — réessayez'}
        </p>
        <Button color="primary" radius="lg" className="min-h-12 font-semibold" onPress={() => { setChargement(true); chargerTout(); }}>
          Réessayer
        </Button>
      </main>
    );
  }

  const optionsZone = [
    { cle: 'aucune', libelle: '— Aucune —' },
    ...zones.map((z) => ({ cle: String(z.id), libelle: `${z.zone} — ${formatFcfa(z.tarifFcfa)}` })),
  ];

  const classeHeure =
    'h-12 min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-base text-gray-900 outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      {/* En-tête */}
      <header className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Configuration du store
        </p>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="mt-1 text-sm text-gray-500">
          Les réglages marqués « Manager » exigent le code PIN manager et sont journalisés.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        {/* ===== Carte Mode Rush ===== */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Zap className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold">Mode Rush</h2>
                  <Chip
                    size="sm"
                    variant="flat"
                    startContent={<Lock className="ml-1 h-3 w-3" aria-hidden />}
                    classNames={{ base: 'bg-gray-100', content: 'text-[10px] font-bold tracking-wider text-gray-600' }}
                  >
                    MANAGER
                  </Chip>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Demande en un geste aux heures de pic. Désactivé par défaut — seul le manager
                  peut l&apos;activer, le staff ne voit qu&apos;une bascule verrouillée.
                </p>
              </div>
            </div>
            <Switch
              isSelected={active}
              onValueChange={(v) => { toucher(); setActive(v); }}
              isDisabled={!estManager}
              color="primary"
              size="lg"
              aria-label="Activer le Mode Rush"
            />
          </div>

          {!estManager && (
            <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
              Activation réservée au manager.
            </p>
          )}

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {/* Plages horaires */}
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Plages de Rush autorisées
              </p>
              <div className="flex flex-col gap-2">
                {plages.map((plage, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={plage.debut}
                      onChange={(e) => majPlage(i, 'debut', e.target.value)}
                      disabled={!estManager}
                      aria-label={`Début de la plage ${i + 1}`}
                      className={classeHeure}
                    />
                    <span className="text-gray-400" aria-hidden>
                      →
                    </span>
                    <input
                      type="time"
                      value={plage.fin}
                      onChange={(e) => majPlage(i, 'fin', e.target.value)}
                      disabled={!estManager}
                      aria-label={`Fin de la plage ${i + 1}`}
                      className={classeHeure}
                    />
                    {plages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => retirerPlage(i)}
                        disabled={!estManager}
                        aria-label={`Retirer la plage ${i + 1}`}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {plages.length < 4 && (
                <Button
                  variant="flat"
                  radius="lg"
                  size="sm"
                  className="mt-2 min-h-10 font-medium"
                  isDisabled={!estManager}
                  onPress={ajouterPlage}
                  startContent={<Plus className="h-4 w-4" aria-hidden />}
                >
                  Ajouter une plage
                </Button>
              )}

              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Hors plages : Rush inaccessible</p>
                  <p className="text-xs text-gray-500">
                    En dehors de ces créneaux, même activé, le Rush se verrouille.
                  </p>
                </div>
                <Switch
                  isSelected={restreintAuxPlages}
                  onValueChange={(v) => { toucher(); setRestreintAuxPlages(v); }}
                  isDisabled={!estManager}
                  color="primary"
                  aria-label="Hors plages : Rush inaccessible"
                />
              </div>
            </div>

            {/* Zones favorites */}
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Zones favorites (3 tuiles géantes)
              </p>
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <Select
                    key={i}
                    aria-label={`Zone favorite ${i + 1}`}
                    placeholder={`Zone favorite ${i + 1}`}
                    selectedKeys={favorites[i] ? [favorites[i]] : []}
                    onChange={(e) => majFavorite(i, e.target.value)}
                    isDisabled={!estManager}
                    radius="lg"
                    classNames={{ trigger: 'min-h-12 bg-gray-50' }}
                  >
                    {optionsZone.map((o) => (
                      <SelectItem key={o.cle}>{o.libelle}</SelectItem>
                    ))}
                  </Select>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Envoi sans client autorisé</p>
                  <p className="text-xs text-gray-500">
                    Sinon, seuls les clients récents (1 tap) sont permis en Rush.
                  </p>
                </div>
                <Switch
                  isSelected={envoiSansClient}
                  onValueChange={(v) => { toucher(); setEnvoiSansClient(v); }}
                  isDisabled={!estManager}
                  color="primary"
                  aria-label="Envoi sans client autorisé"
                />
              </div>
            </div>
          </div>

          {/* Enregistrer */}
          <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center">
            <Button
              color="primary"
              radius="lg"
              className="min-h-12 font-semibold"
              isDisabled={!estManager}
              onPress={ouvrirModalePin}
            >
              Enregistrer le paramétrage
            </Button>
            <p className="text-sm text-gray-500">
              Mode Rush : {rush.active ? 'activé' : 'désactivé'}
              {rush.active && (rush.ouvertMaintenant ? ' — ouvert actuellement' : ' — hors plage actuellement')}
            </p>
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Toute modification est journalisée (auteur, date, avant/après) — journal consultable
            par Turbo (audit).
          </p>
        </section>

        {/* ===== Carte Code PIN Manager ===== */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-bold">Code PIN Manager</h2>
              <p className="mt-1 text-sm text-gray-500">
                {rush.pinDefini
                  ? 'Un PIN est défini. Pour le changer, saisissez l’ancien puis le nouveau (4 chiffres).'
                  : 'Aucun PIN défini pour le moment — définissez-le pour protéger le Mode Rush (4 chiffres).'}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {rush.pinDefini && (
              <Input
                label="Ancien PIN"
                type="password"
                inputMode="numeric"
                value={ancienPin}
                onValueChange={(v) => setAncienPin(chiffresSeuls(v))}
                isDisabled={!estManager}
                radius="lg"
                classNames={{ inputWrapper: 'min-h-12 bg-gray-50' }}
              />
            )}
            <Input
              label="Nouveau PIN"
              type="password"
              inputMode="numeric"
              value={nouveauPin}
              onValueChange={(v) => setNouveauPin(chiffresSeuls(v))}
              isDisabled={!estManager}
              radius="lg"
              classNames={{ inputWrapper: 'min-h-12 bg-gray-50' }}
            />
            <Input
              label="Confirmer le nouveau PIN"
              type="password"
              inputMode="numeric"
              value={confirmationPin}
              onValueChange={(v) => setConfirmationPin(chiffresSeuls(v))}
              isDisabled={!estManager}
              radius="lg"
              classNames={{ inputWrapper: 'min-h-12 bg-gray-50' }}
            />
          </div>

          {erreurCartePin && <p className="mt-2 text-sm text-danger">{erreurCartePin}</p>}

          <Button
            color="primary"
            variant={rush.pinDefini ? 'flat' : 'solid'}
            radius="lg"
            className="mt-3 min-h-12 font-semibold"
            isDisabled={
              !estManager ||
              nouveauPin.length !== 4 ||
              confirmationPin.length !== 4 ||
              (rush.pinDefini && ancienPin.length !== 4)
            }
            isLoading={envoiPin}
            onPress={soumettrePin}
          >
            {rush.pinDefini ? 'Changer le PIN' : 'Définir le PIN (4 chiffres)'}
          </Button>

          {!estManager && (
            <p className="mt-3 text-xs text-gray-400">
              La gestion du PIN est réservée au manager.
            </p>
          )}
        </section>

        {/* ===== Carte Zones & tarifs (lecture seule) ===== */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPinned className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-bold">Zones &amp; tarifs de livraison</h2>
              <p className="mt-1 text-sm text-gray-500">
                Les zones et leurs tarifs sont définis par Turbo — toute demande d&apos;évolution
                passe par le standard.
              </p>
            </div>
          </div>

          <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100">
            {zones.length === 0 && (
              <li className="px-3 py-3 text-sm text-gray-400">Aucune zone configurée.</li>
            )}
            {zones.map((z) => (
              <li key={String(z.id)} className="flex items-center justify-between gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{z.zone}</p>
                  {z.nom && z.nom !== z.zone && (
                    <p className="truncate text-xs text-gray-400">{z.nom}</p>
                  )}
                </div>
                <p className="shrink-0 text-sm font-bold tabular-nums">{formatFcfa(z.tarifFcfa)}</p>
              </li>
            ))}
          </ul>

          <Button
            as={Link}
            href="/partenaire/contact"
            variant="flat"
            radius="lg"
            className="mt-4 min-h-12 font-semibold"
          >
            Contacter le standard
          </Button>
        </section>
      </div>

      {/* ===== Modale PIN — confirmation du paramétrage ===== */}
      <Modal isOpen={modalePinOuverte} onClose={fermerModalePin} placement="center" size="sm">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" aria-hidden />
            Code PIN manager requis
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-500">
              Saisissez le code PIN à 4 chiffres pour confirmer l&apos;enregistrement.
            </p>
            <Input
              autoFocus
              type="password"
              inputMode="numeric"
              aria-label="Code PIN à 4 chiffres"
              value={pin}
              onValueChange={(v) => { setPin(chiffresSeuls(v)); setErreurPin(null); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pin.length === 4 && !enregistrement) confirmerEnregistrement();
              }}
              radius="lg"
              classNames={{
                inputWrapper: 'min-h-14 bg-gray-50',
                input: 'text-center text-2xl font-bold tracking-[0.6em]',
              }}
            />
            {erreurPin && <p className="text-sm text-danger">{erreurPin}</p>}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" radius="lg" className="min-h-12" onPress={fermerModalePin}>
              Annuler
            </Button>
            <Button
              color="primary"
              radius="lg"
              className="min-h-12 font-semibold"
              isDisabled={pin.length !== 4}
              isLoading={enregistrement}
              onPress={confirmerEnregistrement}
            >
              Confirmer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </main>
  );
}
