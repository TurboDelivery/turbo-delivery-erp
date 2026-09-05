'use client';

import Link from 'next/link';
import React from 'react';
import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';

import { Can } from '@/components/auth/Can';
import { TitreSection } from '@/components/commons/TitreSection';
import { ChampListe, ChampMontant } from '@/components/commons/champs-formulaire';
import { TYPE_COMMISSION_OPTIONS } from '@/features/restaurants/schemas/create-restaurant.schema';

/**
 * Le type de commission d'un partenaire.
 *
 * <p>Ce composant existait en DEUX exemplaires, sous `create/` et sous `edit/`, qui ne
 * différaient que par le type du formulaire porteur. Il est désormais générique : les deux
 * formulaires montent le même.</p>
 */
interface CommissionSectionProps<T extends FieldValues> {
  control: Control<T>;
  typeCommission: string;
}

export function CommissionSection<T extends FieldValues>({
  control,
  typeCommission,
}: CommissionSectionProps<T>) {
  const avecMontant = typeCommission === 'POURCENTAGE' || typeCommission === 'FIXE';

  return (
    <section>
      <TitreSection>Type de commission</TitreSection>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-end gap-2">
          <Controller
            control={control}
            name={'typeCommission' as Path<T>}
            render={({ field }) => (
              <div className="flex-1">
                <ChampListe
                  label="Type de commission"
                  onChange={field.onChange}
                  options={TYPE_COMMISSION_OPTIONS}
                  placeholder="Choisissez le type de commission"
                  valeur={(field.value as string) ?? ''}
                />
              </div>
            )}
          />
          {avecMontant && (
            <Controller
              control={control}
              name={'commission' as Path<T>}
              render={({ field }) => (
                <div className="w-32 shrink-0">
                  <ChampMontant
                    label={typeCommission === 'POURCENTAGE' ? 'Taux (%)' : 'Montant'}
                    max={typeCommission === 'POURCENTAGE' ? 100 : undefined}
                    onChange={field.onChange}
                    valeur={Number(field.value ?? 0)}
                  />
                </div>
              )}
            />
          )}
        </div>

        {/* RG-03 — LE CYCLE NE SE REGLE PLUS ICI.
          *
          * Le cahier DOSSOU tranche : « il n'existe qu'un seul endroit pour definir la
          * facon dont un partenaire est facture ». Ce champ etait ce second endroit, et
          * c'etait lui qui pilotait reellement la facturation : deux ecrans pouvaient
          * afficher deux cycles differents pour le meme partenaire, sans qu'aucun ne
          * signale la contradiction. On renvoie donc vers l'ecran unique. */}
        <div className="rounded-xl border border-separator bg-surface-secondary p-3">
          <p className="text-sm font-medium text-foreground">Cycle de facturation</p>
          <p className="mt-1 text-xs text-muted">
            Le cycle et l&apos;objet de la facturation se définissent dans l&apos;écran unique
            « Configuration cycle de facturation partenaire ».
          </p>
          {/* Meme raison que sur la fiche d'edition : sept des dix roles qui peuvent
              creer un partenaire n'ont pas `read Finance` et tombaient sur un 403. */}
          <Can I="read" a="Finance">
            <Link
              className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
              href="/finance/cycle-facturation"
            >
              Ouvrir la configuration des cycles
            </Link>
          </Can>
        </div>
      </div>
    </section>
  );
}
