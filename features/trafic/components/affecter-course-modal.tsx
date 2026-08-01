'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from '@heroui/react';
import { AlertTriangle, PackageCheck } from 'lucide-react';

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
  const { data, isLoading } = useCoursesEnAttenteQuery(isOpen);
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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside" backdrop="blur">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-base font-semibold">Affecter une course</span>
              {livreur && (
                <span className="text-xs font-normal text-default-400">
                  à {livreur.nomComplet}
                  {livreur.rangFile != null ? ` — N°${livreur.rangFile} dans la file du jour` : ''}
                </span>
              )}
            </ModalHeader>
            <ModalBody>
              {!enFile && (
                <div className="flex items-start gap-2 rounded-[14px] bg-warning-50 px-3 py-2 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400">
                  <AlertTriangle className="mt-[2px] h-4 w-4 shrink-0" aria-hidden />
                  <p className="text-xs">
                    Ce livreur n&apos;est plus dans la file d&apos;attente du jour : il ne peut pas
                    recevoir de course. Faites-le repointer avant d&apos;affecter.
                  </p>
                </div>
              )}
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner color="primary" label="Chargement des courses en attente…" />
                </div>
              ) : courses.length === 0 ? (
                <p className="py-8 text-center text-sm text-default-400">Aucune course en attente.</p>
              ) : (
                <div className="space-y-2">
                  {courses.map((c) => {
                    const selected = selectedId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(c.id);
                          if (!frais) setFrais(String(c.total ?? 0));
                        }}
                        className={[
                          'w-full text-left rounded-medium border px-3 py-2 transition-colors',
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-default-200 hover:border-default-300',
                        ].join(' ')}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {c.restaurant?.nomEtablissement ?? c.code ?? 'Course'}
                            </p>
                            <p className="text-xs text-default-500">
                              {c.code} · {c.nombreCommande} commande{c.nombreCommande > 1 ? 's' : ''}
                            </p>
                          </div>
                          <Chip size="sm" variant="flat" color={selected ? 'primary' : 'default'}>
                            {c.total != null ? `${c.total} F` : '—'}
                          </Chip>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedId && (
                <Input
                  label="Frais de livraison (FCFA)"
                  size="sm"
                  type="number"
                  min={0}
                  value={frais}
                  onValueChange={setFrais}
                  className="mt-2"
                  description="Montant versé au livreur pour cette course"
                />
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={assigner.isLoading}>
                Annuler
              </Button>
              <Button
                color="primary"
                startContent={<PackageCheck className="h-4 w-4" />}
                isDisabled={!selectedId || !enFile}
                isLoading={assigner.isLoading}
                onPress={confirmer}
              >
                Affecter
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
