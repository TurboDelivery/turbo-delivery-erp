'use client';

import { useMemo } from 'react';
import { Button, Spinner } from '@/components/heroui';
import { PhoneCall, PhoneMissed } from 'lucide-react';

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
    <section className="rounded-2xl border border-default-200/50 bg-surface dark:bg-content1">
      <header className="flex items-center justify-between gap-2 border-b border-default-100 px-4 py-3">
        <h3 className="flex items-center gap-2.5 text-sm font-bold text-default-700">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger-soft-foreground">
            <PhoneMissed className="h-5 w-5" />
          </span>
          Appels manqués
        </h3>
        {manques.length > 0 && (
          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-bold text-danger-soft-foreground">
            {manques.length}
          </span>
        )}
      </header>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="sm" color="primary" />
        </div>
      ) : isError ? (
        // Le journal est filtre en local : s'il ne se charge pas, la liste des
        // manques est vide et l'ecran annonce que tout a ete decroche.
        <EtatErreur
          quoi="les appels manqués"
          onReessayer={() => refetch()}
          enCours={isFetching}
        />
      ) : manques.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-default-400">
          Aucun appel manqué — tout a été décroché.
        </p>
      ) : (
        <ul className="divide-y divide-default-100">
          {manques.map((a) => {
            const nom = a.appelantNom || 'Appelant inconnu';
            const rappelPossible = a.appelantType === 'LIVREUR' && !!a.appelantId;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-sm font-bold text-rose-600">
                  {initialesDe(nom)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-default-800">{nom}</p>
                  <p className="flex items-center gap-1 text-xs text-default-400">
                    <PhoneMissed className="h-3 w-3 text-rose-400" />
                    Manqué · {depuisQuand(a.declencheLe)}
                  </p>
                </div>
                {rappelPossible && (
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    isDisabled={enAppel}
                    startContent={<PhoneCall className="h-4 w-4" />}
                    onPress={() => appelerLivreur(a.appelantId, nom, a.incidentId ?? undefined)}
                  >
                    Rappeler
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
