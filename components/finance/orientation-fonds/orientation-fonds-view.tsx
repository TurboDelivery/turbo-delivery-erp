'use client';

import { useState } from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Textarea,
} from '@/components/heroui';
import { Landmark, PiggyBank, ArrowRightLeft, Building2 } from 'lucide-react';
import { useFacturesRFQuery, type IFactureRF } from '@/features/responsable-financier';
import EtatErreur from '@/components/commons/EtatErreur';
import { formatMontant } from '@/utils/format.utils';
import {
  useOrienterFondsMutation,
  useReorienterFondsMutation,
} from '@/features/orientation-fonds';


function formatDateFr(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return iso;
  }
}

const MOTIF_MIN = 30;

function FactureCard({ facture, children }: { facture: IFactureRF; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{facture.partenaire}</p>
            <p className="text-xs text-gray-400">{facture.numero}</p>
          </div>
        </div>
        <p className="text-sm font-bold text-red-600 whitespace-nowrap">{formatMontant(facture.montant)}</p>
      </div>
      {facture.numeroVisa ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
          <span className="font-semibold text-indigo-600">{facture.numeroVisa}</span>
          {facture.dateVisa && <span>visa du {formatDateFr(facture.dateVisa)}</span>}
          {facture.viseur && <span>par {facture.viseur}</span>}
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-amber-600">Visa DGA posé automatiquement à l&apos;orientation</p>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function OrientationFondsView() {
  // 2026-07-27 (choix métier) — le visa DGA n'est plus une étape manuelle : décider de
  // l'orientation VAUT visa. On liste donc les factures « En attente visa DGA » (le visa
  // sera posé implicitement par le backend) + le stock « Visé DGA » historique,
  // + les conservées en caisse (ré-orientables).
  const qAttente = useFacturesRFQuery({ periode: 'cycle', statut: 'En attente visa DGA', size: 100 });
  const qVise = useFacturesRFQuery({ periode: 'cycle', statut: 'Visé DGA', size: 100 });
  const qCaisse = useFacturesRFQuery({ periode: 'cycle', statut: 'Conservé en caisse', size: 100 });

  const { data: attenteData, isLoading: loadingAttente } = qAttente;
  const { data: viseData, isLoading: loadingVise } = qVise;
  const { data: caisseData, isLoading: loadingCaisse } = qCaisse;

  // Trois listes agregees derriere un seul indicateur de chargement : si l'un des
  // appels echoue, la file « a orienter » se vidait SILENCIEUSEMENT et le
  // comptable croyait avoir tout traite.
  const erreurOrient = qAttente.isError || qVise.isError;

  const aOrienter = [
    ...(attenteData?.factures?.content ?? []),
    ...(viseData?.factures?.content ?? []),
  ];
  const chargementOrient = loadingAttente || loadingVise;
  const conservees = caisseData?.factures?.content ?? [];

  // Les compteurs de section affichaient `aOrienter.length` et `conservees.length`,
  // c'est-a-dire la taille des PAGES demandees ci-dessus (100 par statut). Un DG
  // lisait donc « 200 en attente d'orientation » quel que soit le stock reel.
  // `totalElements` est le total serveur, calcule sur l'ensemble filtre.
  // On affiche le vrai total ET, quand la liste est tronquee, combien sont
  // rendues : un titre a 340 au-dessus de 200 cartes serait aussi trompeur.
  const totalAOrienter =
    (attenteData?.factures?.totalElements ?? 0) + (viseData?.factures?.totalElements ?? 0);
  const totalConservees = caisseData?.factures?.totalElements ?? 0;
  const orientTronque = totalAOrienter > aOrienter.length;
  const conserveesTronque = totalConservees > conservees.length;

  const orienter = useOrienterFondsMutation();
  const reorienter = useReorienterFondsMutation();

  // Modale orientation
  const [orientFacture, setOrientFacture] = useState<IFactureRF | null>(null);
  const [choix, setChoix] = useState<'DEPOT_BANQUE' | 'CONSERVATION_CAISSE'>('DEPOT_BANQUE');
  const [motif, setMotif] = useState('');

  // Modale ré-orientation
  const [reorientFacture, setReorientFacture] = useState<IFactureRF | null>(null);
  const [motifReorient, setMotifReorient] = useState('');

  const openOrient = (f: IFactureRF) => { setOrientFacture(f); setChoix('DEPOT_BANQUE'); setMotif(''); };
  const openReorient = (f: IFactureRF) => { setReorientFacture(f); setMotifReorient(''); };

  const motifRequis = choix === 'CONSERVATION_CAISSE';
  const motifValide = !motifRequis || motif.trim().length >= MOTIF_MIN;

  const handleConfirmOrient = () => {
    if (!orientFacture || !motifValide) return;
    orienter.mutate(
      { id: orientFacture.id, data: { orientation: choix, motif: motifRequis ? motif.trim() : undefined } },
      { onSuccess: () => setOrientFacture(null) },
    );
  };

  const handleConfirmReorient = () => {
    if (!reorientFacture || motifReorient.trim().length < MOTIF_MIN) return;
    reorienter.mutate(
      { id: reorientFacture.id, data: { motif: motifReorient.trim() } },
      { onSuccess: () => setReorientFacture(null) },
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <p className="text-sm text-gray-500">Comptabilité — Direction</p>
        <h1 className="text-2xl font-bold text-primary">Orientation des fonds</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          La Direction décide de la destination des fonds : dépôt en banque ou conservation en caisse (fonds de roulement).
          Décider vaut visa — depuis « En attente visa DGA », le visa DGA est posé automatiquement.
        </p>
      </div>

      {/* Section 1 — En attente d'orientation */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
          En attente d&apos;orientation ({totalAOrienter})
          {orientTronque && (
            <span className="ml-2 font-normal normal-case tracking-normal text-gray-400">
              {aOrienter.length} affichées
            </span>
          )}
        </h2>
        {erreurOrient ? (
          <EtatErreur
            quoi="les factures à orienter"
            onReessayer={() => {
              qAttente.refetch();
              qVise.refetch();
            }}
            enCours={qAttente.isFetching || qVise.isFetching}
          />
        ) : chargementOrient ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : aOrienter.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center rounded-xl border border-dashed border-gray-200">Aucune opération en attente d&apos;orientation.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aOrienter.map((f) => (
              <FactureCard key={f.id} facture={f}>
                <Button
                  size="sm"
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                  startContent={<Landmark className="w-4 h-4" />}
                  onPress={() => openOrient(f)}
                >
                  Orienter les fonds
                </Button>
              </FactureCard>
            ))}
          </div>
        )}
      </section>

      {/* Section 2 — Conservés en caisse (ré-orientables) */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
          Conservés en caisse ({totalConservees})
          {conserveesTronque && (
            <span className="ml-2 font-normal normal-case tracking-normal text-gray-400">
              {conservees.length} affichées
            </span>
          )}
        </h2>
        {qCaisse.isError ? (
          <EtatErreur
            quoi="les factures conservées en caisse"
            onReessayer={() => qCaisse.refetch()}
            enCours={qCaisse.isFetching}
          />
        ) : loadingCaisse ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : conservees.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center rounded-xl border border-dashed border-gray-200">Aucun fonds conservé en caisse.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {conservees.map((f) => (
              <FactureCard key={f.id} facture={f}>
                <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-2">
                  <PiggyBank className="w-3.5 h-3.5" /> Fonds de roulement
                </div>
                <Button
                  size="sm"
                  variant="bordered"
                  className="w-full border-indigo-300 text-indigo-600"
                  startContent={<ArrowRightLeft className="w-4 h-4" />}
                  onPress={() => openReorient(f)}
                >
                  Ré-orienter vers la banque
                </Button>
              </FactureCard>
            ))}
          </div>
        )}
      </section>

      {/* Modale orientation */}
      <Modal isOpen={!!orientFacture} onOpenChange={(o) => !o && setOrientFacture(null)} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex-col items-start gap-0">
                <span className="text-lg font-bold text-gray-900">Orienter les fonds</span>
                {orientFacture && (
                  <span className="text-sm font-normal text-gray-400">
                    {orientFacture.numero} — {orientFacture.partenaire} · {formatMontant(orientFacture.montant)}
                  </span>
                )}
              </ModalHeader>
              <ModalBody>
                {/* Rappel en lecture seule (SPEC-RECOUV-002 §4.1) */}
                {orientFacture && (
                  <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs space-y-1">
                    <div className="flex justify-between gap-3"><span className="text-gray-400">N° facture</span><span className="font-medium text-gray-800">{orientFacture.numero}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-gray-400">Partenaire</span><span className="font-medium text-gray-800 text-right">{orientFacture.partenaire}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-gray-400">Montant recouvré</span><span className="font-semibold text-red-600">{formatMontant(orientFacture.montant)}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-gray-400">N° de visa</span><span className="font-semibold text-indigo-600">{orientFacture.numeroVisa ?? '—'}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-gray-400">Date du visa</span><span className="text-gray-800">{formatDateFr(orientFacture.dateVisa)}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-gray-400">Viseur</span><span className="text-gray-800">{orientFacture.viseur ?? '—'}</span></div>
                  </div>
                )}
                <RadioGroup value={choix} onValueChange={(v) => setChoix(v as typeof choix)}>
                  <Radio value="DEPOT_BANQUE" description="Le Comptable pourra exécuter le dépôt bancaire (bordereau + preuve).">
                    Autoriser le dépôt en banque
                  </Radio>
                  <Radio value="CONSERVATION_CAISSE" description="Garder les fonds en caisse comme fonds de roulement (aucun dépôt).">
                    Conserver en caisse (fonds de roulement)
                  </Radio>
                </RadioGroup>
                {motifRequis && (
                  <Textarea
                    label="Motif de conservation"
                    placeholder={`Obligatoire — minimum ${MOTIF_MIN} caractères`}
                    value={motif}
                    onValueChange={setMotif}
                    minRows={3}
                    isRequired
                    description={`${motif.trim().length}/${MOTIF_MIN} caractères`}
                    color={motif.length > 0 && !motifValide ? 'danger' : 'default'}
                  />
                )}
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
                  <span>
                    La décision est tracée (auteur + horodatage) et vaut autorisation : c&apos;est elle qui débloque (ou non) l&apos;action du Comptable.
                    {!orientFacture?.numeroVisa && ' Le visa DGA est posé automatiquement (N° de visa généré) par cette décision.'}
                  </span>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} isDisabled={orienter.isPending}>Annuler</Button>
                <Button
                  className="bg-indigo-600 text-white"
                  onPress={handleConfirmOrient}
                  isLoading={orienter.isPending}
                  isDisabled={!motifValide}
                >
                  Confirmer
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modale ré-orientation */}
      <Modal isOpen={!!reorientFacture} onOpenChange={(o) => !o && setReorientFacture(null)} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex-col items-start gap-0">
                <span className="text-lg font-bold text-gray-900">Ré-orienter vers la banque</span>
                {reorientFacture && (
                  <span className="text-sm font-normal text-gray-400">
                    {reorientFacture.numero} — {reorientFacture.partenaire} · {formatMontant(reorientFacture.montant)}
                  </span>
                )}
              </ModalHeader>
              <ModalBody>
                <Textarea
                  label="Motif de ré-orientation"
                  placeholder={`Obligatoire — minimum ${MOTIF_MIN} caractères (toute sortie de caisse doit être tracée)`}
                  value={motifReorient}
                  onValueChange={setMotifReorient}
                  minRows={3}
                  isRequired
                  description={`${motifReorient.trim().length}/${MOTIF_MIN} caractères`}
                  color={motifReorient.length > 0 && motifReorient.trim().length < MOTIF_MIN ? 'danger' : 'default'}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} isDisabled={reorienter.isPending}>Annuler</Button>
                <Button
                  className="bg-indigo-600 text-white"
                  onPress={handleConfirmReorient}
                  isLoading={reorienter.isPending}
                  isDisabled={motifReorient.trim().length < MOTIF_MIN}
                >
                  Confirmer la ré-orientation
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
