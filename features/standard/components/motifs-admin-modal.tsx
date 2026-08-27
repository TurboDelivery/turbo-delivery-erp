'use client';

import { useState } from 'react';
import {
  Button,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Switch,
} from '@/components/heroui';
import { Plus, Save } from 'lucide-react';
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
    <div className="flex flex-wrap items-center gap-2 rounded-medium border border-default-200 px-3 py-2">
      <Chip size="sm" variant="flat" className="font-mono">
        {motif.code}
      </Chip>
      <Input
        aria-label="Libellé"
        size="sm"
        value={libelle}
        onValueChange={setLibelle}
        className="min-w-[10rem] flex-1"
      />
      <Input
        aria-label="Ordre"
        size="sm"
        type="number"
        min={0}
        value={ordre}
        onValueChange={setOrdre}
        className="w-20"
      />
      <Switch size="sm" isSelected={actif} onValueChange={setActif}>
        <span className="text-xs text-default-500">{actif ? 'Actif' : 'Masqué'}</span>
      </Switch>
      <Button
        size="sm"
        color="primary"
        variant="flat"
        isIconOnly
        aria-label="Enregistrer"
        isDisabled={!dirty || !libelle.trim()}
        isLoading={modifier.isPending}
        onPress={() =>
          modifier.mutate({
            code: motif.code,
            dto: { libelle: libelle.trim(), ordre: Number(ordre) || 0, actif },
          })
        }
      >
        <Save className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function MotifsAdminModal({ isOpen, onOpenChange }: Props) {
  const { data: motifs, isLoading } = useMotifsQuery();
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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-base font-semibold">Motifs d&apos;incident</span>
              <span className="text-xs font-normal text-default-400">
                Liste paramétrable proposée aux livreurs (RG-22). Masquer ne supprime pas l&apos;historique.
              </span>
            </ModalHeader>

            <ModalBody>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner color="primary" label="Chargement des motifs…" />
                </div>
              ) : (
                <div className="space-y-2">
                  {(motifs ?? []).map((m) => (
                    <MotifRow key={m.code} motif={m} />
                  ))}
                  {(motifs ?? []).length === 0 && (
                    <p className="py-6 text-center text-sm text-default-400">Aucun motif pour le moment.</p>
                  )}
                </div>
              )}

              <Divider className="my-2" />

              <div className="rounded-medium bg-default-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-default-500">Nouveau motif</p>
                <div className="flex flex-wrap items-end gap-2">
                  <Input
                    label="Code"
                    labelPlacement="outside"
                    size="sm"
                    placeholder="EX: PANNE"
                    value={code}
                    onValueChange={(v) => setCode(v.toUpperCase())}
                    className="w-36"
                  />
                  <Input
                    label="Libellé"
                    labelPlacement="outside"
                    size="sm"
                    placeholder="Panne"
                    value={libelle}
                    onValueChange={setLibelle}
                    className="min-w-[10rem] flex-1"
                  />
                  <Input
                    label="Ordre"
                    labelPlacement="outside"
                    size="sm"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={ordre}
                    onValueChange={setOrdre}
                    className="w-20"
                  />
                  <Button
                    color="primary"
                    size="sm"
                    startContent={<Plus className="h-4 w-4" />}
                    isDisabled={!peutCreer}
                    isLoading={creer.isPending}
                    onPress={ajouter}
                  >
                    Ajouter
                  </Button>
                </div>
                <p className="mt-2 text-xs text-default-400">
                  Le « code » est un identifiant unique en majuscules (ex : PANNE).
                </p>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Fermer
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
