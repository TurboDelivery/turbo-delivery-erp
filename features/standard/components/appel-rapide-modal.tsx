'use client';

import { useMemo, useState } from 'react';
import { Avatar, Button, InputGroup, Modal, TextField } from '@heroui-v3/react';
import { Phone, Search } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
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
  const { data, isLoading, isError, isFetching, refetch } = useLivreursListQuery();
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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-lg">
            <Modal.Header>
              <Modal.Heading className="flex flex-col gap-1">
                <span>Appeler un livreur</span>
                <span className="text-sm font-normal text-muted">
                  Recherchez un livreur et lancez un appel audio in-app.
                </span>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3 pb-5">
              <TextField
                aria-label="Rechercher un livreur"
                onChange={setRecherche}
                value={recherche}
              >
                <InputGroup>
                  <InputGroup.Prefix>
                    <Search aria-hidden="true" className="size-4" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    autoFocus
                    placeholder="Nom, téléphone ou matricule…"
                  />
                </InputGroup>
              </TextField>

              {isLoading ? (
                <div className="flex flex-col gap-2 py-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div className="h-12 animate-pulse rounded-lg bg-surface-secondary" key={i} />
                  ))}
                </div>
              ) : isError ? (
                // « Aucun livreur trouvé » sur une panne laisserait croire que la
                // recherche a abouti : le standard renoncerait a appeler.
                <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les livreurs" />
              ) : livreurs.length === 0 ? (
                <p className="py-10 text-center text-muted">Aucun livreur trouvé.</p>
              ) : (
                <div className="flex max-h-[50vh] flex-col divide-y divide-separator overflow-y-auto">
                  {livreurs.map((l) => (
                    <div className="flex items-center gap-3 py-2" key={l.id}>
                      <Avatar className="shrink-0" size="sm">
                        <Avatar.Image alt="" src={l.avatarUrl ?? undefined} />
                        <Avatar.Fallback>
                          {nomLivreur(l).slice(0, 2).toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{nomLivreur(l)}</p>
                        <p className="truncate text-xs text-muted">
                          {l.telephone || '—'}
                          {l.matricule ? ` · ${l.matricule}` : ''}
                        </p>
                      </div>
                      <Button
                        isDisabled={enAppel}
                        onPress={() => lancer(l)}
                        size="sm"
                        variant="outline"
                      >
                        <Phone aria-hidden="true" className="size-4" />
                        Appeler
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {enAppel && (
                <p className="text-center text-xs text-warning-soft-foreground">
                  Un appel est déjà en cours.
                </p>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
