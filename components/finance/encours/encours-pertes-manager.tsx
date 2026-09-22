'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  ComboBox,
  Input,
  Label,
  ListBox,
  Modal,
  Spinner,
  Table,
  TextField,
} from '@heroui-v3/react';
import { Lock, Plus, Undo2 } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import {
  formatFcfa,
  useAnnulerPerteMutation,
  useCategoriesPerteQuery,
  useCreerPerteMutation,
  usePertesVolsQuery,
  useStatistiquesPertesQuery,
  type IEncoursReleve,
  type ILignePerteStat,
  type IPerteVol,
} from '@/features/encours';

/** Une facture sur laquelle il reste quelque chose à abandonner. */
interface FactureChoisissable {
  id: string;
  libelle: string;
  solde: number;
}

/**
 * Pertes et vols — ce qui ne sera jamais recouvré.
 *
 * <h3>Pourquoi cet onglet existe</h3>
 * <p>Le registre des déductions confondait deux choses : une compensation réelle, où le
 * partenaire s'est acquitté autrement, et une perte, qui n'a aucune contrepartie. En
 * classant les secondes comme des déductions, l'écran laissait croire à un encaissement
 * qui n'a jamais eu lieu.</p>
 *
 * <h3>Ce que l'écran n'a pas le droit de faire</h3>
 * <p>Il ne juge rien. Le plafond du cumul, la précision exigée par certaines catégories
 * et le code de validation sont tenus par le SERVEUR. L'écran les annonce pour éviter un
 * aller-retour inutile, jamais pour les remplacer : un formulaire qui s'autorise lui-même
 * n'est pas une garde.</p>
 *
 * <p>⚠ Aucune suppression. Une perte est un abandon de créance, elle engage : on
 * l'annule, et l'annulation garde son auteur, sa date et son motif.</p>
 */
/**
 * Une barre etiquetee : la part de chaque motif, de chaque partenaire.
 *
 * <p>La barre n'est pas un ornement. Un tableau de montants oblige a comparer des
 * chiffres de tete ; une barre donne l'ordre de grandeur d'un coup d'oeil, ce qui est
 * exactement ce qu'on cherche dans une repartition.</p>
 */
function Barre({ ligne, maximum }: { ligne: ILignePerteStat; maximum: number }) {
  const part = maximum > 0 ? Math.max(2, Math.round((ligne.montant / maximum) * 100)) : 0;
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="truncate text-foreground">{ligne.libelle}</span>
        <span className="shrink-0 tabular-nums text-muted">
          {formatFcfa(ligne.montant)} · {ligne.nb}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-surface-secondary">
        <div
          className="h-1.5 rounded-full bg-danger"
          style={{ width: `${part}%` }}
        />
      </div>
    </li>
  );
}

