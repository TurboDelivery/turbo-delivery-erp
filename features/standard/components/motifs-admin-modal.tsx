'use client';

import { useState } from 'react';
import { Button, Card, Chip, Modal, Separator, Switch } from '@heroui-v3/react';

import { ChampMontant, ChampTexte } from '@/components/commons/champs-formulaire';
import { Plus, Save } from 'lucide-react';
import EtatErreur from '@/components/commons/EtatErreur';
import {
  IIncidentMotif,
  useCreerMotifMutation,
  useModifierMotifMutation,
  useMotifsQuery,
} from '@/features/standard';

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Ligne éditable d'un motif : libellé / ordre / activation, enregistrée à la demande. */
function MotifRow({ motif }: { motif: IIncidentMotif }) {
  const modifier = useModifierMotifMutation();
  const [libelle, setLibelle] = useState(motif.libelle);
  const [ordre, setOrdre] = useState(String(motif.ordre ?? 0));
  const [actif, setActif] = useState(motif.actif);

  const dirty = libelle !== motif.libelle || ordre !== String(motif.ordre ?? 0) || actif !== motif.actif;

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-separator px-3 py-2">
      <Chip className="mb-2 font-mono" size="sm" variant="soft">
        <Chip.Label>{motif.code}</Chip.Label>
      </Chip>
      <div className="min-w-40 flex-1">
        <ChampTexte label="Libellé" onChange={setLibelle} valeur={libelle} />
      </div>
      <div className="w-24">
        <ChampMontant label="Ordre" onChange={(v) => setOrdre(String(v))} valeur={Number(ordre) || 0} />
      </div>
      <Switch className="mb-2" isSelected={actif} onChange={setActif} size="sm">
        <Switch.Content>
          <Switch.Thumb />
        </Switch.Content>
        <span className="ms-2 text-xs text-muted">{actif ? 'Actif' : 'Masqué'}</span>
      </Switch>
      <Button
        aria-label="Enregistrer ce motif"
        className="mb-2"
        isDisabled={!dirty || !libelle.trim()}
        isIconOnly
        isPending={modifier.isPending}
        size="sm"
        variant="outline"
        onPress={() =>
          modifier.mutate({
            code: motif.code,
            dto: { libelle: libelle.trim(), ordre: Number(ordre) || 0, actif },
          })
        }
      >
        <Save aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

export function MotifsAdminModal({ isOpen, onOpenChange }: Props) {
  const { data: motifs, isLoading, isError, isFetching, refetch } = useMotifsQuery();
  const creer = useCreerMotifMutation();

  const [code, setCode] = useState('');
  const [libelle, setLibelle] = useState('');
  const [ordre, setOrdre] = useState('');

  const peutCreer = code.trim().length > 0 && libelle.trim().length > 0;

  const ajouter = () => {
    if (!peutCreer) return;
    creer.mutate(
      { code: code.trim(), libelle: libelle.trim(), ordre: ordre ? Number(ordre) : undefined },
      {
        onSuccess: () => {
          setCode('');
          setLibelle('');
          setOrdre('');
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-2xl">
            <Modal.Header>
              <Modal.Heading className="flex flex-col gap-1">
                <span className="text-base font-semibold">Motifs d&apos;incident</span>
                <span className="text-xs font-normal text-muted">
                  Liste paramétrable proposée aux livreurs (RG-22). Masquer ne supprime pas
                  l&apos;historique.
                </span>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-3">
              {isLoading ? (
                <div className="flex flex-col gap-2 py-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div className="h-14 animate-pulse rounded-lg bg-surface-secondary" key={i} />
                  ))}
                </div>
              ) : isError ? (
                // Sans ce cas, une lecture en echec affichait « Aucun motif pour le
                // moment » : on recreerait des motifs qui existent deja.
                <EtatErreur
                  enCours={isFetching}
                  onReessayer={() => refetch()}
                  quoi="les motifs d'incident"
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {(motifs ?? []).map((m) => (
                    <MotifRow key={m.code} motif={m} />
                  ))}
                  {(motifs ?? []).length === 0 && (
                    <p className="py-6 text-center text-sm text-muted">Aucun motif pour le moment.</p>
                  )}
                </div>
              )}

              <Separator className="my-2" />

              <Card>
                <Card.Content className="gap-2 p-3">
                  <p className="text-xs font-semibold tracking-wide uppercase text-muted">
                    Nouveau motif
                  </p>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="w-36">
                      <ChampTexte
                        label="Code"
                        onChange={(v) => setCode(v.toUpperCase())}
                        placeholder="EX : PANNE"
                        valeur={code}
                      />
                    </div>
                    <div className="min-w-40 flex-1">
                      <ChampTexte
                        label="Libellé"
                        onChange={setLibelle}
                        placeholder="Panne"
                        valeur={libelle}
                      />
                    </div>
                    <div className="w-24">
                      <ChampMontant
                        label="Ordre"
                        onChange={(v) => setOrdre(String(v))}
                        valeur={ordre === '' ? undefined : Number(ordre)}
                      />
                    </div>
                    <Button
                      className="mb-2"
                      isDisabled={!peutCreer}
                      isPending={creer.isPending}
                      onPress={ajouter}
                      size="sm"
                      variant="primary"
                    >
                      <Plus aria-hidden="true" className="size-4" />
                      Ajouter
                    </Button>
                  </div>
                  <p className="text-xs text-muted">
                    Le « code » est un identifiant unique en majuscules (ex : PANNE).
                  </p>
                </Card.Content>
              </Card>
            </Modal.Body>

            <Modal.Footer>
              <Button onPress={() => onOpenChange(false)} variant="ghost">
                Fermer
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
