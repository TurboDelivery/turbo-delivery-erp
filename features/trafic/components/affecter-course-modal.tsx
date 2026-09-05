'use client';

import { useEffect, useState } from 'react';
import { Button, Chip, Modal } from '@heroui-v3/react';

import { ChampMontant } from '@/components/commons/champs-formulaire';
import { cn } from '@/lib/utils';
import { AlertTriangle, PackageCheck } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import { LivreurTraficVue } from '@/features/trafic/utils/normaliser-trafic';
import {
  useAssignerCourseMutation,
  useCoursesEnAttenteQuery,
} from '@/features/trafic/queries/course-affectation.query';

interface Props {
  livreur: LivreurTraficVue | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Affecte une course EN_ATTENTE à un livreur depuis la carte (CDC §5.4, M4).
 *
 * Garde-fou : seul un livreur présent dans la file d'attente du jour peut
 * recevoir une course. L'écran ne propose déjà le bouton qu'à ceux-là ; ce
 * second contrôle couvre le cas où le livreur sort de la file entre l'ouverture
 * de la fenêtre et la validation.
 */
export function AffecterCourseModal({ livreur, isOpen, onOpenChange }: Props) {
  const { data, isLoading, isError, isFetching, refetch } = useCoursesEnAttenteQuery(isOpen);
  const assigner = useAssignerCourseMutation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [frais, setFrais] = useState('');

  useEffect(() => {
    setSelectedId(null);
    setFrais('');
  }, [livreur?.livreurId, isOpen]);

  const courses = data?.content ?? [];
  const enFile = !!livreur?.enFile;

  const confirmer = () => {
    if (!livreur || !selectedId || !enFile) return;
    assigner.mutate(
      { courseId: selectedId, livreurId: livreur.livreurId, frais: Number(frais) || 0 },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-2xl">
            <Modal.Header>
              <Modal.Heading className="flex flex-col gap-1">
                <span className="text-base font-semibold">Affecter une course</span>
                {livreur && (
                  <span className="text-xs font-normal text-muted">
                    à {livreur.nomComplet}
                    {livreur.rangFile != null ? ` — N°${livreur.rangFile} dans la file du jour` : ''}
                  </span>
                )}
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              {!enFile && (
                <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2">
                  <AlertTriangle
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-warning-soft-foreground"
                  />
                  <p className="text-xs text-foreground">
                    Ce livreur n&apos;est plus dans la file d&apos;attente du jour : il ne peut pas
                    recevoir de course. Faites-le repointer avant d&apos;affecter.
                  </p>
                </div>
              )}
              {isLoading ? (
                <div className="flex flex-col gap-2 py-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div className="h-14 animate-pulse rounded-lg bg-surface-secondary" key={i} />
                  ))}
                </div>
              ) : isError ? (
                /* « Aucune course en attente » ferait renoncer le regulateur alors
                   que des courses attendent peut-etre d etre affectees. */
                <EtatErreur
                  enCours={isFetching}
                  onReessayer={() => void refetch()}
                  quoi="les courses en attente"
                />
              ) : courses.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">Aucune course en attente.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {courses.map((c) => {
                    const selected = selectedId === c.id;
                    return (
                      <button
                        className={cn(
                          'w-full rounded-lg border px-3 py-2 text-left transition-colors',
                          selected
                            ? 'border-accent bg-accent-soft/30'
                            : 'border-separator hover:bg-surface-secondary',
                        )}
                        key={c.id}
                        onClick={() => {
                          setSelectedId(c.id);
                          if (!frais) setFrais(String(c.total ?? 0));
                        }}
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {c.restaurant?.nomEtablissement ?? c.code ?? 'Course'}
                            </p>
                            <p className="text-xs text-muted">
                              {c.code} · {c.nombreCommande} commande
                              {c.nombreCommande > 1 ? 's' : ''}
                            </p>
                          </div>
                          <Chip size="sm" variant="soft">
                            <Chip.Label className="tabular-nums">
                              {c.total != null ? `${c.total} F` : '—'}
                            </Chip.Label>
                          </Chip>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedId && (
                <ChampMontant
                  aide="Montant versé au livreur pour cette course"
                  label="Frais de livraison (FCFA)"
                  onChange={(v) => setFrais(String(v))}
                  valeur={frais === '' ? undefined : Number(frais)}
                />
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={assigner.isPending}
                onPress={() => onOpenChange(false)}
                variant="ghost"
              >
                Annuler
              </Button>
              <Button
                isDisabled={!selectedId || !enFile}
                isPending={assigner.isPending}
                onPress={confirmer}
                variant="primary"
              >
                <PackageCheck aria-hidden="true" className="size-4" />
                Affecter
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
