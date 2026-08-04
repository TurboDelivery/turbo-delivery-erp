'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Modal, ModalBody, ModalContent } from '@heroui/react';
import { ArrowLeft, Check, Star, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { ecrirePartenaire, ErreurPartenaire, lirePartenaire } from '@/features/espace-partenaire/api';

import {
  chiffresSeuls,
  formaterFcfa,
  lireJson,
  type ClientRecent,
  type ParametresRush,
  type ReponseDemande,
  type Zone,
} from './types';

/**
 * MODE RUSH (EF-07) : un tap sur une zone = un Turboys qui part.
 * 3 tuiles géantes (zones favorites du paramétrage manager), les autres zones en
 * chips. Le tap ouvre une bottom-sheet légère : clients récents en pastilles
 * (1 tap = envoi avec nom + contact) et, si le manager l'autorise, envoi sans
 * client (données exigées avant clôture). Après envoi : FLASH plein écran ~1,5 s.
 */
export default function ModeRush({
  zones,
  parametres,
  onEnvoyee,
}: {
  zones: Zone[];
  parametres: ParametresRush;
  onEnvoyee: () => void;
}) {
  const [compteur, setCompteur] = useState(0);
  const [clientsRecents, setClientsRecents] = useState<ClientRecent[]>([]);
  const [zoneChoisie, setZoneChoisie] = useState<Zone | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [flash, setFlash] = useState<{ reference: string; zone: string; client: string | null } | null>(null);
  const minuterieFlash = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let arrete = false;
    lirePartenaire<ClientRecent[]>('clients-recents')
      .then((liste) => !arrete && setClientsRecents(liste))
      .catch(() => undefined);
    return () => {
      arrete = true;
      if (minuterieFlash.current) clearTimeout(minuterieFlash.current);
    };
  }, []);

  // Zones favorites du paramétrage manager — repli sur les 3 premières zones.
  const idsFavoris = lireJson<Array<string | number>>(parametres.zonesFavorites, []).map(String);
  const tuiles: Zone[] = [];
  idsFavoris.forEach((id) => {
    const zone = zones.find((z) => String(z.id) === id);
    if (zone && !tuiles.includes(zone)) tuiles.push(zone);
  });
  for (const zone of zones) {
    if (tuiles.length >= 3) break;
    if (!tuiles.includes(zone)) tuiles.push(zone);
  }
  const autres = zones.filter((zone) => !tuiles.includes(zone));

  async function envoyer(client: ClientRecent | null) {
    if (!zoneChoisie || envoi) return;
    if (!client && !parametres.envoiSansClient) return;
    setEnvoi(true);
    try {
      const reponse = await ecrirePartenaire<ReponseDemande>('demandes', {
        zoneId: zoneChoisie.id,
        nomClient: client ? client.nom : null,
        contactClient: client ? chiffresSeuls(client.contact) || client.contact : null,
        montantCommande: null,
        rush: true,
      });
      setCompteur((n) => n + 1);
      setZoneChoisie(null);
      setFlash({ reference: reponse.reference, zone: reponse.zone, client: client?.nom ?? null });
      if (minuterieFlash.current) clearTimeout(minuterieFlash.current);
      minuterieFlash.current = setTimeout(() => setFlash(null), 1500);
      onEnvoyee();
    } catch (e) {
      toast.error(e instanceof ErreurPartenaire ? e.message : 'Une erreur est survenue — réessayez');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-900/90 bg-gray-900 p-4 text-white shadow-md sm:p-5">
      {/* En-tête du panneau Rush */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-extrabold tracking-widest">
          <Zap className="h-3.5 w-3.5" aria-hidden /> MODE RUSH
        </span>
        <span className="min-w-0 flex-1 text-xs font-medium text-gray-400">
          Un geste = un Turboys qui part. Les données se complètent pendant qu&apos;il roule — et
          sont exigées à la clôture.
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-gray-200">
          <b className="tabular-nums">{compteur}</b> envoyée{compteur > 1 ? 's' : ''} ce rush
        </span>
      </div>

      <div>
        <h2 className="text-xl font-extrabold">Touchez la zone, le Turboys part.</h2>
        <p className="mt-0.5 text-sm text-gray-400">
          Vos 3 zones favorites d&apos;abord — client et montant : après, jamais oubliés (verrou à
          la clôture).
        </p>
      </div>

      {/* Tuiles géantes — zones favorites */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tuiles.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => setZoneChoisie(zone)}
            className="flex min-h-[120px] flex-col items-start justify-between rounded-2xl border-2 border-white/10 bg-white/5 p-4 text-left transition-all hover:border-primary active:scale-[0.98]"
          >
            <span className="flex items-center gap-1 text-[10px] font-extrabold tracking-widest text-primary">
              <Star className="h-3 w-3 fill-current" aria-hidden /> ZONE FAVORITE
            </span>
            <span className="text-lg font-extrabold leading-tight">{zone.nom}</span>
            <span className="text-base font-extrabold text-primary">
              {formaterFcfa(zone.tarifFcfa)} F
            </span>
          </button>
        ))}
      </div>

      {/* Autres zones en chips */}
      {autres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {autres.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={() => setZoneChoisie(zone)}
              className="flex min-h-[48px] items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-semibold text-gray-200 transition-colors hover:border-primary active:scale-95"
            >
              {zone.nom}
              <b className="text-primary">{formaterFcfa(zone.tarifFcfa)} F</b>
            </button>
          ))}
        </div>
      )}

      {/* Bottom-sheet : clients récents + envoi */}
      <Modal
        isOpen={zoneChoisie !== null}
        onClose={() => setZoneChoisie(null)}
        placement="bottom"
        hideCloseButton
        scrollBehavior="inside"
        classNames={{
          base: 'm-0 mb-0 w-full max-w-full rounded-b-none rounded-t-3xl sm:mx-auto sm:max-w-lg',
        }}
      >
        <ModalContent>
          {() => (
            <ModalBody className="flex flex-col gap-3 px-5 pb-6 pt-2">
              <span className="mx-auto h-1.5 w-10 rounded-full bg-gray-200" aria-hidden />

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold text-gray-900">
                    {zoneChoisie?.nom}
                  </p>
                  <p className="text-sm font-extrabold text-primary">
                    {zoneChoisie ? `${formaterFcfa(zoneChoisie.tarifFcfa)} F` : ''}
                  </p>
                </div>
                <Button
                  variant="light"
                  size="sm"
                  className="h-10 shrink-0 px-2 font-semibold text-gray-500"
                  startContent={<ArrowLeft className="h-4 w-4" aria-hidden />}
                  onPress={() => setZoneChoisie(null)}
                >
                  Changer
                </Button>
              </div>

              <p className="text-[10px] font-extrabold tracking-widest text-gray-400">
                CLIENTS RÉCENTS — 1 TAP, CONTACT DÉJÀ CONNU
              </p>

              {clientsRecents.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {clientsRecents.map((client, i) => (
                    <button
                      key={`${client.contact}-${i}`}
                      type="button"
                      disabled={envoi}
                      onClick={() => envoyer(client)}
                      className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 text-left transition-colors hover:border-primary disabled:opacity-50"
                    >
                      <span className="min-w-0 truncate text-sm font-bold text-gray-800">
                        {client.nom}
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-500">
                        {client.contact}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
                  Aucun client récent
                  {parametres.envoiSansClient
                    ? ' — envoyez, tout se complète avant la clôture.'
                    : " — l'envoi sans client est désactivé par le manager."}
                </p>
              )}

              {parametres.envoiSansClient && (
                <Button
                  color="primary"
                  className="h-16 font-extrabold"
                  isLoading={envoi}
                  startContent={!envoi && <Zap className="h-5 w-5 shrink-0" aria-hidden />}
                  onPress={() => envoyer(null)}
                >
                  <span className="flex min-w-0 flex-col text-left leading-tight">
                    ENVOYER — compléter pendant la course
                    <small className="text-[11px] font-medium opacity-85">
                      nom, contact et montant seront exigés avant la clôture
                    </small>
                  </span>
                </Button>
              )}
            </ModalBody>
          )}
        </ModalContent>
      </Modal>

      {/* FLASH plein écran après envoi Rush */}
      {flash && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-primary text-white"
          role="status"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <Check className="h-10 w-10" aria-hidden strokeWidth={2.8} />
          </span>
          <p className="text-4xl font-black tracking-widest">PARTI !</p>
          <p className="font-mono text-lg font-bold">{flash.reference}</p>
          <p className="text-sm font-semibold opacity-90">
            {flash.zone}
            {flash.client ? ` · ${flash.client}` : ''}
          </p>
        </div>
      )}
    </div>
  );
}
