'use client';

import { useState } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@/components/heroui';
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  useDeductionsQuery,
  useCreerDeductionMutation,
  useModifierDeductionMutation,
  useSupprimerDeductionMutation,
  formatFcfa,
  IDeductionPartenaire,
} from '@/features/encours';

/** Gestion (CRUD) des déductions / avances par partenaire pour une année (§6). */
export function EncoursDeductionsManager({ annee }: { annee: number }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: deductions } = useDeductionsQuery(annee);
  const creer = useCreerDeductionMutation();
  const modifier = useModifierDeductionMutation();
  const supprimer = useSupprimerDeductionMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupe, setGroupe] = useState('');
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState('');

  // Suppression sous code de sécurité (4 chiffres, défini par le DG ou le
  // DGA) : le modal recueille le code, le backend est seul juge (403 sinon).
  const [suppression, setSuppression] = useState<IDeductionPartenaire | null>(null);
  const [codeSecret, setCodeSecret] = useState('');

  const confirmerSuppression = () => {
    if (!suppression || !/^\d{4}$/.test(codeSecret)) return;
    supprimer.mutate(
      { id: suppression.id, codeSecret: codeSecret.trim() },
      {
        onSuccess: () => {
          setSuppression(null);
          setCodeSecret('');
        },
      },
    );
  };

  const reset = () => {
    setEditingId(null);
    setGroupe('');
    setMontant('');
    setMotif('');
  };

  const startEdit = (d: IDeductionPartenaire) => {
    setEditingId(d.id);
    setGroupe(d.groupePartenaire);
    setMontant(String(d.montant));
    setMotif(d.motif ?? '');
  };

  const submit = () => {
    const dto = {
      groupePartenaire: groupe.trim(),
      montant: Number(montant) || 0,
      motif: motif.trim() || null,
      annee,
    };
    if (!dto.groupePartenaire) return;
    if (editingId) {
      modifier.mutate({ id: editingId, dto }, { onSuccess: reset });
    } else {
      creer.mutate(dto, { onSuccess: reset });
    }
  };

  return (
    <>
      <Button size="sm" variant="bordered" startContent={<Plus className="h-4 w-4" />} onPress={onOpen}>
        Gérer les déductions
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Déductions / avances — {annee}</ModalHeader>
              <ModalBody className="gap-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input label="Partenaire (groupe)" size="sm" value={groupe} onValueChange={setGroupe} />
                  <Input label="Montant (FCFA)" size="sm" type="number" value={montant} onValueChange={setMontant} />
                  <Input label="Motif" size="sm" value={motif} onValueChange={setMotif} className="sm:col-span-2" />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="primary"
                    isLoading={creer.isPending || modifier.isPending}
                    onPress={submit}
                  >
                    {editingId ? 'Enregistrer' : 'Ajouter'}
                  </Button>
                  {editingId && (
                    <Button size="sm" variant="light" onPress={reset}>
                      Annuler l&apos;édition
                    </Button>
                  )}
                </div>

                <div className="divide-y">
                  {(deductions ?? []).map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <div className="min-w-0">
                        <span className="font-medium">{d.groupePartenaire}</span>
                        <span className="text-gray-500"> — {d.motif || '—'}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-semibold">{formatFcfa(d.montant)}</span>
                        <Button isIconOnly size="sm" variant="light" onPress={() => startEdit(d)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => {
                            setCodeSecret('');
                            setSuppression(d);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!deductions || deductions.length === 0) && (
                    <p className="py-2 text-sm text-gray-500">Aucune déduction pour {annee}.</p>
                  )}
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

      {/* La suppression n'aboutit que si le code de sécurité (DG/DGA) est correct. */}
      <Modal
        isOpen={suppression !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSuppression(null);
            setCodeSecret('');
          }
        }}
        size="sm"
      >
        <ModalContent>
          {(fermer) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-danger" />
                Code de sécurité requis
              </ModalHeader>
              <ModalBody className="gap-3">
                <p className="text-sm text-gray-600">
                  Supprimer la déduction{' '}
                  <span className="font-medium">{suppression?.groupePartenaire}</span> de{' '}
                  <span className="font-semibold">{formatFcfa(suppression?.montant ?? 0)}</span> ?
                  Cette action exige le code de sécurité à 4 chiffres défini par le DG ou le DGA.
                </p>
                <Input
                  autoFocus
                  label="Code de sécurité (4 chiffres)"
                  size="sm"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={codeSecret}
                  onValueChange={(v) => setCodeSecret(v.replace(/\D/g, '').slice(0, 4))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmerSuppression();
                  }}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={fermer}>
                  Annuler
                </Button>
                <Button
                  color="danger"
                  isDisabled={codeSecret.length !== 4}
                  isLoading={supprimer.isPending}
                  onPress={confirmerSuppression}
                >
                  Supprimer
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
