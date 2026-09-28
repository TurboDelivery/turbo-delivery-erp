'use client';

import React from 'react';
import {
  Button,
  ComboBox,
  Input,
  Label,
  ListBox,
  Spinner,
  TextField,
} from '@heroui-v3/react';
import { CheckCircle2, CircleAlert, Upload } from 'lucide-react';

import { useRestaurantsListQuery } from '@/features/restaurants/queries/restaurant-list.query';
import {
  analyserMontant,
  appliquer,
  construireTable,
  formatNombre,
  proposerRattachement,
  useEnregistrerLotMutation,
  useVerifierLotMutation,
  versLignes,
  type ILigneSaisie,
  type IRattachement,
  type ISyntheseLot,
  type ITableImport,
  type ITransformation,
  type IVerdictLigne,
} from '@/features/bdd-clients';

import { ImportChargement } from './import-chargement';
import { ImportRattachement } from './import-rattachement';
import { ImportTransformations } from './import-transformations';

/**
 * Importer un fichier de contacts, en recomposant ses colonnes.
 *
 * <h3>Pourquoi un écran à part de la saisie</h3>
 * <p>La grille de saisie est faite pour taper des tickets un par un, sept colonnes
 * fixes. Un fichier de caisse porte la date de la commande et son numéro, que la grille
 * n'a pas, et surtout des colonnes qu'il faut recomposer avant de savoir ce qu'elles
 * sont. Ce sont deux gestes différents, et les mélanger aurait alourdi celui qu'on fait
 * cent fois par jour.</p>
 *
 * <h3>Le contrôle et l'enregistrement sont les MÊMES</h3>
 * <p>Même contrôle groupé, même enregistrement, mêmes refus. L'import ne s'ouvre pas une
 * porte à lui : il produit des lignes, et ces lignes passent par où passent toutes les
 * autres. Une seconde porte aurait fini par diverger de la première.</p>
 *
 * <h3>⚠ Le contrôle N'EST PAS automatique ici</h3>
 * <p>Sur la saisie, il se déclenche à la frappe parce qu'on saisit dix lignes. Un import
 * en porte des centaines : relancer le contrôle à chaque transformation ferait autant
 * d'allers-retours que de gestes, sur un écran où l'on en pose beaucoup. Il se demande.</p>
 */

/** Au-delà, le serveur refuse le lot entier : on s'arrête et on le dit. */
const MAXIMUM_LIGNES = 500;

