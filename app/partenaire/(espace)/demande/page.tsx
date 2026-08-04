'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Lock, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { ErreurPartenaire, lirePartenaire } from '@/features/espace-partenaire/api';
import { useProfilPartenaire } from '@/features/espace-partenaire/composants/coquille-partenaire';
import FileACompleter from '@/features/espace-partenaire/composants/demande/file-a-completer';
import ModaleDemande from '@/features/espace-partenaire/composants/demande/modale-demande';
import ModeRush from '@/features/espace-partenaire/composants/demande/mode-rush';
import ParcoursComplet from '@/features/espace-partenaire/composants/demande/parcours-complet';
import type { ParametresRush, Zone } from '@/features/espace-partenaire/composants/demande/types';

/**
 * DEMANDE DE TURBOYS — l'écran central de l'espace partenaire (EF-02, EF-07).
 * Étape 1 : zone de livraison (radar / liste / échelle des tarifs mobile).
 * Étape 2 : client & envoi, dans la modale. Bascule Mode Rush verrouillée tant
 * que le manager ne l'a pas activée (RG-10), et hors des plages autorisées.
 */
export default function PageDemande() {
  const profil = useProfilPartenaire();

  const [zones, setZones] = useState<Zone[]>([]);
  const [chargementZones, setChargementZones] = useState(true);
  const [erreurZones, setErreurZones] = useState<string | null>(null);

  const [rush, setRush] = useState<ParametresRush | null>(null);
  const [rushCharge, setRushCharge] = useState(false);

  const [mode, setMode] = useState<'std' | 'rush'>('std');
  const [zoneChoisie, setZoneChoisie] = useState<Zone | null>(null);
  const [signalCompleter, setSignalCompleter] = useState(0);
  const modeUrlApplique = useRef(false);

  const chargerZones = useCallback(async () => {
    setChargementZones(true);
    setErreurZones(null);
    try {
      setZones(await lirePartenaire<Zone[]>('zones'));
    } catch (e) {
      setErreurZones(
        e instanceof ErreurPartenaire ? e.message : 'Une erreur est survenue — réessayez',
      );
    } finally {
      setChargementZones(false);
    }
  }, []);

  const chargerRush = useCallback(async () => {
    try {
      setRush(await lirePartenaire<ParametresRush>('rush'));
    } catch {
      // Repli silencieux sur les indicateurs du profil.
    } finally {
      setRushCharge(true);
    }
  }, []);

  useEffect(() => {
    chargerZones();
    chargerRush();
  }, [chargerZones, chargerRush]);

  // Le paramétrage Rush bouge côté manager : on le relève périodiquement.
  useEffect(() => {
    const intervalle = setInterval(chargerRush, 20_000);
    return () => clearInterval(intervalle);
  }, [chargerRush]);

  const rushActive = rush ? rush.active : profil.rushActive;
  const rushOuvert = rush ? rush.ouvertMaintenant : profil.rushOuvert;
  const rushPermis = rushActive && rushOuvert;

  // ?mode=rush : ouvrir directement le Mode Rush si (et seulement si) c'est permis.
  useEffect(() => {
    if (modeUrlApplique.current || !rushCharge) return;
    modeUrlApplique.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'rush' && rushPermis && rush) {
      setMode('rush');
    }
  }, [rushCharge, rushPermis, rush]);

  // Le Rush se referme tout seul (fin de plage, désactivation manager).
  useEffect(() => {
    if (mode === 'rush' && rushCharge && !rushPermis) {
      setMode('std');
      toast('Mode Rush refermé — hors plage ou désactivé par le manager.');
    }
  }, [mode, rushCharge, rushPermis]);

  function basculerRush() {
    if (!rushActive) {
      toast.error('Mode Rush désactivé — activation réservée au manager (Paramètres).');
      return;
    }
    if (!rushOuvert) {
      toast.error('Hors plages de rush — réessayez pendant les heures de pic.');
      return;
    }
    if (!rush) {
      toast('Paramétrage du Rush en cours de chargement — réessayez dans un instant.');
      chargerRush();
      return;
    }
    setMode('rush');
  }

  const etape = zoneChoisie !== null ? 2 : 1;
  const sousLibelleRush = !rushActive
    ? 'activation réservée au manager'
    : !rushOuvert
      ? 'hors plages de rush'
      : 'un tap = un Turboys';

  const classeEtape = (n: 1 | 2) =>
    `flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold ${
      etape === n ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
    }`;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4 sm:p-6">
      {/* En-tête : titre + étapes */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Demande de Turboys</h1>
          <p className="mt-1 text-sm text-gray-500">
            Touchez la zone de livraison de votre client — le tarif s&apos;affiche sur chaque zone.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          <span className={classeEtape(1)}>1</span>
          Zone de livraison
          <ChevronRight className="h-4 w-4 text-gray-300" aria-hidden />
          <span className={classeEtape(2)}>2</span>
          Client &amp; envoi
        </div>
      </header>

      {/* Bascule Parcours complet | Mode Rush */}
      <div>
        <div className="flex w-fit max-w-full items-center gap-1 rounded-full bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode('std')}
            className={`min-h-[48px] rounded-full px-4 text-sm font-semibold transition-colors ${
              mode === 'std' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Parcours complet
          </button>
          <button
            type="button"
            onClick={basculerRush}
            aria-disabled={!rushPermis}
            className={`flex min-h-[48px] items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
              mode === 'rush'
                ? 'bg-primary text-white shadow-sm'
                : rushPermis
                  ? 'text-gray-600'
                  : 'text-gray-400'
            }`}
          >
            {rushActive ? (
              <Zap className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Lock className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <span className="flex flex-col text-left leading-tight">
              Mode Rush
              <small className="text-[10px] font-medium opacity-70">{sousLibelleRush}</small>
            </span>
          </button>
        </div>
        {!rushActive && (
          <p className="mt-1.5 text-xs text-gray-400">
            <Lock className="mr-1 inline h-3 w-3 align-[-1px]" aria-hidden />
            Mode Rush désactivé — activation réservée au manager, depuis{' '}
            <Link href="/partenaire/parametres" className="font-semibold text-primary underline">
              Paramètres
            </Link>
            .
          </p>
        )}
        {rushActive && !rushOuvert && (
          <p className="mt-1.5 text-xs text-gray-400">
            Hors plages de rush — la bascule s&apos;ouvrira automatiquement aux heures de pic.
          </p>
        )}
      </div>

      {/* Contenu selon le mode */}
      {mode === 'std' || !rush ? (
        <ParcoursComplet
          zones={zones}
          chargement={chargementZones}
          erreur={erreurZones}
          onRecharger={chargerZones}
          onChoisir={setZoneChoisie}
        />
      ) : (
        <ModeRush
          zones={zones}
          parametres={rush}
          onEnvoyee={() => setSignalCompleter((n) => n + 1)}
        />
      )}

      {/* Étape 2 — client & envoi (parcours complet) */}
      <ModaleDemande
        zone={zoneChoisie}
        ouverte={zoneChoisie !== null}
        onFermer={() => setZoneChoisie(null)}
        onEnvoyee={() => setSignalCompleter((n) => n + 1)}
      />

      {/* File épinglée : courses à compléter avant clôture */}
      <FileACompleter signal={signalCompleter} />
    </main>
  );
}
