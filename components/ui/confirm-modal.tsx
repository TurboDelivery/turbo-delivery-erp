'use client';

import { Button, Modal } from '@heroui-v3/react';
import React from 'react';

export interface ConfirmModalAction {
  /** Le geste, à l'infinitif : « Supprimer », « Décaisser », « Annuler la course ». */
  label: string;
  onPress: () => void;
  /**
   * `danger` pour ce qui détruit, `danger-soft` pour une variante moins totale du même
   * geste, `primary` pour tout le reste. Le dernier bouton de la rangée est celui qui
   * engage le plus : c'est là qu'on lit d'abord.
   */
  variante?: 'danger' | 'danger-soft' | 'primary';
}

interface ConfirmModalProps {
  /** Les gestes qui ENGAGENT. Le retrait est rendu par la fenêtre, ne pas le lister ici. */
  actions: ConfirmModalAction[];
  children: React.ReactNode;
  /** Libellé du retrait. « Annuler » par défaut, « Retour » quand le sujet est une annulation. */
  annuler?: string;
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

/**
 * La fenêtre « êtes-vous sûr ».
 *
 * <h3>Ce qui change</h3>
 * <p>Le bouton de retrait était RÉPÉTÉ dans le tableau `actions` de chacun des neuf
 * appelants, et son `onPress` y était à chaque fois exactement la fonction déjà passée en
 * `onClose`. La fenêtre le rend maintenant elle-même : un appelant ne peut plus ouvrir une
 * confirmation de suppression sans porte de sortie.</p>
 *
 * <p>Surtout, `isLoading` était appliqué à TOUS les boutons, retrait compris. Pendant une
 * suppression, « Annuler » se mettait donc à tourner et devenait inopérant : l'utilisateur
 * qui se ravisait au moment du clic n'avait plus aucune issue jusqu'au retour du serveur.
 * L'attente ne porte plus que sur les gestes qui engagent ; le retrait reste cliquable.</p>
 *
 * <p>Le tableau `actions` est conservé — il ne sert pas qu'à deux boutons : la suppression
 * d'un partenaire propose « en conservant l'historique » et « totale », deux issues
 * distinctes du même dialogue.</p>
 */
export default function ConfirmModal({
  actions,
  annuler = 'Annuler',
  children,
  isLoading,
  isOpen,
  onClose,
  title,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="text-sm text-muted">{children}</Modal.Body>
            <Modal.Footer>
              <Button onPress={onClose} variant="ghost">
                {annuler}
              </Button>
              {actions.map((action) => (
                <Button
                  isPending={isLoading}
                  key={action.label}
                  onPress={action.onPress}
                  variant={action.variante ?? 'primary'}
                >
                  {action.label}
                </Button>
              ))}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
