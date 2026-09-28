'use client';

import React from 'react';
import {
  Button,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@heroui-v3/react';
import { Combine, Eraser, Filter, Scissors, Trash2, Undo2 } from 'lucide-react';

import {
  LIBELLES_COMPARAISON,
  LIBELLES_NETTOYAGE,
  formatNombre,
  nouvelIdColonne,
  type IColonneImport,
  type ITableImport,
  type ITransformation,
  type ComparaisonImport,
  type NettoyageImport,
} from '@/features/bdd-clients';

/**
 * L'atelier des colonnes.
 *
 * <h3>Ce qu'on y fait, et pourquoi c'est là</h3>
 * <p>Un fichier de caisse ne sort jamais aux colonnes qu'on attend : le nom et le prénom
 * dans une seule case, le montant avec sa devise, le numéro avec son indicatif. Sans cet
 * atelier, il faut rouvrir le fichier dans un tableur, le corriger à la main et le
 * réexporter — et c'est là que les erreurs entrent.</p>
 *
 * <h3>Chaque geste est une LIGNE qu'on peut retirer</h3>
 * <p>Les transformations sont une liste rejouée depuis le fichier d'origine. Défaire,
 * c'est retirer un élément ; il n'y a donc pas d'état à réconcilier, et l'aperçu montre
 * toujours exactement ce que l'enregistrement produira.</p>
 *
 * <h3>Un aperçu de cinq lignes, pas de mille</h3>
 * <p>On vérifie une transformation sur quelques lignes, jamais en les lisant toutes.
 * Rendre mille lignes à chaque frappe rendrait l'atelier inutilisable, et la ligne mille
 * ne dit rien de plus que la ligne trois.</p>
 */

const APERCU = 5;

function libelleTransformation(t: ITransformation, colonnes: IColonneImport[]): string {
  const nomDe = (id: string) => colonnes.find((c) => c.id === id)?.nom ?? '(colonne retirée)';
  switch (t.type) {
    case 'fusionner':
      return `Fusionner ${t.sources.map(nomDe).join(' + ')} → « ${t.nom} »`;
    case 'diviser':
      return `Diviser ${nomDe(t.source)} sur « ${t.separateur} » → « ${t.nomGauche} » et « ${t.nomDroite} »`;
    case 'nettoyer':
      return `${LIBELLES_NETTOYAGE[t.nettoyage]} sur ${nomDe(t.source)}`;
    case 'renommer':
      return `Renommer ${nomDe(t.source)} en « ${t.nom} »`;
    case 'supprimer':
      return `Supprimer ${nomDe(t.source)}`;
    case 'filtrer':
      return `${t.garder ? 'Garder' : 'Retirer'} les lignes où ${nomDe(t.source)} ${LIBELLES_COMPARAISON[t.comparaison]}${
        t.comparaison === 'vide' || t.comparaison === 'nonVide' ? '' : ` « ${t.valeur} »`
      }`;
    default:
      return 'Transformation';
  }
}

function ChoixColonne({
  colonnes,
  etiquette,
  onChange,
  valeur,
}: {
  colonnes: IColonneImport[];
  etiquette: string;
  onChange: (id: string) => void;
  valeur: string;
}) {
  return (
    <Select
      className="w-44"
      onSelectionChange={(k) => onChange(String(k ?? ''))}
      placeholder="Choisir"
      selectedKey={valeur || null}
    >
      <Label>{etiquette}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {colonnes.map((c) => (
            <ListBox.Item id={c.id} key={c.id} textValue={c.nom}>
              {c.nom}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function ImportTransformations({
  onChanger,
  source,
  table,
  transformations,
}: {
  onChanger: (t: ITransformation[]) => void;
  source: ITableImport;
  table: ITableImport;
  transformations: ITransformation[];
}) {
  const [fusionA, setFusionA] = React.useState('');
  const [fusionB, setFusionB] = React.useState('');
  const [fusionSeparateur, setFusionSeparateur] = React.useState(' ');
  const [fusionNom, setFusionNom] = React.useState('');

  const [divisionSource, setDivisionSource] = React.useState('');
  const [divisionSeparateur, setDivisionSeparateur] = React.useState(' ');

  const [filtreSource, setFiltreSource] = React.useState('');
  const [filtreComparaison, setFiltreComparaison] =
    React.useState<ComparaisonImport>('contient');
  const [filtreValeur, setFiltreValeur] = React.useState('');
  const [filtreGarder, setFiltreGarder] = React.useState(false);

  const ajouter = (t: ITransformation) => onChanger([...transformations, t]);
  const retirer = (i: number) => onChanger(transformations.filter((_, j) => j !== i));

  const fusionner = () => {
    if (fusionA === '' || fusionB === '' || fusionA === fusionB) return;
    const nomA = table.colonnes.find((c) => c.id === fusionA)?.nom ?? '';
    const nomB = table.colonnes.find((c) => c.id === fusionB)?.nom ?? '';
    ajouter({
      id: nouvelIdColonne('f'),
      nom: fusionNom.trim() || `${nomA} + ${nomB}`,
      separateur: fusionSeparateur,
      sources: [fusionA, fusionB],
      type: 'fusionner',
    });
    setFusionA('');
    setFusionB('');
    setFusionNom('');
  };

  const diviser = () => {
    if (divisionSource === '') return;
    const nom = table.colonnes.find((c) => c.id === divisionSource)?.nom ?? 'Colonne';
    ajouter({
      idDroite: nouvelIdColonne('d'),
      idGauche: nouvelIdColonne('g'),
      nomDroite: `${nom} (droite)`,
      nomGauche: `${nom} (gauche)`,
      separateur: divisionSeparateur,
      source: divisionSource,
      type: 'diviser',
    });
    setDivisionSource('');
  };

  const sansValeur = filtreComparaison === 'vide' || filtreComparaison === 'nonVide';

  const filtrer = () => {
    if (filtreSource === '' || (!sansValeur && filtreValeur.trim() === '')) return;
    ajouter({
      comparaison: filtreComparaison,
      garder: filtreGarder,
      source: filtreSource,
      type: 'filtrer',
      valeur: sansValeur ? '' : filtreValeur,
    });
    setFiltreSource('');
    setFiltreValeur('');
  };

  const apercu = table.lignes.slice(0, APERCU);

  /*
   * ⚠ L'aperçu SUIT la colonne qu'on vient de créer.
   *
   * Une fusion et une division ajoutent leurs colonnes à la fin, et le tableau défile
   * horizontalement : sans ce déplacement, l'opérateur pose un geste et ne voit rien
   * changer — le résultat est à six colonnes vers la droite. Vu à l'écran, pas déduit.
   */
  const defilement = React.useRef<HTMLDivElement>(null);
  const nbColonnes = table.colonnes.length;
  const precedent = React.useRef(nbColonnes);
  React.useEffect(() => {
    if (nbColonnes > precedent.current && defilement.current) {
      defilement.current.scrollTo({ behavior: 'smooth', left: defilement.current.scrollWidth });
    }
    precedent.current = nbColonnes;
  }, [nbColonnes]);

  return (
    <div className="flex flex-col gap-4 rounded-large border border-separator bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted">
          2. Les colonnes
        </h2>
        <span className="text-xs text-muted">
          <span className="tabular-nums">{formatNombre(source.lignes.length)}</span> lignes,{' '}
          <span className="tabular-nums">{table.colonnes.length}</span> colonnes
        </span>
      </div>

      {/* Fusionner */}
      <div className="flex flex-wrap items-end gap-2 rounded-medium bg-surface-2 p-2">
        <Combine aria-hidden="true" className="mb-2 size-4 text-muted" />
        <ChoixColonne
          colonnes={table.colonnes}
          etiquette="Fusionner"
          onChange={setFusionA}
          valeur={fusionA}
        />
        <ChoixColonne
          colonnes={table.colonnes.filter((c) => c.id !== fusionA)}
          etiquette="avec"
          onChange={setFusionB}
          valeur={fusionB}
        />
        <TextField className="w-28" onChange={setFusionSeparateur} value={fusionSeparateur}>
          <Label>Séparé par</Label>
          <Input placeholder="espace" />
        </TextField>
        <TextField className="w-40" onChange={setFusionNom} value={fusionNom}>
          <Label>Nom de la colonne</Label>
          <Input placeholder="Facultatif" />
        </TextField>
        <Button
          className="mb-1"
          isDisabled={fusionA === '' || fusionB === ''}
          onPress={fusionner}
          size="sm"
          variant="secondary"
        >
          Fusionner
        </Button>
      </div>

      {/* Diviser */}
      <div className="flex flex-wrap items-end gap-2 rounded-medium bg-surface-2 p-2">
        <Scissors aria-hidden="true" className="mb-2 size-4 text-muted" />
        <ChoixColonne
          colonnes={table.colonnes}
          etiquette="Diviser"
          onChange={setDivisionSource}
          valeur={divisionSource}
        />
        <TextField
          className="w-28"
          onChange={setDivisionSeparateur}
          value={divisionSeparateur}
        >
          <Label>Au premier</Label>
          <Input placeholder="espace" />
        </TextField>
        <span className="mb-2 max-w-xs text-xs text-muted">
          Coupe à la PREMIÈRE occurrence : « KOFFI ABOU JEAN » donne « KOFFI » et « ABOU
          JEAN ».
        </span>
        <Button
          className="mb-1"
          isDisabled={divisionSource === ''}
          onPress={diviser}
          size="sm"
          variant="secondary"
        >
          Diviser
        </Button>
      </div>

      {/* Filtrer les lignes */}
      <div className="flex flex-wrap items-end gap-2 rounded-medium bg-surface-2 p-2">
        <Filter aria-hidden="true" className="mb-2 size-4 text-muted" />
        <ToggleButtonGroup
          aria-label="Garder ou retirer les lignes"
          className="mb-1"
          disallowEmptySelection
          onSelectionChange={(k) => setFiltreGarder([...k][0] === 'garder')}
          selectedKeys={[filtreGarder ? 'garder' : 'retirer']}
          selectionMode="single"
          size="sm"
        >
          <ToggleButton id="retirer">Retirer</ToggleButton>
          <ToggleButton id="garder">
            <ToggleButtonGroup.Separator />
            Garder
          </ToggleButton>
        </ToggleButtonGroup>
        <span className="mb-2 text-sm text-foreground">les lignes où</span>
        <ChoixColonne
          colonnes={table.colonnes}
          etiquette="Colonne"
          onChange={setFiltreSource}
          valeur={filtreSource}
        />
        <Select
          className="w-40"
          onSelectionChange={(k) => setFiltreComparaison(String(k) as ComparaisonImport)}
          selectedKey={filtreComparaison}
        >
          <Label>Condition</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {(Object.keys(LIBELLES_COMPARAISON) as ComparaisonImport[]).map((c) => (
                <ListBox.Item id={c} key={c} textValue={LIBELLES_COMPARAISON[c]}>
                  {LIBELLES_COMPARAISON[c]}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        {sansValeur ? null : (
          <TextField className="w-36" onChange={setFiltreValeur} value={filtreValeur}>
            <Label>Valeur</Label>
            <Input placeholder="annulé" />
          </TextField>
        )}
        <Button
          className="mb-1"
          isDisabled={filtreSource === '' || (!sansValeur && filtreValeur.trim() === '')}
          onPress={filtrer}
          size="sm"
          variant="secondary"
        >
          Filtrer
        </Button>
        <span className="mb-2 text-xs text-muted">
          <span className="tabular-nums">{formatNombre(table.lignes.length)}</span> ligne
          {table.lignes.length > 1 ? 's' : ''} restante
          {table.lignes.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* L'aperçu, avec les actions par colonne */}
      <div
        className="overflow-x-auto rounded-medium border border-separator"
        ref={defilement}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-separator bg-surface-2">
              {table.colonnes.map((c) => (
                <th className="min-w-[10rem] p-2 text-left align-top" key={c.id}>
                  <div className="flex flex-col gap-1">
                    <span
                      className={
                        c.calculee
                          ? 'truncate font-medium text-accent-soft-foreground'
                          : 'truncate font-medium text-foreground'
                      }
                      title={c.nom}
                    >
                      {c.nom}
                    </span>
                    <div className="flex items-center gap-1">
                      <Select
                        aria-label={`Nettoyer ${c.nom}`}
                        className="w-32"
                        onSelectionChange={(k) =>
                          ajouter({
                            nettoyage: String(k) as NettoyageImport,
                            source: c.id,
                            type: 'nettoyer',
                          })
                        }
                        placeholder="Nettoyer"
                        selectedKey={null}
                      >
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {(
                              Object.keys(LIBELLES_NETTOYAGE) as NettoyageImport[]
                            ).map((n) => (
                              <ListBox.Item id={n} key={n} textValue={LIBELLES_NETTOYAGE[n]}>
                                {LIBELLES_NETTOYAGE[n]}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      <Button
                        aria-label={`Supprimer la colonne ${c.nom}`}
                        isIconOnly
                        onPress={() => ajouter({ source: c.id, type: 'supprimer' })}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </Button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apercu.map((ligne, i) => (
              <tr className="border-b border-separator last:border-b-0" key={i}>
                {table.colonnes.map((c) => (
                  <td className="max-w-[16rem] truncate p-2 text-foreground" key={c.id}>
                    {ligne[c.id] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {source.lignes.length > APERCU ? (
        <p className="text-xs text-muted">
          Aperçu des {APERCU} premières lignes. La transformation s&apos;applique aux{' '}
          <span className="tabular-nums">{formatNombre(source.lignes.length)}</span>.
        </p>
      ) : null}

      {/* La pile des gestes posés */}
      {transformations.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Ce que tu as posé
          </span>
          <ul className="flex flex-col gap-1">
            {transformations.map((t, i) => (
              <li
                className="flex items-center justify-between gap-2 rounded-medium bg-surface-2 px-2 py-1 text-sm"
                key={i}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Eraser aria-hidden="true" className="size-3.5 shrink-0 text-muted" />
                  <span className="truncate">{libelleTransformation(t, source.colonnes)}</span>
                </span>
                <Button
                  aria-label="Retirer cette transformation"
                  isIconOnly
                  onPress={() => retirer(i)}
                  size="sm"
                  variant="ghost"
                >
                  <Undo2 aria-hidden="true" className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
