'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from '@/components/heroui';
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
        <p className="text-xs uppercase tracking-wide text-default-400">{label}</p>
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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside" backdrop="blur">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${TON_INCIDENT[incident.statut].pastille}`}
              >
                <AlertTriangle className="h-5 w-5" />
              </span>
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate text-base font-bold">{incident.motifLibelle}</span>
                <IncidentStatutChip statut={incident.statut} />
              </span>
            </ModalHeader>

            <ModalBody>
              <div className="rounded-large bg-default-50 px-4 py-3">
                <IncidentStatutStepper statut={incident.statut} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow icon={User} label="Livreur">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>
                      {livreur?.nomComplet ?? incident.livreurNom ?? (
                        <span className="text-default-400">Inconnu</span>
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
                    <a href={hrefTel} className="text-xs font-medium text-primary hover:underline">
                      {livreur?.telephone}
                    </a>
                  )}
                </InfoRow>
                <InfoRow icon={Clock} label="Signalé le">{formatInstant(incident.signaleLe)}</InfoRow>
              </div>

              {incident.livreurId && (
                <Button
                  size="sm"
                  className="w-fit bg-success/10 font-semibold text-success-soft-foreground"
                  startContent={<Phone className="h-4 w-4" />}
                  isDisabled={enAppel}
                  onPress={() =>
                    appelerLivreur(
                      incident.livreurId,
                      livreur?.nomComplet ?? incident.livreurNom ?? 'Livreur',
                      incident.id,
                    )
                  }
                >
                  Appeler le livreur (audio)
                </Button>
              )}

              {incident.description && (
                <>
                  <Divider />
                  <InfoRow icon={MessageSquare} label="Description">
                    <p className="whitespace-pre-wrap">{incident.description}</p>
                  </InfoRow>
                </>
              )}

              <Divider />
              <InfoRow icon={MapPin} label="Position">
                {mapsHref ? (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Voir sur la carte
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="text-default-400">
                      ({incident.latitude?.toFixed(5)}, {incident.longitude?.toFixed(5)})
                    </span>
                  </a>
                ) : (
                  <span className="text-default-400">Non géolocalisé</span>
                )}
              </InfoRow>

              <Divider />
              <InfoRow icon={Camera} label="Preuve">
                {preuveHref ? (
                  estPhoto ? (
                    <a href={preuveHref} target="_blank" rel="noopener noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preuveHref}
                        alt="Preuve de l'incident"
                        className="max-h-56 rounded-medium border border-default-200 object-contain"
                      />
                    </a>
                  ) : (
                    <a
                      href={preuveHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Ouvrir la preuve
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )
                ) : (
                  <span className="text-default-400">Aucune preuve jointe</span>
                )}
              </InfoRow>

              {incident.commentaireTraitement && (
                <>
                  <Divider />
                  <InfoRow icon={MessageSquare} label="Note de traitement">
                    <p className="whitespace-pre-wrap">{incident.commentaireTraitement}</p>
                  </InfoRow>
                </>
              )}

              {canUpdate && action && (
                <>
                  <Divider />
                  <Textarea
                    label="Commentaire (optionnel)"
                    placeholder="Note jointe à la mise à jour du statut…"
                    value={commentaire}
                    onValueChange={setCommentaire}
                    minRows={2}
                  />
                </>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={changerStatut.isPending}>
                Fermer
              </Button>
              {canUpdate && action && (
                <Button
                  color="primary"
                  isLoading={changerStatut.isPending}
                  isDisabled={!userId}
                  onPress={() => appliquerTransition(action.next)}
                >
                  {action.label}
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
