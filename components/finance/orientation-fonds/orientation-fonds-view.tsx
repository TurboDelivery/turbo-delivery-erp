'use client';

import { useState } from 'react';
import { Button, Description, FieldError, Label, Modal, Radio, RadioGroup, Spinner, TextArea } from '@heroui-v3/react';
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
    <div className="rounded-xl border border-separator bg-surface p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
            <Building2 aria-hidden="true" className="size-4 text-muted" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{facture.partenaire}</p>
            <p className="text-xs text-muted">{facture.numero}</p>
          </div>
        </div>
        <p className="text-sm font-bold text-foreground whitespace-nowrap">{formatMontant(facture.montant)}</p>
      </div>
      {facture.numeroVisa ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted">
          <span className="font-semibold text-muted">{facture.numeroVisa}</span>
          {facture.dateVisa && <span>visa du {formatDateFr(facture.dateVisa)}</span>}
          {facture.viseur && <span>par {facture.viseur}</span>}
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-warning-soft-foreground">Visa DGA posé automatiquement à l&apos;orientation</p>
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
        <p className="text-sm text-muted">Comptabilité — Direction</p>
        <h1 className="text-2xl font-bold text-primary">Orientation des fonds</h1>
        <p className="text-sm text-muted mt-0.5">
          La Direction décide de la destination des fonds : dépôt en banque ou conservation en caisse (fonds de roulement).
          Décider vaut visa — depuis « En attente visa DGA », le visa DGA est posé automatiquement.
        </p>
      </div>

      {/* Section 1 — En attente d'orientation */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted mb-3">
          En attente d&apos;orientation ({totalAOrienter})
          {orientTronque && (
            <span className="ml-2 font-normal normal-case tracking-normal text-muted">
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
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-surface-secondary animate-pulse" />)}
          </div>
        ) : aOrienter.length === 0 ? (
          <p className="text-sm text-muted py-8 text-center rounded-xl border border-dashed border-separator">Aucune opération en attente d&apos;orientation.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aOrienter.map((f) => (
              <FactureCard key={f.id} facture={f}>
                <Button className="w-full" onPress={() => openOrient(f)} size="sm" variant="primary">
                  <Landmark aria-hidden="true" className="size-4" />
                  Orienter les fonds
                </Button>
              </FactureCard>
            ))}
          </div>
        )}
      </section>

      {/* Section 2 — Conservés en caisse (ré-orientables) */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted mb-3">
          Conservés en caisse ({totalConservees})
          {conserveesTronque && (
            <span className="ml-2 font-normal normal-case tracking-normal text-muted">
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
            {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-surface-secondary animate-pulse" />)}
          </div>
        ) : conservees.length === 0 ? (
          <p className="text-sm text-muted py-8 text-center rounded-xl border border-dashed border-separator">Aucun fonds conservé en caisse.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {conservees.map((f) => (
              <FactureCard key={f.id} facture={f}>
                <div className="mb-2 flex items-center gap-1.5 text-xs text-warning-soft-foreground">
                  <PiggyBank aria-hidden="true" className="size-3.5" /> Fonds de roulement
                </div>
                <Button className="w-full" onPress={() => openReorient(f)} size="sm" variant="outline">
                  <ArrowRightLeft aria-hidden="true" className="size-4" />
                  Ré-orienter vers la banque
                </Button>
              </FactureCard>
            ))}
          </div>
        )}
      </section>

      {/* Modale orientation */}
      <Modal isOpen={!!orientFacture} onOpenChange={(o) => !o && setOrientFacture(null)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-lg">
              <Modal.Header>
                <Modal.Heading className="flex flex-col items-start gap-0">
                  <span className="text-lg font-bold text-foreground">Orienter les fonds</span>
                  {orientFacture && (
                    <span className="text-sm font-normal text-muted">
                      {orientFacture.numero} — {orientFacture.partenaire} ·{' '}
                      {formatMontant(orientFacture.montant)}
                    </span>
                  )}
                </Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-4">
                {/* Rappel en lecture seule (SPEC-RECOUV-002 §4.1) */}
                {orientFacture && (
                  <div className="flex flex-col gap-1 rounded-lg border border-separator bg-surface-secondary p-3 text-xs">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">N° facture</span>
                      <span className="font-medium text-foreground">{orientFacture.numero}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">Partenaire</span>
                      <span className="text-right font-medium text-foreground">
                        {orientFacture.partenaire}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">Montant recouvré</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatMontant(orientFacture.montant)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">N° de visa</span>
                      <span className="font-semibold text-foreground">
                        {orientFacture.numeroVisa ?? '—'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">Date du visa</span>
                      <span className="text-foreground">{formatDateFr(orientFacture.dateVisa)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">Viseur</span>
                      <span className="text-foreground">{orientFacture.viseur ?? '—'}</span>
                    </div>
                  </div>
                )}

                <RadioGroup onChange={(v) => setChoix(v as typeof choix)} value={choix}>
                  <Radio value="DEPOT_BANQUE">
                    <Radio.Content className="items-start">
                      <Radio.Control className="mt-1">
                        <Radio.Indicator />
                      </Radio.Control>
                      <span className="flex flex-col items-start">
                        <span className="text-sm text-foreground">Autoriser le dépôt en banque</span>
                        <span className="text-xs text-muted">
                          Le Comptable pourra exécuter le dépôt bancaire (bordereau + preuve).
                        </span>
                      </span>
                    </Radio.Content>
                  </Radio>
                  <Radio value="CONSERVATION_CAISSE">
                    <Radio.Content className="items-start">
                      <Radio.Control className="mt-1">
                        <Radio.Indicator />
                      </Radio.Control>
                      <span className="flex flex-col items-start">
                        <span className="text-sm text-foreground">
                          Conserver en caisse (fonds de roulement)
                        </span>
                        <span className="text-xs text-muted">
                          Garder les fonds en caisse comme fonds de roulement (aucun dépôt).
                        </span>
                      </span>
                    </Radio.Content>
                  </Radio>
                </RadioGroup>

                {motifRequis && (
                  <div className="flex flex-col gap-1">
                    <Label>Motif de conservation</Label>
                    <TextArea
                      onChange={(e) => setMotif(e.target.value)}
                      placeholder={`Obligatoire — minimum ${MOTIF_MIN} caractères`}
                      required
                      rows={3}
                      value={motif}
                    />
                    {motif.length > 0 && !motifValide ? (
                      <FieldError>{`${motif.trim().length}/${MOTIF_MIN} caractères`}</FieldError>
                    ) : (
                      <Description>{`${motif.trim().length}/${MOTIF_MIN} caractères`}</Description>
                    )}
                  </div>
                )}

                {/* L'avertissement dit quelque chose : il garde son ton, mais en jetons —
                    `bg-amber-50 border-amber-100 text-amber-700` etaient trois teintes de
                    la palette Tailwind, sans variante sombre. */}
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground">
                  <span>
                    La décision est tracée (auteur + horodatage) et vaut autorisation :
                    c&apos;est elle qui débloque (ou non) l&apos;action du Comptable.
                    {!orientFacture?.numeroVisa &&
                      ' Le visa DGA est posé automatiquement (N° de visa généré) par cette décision.'}
                  </span>
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  isDisabled={orienter.isPending}
                  onPress={() => setOrientFacture(null)}
                  variant="ghost"
                >
                  Annuler
                </Button>
                <Button
                  isDisabled={!motifValide}
                  isPending={orienter.isPending}
                  onPress={handleConfirmOrient}
                  variant="primary"
                >
                  {orienter.isPending ? <Spinner size="sm" /> : null}
                  Confirmer
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Modale ré-orientation */}
      <Modal isOpen={!!reorientFacture} onOpenChange={(o) => !o && setReorientFacture(null)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-lg">
              <Modal.Header>
                <Modal.Heading className="flex flex-col items-start gap-0">
                  <span className="text-lg font-bold text-foreground">
                    Ré-orienter vers la banque
                  </span>
                  {reorientFacture && (
                    <span className="text-sm font-normal text-muted">
                      {reorientFacture.numero} — {reorientFacture.partenaire} ·{' '}
                      {formatMontant(reorientFacture.montant)}
                    </span>
                  )}
                </Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>

              <Modal.Body>
                <div className="flex flex-col gap-1">
                  <Label>Motif de ré-orientation</Label>
                  <TextArea
                    onChange={(e) => setMotifReorient(e.target.value)}
                    placeholder={`Obligatoire — minimum ${MOTIF_MIN} caractères (toute sortie de caisse doit être tracée)`}
                    required
                    rows={3}
                    value={motifReorient}
                  />
                  {motifReorient.length > 0 && motifReorient.trim().length < MOTIF_MIN ? (
                    <FieldError>{`${motifReorient.trim().length}/${MOTIF_MIN} caractères`}</FieldError>
                  ) : (
                    <Description>{`${motifReorient.trim().length}/${MOTIF_MIN} caractères`}</Description>
                  )}
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  isDisabled={reorienter.isPending}
                  onPress={() => setReorientFacture(null)}
                  variant="ghost"
                >
                  Annuler
                </Button>
                <Button
                  isDisabled={motifReorient.trim().length < MOTIF_MIN}
                  isPending={reorienter.isPending}
                  onPress={handleConfirmReorient}
                  variant="primary"
                >
                  {reorienter.isPending ? <Spinner size="sm" /> : null}
                  Confirmer la ré-orientation
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
