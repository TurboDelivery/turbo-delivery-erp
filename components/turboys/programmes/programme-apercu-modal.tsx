'use client';

import React from 'react';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import { Download, Send } from 'lucide-react';

import { IProgramme } from '@/features/turboys/types/programme.types';
import { useEnvoyerProgrammeMutation } from '@/features/turboys/queries/programme.query';
import { exporterProgrammeIndividuelPdf } from '@/features/turboys/utils/programmes-export.utils';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';

const JOURS: Array<{ key: string; label: string }> = [
  { key: 'LUNDI', label: 'Lundi' },
  { key: 'MARDI', label: 'Mardi' },
  { key: 'MERCREDI', label: 'Mercredi' },
  { key: 'JEUDI', label: 'Jeudi' },
  { key: 'VENDREDI', label: 'Vendredi' },
  { key: 'SAMEDI', label: 'Samedi' },
  { key: 'DIMANCHE', label: 'Dimanche' },
];

const hhmm = (t?: string | null) => (t ?? '').slice(0, 5);

interface Props {
  programme: IProgramme | null;
  annee: number;
  semaine: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Aperçu « Programme individuel » (maquette M2) : la semaine d'un livreur en
 * lecture, avec export PDF mono-livreur.
 */
export function ProgrammeApercuModal({ programme, annee, semaine, isOpen, onOpenChange }: Props) {
  const prenom = (programme?.livreurNom ?? '').split(' ')[0] || 'Bonjour';
  const envoyer = useEnvoyerProgrammeMutation();
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-start gap-0">
              <span className="text-base font-semibold text-primary">Programme individuel</span>
              <span className="text-sm font-normal text-default-500">
                {programme?.livreurNom ?? '—'}
                {programme?.typeLivreur ? ` · ${getTurboyTypeDisplay(programme.typeLivreur).label}` : ''} — Semaine {semaine} / {annee}
              </span>
            </ModalHeader>
            <ModalBody>
              {programme && (
                <div className="rounded-xl border border-default-200 p-4">
                  <p className="mb-3 text-sm font-medium text-default-700">
                    {prenom}, voici ton programme cette semaine
                  </p>
                  <ul className="divide-y divide-default-100">
                    {JOURS.map((jr) => {
                      const j = programme.jours?.find((x) => (x.jour ?? '').toUpperCase() === jr.key);
                      const repos = !j || !j.actif;
                      return (
                        <li key={jr.key} className="flex items-center justify-between py-2 text-sm">
                          <span className="text-default-600">{jr.label}</span>
                          {repos ? (
                            <span className="font-medium text-danger">Repos</span>
                          ) : (
                            <span className="font-medium text-default-800">
                              {hhmm(j!.debut)} – {hhmm(j!.fin)}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Fermer
              </Button>
              <Button
                variant="flat"
                isDisabled={!programme}
                startContent={<Download className="h-4 w-4" />}
                onPress={() => programme && exporterProgrammeIndividuelPdf(programme, annee, semaine)}
              >
                Exporter PDF
              </Button>
              <Button
                color="primary"
                isDisabled={!programme}
                isLoading={envoyer.isLoading}
                startContent={!envoyer.isLoading && <Send className="h-4 w-4" />}
                onPress={() => programme && envoyer.mutate(programme.id)}
              >
                Envoyer au livreur
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
