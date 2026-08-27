'use client';

import React from 'react';
import { Spinner } from '@heroui/react';
import { useAutosuffisanceSemaineQuery } from '@/features/turboys/queries/programme.query';

const LABEL_COURT: Record<string, string> = {
  LUNDI: 'Lun',
  MARDI: 'Mar',
  MERCREDI: 'Mer',
  JEUDI: 'Jeu',
  VENDREDI: 'Ven',
  SAMEDI: 'Sam',
  DIMANCHE: 'Dim',
};

const HAUTEUR = 96; // px de la zone de barre

/** RG-32 — barres empilées indépendants (base) + planifiés, par jour de la semaine. */
export function AutosuffisancePanel({ annee, semaine }: { annee: number; semaine: number }) {
  const { data, isLoading, isError } = useAutosuffisanceSemaineQuery(annee, semaine);
  const jours = Array.isArray(data) ? data : [];
  const max = Math.max(1, ...jours.map((j) => j.total));

  return (
    <section className="mt-4 rounded-xl border border-default-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-primary">Autosuffisance — livreurs actifs / jour</h3>
        <div className="flex items-center gap-3 text-xs text-default-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-primary" /> Indépendants
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-secondary" /> Planifiés
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner size="sm" />
        </div>
      ) : isError ? (
        <p className="py-4 text-center text-sm text-danger">Erreur de chargement de l&apos;autosuffisance</p>
      ) : (
        <div className="flex items-end justify-between gap-2">
          {jours.map((j) => (
            <div key={j.jour} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-medium text-default-600">{j.total}</span>
              <div
                className="flex w-full max-w-[44px] flex-col justify-end overflow-hidden rounded-md bg-default-100"
                style={{ height: HAUTEUR }}
              >
                <div
                  className="w-full bg-secondary"
                  style={{ height: (j.planifies / max) * HAUTEUR }}
                  title={`${j.planifies} planifié(s)`}
                />
                <div
                  className="w-full bg-primary"
                  style={{ height: (j.independants / max) * HAUTEUR }}
                  title={`${j.independants} indépendant(s)`}
                />
              </div>
              <span className="text-xs text-default-500">{LABEL_COURT[j.jour] ?? j.jour}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
