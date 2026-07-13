'use client';

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Spinner,
} from '@heroui/react';
import { Ear, PhoneCall } from 'lucide-react';

import { IAppelEnCours } from '../types/standard.types';
import { useAppelsEnCoursQuery } from '../queries/standard.query';
import { useAppel } from './appel-provider';

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function depuis(demarreLe: string | null): string {
  if (!demarreLe) return '';
  const sec = Math.max(0, Math.floor((Date.now() - Date.parse(demarreLe)) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `depuis ${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Supervision : liste les appels EN COURS et permet à un superviseur autorisé
 * de rejoindre l'un d'eux en écoute seule (micro coupé, ne raccroche pas).
 */
export function AppelsEnCoursModal({ isOpen, onOpenChange }: Props) {
  const { superviser, enAppel } = useAppel();
  const { data, isLoading } = useAppelsEnCoursQuery(isOpen);
  const appels: IAppelEnCours[] = data ?? [];

  const ecouter = (a: IAppelEnCours) => {
    superviser(a.appelId, `${a.appelantNom} ↔ ${a.appeleNom}`);
    onOpenChange(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" scrollBehavior="inside">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-primary">
                <Ear className="h-5 w-5" />
                Écouter un appel en cours
              </span>
              <span className="text-xs font-normal text-default-400">
                Rejoignez un appel en cours pour l&apos;écouter (micro coupé). Vous n&apos;êtes pas
                entendu et votre départ ne coupe pas l&apos;appel.
              </span>
            </ModalHeader>
            <ModalBody className="pb-5">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner color="primary" label="Chargement…" />
                </div>
              ) : appels.length === 0 ? (
                <p className="py-10 text-center text-default-400">Aucun appel en cours.</p>
              ) : (
                <div className="flex flex-col divide-y divide-default-100">
                  {appels.map((a) => (
                    <div key={a.appelId} className="flex items-center gap-3 py-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success">
                        <PhoneCall className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {a.appelantNom} <span className="text-default-400">↔</span> {a.appeleNom}
                        </p>
                        <p className="truncate text-xs text-default-400">{depuis(a.demarreLe)}</p>
                      </div>
                      <Button
                        color="primary"
                        variant="flat"
                        size="sm"
                        isDisabled={enAppel}
                        startContent={<Ear className="h-4 w-4" />}
                        onPress={() => ecouter(a)}
                      >
                        Écouter
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {enAppel && (
                <p className="text-center text-xs text-warning">
                  Vous êtes déjà sur un appel.
                </p>
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
