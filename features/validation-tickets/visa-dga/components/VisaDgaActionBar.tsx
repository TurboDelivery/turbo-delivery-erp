/*
 * Barre de decision du visa DGA, rendue avec HeroUI V3.
 *
 * <p>Le code couleur disait l'inverse de ce que font les boutons. « Voir grille
 * complete », qui se contente d'ouvrir la grille de paiement, portait le vert
 * (`bg-green-600`) ; « Valider et transmettre au PDG », le geste qui engage le lot vers
 * l'approbation finale, portait le rouge (`bg-red-600`) ; et « Rejeter et renvoyer », le
 * seul refus reel, etait un contour gris en `text-muted`. Un DGA qui balaie la barre au
 * signal couleur lisait donc l'accord sur une simple consultation et le refus sur
 * l'engagement. L'accent revient a la validation, `danger-soft` au rejet, et la
 * consultation n'a plus de couleur du tout.</p>
 *
 * <p>Ces deux teintes etaient ecrites en dur, sans variante sombre : avec la bascule de
 * theme de l'en-tete, elles restaient les deux seuls ilots clairs d'un ecran sombre.</p>
 *
 * <p>Les deux decisions sont regroupees a l'oppose de la consultation : le DGA arbitre
 * entre viser et rejeter, aller lire la grille n'est pas un troisieme choix.</p>
 *
 * <p>Pendant la mutation, `disabled` grisait le bouton sans dire lequel des deux envois
 * tournait. `isPending` le garde lisible et focusable, et son libelle nomme l'operation
 * en cours.</p>
 */
import { Eye, RotateCcw, Send } from 'lucide-react';
import { Button, Spinner } from '@heroui-v3/react';

interface Props {
  isVisant: boolean;
  isRejetant: boolean;
  onVoirGrille: () => void;
  onRejeter: () => void;
  onViser: () => void;
}

export default function VisaDgaActionBar({ isVisant, isRejetant, onVoirGrille, onRejeter, onViser }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Button className="w-full sm:w-auto" variant="outline" onPress={onVoirGrille}>
        <Eye aria-hidden="true" />
        Voir grille complète
      </Button>

      <div className="flex flex-col gap-3 sm:ms-auto sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          className="w-full sm:w-auto"
          isPending={isRejetant}
          onPress={onRejeter}
          variant="danger-soft"
        >
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : <RotateCcw aria-hidden="true" />}
              {isPending ? 'Renvoi…' : 'Rejeter et renvoyer'}
            </>
          )}
        </Button>

        <Button className="w-full sm:w-auto" isPending={isVisant} onPress={onViser}>
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : <Send aria-hidden="true" />}
              {isPending ? 'Transmission…' : 'Valider et transmettre au PDG'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
