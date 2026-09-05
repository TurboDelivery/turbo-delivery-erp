'use client';

import { Avatar, Chip } from '@heroui-v3/react';
import { Clock } from 'lucide-react';

import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { cn } from '@/lib/utils';
import { createUrlFile, getInitials } from '@/utils/createUrlFile';

import type { LigneFileVue } from '../hooks/use-file-attente-vue';
import { attenteLisible, heureLisible } from '../utils/file-attente.utils';

/**
 * Une place dans la file.
 *
 * <p>Le premier rang est traité différemment du reste : ce n'est pas une
 * décoration, c'est l'information opérationnelle de la ligne — c'est lui qui
 * recevra la prochaine course de ce partenaire.</p>
 *
 * <p>Les initiales restent en gris neutre, et non en couleur tirée du nom : sur cet écran
 * le vert veut dire « prochaine course ». Des pastilles vertes distribuées au hasard des
 * initiales brouilleraient le seul signal de couleur qui compte.</p>
 */
export function FileLivreurLigne({
  ligne,
  maintenant,
}: {
  ligne: LigneFileVue;
  maintenant: number;
}) {
  const premier = ligne.rang === 1;
  const type = ligne.typeContrat ? getTurboyTypeDisplay(ligne.typeContrat) : null;
  const photo = ligne.avatar ? createUrlFile(ligne.avatar, 'backend') : '';

  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-xl px-2.5 py-2',
        premier ? 'bg-success/10 ring-1 ring-inset ring-success/25' : 'hover:bg-surface-secondary',
      )}
    >
      <span
        aria-label={`Rang ${ligne.rang}`}
        className={cn(
          'flex h-8 shrink-0 items-center justify-center rounded-[10px] px-2 text-[13px] font-bold tabular-nums',
          premier ? 'bg-success text-success-foreground' : 'bg-surface-secondary text-muted',
        )}
      >
        N°{ligne.rang}
      </span>

      <Avatar className="size-9 shrink-0">
        {photo && <Avatar.Image alt={ligne.nomComplet} src={photo} />}
        <Avatar.Fallback>{getInitials(ligne.nomComplet)}</Avatar.Fallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{ligne.nomComplet}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {premier && (
            <Chip color="success" size="sm" variant="soft">
              <Chip.Label>Prochaine course</Chip.Label>
            </Chip>
          )}
          {/* Type de contrat : affiché seulement s'il est connu. Écrire
              « À catégoriser » parce que l'annuaire n'a pas répondu ferait
              passer une panne de lecture pour un défaut de dossier RH. */}
          {type && (
            <Chip size="sm" variant="soft">
              <Chip.Label>{type.label}</Chip.Label>
            </Chip>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="flex items-center justify-end gap-1 text-xs font-semibold tabular-nums text-foreground">
          <Clock aria-hidden="true" className="size-3 text-muted" />
          {attenteLisible(ligne.entreeLe, maintenant)}
        </p>
        <p className="text-[11px] text-muted">entré à {heureLisible(ligne.entreeLe)}</p>
      </div>
    </li>
  );
}