/** Une colonne de repartition, ou la phrase qui dit qu'il n'y a rien a repartir. */
function Repartition({ lignes, titre }: { lignes: ILignePerteStat[]; titre: string }) {
  const maximum = Math.max(0, ...lignes.map((l) => l.montant));
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{titre}</p>
      {lignes.length === 0 ? (
        <p className="text-xs text-muted">Rien sur cette période.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lignes.slice(0, 5).map((l) => (
            <Barre key={l.cle} ligne={l} maximum={maximum} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function EncoursPertesManager({ releve }: { releve?: IEncoursReleve }) {
  /*
   * La fenêtre par défaut : l'année en cours ET la précédente.
   *
   * <p>Le cahier des charges demande une comparaison à l'année précédente. La donner
   * d'emblée évite un second réglage pour obtenir la seule lecture qui a du sens sur
   * une évolution — un mois isolé ne se compare à rien.</p>
   */
  const anneeCourante = new Date().getFullYear();
  const debut = `${anneeCourante - 1}-01-01`;
  const fin = `${anneeCourante}-12-31`;

  const { data: pertes, isError, isFetching, refetch } = usePertesVolsQuery();
  const { data: stats } = useStatistiquesPertesQuery(debut, fin);
  const { data: categories } = useCategoriesPerteQuery();
  const creer = useCreerPerteMutation();
  const annuler = useAnnulerPerteMutation();

  const [saisieOuverte, setSaisieOuverte] = useState(false);
  const [factureId, setFactureId] = useState('');
  const [montant, setMontant] = useState('');
  const [categorieCode, setCategorieCode] = useState('');
  const [precision, setPrecision] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [code, setCode] = useState('');

  const [aAnnuler, setAAnnuler] = useState<IPerteVol | null>(null);
  const [motif, setMotif] = useState('');
  const [codeAnnulation, setCodeAnnulation] = useState('');

  /*
   * Les factures proposées viennent du RELEVÉ affiché, et donc du filtre courant.
   *
   * <p>C'est voulu : l'opérateur cherche un partenaire avec les filtres qu'il connaît
   * déjà, puis choisit la facture. Proposer toutes les factures de tous les exercices
   * dans une liste déroulante ne serait pas utilisable.</p>
   *
   * <p>Seules celles qui portent encore un solde apparaissent : on n'abandonne pas une
   * créance déjà soldée.</p>
   */
  const factures = useMemo<FactureChoisissable[]>(() => {
    const liste: FactureChoisissable[] = [];
    (releve?.partenaires ?? []).forEach((p) => {
      (p.stores ?? []).forEach((s) => {
        (s.factures ?? []).forEach((f) => {
          const solde = f.solde ?? 0;
          if (!f.id || solde <= 0) return;
          liste.push({
            id: f.id,
            solde,
            libelle: `${s.store} · ${f.periode} ${f.libelle} · ${formatFcfa(solde)}`,
          });
        });
      });
    });
    return liste;
  }, [releve]);

  const factureChoisie = factures.find((f) => f.id === factureId);
  const categorie = (categories ?? []).find((c) => c.code === categorieCode);
  const montantNombre = Number(montant.replace(/\s/g, '')) || 0;

  const precisionManquante = Boolean(categorie?.exigePrecision) && !precision.trim();
  const depasse = Boolean(factureChoisie) && montantNombre > (factureChoisie?.solde ?? 0);
  const saisieValide =
    Boolean(factureId) &&
    montantNombre > 0 &&
    !depasse &&
    Boolean(categorieCode) &&
    !precisionManquante &&
    /^\d{4}$/.test(code);

  const fermerSaisie = () => {
    setSaisieOuverte(false);
    setFactureId('');
    setMontant('');
    setCategorieCode('');
    setPrecision('');
    setCommentaire('');
    setCode('');
  };

  const enregistrer = () => {
    if (!saisieValide) return;
    creer.mutate(
      {
        codeSecret: code,
        data: {
          categorieCode,
          commentaire: commentaire.trim() || undefined,
          factureId,
          montant: montantNombre,
          precision: precision.trim() || undefined,
        },
      },
      { onSuccess: fermerSaisie },
    );
  };

  const confirmerAnnulation = () => {
    if (!aAnnuler || !motif.trim() || !/^\d{4}$/.test(codeAnnulation)) return;
    annuler.mutate(
      { codeSecret: codeAnnulation, id: aAnnuler.id, motif: motif.trim() },
      {
        onSuccess: () => {
          setAAnnuler(null);
          setMotif('');
          setCodeAnnulation('');
        },
      },
    );
  };

  if (isError) {
    return <EtatErreur onReessayer={() => void refetch()} />;
  }

  const lignes = pertes ?? [];
  const total = lignes.reduce((t, l) => t + (Number(l.montant) || 0), 0);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] text-muted">
          Ces montants sont sortis du stock des encours : ils ne comptent plus ni dans le
          reste à payer, ni dans le retard.
        </p>
        <Button onPress={() => setSaisieOuverte(true)} size="sm" variant="primary">
          <Plus aria-hidden="true" className="size-4" />
          Enregistrer une perte
        </Button>
      </div>

      {stats && stats.nbLignes > 0 ? (
        <div className="rounded-large border border-separator bg-surface px-4 py-3">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
              {anneeCourante - 1} et {anneeCourante}
            </span>
            <span className="text-sm">
              <span className="font-bold tabular-nums text-danger-soft-foreground">
                {formatFcfa(stats.total)}
              </span>
              <span className="text-muted"> sur {stats.nbLignes} ligne{stats.nbLignes > 1 ? 's' : ''}</span>
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Repartition lignes={stats.parCategorie} titre="Par motif" />
            <Repartition lignes={stats.parPartenaire} titre="Partenaires les plus concernés" />
            <Repartition lignes={stats.parMois} titre="Mois par mois" />
          </div>
        </div>
      ) : null}

      {isFetching && lignes.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner size="sm" />
        </div>
      ) : lignes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          Aucune perte enregistrée. C&apos;est la situation souhaitable.
        </p>
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Pertes et vols" className="min-w-[44rem]">
              <Table.Header>
                <Table.Column id="categorie" isRowHeader>
                  Catégorie
                </Table.Column>
                <Table.Column id="commentaire">Commentaire</Table.Column>
                <Table.Column className="w-40 text-right" id="montant">
                  Montant perdu
                </Table.Column>
                <Table.Column className="w-28" id="action">
                  {' '}
                </Table.Column>
              </Table.Header>
              <Table.Body>
                {lignes.map((l) => (
                  <Table.Row id={l.id} key={l.id}>
                    <Table.Cell className="align-top">
                      <span className="font-medium text-foreground">
                        {(categories ?? []).find((c) => c.code === l.categorieCode)?.libelle ??
                          l.categorieCode}
                      </span>
                      {l.precisionLibre ? (
                        <span className="block text-xs text-muted">{l.precisionLibre}</span>
                      ) : null}
                    </Table.Cell>
                    <Table.Cell className="align-top text-muted">
                      {l.commentaire || <span className="text-muted">—</span>}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-right align-top tabular-nums">
                      {formatFcfa(l.montant)}
                    </Table.Cell>
                    <Table.Cell className="align-top">
                      <Button onPress={() => setAAnnuler(l)} size="sm" variant="ghost">
                        <Undo2 aria-hidden="true" className="size-4" />
                        Annuler
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>

          <Table.Footer className="justify-between text-sm">
            <span className="font-semibold text-foreground">Total des pertes</span>
            <span className="font-bold tabular-nums text-foreground">{formatFcfa(total)}</span>
          </Table.Footer>
        </Table>
      )}

      <Modal isOpen={saisieOuverte} onOpenChange={(o) => (o ? null : fermerSaisie())}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Enregistrer une perte</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-3">
                <ComboBox
                  allowsEmptyCollection
                  onSelectionChange={(c) => setFactureId(String(c ?? ''))}
                  selectedKey={factureId || null}
                >
                  <Label>Facture de référence</Label>
                  <ComboBox.InputGroup>
                    <Input placeholder="Choisis la facture concernée" />
                    <ComboBox.Trigger />
                  </ComboBox.InputGroup>
                  <ComboBox.Popover>
                    <ListBox
                      items={factures}
                      renderEmptyState={() => (
                        <p className="px-3 py-2 text-sm text-muted">
                          Aucune facture avec un solde dans le relevé affiché. Ajuste les
                          filtres au-dessus.
                        </p>
                      )}
                    >
                      {(f: FactureChoisissable) => (
                        <ListBox.Item id={f.id} textValue={f.libelle}>
                          {f.libelle}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      )}
                    </ListBox>
                  </ComboBox.Popover>
                </ComboBox>

                <TextField
                  onChange={(v) => setMontant(v.replace(/\D/g, ''))}
                  value={montant}
                >
                  <Label>Montant en perte</Label>
                  <Input inputMode="numeric" placeholder="0" />
                </TextField>
                {factureChoisie ? (
                  <p
                    className={`text-xs ${depasse ? 'text-danger-soft-foreground' : 'text-muted'}`}
                  >
                    {depasse
                      ? `Au-delà du solde : cette facture ne doit plus que ${formatFcfa(factureChoisie.solde)}.`
                      : `Solde restant sur cette facture : ${formatFcfa(factureChoisie.solde)}.`}
                  </p>
                ) : null}

                <ComboBox
                  allowsEmptyCollection
                  onSelectionChange={(c) => setCategorieCode(String(c ?? ''))}
                  selectedKey={categorieCode || null}
                >
                  <Label>Catégorie</Label>
                  <ComboBox.InputGroup>
                    <Input placeholder="Motif de la perte" />
                    <ComboBox.Trigger />
                  </ComboBox.InputGroup>
                  <ComboBox.Popover>
                    <ListBox
                      items={categories ?? []}
                      renderEmptyState={() => (
                        <p className="px-3 py-2 text-sm text-muted">Aucune catégorie</p>
                      )}
                    >
                      {(c: { code: string; libelle: string }) => (
                        <ListBox.Item id={c.code} textValue={c.libelle}>
                          {c.libelle}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      )}
                    </ListBox>
                  </ComboBox.Popover>
                </ComboBox>

                {categorie?.exigePrecision ? (
                  <TextField onChange={setPrecision} value={precision}>
                    <Label>Précision (obligatoire pour ce motif)</Label>
                    <Input placeholder="De quoi s'agit-il ?" />
                  </TextField>
                ) : null}

                <TextField onChange={setCommentaire} value={commentaire}>
                  <Label>Commentaire</Label>
                  <Input placeholder="Facultatif" />
                </TextField>

                <TextField
                  onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 4))}
                  value={code}
                >
                  <Label>Code de validation (4 chiffres)</Label>
                  <Input inputMode="numeric" maxLength={4} type="password" />
                </TextField>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Lock aria-hidden="true" className="size-3.5" />
                  Ce montant sortira définitivement des encours à recouvrer.
                </p>
              </Modal.Body>

              <Modal.Footer>
                <Button onPress={fermerSaisie} variant="ghost">
                  Annuler
                </Button>
                <Button
                  isDisabled={!saisieValide}
                  isPending={creer.isPending}
                  onPress={enregistrer}
                  variant="primary"
                >
                  {creer.isPending ? <Spinner size="sm" /> : null}
                  Enregistrer
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal
        isOpen={Boolean(aAnnuler)}
        onOpenChange={(o) => {
          if (!o) {
            setAAnnuler(null);
            setMotif('');
            setCodeAnnulation('');
          }
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading className="flex items-center gap-2">
                  <Lock aria-hidden="true" className="size-4 text-danger-soft-foreground" />
                  Annuler cette perte
                </Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-3">
                <p className="text-sm text-muted">
                  {formatFcfa(aAnnuler?.montant ?? 0)} reviendront dans les encours à
                  recouvrer. La ligne n&apos;est pas supprimée : elle reste consultable
                  avec son auteur, sa date et ce motif.
                </p>
                <TextField onChange={setMotif} value={motif}>
                  <Label>Motif de l&apos;annulation</Label>
                  <Input placeholder="Pourquoi ce montant revient-il ?" />
                </TextField>
                <TextField
                  onChange={(v) => setCodeAnnulation(v.replace(/\D/g, '').slice(0, 4))}
                  value={codeAnnulation}
                >
                  <Label>Code de validation (4 chiffres)</Label>
                  <Input inputMode="numeric" maxLength={4} type="password" />
                </TextField>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  onPress={() => {
                    setAAnnuler(null);
                    setMotif('');
                    setCodeAnnulation('');
                  }}
                  variant="ghost"
                >
                  Fermer
                </Button>
                <Button
                  isDisabled={!motif.trim() || codeAnnulation.length !== 4}
                  isPending={annuler.isPending}
                  onPress={confirmerAnnulation}
                  variant="primary"
                >
                  {annuler.isPending ? <Spinner size="sm" /> : null}
                  Annuler la perte
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </section>
  );
}
