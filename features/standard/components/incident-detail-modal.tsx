'use client';

import { useEffect, useState } from 'react';
import { Button, Modal, Separator } from '@heroui-v3/react';

import { ChampZoneTexte } from '@/components/commons/champs-formulaire';
import { AlertTriangle, Camera, Clock, ExternalLink, MapPin, MessageSquare, Phone, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { createUrlFile } from '@/utils/createUrlFile';
import {
  IIncident,
  ILivreurTrafic,
  STATUT_ORDRE,
  STATUT_TRAFIC_LABEL,
  StatutIncident,
  useChangerStatutMutation,
} from '@/features/standard';
import { IncidentStatutChip } from './incident-statut-chip';
import { IncidentStatutStepper } from './incident-statut-stepper';
import { useAppel } from './appel-provider';
import { TON_INCIDENT, TON_TRAFIC, lienTelephone } from '../utils/incident-ui.utils';

interface Props {
  incident: IIncident | null;
  /** Fiche terrain du livreur (téléphone, statut de service) si le trafic la connaît. */
  livreur?: ILivreurTrafic;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  canUpdate: boolean;
}

/** Action de transition proposée selon le statut courant (avant-uniquement, RG-24). */
const NEXT_ACTION: Partial<Record<StatutIncident, { next: StatutIncident; label: string }>> = {
  RECU: { next: 'EN_COURS', label: 'Prendre en charge' },
  EN_COURS: { next: 'TRAITE', label: 'Marquer comme traité' },
  TRAITE: { next: 'CLOTURE', label: 'Clôturer' },
};

function formatInstant(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function InfoRow({ icon: Icon, label, children }: { icon: typeof User; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
        <div className="text-sm text-default-700">{children}</div>
      </div>
    </div>
  );
}

export function IncidentDetailModal({ incident, livreur, isOpen, onOpenChange, canUpdate }: Props) {
  const session = useSession();
  const userId = session.data?.user?.id;
  const changerStatut = useChangerStatutMutation();
  const { appelerLivreur, enAppel } = useAppel();
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    // Réinitialise le commentaire à chaque ouverture/changement d'incident.
    setCommentaire('');
  }, [incident?.id, isOpen]);

  if (!incident) return null;

  const action = NEXT_ACTION[incident.statut];
  const hrefTel = lienTelephone(livreur?.telephone);
  const preuveHref = incident.preuveUrl ? createUrlFile(incident.preuveUrl, 'backend') : null;
  const estPhoto = incident.preuveType === 'PHOTO' || incident.preuveType === null;
  const mapsHref =
    incident.latitude != null && incident.longitude != null
      ? `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`
      : null;

  const appliquerTransition = (next: StatutIncident) => {
    if (!userId) return;
    // Garde côté UI cohérente avec le backend : pas de retour arrière.
    if (STATUT_ORDRE[next] < STATUT_ORDRE[incident.statut]) return;
    changerStatut.mutate(
      { id: incident.id, dto: { statut: next, commentaire: commentaire.trim() || undefined }, userId },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-2xl">
            <Modal.Header>
              <Modal.Heading className="flex items-center gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${TON_INCIDENT[incident.statut].pastille}`}
              >
                <AlertTriangle className="h-5 w-5" />
              </span>
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate text-base font-bold">{incident.motifLibelle}</span>
                <IncidentStatutChip statut={incident.statut} />
              </span>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-4">
              <div className="rounded-xl bg-surface-secondary px-4 py-3">
                <IncidentStatutStepper statut={incident.statut} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow icon={User} label="Livreur">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>
                      {livreur?.nomComplet ?? incident.livreurNom ?? (
                        <span className="text-muted">Inconnu</span>
                      )}
                    </span>
                    {livreur && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${TON_TRAFIC[livreur.statut]}`}
                      >
                        {STATUT_TRAFIC_LABEL[livreur.statut]}
                      </span>
                    )}
                  </div>
                  {hrefTel && (
                    <a href={hrefTel} className="text-xs font-medium text-accent hover:underline">
                      {livreur?.telephone}
                    </a>
                  )}
                </InfoRow>
                <InfoRow icon={Clock} label="Signalé le">{formatInstant(incident.signaleLe)}</InfoRow>
              </div>

              {incident.livreurId && (
                <Button
                  className="w-fit"
                  isDisabled={enAppel}
                  size="sm"
                  variant="outline"
                  onPress={() =>
                    appelerLivreur(
                      incident.livreurId,
                      livreur?.nomComplet ?? incident.livreurNom ?? 'Livreur',
                      incident.id,
                    )
                  }
                >
                  <Phone aria-hidden="true" className="size-4" />
                  Appeler le livreur (audio)
                </Button>
              )}

              {incident.description && (
                <>
                  <Separator />
                  <InfoRow icon={MessageSquare} label="Description">
                    <p className="whitespace-pre-wrap">{incident.description}</p>
                  </InfoRow>
                </>
              )}

              <Separator />
              <InfoRow icon={MapPin} label="Position">
                {mapsHref ? (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    Voir sur la carte
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="text-muted">
                      ({incident.latitude?.toFixed(5)}, {incident.longitude?.toFixed(5)})
                    </span>
                  </a>
                ) : (
                  <span className="text-muted">Non géolocalisé</span>
                )}
              </InfoRow>

              <Separator />
              <InfoRow icon={Camera} label="Preuve">
                {preuveHref ? (
                  estPhoto ? (
                    <a href={preuveHref} target="_blank" rel="noopener noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preuveHref}
                        alt="Preuve de l'incident"
                        className="max-h-56 rounded-lg border border-separator object-contain"
                      />
                    </a>
                  ) : (
                    <a
                      href={preuveHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-accent hover:underline"
                    >
                      Ouvrir la preuve
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )
                ) : (
                  <span className="text-muted">Aucune preuve jointe</span>
                )}
              </InfoRow>

              {incident.commentaireTraitement && (
                <>
                  <Separator />
                  <InfoRow icon={MessageSquare} label="Note de traitement">
                    <p className="whitespace-pre-wrap">{incident.commentaireTraitement}</p>
                  </InfoRow>
                </>
              )}

              {canUpdate && action && (
                <>
                  <Separator />
                  <ChampZoneTexte
                    label="Commentaire (optionnel)"
                    lignes={2}
                    onChange={setCommentaire}
                    placeholder="Note jointe à la mise à jour du statut…"
                    valeur={commentaire}
                  />
                </>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button
                isDisabled={changerStatut.isPending}
                onPress={() => onOpenChange(false)}
                variant="ghost"
              >
                Fermer
              </Button>
              {canUpdate && action && (
                <Button
                  isDisabled={!userId}
                  isPending={changerStatut.isPending}
                  onPress={() => appliquerTransition(action.next)}
                  variant="primary"
                >
                  {action.label}
                </Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
