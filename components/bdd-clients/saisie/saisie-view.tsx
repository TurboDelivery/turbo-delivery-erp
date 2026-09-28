'use client';

import React from 'react';
import { Button, ComboBox, Input, Label, ListBox, Spinner, TextField } from '@heroui-v3/react';
import { Plus, Save, ShieldCheck } from 'lucide-react';

import { GrilleSaisie } from './grille-saisie';
import {
  analyserMontant,
  ligneVide,
  useEnregistrerLotMutation,
  useVerifierLotMutation,
  type ILigneSaisie,
  type ISyntheseLot,
  type IVerdictLigne,
  type LigneGrille,
} from '@/features/bdd-clients';
import { useRestaurantsListQuery } from '@/features/restaurants/queries/restaurant-list.query';

/**
 * Parcours 1 — la saisie en lot.
 *
 * <h3>Ce que regarde l'opérateur</h3>
 * <p>Une pile de tickets à sa gauche, la grille à l'écran. Tout le reste — le partenaire,
 * la date, les compteurs — tient sur une seule bande en haut, parce que chaque rangée
 * prise à la grille est une ligne de tickets qu'il ne voit plus. La fenêtre réelle de ces
 * postes fait 563 pixels de haut.</p>
 *
 * <h3>Le contrôle est une annonce, pas une autorisation</h3>
 * <p>Les états affichés ligne par ligne viennent du serveur, qui les rejoue intégralement
 * à l'enregistrement. L'écran ne s'autorise rien : entre l'affichage et la sauvegarde, un
 * autre agent a pu saisir le même ticket.</p>
 */

/** Une seule interrogation par rafale de frappe, pas une par caractère. */
const ATTENTE_CONTROLE_MS = 450;

const RACCOURCIS_LIGNES = [5, 10, 20];

function grilleDe(nb: number): LigneGrille[] {
  return Array.from({ length: nb }, () => ligneVide());
}

