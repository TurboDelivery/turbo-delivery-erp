'use client';

import { Button, Card, Chip } from '@heroui-v3/react';
import { AlertTriangle, ChevronDown, ChevronUp, Store, Users } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import type { PosteFileVue } from '../hooks/use-file-attente-vue';
import { pluriel } from '../utils/file-attente.utils';
import { FileLivreurLigne } from './file-livreur-ligne';

/** Au-delà, la carte devient une liste à dérouler plutôt qu'un mur de noms. */
const RANGS_VISIBLES = 6;

/**
 * La file d'un poste, dans l'ordre où les courses y seront distribuées.
 *
 * <p>Deux états seulement, et ils se lisent au premier coup d'œil : le poste
 * tourne, ou il est déserté. Le second n'est pas un vide à combler
 * visuellement — c'est une alerte : aucune commande de ce partenaire ne peut
 * être servie tant que personne n'a pointé sa montée.</p>
 */
export function PosteFileCard({ poste, maintenant }: { poste: PosteFileVue; maintenant: number }) {
  const [tousAffiches, setTousAffiches] = useState(false);

  const visibles = tousAffiches ? poste.file : poste.file.slice(0, RANGS_VISIBLES);
  const restants = poste.file.length - visibles.length;
  const deroulable = poste.file.length > RANGS_VISIBLES;

  return (
    <Card>
      <Card.Content className="gap-3">
        <header className="flex items-start gap-3">
          <span
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-[14px]',
              poste.desert
                ? 'bg-danger/10 text-danger-soft-foreground'
                : 'bg-success/10 text-success-soft-foreground',
            )}
          >
            <Store aria-hidden="true" className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-foreground" title={poste.restaurant}>
              {poste.restaurant}
            </h3>
            <p className="mt-0.5 flex items-start gap-1 text-[11px] leading-snug text-muted">
              <Users aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
              {poste.livreursAssignes} {pluriel(poste.livreursAssignes, 'livreur')}{' '}
              {pluriel(poste.livreursAssignes, 'assigné')} à ce poste
            </p>
          </div>

          <Chip color={poste.desert ? 'danger' : 'success'} size="sm" variant="soft">
            <Chip.Label>
              {poste.desert ? 'Personne en file' : `${poste.file.length} en file`}
            </Chip.Label>
          </Chip>
        </header>

        {poste.desert ? (
          <div className="flex items-start gap-2 rounded-xl border border-dashed border-danger/35 bg-danger/5 p-3">
            <AlertTriangle
              aria-hidden="true"
              className="mt-px size-4 shrink-0 text-danger-soft-foreground"
            />
            <p className="text-xs leading-relaxed text-muted">
              Personne n&apos;attend sur ce poste : aucun livreur n&apos;a pointé sa montée, ou tous
              se sont mis en pause ou ont pointé leur fin de service.{' '}
              <span className="font-semibold text-foreground">
                Aucune commande de ce partenaire ne peut être servie.
              </span>
            </p>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-1">
              {visibles.map((ligne) => (
                <FileLivreurLigne key={ligne.cle} ligne={ligne} maintenant={maintenant} />
              ))}
            </ul>

            {deroulable && (
              <Button
                className="w-full"
                onPress={() => setTousAffiches((affiche) => !affiche)}
                size="sm"
                variant="secondary"
              >
                {tousAffiches ? (
                  <>
                    <ChevronUp aria-hidden="true" className="size-3.5" />
                    Réduire la file
                  </>
                ) : (
                  <>
                    <ChevronDown aria-hidden="true" className="size-3.5" />
                    Afficher {restants} {pluriel(restants, 'livreur')} de plus
                  </>
                )}
              </Button>
            )}

            <p className="text-[11px] text-muted">La prochaine course de ce partenaire ira au N°1.</p>
          </>
        )}
      </Card.Content>
    </Card>
  );
}
