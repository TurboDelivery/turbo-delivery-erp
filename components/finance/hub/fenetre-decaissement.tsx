'use client';

import { useEffect, useState } from 'react';
import { Button, ComboBox, Input, Label, ListBox, Modal, Spinner } from '@heroui-v3/react';

import { fmtFcfa, MOYENS_PAIEMENT, type IFinanceItem, type ISortieTresorerie } from '@/features/finances-hub';

interface FenetreDecaissementProps {
  isOpen: boolean;
  onOpenChange: (ouvert: boolean) => void;
  /** Les charges à décaisser : une seule, ou toute la sélection. */
  cibles: IFinanceItem[];
  /** Les comptes de trésorerie de Finance › Configuration, dans leur ordre. */
  comptes: string[];
  busy: boolean;
  onConfirmer: (sortie: ISortieTresorerie) => void;
}

/**
 * La fenêtre « Décaisser » : d'où sort l'argent, et par quel moyen.
 *
 * <p>Elle demandait déjà ces deux choses et annonçait « compte + moyen tracés », mais elle
 * les rangeait dans un commentaire que le serveur ne lisait pas : rien n'était gardé, et
 * un export ne pouvait pas dire de quel compte une dépense était sortie. Elles partent
 * maintenant dans leurs propres champs, que le serveur écrit sur la charge et sur la
 * dépense.</p>
 *
 * <p>⚠ Les comptes proposés sont ceux de la CONFIGURATION, pas une liste écrite ici : elle
 * offrait « Banque », qui n'existait dans aucune configuration et que le serveur refuse.
 * Le premier compte configuré est choisi d'office (c'était « Caisse physique » en dur, qui
 * est justement le premier). Sans aucun compte configuré, le champ est inactif et le
 * décaissement part sans compte, comme avant.</p>
 */
export function FenetreDecaissement({ busy, cibles, comptes, isOpen, onConfirmer, onOpenChange }: FenetreDecaissementProps) {
  const comptePremier = comptes[0] ?? '';
  const [compte, setCompte] = useState('');
  const [moyen, setMoyen] = useState<string>(MOYENS_PAIEMENT[0].code);

  // `comptes` est un tableau neuf à chaque rendu : on s'abonne à son CONTENU. Un compte
  // retiré de la configuration pendant que l'écran est ouvert retombe sur le premier.
  const empreinte = comptes.join('\u0000');
  useEffect(() => {
    if (!comptes.includes(compte)) setCompte(comptePremier);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empreinte, compte, comptePremier]);

  const total = cibles.reduce((s, i) => s + i.montant, 0);
  const aucunCompte = comptes.length === 0;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-lg">
            <Modal.Header>
              <Modal.Heading>
                Décaisser {cibles.length > 1 ? `la sélection (${cibles.length})` : 'cette dépense'}
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-4">
              <div className="rounded-lg bg-surface-secondary p-3 text-sm text-foreground">
                {cibles.length === 1 ? (
                  <>
                    {cibles[0]?.designation}
                    <br />
                    Montant : <b>{fmtFcfa(cibles[0]?.montant)}</b>
                  </>
                ) : (
                  <>
                    {cibles.length} dépenses · Total : <b>{fmtFcfa(total)}</b>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ComboBox
                  allowsEmptyCollection
                  isDisabled={aucunCompte}
                  onSelectionChange={(c) => setCompte(String(c ?? comptePremier))}
                  selectedKey={compte || null}
                >
                  <Label>Compte débité</Label>
                  <ComboBox.InputGroup>
                    <Input placeholder={aucunCompte ? 'Aucun compte configuré' : undefined} />
                    <ComboBox.Trigger />
                  </ComboBox.InputGroup>
                  <ComboBox.Popover>
                    <ListBox
                      items={comptes.map((c) => ({ cle: c }))}
                      renderEmptyState={() => <span className="px-3 py-2 text-sm text-muted">Aucun compte</span>}
                    >
                      {(o: { cle: string }) => (
                        <ListBox.Item id={o.cle} textValue={o.cle}>
                          {o.cle}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      )}
                    </ListBox>
                  </ComboBox.Popover>
                </ComboBox>

                <ComboBox
                  allowsEmptyCollection
                  onSelectionChange={(c) => setMoyen(String(c ?? MOYENS_PAIEMENT[0].code))}
                  selectedKey={moyen}
                >
                  <Label>Moyen de paiement</Label>
                  <ComboBox.InputGroup>
                    <Input />
                    <ComboBox.Trigger />
                  </ComboBox.InputGroup>
                  <ComboBox.Popover>
                    <ListBox
                      items={MOYENS_PAIEMENT.map((m) => ({ cle: m.code, libelle: m.libelle }))}
                      renderEmptyState={() => <span className="px-3 py-2 text-sm text-muted">Aucun moyen</span>}
                    >
                      {(o: { cle: string; libelle: string }) => (
                        <ListBox.Item id={o.cle} textValue={o.libelle}>
                          {o.libelle}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      )}
                    </ListBox>
                  </ComboBox.Popover>
                </ComboBox>
              </div>

              <p className="text-xs text-muted">
                {aucunCompte
                  ? 'Aucun compte de trésorerie n’est configuré (Finance › Configuration) : le décaissement sera enregistré sans compte.'
                  : 'Le passage en « Payé » crée la sortie de trésorerie. Le compte et le moyen sont gardés et repris dans les exports.'}
              </p>
            </Modal.Body>

            <Modal.Footer>
              <Button onPress={() => onOpenChange(false)} variant="ghost">
                Annuler
              </Button>
              <Button
                isPending={busy}
                onPress={() => onConfirmer({ compteTresorerie: compte || undefined, moyenPaiement: moyen })}
                variant="primary"
              >
                {busy ? <Spinner size="sm" /> : null}
                Confirmer le décaissement
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
