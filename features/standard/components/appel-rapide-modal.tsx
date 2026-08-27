'use client';

import { useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Spinner,
} from '@/components/heroui';
import { Phone, Search } from 'lucide-react';

import { useLivreursListQuery } from '@/features/tickets/queries/livreur-list.query';
import { DeliveryMan } from '@/types/models';

import { useAppel } from './appel-provider';

interface AppelRapideModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function nomLivreur(l: DeliveryMan): string {
  return [l.nom, l.prenoms].filter(Boolean).join(' ').trim() || l.telephone || 'Livreur';
}

/**
 * Appel rapide STANDARD → livreur, **sans incident** : recherche un livreur et
 * lance l'appel audio in-app (via {@link useAppel}). Répond au besoin « appeler
 * rapidement un livreur » de la console.
 */
export function AppelRapideModal({ isOpen, onOpenChange }: AppelRapideModalProps) {
  const { appelerLivreur, enAppel } = useAppel();
  const { data, isLoading } = useLivreursListQuery();
  const [recherche, setRecherche] = useState('');

  const livreurs = useMemo(() => {
    const tous = (data ?? []).filter((l) => !l.deleted);
    const q = recherche.trim().toLowerCase();
    const filtres = q
      ? tous.filter(
          (l) =>
            nomLivreur(l).toLowerCase().includes(q) ||
            (l.telephone ?? '').toLowerCase().includes(q) ||
            (l.matricule ?? '').toLowerCase().includes(q),
        )
      : tous;
    return filtres
      .sort((a, b) => nomLivreur(a).localeCompare(nomLivreur(b)))
      .slice(0, 50);
  }, [data, recherche]);

  const lancer = (l: DeliveryMan) => {
    appelerLivreur(l.id, nomLivreur(l));
    onOpenChange(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" scrollBehavior="inside">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-primary">Appeler un livreur</span>
              <span className="text-sm font-normal text-default-500">
                Recherchez un livreur et lancez un appel audio in-app.
              </span>
            </ModalHeader>
            <ModalBody className="pb-5">
              <Input
                autoFocus
                placeholder="Nom, téléphone ou matricule…"
                value={recherche}
                onValueChange={setRecherche}
                startContent={<Search className="h-4 w-4 text-default-400" />}
                isClearable
                onClear={() => setRecherche('')}
              />

              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner color="primary" label="Chargement des livreurs…" />
                </div>
              ) : livreurs.length === 0 ? (
                <p className="py-10 text-center text-default-400">Aucun livreur trouvé.</p>
              ) : (
                <div className="flex max-h-[50vh] flex-col divide-y divide-default-100 overflow-y-auto">
                  {livreurs.map((l) => (
                    <div key={l.id} className="flex items-center gap-3 py-2">
                      <Avatar
                        src={l.avatarUrl ?? undefined}
                        name={nomLivreur(l)}
                        size="sm"
                        className="shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{nomLivreur(l)}</p>
                        <p className="truncate text-xs text-default-400">
                          {l.telephone || '—'}
                          {l.matricule ? ` · ${l.matricule}` : ''}
                        </p>
                      </div>
                      <Button
                        color="success"
                        variant="flat"
                        size="sm"
                        isDisabled={enAppel}
                        startContent={<Phone className="h-4 w-4" />}
                        onPress={() => lancer(l)}
                      >
                        Appeler
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {enAppel && (
                <p className="text-center text-xs text-warning">
                  Un appel est déjà en cours.
                </p>
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
