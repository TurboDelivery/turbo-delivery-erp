'use client';

import React from 'react';
import { Button, Input, Label, ListBox, Select, TextField } from '@heroui-v3/react';
import { Search, X } from 'lucide-react';

import {
  LIBELLES_CONSENTEMENT,
  LIBELLES_SEGMENT,
  LIBELLES_STATUT,
  useBddClientsFilters,
} from '@/features/bdd-clients';

/**
 * La barre de filtres de la base clients.
 *
 * <h3>Ce qui est posé à plat, et ce qui est rangé</h3>
 * <p>La recherche, la période et la fidélité sont à plat : ce sont les trois gestes de
 * tous les jours. Le statut, le segment et le consentement suivent sur la même bande, en
 * listes courtes. Tout tient sur deux rangées, parce que chaque rangée prise ici est une
 * rangée de moins pour la liste, sur une fenêtre de 563 pixels de haut.</p>
 *
 * <p>Le choix des partenaires n'est pas ici : il demande une multi-sélection sur soixante
 * quinze établissements, donc son propre composant. Il arrivera avec l'onglet des
 * statistiques par partenaire, qui en a besoin aussi.</p>
 */

function Liste({
  choix,
  etiquette,
  onChange,
  valeur,
  vide,
}: {
  choix: Record<string, string>;
  etiquette: string;
  onChange: (v: string) => void;
  valeur: string;
  vide: string;
}) {
  return (
    <Select
      className="w-44"
      onSelectionChange={(k) => onChange(String(k ?? ''))}
      selectedKey={valeur || '__tous'}
    >
      <Label>{etiquette}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id="__tous" textValue={vide}>
            {vide}
            <ListBox.ItemIndicator />
          </ListBox.Item>
          {Object.entries(choix).map(([code, libelle]) => (
            <ListBox.Item id={code} key={code} textValue={libelle}>
              {libelle}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function ClientsFiltres() {
  const { actifs, filtres, poser, vider } = useBddClientsFilters();

  const changerListe = (cle: 'statut' | 'segment' | 'consentement') => (v: string) =>
    poser({ [cle]: v === '__tous' ? '' : v });

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-separator bg-surface px-3 py-2.5">
      <div className="flex flex-wrap items-end gap-3">
        <TextField
          className="min-w-[18rem] flex-1"
          onChange={(v) => poser({ recherche: v })}
          value={filtres.recherche}
        >
          <Label>Rechercher</Label>
          <Input placeholder="Un nom, un prénom, un numéro…" />
        </TextField>

        <TextField className="w-40" onChange={(v) => poser({ debut: v })} value={filtres.debut}>
          <Label>Du</Label>
          <Input type="date" />
        </TextField>
        <TextField className="w-40" onChange={(v) => poser({ fin: v })} value={filtres.fin}>
          <Label>Au</Label>
          <Input type="date" />
        </TextField>

        {/*
          La fidélité est le geste commercial de cet écran : « qui revient ». Elle mérite
          des raccourcis plutôt qu'un champ numérique, parce que personne ne cherche
          « exactement 4 captures », on cherche « 2 et plus ».
        */}
        <div className="flex flex-col gap-1">
          <span className="text-sm text-foreground">Captures</span>
          <div className="flex items-center gap-1">
            {[2, 3, 5].map((n) => (
              <Button
                key={n}
                onPress={() => poser({ capturesMin: filtres.capturesMin === n ? null : n })}
                size="sm"
                variant={filtres.capturesMin === n ? 'secondary' : 'ghost'}
              >
                {n}+
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm text-foreground">Restaurants</span>
          <div className="flex items-center gap-1">
            {[2, 3].map((n) => (
              <Button
                key={n}
                onPress={() => poser({ partenairesMin: filtres.partenairesMin === n ? null : n })}
                size="sm"
                variant={filtres.partenairesMin === n ? 'secondary' : 'ghost'}
              >
                {n}+
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Liste
          choix={LIBELLES_STATUT}
          etiquette="Statut"
          onChange={changerListe('statut')}
          valeur={filtres.statut}
          vide="Tous les statuts"
        />
        <Liste
          choix={LIBELLES_SEGMENT}
          etiquette="Segment"
          onChange={changerListe('segment')}
          valeur={filtres.segment}
          vide="Tous les segments"
        />
        <Liste
          choix={LIBELLES_CONSENTEMENT}
          etiquette="Consentement"
          onChange={changerListe('consentement')}
          valeur={filtres.consentement}
          vide="Tous"
        />

        {actifs ? (
          <Button className="mb-1" onPress={vider} size="sm" variant="ghost">
            <X aria-hidden="true" className="size-4" />
            Retirer les filtres
          </Button>
        ) : (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-muted">
            <Search aria-hidden="true" className="size-3.5" />
            Toute la base
          </p>
        )}
      </div>
    </div>
  );
}
