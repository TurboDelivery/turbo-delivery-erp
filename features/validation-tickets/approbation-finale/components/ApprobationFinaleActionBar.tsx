'use client';

/*
 * Barre d'action de l'approbation finale, passee en V3.
 *
 * <p>Trois defauts corriges au passage :</p>
 *
 * <p>1. Le bouton d'approbation etait peint a la main en `bg-green-600 hover:bg-green-700
 * text-white`. Une couleur posee sur un composant qui a deja ses propres etats laissait
 * son survol et son focus desaccordes du reste de l'ERP, et cette teinte n'avait aucune
 * variante sombre. Le meme defaut avait deja ete corrige sur la fenetre de confirmation
 * qui suit : le bouton primaire porte le geste, le vert de l'approbation reste porte par
 * le bandeau et par le montant.</p>
 *
 * <p>2. Le cadenas etait en `text-green-500`, une couleur fixe sans variante sombre :
 * avec la bascule de theme de l'en-tete, il restait vert vif sur fond sombre. L'echelle
 * `success` suit les deux themes.</p>
 *
 * <p>3. Chaque bouton portait `disabled` pendant son envoi. Il devenait gris sans rien
 * dire : le DG, dont la pression declenche des virements Wave irreversibles, ne pouvait
 * pas distinguer un envoi en cours d'un bouton qui ne repond plus. `isPending` bloque la
 * pression comme avant, mais affiche le rond d'attente et le libelle dit ce qui se
 * passe.</p>
 */

import { Button, Spinner } from '@heroui-v3/react';
import { CheckCircle2, Lock, XCircle } from 'lucide-react';

interface Props {
  isApprouvant: boolean;
  isRejetant: boolean;
  onRejeter: () => void;
  onApprouver: () => void;
}

export default function ApprobationFinaleActionBar({ isApprouvant, isRejetant, onRejeter, onApprouver }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 rounded-xl border border-separator bg-surface px-5 py-4">
      <Lock aria-hidden="true" className="h-4 w-4 text-success-soft-foreground shrink-0 hidden sm:block" />
      <p className="text-sm text-muted flex-1">
        Confirmation à double validation requise — déclenche immédiatement les virements Wave.
      </p>
      <div className="flex flex-wrap gap-3 shrink-0">
        {/* Le `gap-2` pose sur les deux boutons redisait l'espacement que le composant
            applique deja a ses enfants, tout comme le `h-4 w-4` des icones. */}
        <Button isPending={isRejetant} variant="outline" onPress={onRejeter}>
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : <XCircle aria-hidden="true" />}
              {isPending ? 'Rejet en cours…' : 'Rejeter'}
            </>
          )}
        </Button>
        <Button isPending={isApprouvant} variant="primary" onPress={onApprouver}>
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : <CheckCircle2 aria-hidden="true" />}
              {isPending ? 'Déclenchement Wave en cours…' : 'Approuver et déclencher Wave'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
