'use client';

import { Toaster, toast, useSonner } from 'sonner';
import { X } from 'lucide-react';

/**
 * Bouton flottant « Tout fermer (N) » qui apparait uniquement quand au moins 2
 * toasts sont visibles. Cliquer dessus ferme toute la pile en un coup. Le bouton
 * vient se poser AU-DESSUS de la pile (la pile est en bottom-left avec offset 64,
 * le bouton est en bottom-left avec un offset plus petit pour rester juste sous
 * la pile visuelle). En mobile, on garde le meme placement bottom-left.
 */
function DismissAllButton() {
  const { toasts } = useSonner();

  if (toasts.length < 2) return null;

  return (
    <button
      type="button"
      onClick={() => toast.dismiss()}
      aria-label={`Fermer les ${toasts.length} notifications`}
      className="fixed bottom-2 left-4 z-9999 flex items-center gap-1.5 rounded-full border bg-background/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-sm transition hover:bg-muted-surface active:scale-95"
    >
      <X className="size-3.5" />
      Tout fermer ({toasts.length})
    </button>
  );
}

/**
 * Wrapper du Toaster Sonner pour l'application :
 * - position bottom-left (au lieu du defaut top-right)
 * - closeButton sur chaque toast (croix pour fermer individuellement)
 * - richColors (variantes success/error/warning visuellement distinctes)
 * - bouton flottant « Tout fermer (N) » via {@link DismissAllButton}
 */
export function AppToaster() {
  return (
    <>
      <Toaster
        position="bottom-left"
        closeButton
        richColors
        // Offset pour laisser la place au bouton "Tout fermer" sous la pile.
        offset={64}
      />
      <DismissAllButton />
    </>
  );
}
