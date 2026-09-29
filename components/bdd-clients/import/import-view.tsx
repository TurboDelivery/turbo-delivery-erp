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
import { toast } from 'sonner';
import { CheckCircle2, CircleAlert, Upload } from 'lucide-react';

import { useRestaurantsListQuery } from '@/features/restaurants/queries/restaurant-list.query';
import {
  analyserMontant,
  appliquer,
  construireTable,
  decouper,
  formatNombre,
  nombreDeLots,
  proposerRattachement,
  useEnregistrerLotMutation,
  useInvalidateBddClients,
  useParametresSaisieQuery,
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

/** Ce qu'on additionne d'un lot à l'autre pour n'annoncer qu'un seul résultat. */
const CUMUL_VIDE = { nbEnregistrees: 0, nbErreurs: 0, nbNouveaux: 0, nbRattachees: 0 };

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

  /*
   * ⚠ La page est indexée à ZÉRO.
   *
   * `getRestaurantsPaginated` découpe avec `slice(page * limit, …)` : demander la
   * page 1 sur une taille de 300 commençait à la 301e enseigne d'un réseau qui en
   * compte moins de cent. La liste revenait VIDE, et l'écran disait « Aucun
   * partenaire » — ce qui se lit comme « le réseau est vide » et non comme « tu as
   * demandé la deuxième page ». Le choix du partenaire étant la première chose à
   * faire ici, rien n'était saisissable.
   */
  const { data: partenaires, isFetching: chargePartenaires } = useRestaurantsListQuery({
    limit: 300,
    page: 0,
  });
  /*
   * Où en est l'envoi, et où il s'est arrêté.
   *
   * ⚠ `arret` porte le NOMBRE DE LIGNES DÉJÀ ÉCRITES, pas seulement un message. Les
   * lots partis avant l'échec sont enregistrés : rien ne les annule. Reprendre au début
   * réécrirait des captures pour des clients déjà créés et fausserait leurs compteurs.
   */
  const [progression, setProgression] = React.useState<{ fait: number; total: number } | null>(
    null,
  );
  const [arret, setArret] = React.useState<{ ecrites: number; raison: string } | null>(null);

  const { data: reglages, isLoading: chargeReglages } = useParametresSaisieQuery();
  const verifier = useVerifierLotMutation();
  // L'import envoie plusieurs lots : il annonce lui-même, une fois, à la fin.
  const enregistrer = useEnregistrerLotMutation({ silencieux: true });
  const invalider = useInvalidateBddClients();

  const table = React.useMemo(
    () => (source ? appliquer(source, transformations) : null),
    [source, transformations],
  );

  const { ecartees, lignes } = React.useMemo(
    () => (table ? versLignes(table, rattachement) : { ecartees: 0, lignes: [] }),
    [table, rattachement],
  );

  const parLot = reglages?.lotLignesMax ?? 0;
  const nbLots = nombreDeLots(lignes.length, parLot);
  const enCours = progression !== null;
  /*
   * Tant que le serveur n'a pas dit sa règle, on ne propose rien. Deviner un plafond,
   * c'est exactement le défaut qu'on répare : l'écran annoncerait une limite que le
   * serveur n'applique pas.
   */
  const pret = partenaireId !== '' && lignes.length > 0 && parLot > 0 && !enCours;

  const charger = (grille: string[][], nom: string) => {
    const construite = construireTable(grille);
    setSource(construite);
    setNomFichier(nom);
    setTransformations([]);
    setRattachement(proposerRattachement(construite.colonnes));
    setVerdicts(new Map());
    setSynthese(null);
    setLotId(null);
    setArret(null);
  };

  /*
   * Le contrôle se demande, il ne se déclenche pas : un import porte des centaines de
   * lignes, et le relancer à chaque transformation ferait autant d'allers-retours que
   * de gestes posés.
   */
  const controler = async () => {
    if (!pret) return;
    const aControler = lignes.map((l, i) => ({
      contact: l.contact,
      index: i,
      numCheck: l.numCheck || null,
    }));
    /*
     * ⚠ L'index envoyé est celui de la ligne dans le FICHIER, pas dans la tranche.
     *
     * Le serveur ne s'en sert que comme clé pour rendre son verdict ; le garder global
     * permet de reposer chaque verdict sur sa vraie ligne quel que soit le découpage.
     * Des index remis à zéro à chaque tranche feraient clignoter les refus sur les
     * vingt-cinq premières lignes du fichier.
     */
    const tranches = decouper(aControler, parLot);
    const tous = new Map<number, IVerdictLigne>();
    setArret(null);
    setProgression({ fait: 0, total: tranches.length });
    try {
      for (let i = 0; i < tranches.length; i += 1) {
        const verdictsTranche = await verifier.mutateAsync({
          lignes: tranches[i],
          partenaireId,
        });
        verdictsTranche.forEach((v) => tous.set(v.index, v));
        setProgression({ fait: i + 1, total: tranches.length });
        // Les refus apparaissent au fil de l'eau : sur un gros fichier, attendre la fin
        // pour montrer quoi que ce soit donne une minute d'écran immobile.
        setVerdicts(new Map(tous));
      }
    } catch (erreur) {
      setArret({
        ecrites: 0,
        raison: erreur instanceof Error ? erreur.message : 'Le contrôle a échoué.',
      });
    } finally {
      setProgression(null);
    }
  };

  /**
   * Envoyer le fichier, en autant de lots que le serveur en accepte.
   *
   * <h3>Plusieurs lots, et l'opérateur n'en fait qu'un geste</h3>
   * <p>Un lot est borné par `LOT_LIGNES_MAX`. Un fichier de caisse en porte des
   * milliers. Demander à l'opérateur de découper son fichier dans un tableur serait
   * exactement le détour que cet écran existe pour supprimer, alors l'écran découpe.</p>
   *
   * <h3>⚠ Rien ne s'annule</h3>
   * <p>Chaque lot est une transaction à lui. Si le huitième échoue, les sept premiers
   * SONT en base : il n'y a pas de retour en arrière, et prétendre le contraire serait
   * un mensonge coûteux. L'écran dit donc combien de lignes sont passées, et propose de
   * reprendre à celle qui suit. Reprendre au début recréerait une capture pour chaque
   * client déjà écrit, et ses compteurs, son segment et son rang seraient faux.</p>
   */
  const envoyer = async (valider: boolean, depuis = 0) => {
    if (!pret) return;
    const aEnvoyer: ILigneSaisie[] = lignes.slice(depuis).map((l, i) => ({
      contact: l.contact,
      dateCommande: l.dateCommande || null,
      index: depuis + i,
      montant: analyserMontant(l.montant),
      nom: l.nom || null,
      numCheck: l.numCheck || null,
      numCommande: l.numCommande || null,
      prenom: l.prenom || null,
      zoneSaisie: l.zoneSaisie || null,
    }));
    const tranches = decouper(aEnvoyer, parLot);
    if (tranches.length === 0) return;

    const cumul = { ...CUMUL_VIDE };
    const refus = new Map<number, IVerdictLigne>();
    let ecrites = depuis;
    let dernierLot: string | null = null;
    let echec: string | null = null;

    setArret(null);
    setProgression({ fait: 0, total: tranches.length });
    for (let i = 0; i < tranches.length; i += 1) {
      try {
        const resultat = await enregistrer.mutateAsync({
          dateReference,
          lignes: tranches[i],
          // Un brouillon ne se reprend que s'il n'y a qu'un lot : au-delà, chaque
          // tranche est un lot neuf, et rejouer le même en écraserait les lignes.
          lotId: tranches.length === 1 ? lotId : null,
          partenaireId,
          valider,
        });
        cumul.nbEnregistrees += resultat.nbEnregistrees;
        cumul.nbErreurs += resultat.nbErreurs;
        cumul.nbNouveaux += resultat.nbNouveaux;
        cumul.nbRattachees += resultat.nbRattachees;
        resultat.erreurs.forEach((v) => refus.set(v.index, v));
        ecrites += tranches[i].length;
        dernierLot = resultat.lotId;
        setProgression({ fait: i + 1, total: tranches.length });
      } catch (erreur) {
        echec = erreur instanceof Error ? erreur.message : "L'enregistrement a échoué.";
        break;
      }
    }
    setProgression(null);
    // Une seule relecture de la liste et des cartes, à la fin : une par lot ferait
    // vingt-sept allers-retours pour le même écran.
    invalider();

    setSynthese({
      erreurs: [...refus.values()],
      lotId: dernierLot ?? '',
      nbEnregistrees: cumul.nbEnregistrees,
      nbErreurs: cumul.nbErreurs,
      nbNouveaux: cumul.nbNouveaux,
      nbRattachees: cumul.nbRattachees,
      statut: valider ? 'VALIDE' : 'BROUILLON',
    });
    if (refus.size > 0) setVerdicts(new Map(refus));

    if (echec) {
      setArret({ ecrites, raison: echec });
      toast.error(
        `Arrêté après ${formatNombre(ecrites)} ligne${ecrites > 1 ? 's' : ''} : ${echec}`,
      );
      return;
    }

    const detail =
      `${formatNombre(cumul.nbEnregistrees)} enregistrée${cumul.nbEnregistrees > 1 ? 's' : ''}` +
      ` · ${formatNombre(cumul.nbNouveaux)} nouveau${cumul.nbNouveaux > 1 ? 'x' : ''}` +
      ` · ${formatNombre(cumul.nbRattachees)} rattachée${cumul.nbRattachees > 1 ? 's' : ''}` +
      (tranches.length > 1 ? ` · ${tranches.length} lots` : '');
    if (cumul.nbErreurs > 0) toast.warning(`${detail} · ${formatNombre(cumul.nbErreurs)} en erreur`);
    else toast.success(detail);

    setLotId(valider ? null : dernierLot);
    if (valider) {
      setSource(null);
      setTransformations([]);
      setRattachement({});
      setVerdicts(new Map());
      setArret(null);
    }
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
              <span className="max-w-xl text-xs text-muted">
                {progression
                  ? `Lot ${formatNombre(progression.fait + 1)} sur ${formatNombre(progression.total)}. Ne quitte pas cette page.`
                  : arret
                    ? `Arrêté : ${arret.raison} ${formatNombre(arret.ecrites)} ligne${arret.ecrites > 1 ? 's sont' : ' est'} déjà enregistrée${arret.ecrites > 1 ? 's' : ''} et ne se rejoue${arret.ecrites > 1 ? 'nt' : ''} pas.`
                    : chargeReglages
                      ? 'Lecture des règles du serveur…'
                      : parLot === 0
                        ? 'Les règles du serveur n’ont pas pu être lues. Réessaie dans un instant.'
                        : partenaireId === ''
                          ? 'Choisis le restaurant dont vient ce fichier.'
                          : lignes.length === 0
                            ? 'Aucune ligne ne porte de numéro : vérifie le rattachement.'
                            : nbLots > 1
                              ? `${formatNombre(lignes.length)} lignes : un lot en porte au plus ${formatNombre(parLot)}, l’écran en enverra ${formatNombre(nbLots)} à la suite.`
                              : verdicts.size === 0
                                ? 'Contrôle avant d’enregistrer : le serveur dira ce qui est déjà en base.'
                                : bloquees.length > 0
                                  ? `${formatNombre(bloquees.length)} ligne(s) seront refusées. Les autres passeront.`
                                  : 'Tout passe. Enregistre en brouillon pour relire, ou valide.'}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  isDisabled={!pret}
                  onPress={() => void controler()}
                  variant="secondary"
                >
                  {enCours && verifier.isPending ? <Spinner color="current" size="sm" /> : null}
                  Contrôler
                </Button>
                {/*
                  Un brouillon ne se propose que si le fichier tient dans UN lot. Au-delà,
                  « brouillon » n'aurait plus de sens : il y aurait vingt-sept brouillons à
                  relire un par un, ce qui est plus lourd que de valider.
                */}
                {nbLots <= 1 ? (
                  <Button isDisabled={!pret} onPress={() => void envoyer(false)} variant="ghost">
                    Enregistrer en brouillon
                  </Button>
                ) : null}
                {arret ? (
                  <Button
                    isDisabled={!pret}
                    onPress={() => void envoyer(true, arret.ecrites)}
                    variant="primary"
                  >
                    Reprendre à la ligne {formatNombre(arret.ecrites + 1)}
                  </Button>
                ) : (
                  <Button
                    isDisabled={!pret}
                    onPress={() => void envoyer(true)}
                    variant="primary"
                  >
                    {enCours && enregistrer.isPending ? (
                      <Spinner color="current" size="sm" />
                    ) : null}
                    {nbLots > 1 ? `Valider les ${formatNombre(nbLots)} lots` : 'Valider le lot'}
                  </Button>
                )}
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