export function ImportView() {
  const [source, setSource] = React.useState<ITableImport | null>(null);
  const [nomFichier, setNomFichier] = React.useState('');
  const [transformations, setTransformations] = React.useState<ITransformation[]>([]);
  const [rattachement, setRattachement] = React.useState<IRattachement>({});

  const [partenaireId, setPartenaireId] = React.useState('');
  const [dateReference, setDateReference] = React.useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [verdicts, setVerdicts] = React.useState<Map<number, IVerdictLigne>>(new Map());
  const [synthese, setSynthese] = React.useState<ISyntheseLot | null>(null);
  const [lotId, setLotId] = React.useState<string | null>(null);

  const { data: partenaires, isFetching: chargePartenaires } = useRestaurantsListQuery({
    limit: 300,
    page: 1,
  });
  const verifier = useVerifierLotMutation();
  const enregistrer = useEnregistrerLotMutation();

  const table = React.useMemo(
    () => (source ? appliquer(source, transformations) : null),
    [source, transformations],
  );

  const { ecartees, lignes } = React.useMemo(
    () => (table ? versLignes(table, rattachement) : { ecartees: 0, lignes: [] }),
    [table, rattachement],
  );

  const tropNombreuses = lignes.length > MAXIMUM_LIGNES;
  const pret = partenaireId !== '' && lignes.length > 0 && !tropNombreuses;

  const charger = (grille: string[][], nom: string) => {
    const construite = construireTable(grille);
    setSource(construite);
    setNomFichier(nom);
    setTransformations([]);
    setRattachement(proposerRattachement(construite.colonnes));
    setVerdicts(new Map());
    setSynthese(null);
    setLotId(null);
  };

  /*
   * Le contrôle se demande, il ne se déclenche pas : un import porte des centaines de
   * lignes, et le relancer à chaque transformation ferait autant d'allers-retours que
   * de gestes posés.
   */
  const controler = () => {
    if (!pret) return;
    verifier.mutate(
      {
        lignes: lignes.map((l, i) => ({
          contact: l.contact,
          index: i,
          numCheck: l.numCheck || null,
        })),
        partenaireId,
      },
      { onSuccess: (r) => setVerdicts(new Map(r.map((v) => [v.index, v]))) },
    );
  };

  const envoyer = (valider: boolean) => {
    if (!pret) return;
    const aEnvoyer: ILigneSaisie[] = lignes.map((l, i) => ({
      contact: l.contact,
      dateCommande: l.dateCommande || null,
      index: i,
      montant: analyserMontant(l.montant),
      nom: l.nom || null,
      numCheck: l.numCheck || null,
      numCommande: l.numCommande || null,
      prenom: l.prenom || null,
      zoneSaisie: l.zoneSaisie || null,
    }));
    enregistrer.mutate(
      { dateReference, lignes: aEnvoyer, lotId, partenaireId, valider },
      {
        onSuccess: (resultat) => {
          setSynthese(resultat);
          if (resultat.erreurs.length > 0) {
            setVerdicts(new Map(resultat.erreurs.map((v) => [v.index, v])));
          }
          setLotId(resultat.statut === 'VALIDE' ? null : resultat.lotId);
          if (resultat.statut === 'VALIDE') {
            setSource(null);
            setTransformations([]);
            setRattachement({});
            setVerdicts(new Map());
          }
        },
      },
    );
  };

  const bloquees = [...verdicts.values()].filter((v) => v.etat === 'BLOQUE');

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Importer des contacts</h1>
        <p className="text-sm text-muted">
          Un fichier de caisse ne sort jamais aux colonnes attendues. Recompose-les ici
          plutôt que dans un tableur : le contrôle et l&apos;enregistrement sont ceux de la
          saisie.
        </p>
      </div>

      <ImportChargement onCharger={charger} />

      {source && table ? (
        <>
          <p className="flex items-center gap-2 text-xs text-muted">
            <Upload aria-hidden="true" className="size-3.5" />
            {nomFichier} · <span className="tabular-nums">
              {formatNombre(source.lignes.length)}
            </span>{' '}
            ligne{source.lignes.length > 1 ? 's' : ''} lue
            {source.lignes.length > 1 ? 's' : ''}
          </p>

          <ImportTransformations
            onChanger={setTransformations}
            source={source}
            table={table}
            transformations={transformations}
          />

          <ImportRattachement
            onChanger={setRattachement}
            rattachement={rattachement}
            table={table}
          />

          <div className="flex flex-col gap-3 rounded-large border border-separator bg-surface p-4">
            <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted">
              4. Contrôler et enregistrer
            </h2>

            <div className="flex flex-wrap items-end gap-3">
              <ComboBox
                allowsEmptyCollection
                className="min-w-[16rem]"
                onSelectionChange={(c) => setPartenaireId(String(c ?? ''))}
                selectedKey={partenaireId || null}
              >
                <Label>Restaurant</Label>
                <ComboBox.InputGroup>
                  <Input placeholder="D'où vient ce fichier ?" />
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

              <div className="ms-auto flex items-baseline gap-4 text-sm">
                <span className="text-muted">
                  À importer{' '}
                  <strong className="tabular-nums text-foreground">
                    {formatNombre(lignes.length)}
                  </strong>
                </span>
                {ecartees > 0 ? (
                  <span className="text-muted">
                    Sans numéro{' '}
                    <strong className="tabular-nums text-foreground">
                      {formatNombre(ecartees)}
                    </strong>
                  </span>
                ) : null}
                {verdicts.size > 0 ? (
                  <span className="text-muted">
                    Bloquées{' '}
                    <strong className="tabular-nums text-foreground">
                      {formatNombre(bloquees.length)}
                    </strong>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-separator pt-3">
              <span className="max-w-lg text-xs text-muted">
                {tropNombreuses
                  ? `${formatNombre(lignes.length)} lignes : le serveur refuse au-delà de ${MAXIMUM_LIGNES}. Découpe le fichier.`
                  : partenaireId === ''
                    ? 'Choisis le restaurant dont vient ce fichier.'
                    : lignes.length === 0
                      ? 'Aucune ligne ne porte de numéro : vérifie le rattachement.'
                      : verdicts.size === 0
                        ? 'Contrôle avant d’enregistrer : le serveur dira ce qui est déjà en base.'
                        : bloquees.length > 0
                          ? `${formatNombre(bloquees.length)} ligne(s) seront refusées. Les autres passeront.`
                          : 'Tout passe. Enregistre en brouillon pour relire, ou valide.'}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  isDisabled={!pret || verifier.isPending}
                  onPress={controler}
                  variant="secondary"
                >
                  {verifier.isPending ? <Spinner color="current" size="sm" /> : null}
                  Contrôler
                </Button>
                <Button
                  isDisabled={!pret || enregistrer.isPending}
                  onPress={() => envoyer(false)}
                  variant="ghost"
                >
                  Enregistrer en brouillon
                </Button>
                <Button
                  isDisabled={!pret || enregistrer.isPending}
                  onPress={() => envoyer(true)}
                  variant="primary"
                >
                  {enregistrer.isPending ? <Spinner color="current" size="sm" /> : null}
                  Valider le lot
                </Button>
              </div>
            </div>

            {/*
              Les refus sont NOMMÉS, pas comptés. « 12 en erreur » sans dire lesquelles
              obligerait à rouvrir le fichier pour deviner.
            */}
            {bloquees.length > 0 ? (
              <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-medium bg-danger-soft p-2">
                {bloquees.map((v) => (
                  <li
                    className="flex items-center gap-2 text-xs text-danger-soft-foreground"
                    key={v.index}
                  >
                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                    <span className="tabular-nums">
                      Ligne {v.index + 1} · {lignes[v.index]?.contact ?? ''}
                    </span>
                    <span className="truncate">{v.motif}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {synthese ? (
              <p className="flex items-center gap-2 rounded-medium bg-surface-2 px-3 py-2 text-sm text-foreground">
                <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
                <span className="tabular-nums">{formatNombre(synthese.nbEnregistrees)}</span>{' '}
                enregistrée{synthese.nbEnregistrees > 1 ? 's' : ''} ·{' '}
                <span className="tabular-nums">{formatNombre(synthese.nbNouveaux)}</span>{' '}
                nouvelle{synthese.nbNouveaux > 1 ? 's' : ''} fiche
                {synthese.nbNouveaux > 1 ? 's' : ''} ·{' '}
                <span className="tabular-nums">{formatNombre(synthese.nbRattachees)}</span>{' '}
                rattachée{synthese.nbRattachees > 1 ? 's' : ''}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
