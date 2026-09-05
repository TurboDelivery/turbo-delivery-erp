'use client';

import { Avatar, Button, Card } from '@heroui-v3/react';
import { PhoneCall, PhoneMissed } from 'lucide-react';
import { useMemo } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { IAppelLog, useAppelsQuery } from '@/features/standard';

import { useAppel } from './appel-provider';
import { depuisQuand, initialesDe } from '../utils/appel-ui.utils';

/**
 * Appels MANQUÉS — ceux qui ont sonné sans que personne ne décroche (statut
 * MANQUE posé par le serveur au bout d'~1 min). Permet de rappeler le livreur
 * en un clic, sans aller chercher la ligne dans le journal complet.
 */
export function AppelsManquesPanel() {
  const { data, isLoading, isError, isFetching, refetch } = useAppelsQuery(0, 50, 15000);
  const { appelerLivreur, enAppel } = useAppel();

  const manques = useMemo(
    () => ((data?.content ?? []) as IAppelLog[]).filter((a) => a.statut === 'MANQUE'),
    [data],
  );

  return (
    <Card>
      <Card.Header className="flex-row items-center justify-between gap-2">
        <h3 className="flex items-center gap-2.5 text-sm font-bold text-foreground">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger-soft-foreground">
            <PhoneMissed aria-hidden="true" className="size-5" />
          </span>
          Appels manqués
        </h3>
        {manques.length > 0 && (
          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-bold text-danger-soft-foreground">
            {manques.length}
          </span>
        )}
      </Card.Header>

      {isLoading ? (
        <div className="flex flex-col gap-2 px-4 py-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="h-14 animate-pulse rounded-lg bg-surface-secondary" key={i} />
          ))}
        </div>
      ) : isError ? (
        // Le journal est filtre en local : s'il ne se charge pas, la liste des
        // manques est vide et l'ecran annonce que tout a ete decroche.
        <div className="p-4">
          <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les appels manqués" />
        </div>
      ) : manques.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted">
          Aucun appel manqué — tout a été décroché.
        </p>
      ) : (
        <ul className="divide-y divide-separator">
          {manques.map((a) => {
            const nom = a.appelantNom || 'Appelant inconnu';
            const rappelPossible = a.appelantType === 'LIVREUR' && !!a.appelantId;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                {/* Le rond d'initiales etait peint en `bg-rose-50 text-rose-600` : du rose
                    de palette, sans variante sombre, pour une simple identite. */}
                <Avatar className="shrink-0" size="md">
                  <Avatar.Fallback>{initialesDe(nom)}</Avatar.Fallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{nom}</p>
                  <p className="flex items-center gap-1 text-xs text-muted">
                    <PhoneMissed aria-hidden="true" className="size-3 text-danger" />
                    Manqué · {depuisQuand(a.declencheLe)}
                  </p>
                </div>
                {rappelPossible && (
                  <Button
                    isDisabled={enAppel}
                    onPress={() => appelerLivreur(a.appelantId, nom, a.incidentId ?? undefined)}
                    size="sm"
                    variant="outline"
                  >
                    <PhoneCall aria-hidden="true" className="size-4" />
                    Rappeler
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
