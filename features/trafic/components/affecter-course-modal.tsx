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
import { PackageCheck } from 'lucide-react';

import { LivreurTrafic } from '@/features/trafic/types/trafic.type';
import {
  useAssignerCourseMutation,
  useCoursesEnAttenteQuery,
} from '@/features/trafic/queries/course-affectation.query';

interface Props {
  livreur: LivreurTrafic | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Affecte une course EN_ATTENTE à un livreur depuis la carte (CDC §5.4, M4). */
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

  const confirmer = () => {
    if (!livreur || !selectedId) return;
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
                <span className="text-xs font-normal text-default-400">à {livreur.nomComplet}</span>
              )}
            </ModalHeader>
            <ModalBody>
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
                isDisabled={!selectedId}
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