export function SaisieView({ maximumLignes = 50 }: { maximumLignes?: number }) {
  const [partenaireId, setPartenaireId] = React.useState('');
  const [dateReference, setDateReference] = React.useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [grille, setGrille] = React.useState<LigneGrille[]>(() => grilleDe(10));
  const [verdicts, setVerdicts] = React.useState<Map<number, IVerdictLigne>>(new Map());
  const [tronque, setTronque] = React.useState(0);
  const [synthese, setSynthese] = React.useState<ISyntheseLot | null>(null);
  const [lotId, setLotId] = React.useState<string | null>(null);

  const { data: partenaires, isFetching: chargePartenaires } = useRestaurantsListQuery({
    limit: 300,
    page: 1,
  });
  const verifier = useVerifierLotMutation();
  const enregistrer = useEnregistrerLotMutation();

  const remplies = React.useMemo(
    () => grille.map((l, i) => ({ ...l, index: i + 1 })).filter((l) => l.contact.trim() !== ''),
    [grille],
  );

  /*
   * La SIGNATURE, et non la grille, sert de dépendance.
   *
   * Un tableau neuf à chaque rendu relancerait l'effet en boucle — c'est le même piège
   * qu'une `Date` reconstruite en dépendance d'effet, déjà payé sur cet ERP. Seule une
   * modification d'un contact ou d'un numéro de check doit provoquer un contrôle : ni le
   * nom, ni le montant, ni un commentaire ne changent un verdict.
   */
  const signature = React.useMemo(
    () => remplies.map((l) => `${l.index}|${l.contact.trim()}|${(l.numCheck ?? '').trim()}`).join(';'),
    [remplies],
  );

  React.useEffect(() => {
    if (!partenaireId || signature === '') {
      setVerdicts(new Map());
      return undefined;
    }
    const minuteur = setTimeout(() => {
      verifier.mutate(
        {
          lignes: remplies.map((l) => ({
            contact: l.contact.trim(),
            index: l.index,
            numCheck: l.numCheck.trim() || null,
          })),
          partenaireId,
        },
        {
          onSuccess: (resultats) =>
            setVerdicts(new Map(resultats.map((v) => [v.index, v]))),
        },
      );
    }, ATTENTE_CONTROLE_MS);
    return () => clearTimeout(minuteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, partenaireId]);

  const nbBloquees = [...verdicts.values()].filter((v) => v.etat === 'BLOQUE').length;
  const nbNouveaux = [...verdicts.values()].filter((v) => v.etat === 'NOUVEAU').length;
  const nbConnus = [...verdicts.values()].filter((v) => v.etat === 'CONNU').length;

  const envoyer = (valider: boolean) => {
    if (!partenaireId || remplies.length === 0) return;
    const lignes: ILigneSaisie[] = remplies.map((l) => ({
      articles: l.articles.trim() || null,
      contact: l.contact.trim(),
      index: l.index,
      montant: analyserMontant(l.montant),
      nom: l.nom.trim() || null,
      numCheck: l.numCheck.trim() || null,
      prenom: l.prenom.trim() || null,
      zoneSaisie: l.zoneSaisie.trim() || null,
    }));
    enregistrer.mutate(
      { dateReference, lignes, lotId, partenaireId, valider },
      {
        onSuccess: (resultat) => {
          setSynthese(resultat);
          setLotId(resultat.statut === 'VALIDE' ? null : resultat.lotId);
          if (resultat.statut === 'VALIDE') {
            setGrille(grilleDe(10));
            setVerdicts(new Map());
          }
        },
      },
    );
  };

  const enCours = enregistrer.isPending;

  return (
    <section className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-separator bg-surface px-3 py-2.5">
        <ComboBox
          allowsEmptyCollection
          className="min-w-[16rem]"
          onSelectionChange={(c) => setPartenaireId(String(c ?? ''))}
          selectedKey={partenaireId || null}
        >
          <Label>Partenaire</Label>
          <ComboBox.InputGroup>
            <Input placeholder="Chez qui ces tickets ont-ils été émis ?" />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox
              items={partenaires?.content ?? []}
              renderEmptyState={() => (
                <p className="px-3 py-2 text-sm text-muted">
                  {chargePartenaires ? 'Lecture des partenaires…' : 'Aucun partenaire'}
                </p>
              )}
            >
              {(r: { id: string; nomEtablissement?: string }) => (
                <ListBox.Item id={r.id} textValue={r.nomEtablissement ?? r.id}>
                  {r.nomEtablissement ?? r.id}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              )}
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>

        <TextField className="w-44" onChange={setDateReference} value={dateReference}>
          <Label>Date de dépôt</Label>
          <Input type="date" />
        </TextField>

        <div className="flex flex-col gap-1">
          <span className="text-sm text-foreground">Lignes</span>
          <div className="flex items-center gap-1">
            {RACCOURCIS_LIGNES.map((n) => (
              <Button
                key={n}
                onPress={() => setGrille(grilleDe(n))}
                size="sm"
                variant={grille.length === n ? 'secondary' : 'ghost'}
              >
                {n}
              </Button>
            ))}
            <Button
              isDisabled={grille.length >= maximumLignes}
              onPress={() => setGrille((g) => [...g, ligneVide()])}
              size="sm"
              variant="ghost"
            >
              <Plus aria-hidden="true" className="size-4" />
              Ajouter
            </Button>
          </div>
        </div>

        {/*
          Les compteurs vivent ici, à côté des réglages, et non sous la grille : c'est ce
          que l'agent surveille du coin de l'œil pendant qu'il tape, sans quitter la pile
          de tickets des yeux.
        */}
        <div className="ms-auto flex items-baseline gap-4 text-sm">
          <span className="text-muted">
            <span className="font-semibold tabular-nums text-foreground">{remplies.length}</span>{' '}
            saisie{remplies.length > 1 ? 's' : ''}
          </span>
          <span className="text-muted">
            <span className="font-semibold tabular-nums text-foreground">{nbNouveaux}</span>{' '}
            nouveau{nbNouveaux > 1 ? 'x' : ''}
          </span>
          <span className="text-muted">
            <span className="font-semibold tabular-nums text-foreground">{nbConnus}</span> connu
            {nbConnus > 1 ? 's' : ''}
          </span>
          {nbBloquees > 0 ? (
            <span className="font-semibold tabular-nums text-danger-soft-foreground">
              {nbBloquees} en erreur
            </span>
          ) : null}
          {verifier.isPending ? <Spinner size="sm" /> : null}
        </div>
      </div>

      {tronque > 0 ? (
        <p className="rounded-medium border border-separator bg-surface-2 px-3 py-2 text-xs text-muted">
          {tronque} ligne{tronque > 1 ? 's' : ''} du collage {tronque > 1 ? 'ont' : 'a'} été
          écartée{tronque > 1 ? 's' : ''} : un lot ne peut pas dépasser {maximumLignes} lignes.
          Enregistre celui-ci, puis colle la suite dans un nouveau lot.
        </p>
      ) : null}

      <div className="min-h-0 flex-1">
        <GrilleSaisie
          grille={grille}
          maximum={maximumLignes}
          onChange={setGrille}
          onTronque={setTronque}
          verdicts={verdicts}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          {synthese ? (
            <span className="text-muted">
              <span className="font-semibold tabular-nums text-foreground">
                {synthese.nbEnregistrees}
              </span>{' '}
              enregistrée{synthese.nbEnregistrees > 1 ? 's' : ''} ·{' '}
              <span className="font-semibold tabular-nums text-foreground">
                {synthese.nbNouveaux}
              </span>{' '}
              nouveau{synthese.nbNouveaux > 1 ? 'x' : ''} client
              {synthese.nbNouveaux > 1 ? 's' : ''} ·{' '}
              <span className="font-semibold tabular-nums text-foreground">
                {synthese.nbRattachees}
              </span>{' '}
              rattachée{synthese.nbRattachees > 1 ? 's' : ''}
              {synthese.nbErreurs > 0 ? (
                <span className="text-danger-soft-foreground">
                  {' '}
                  · {synthese.nbErreurs} en erreur
                </span>
              ) : null}
              {lotId ? (
                <span className="text-muted"> · conservé en brouillon</span>
              ) : null}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            isDisabled={!partenaireId || remplies.length === 0 || enCours}
            onPress={() => envoyer(false)}
            variant="ghost"
          >
            {enCours ? <Spinner size="sm" /> : <Save aria-hidden="true" className="size-4" />}
            Enregistrer le brouillon
          </Button>
          <Button
            isDisabled={!partenaireId || remplies.length === 0 || nbBloquees > 0 || enCours}
            onPress={() => envoyer(true)}
            variant="primary"
          >
            {enCours ? <Spinner size="sm" /> : <ShieldCheck aria-hidden="true" className="size-4" />}
            Valider le lot
          </Button>
        </div>
      </div>
    </section>
  );
}
