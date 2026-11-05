'use client';

import React from 'react';
import { toast } from 'sonner';

import { ImportTransformations } from '@/components/tableur/atelier-colonnes';
import { appliquer, construireTable, type ITransformation } from '@/lib/tableur/atelier-colonnes';
import { useLivreurs } from '@/features/tickets/hooks/use-livreurs';
import {
  useGrillesZonesQueries,
  useParametresImportQuery,
} from '@/features/tickets/import/import-tickets.query';
import {
  enregistrerPaquetRequest,
  verifierLignesRequest,
  type ISyntheseImport,
  type IVerdictImport,
} from '@/features/tickets/import/import-tickets.request';
import {
  choixDeZone,
  clefChoixZone,
  preparerLignes,
  proposerCorrespondances,
  proposerRattachementTicket,
  referencesEnDoublon,
  valeursDistinctes,
  versLignesTicket,
  type ICandidat,
  type ILigneAEnvoyer,
  type IRattachementTicket,
} from '@/features/tickets/import/import-tickets.utils';
import type { Restaurant } from '@/types/models';
import { formatNombre } from '@/utils/format.utils';

import { EtapeControle } from './etape-controle';
import { EtapeFichier, devinerLigneEntete, type IFeuilleLue } from './etape-fichier';
import { EtapeRattachement } from './etape-rattachement';
import { EtapeReferences, type IOptionRattachement } from './etape-references';

/**
 * L'import de tickets, d'un bout à l'autre.
 *
 * <h3>L'état tient en deux moitiés</h3>
 * <p>Ce que l'opérateur a POSÉ — le fichier, les transformations, les rattachements
 * qu'il a corrigés — et ce qui en DÉCOULE, recalculé à chaque rendu depuis la source.
 * Rien de dérivé n'est stocké. C'est ce qui garantit que l'aperçu montre exactement ce
 * que l'enregistrement produira : une valeur gardée en double aurait tôt ou tard
 * divergé de celle qu'on envoie.</p>
 *
 * <h3>Les propositions ne sont pas écrites dans l'état</h3>
 * <p>Les correspondances devinées se FUSIONNENT au rendu avec les choix de
 * l'opérateur ({@code ...propose, ...manuel}), au lieu d'être recopiées dans l'état par
 * un effet. Un effet qui écrit un état dérivé d'un tableau recalculé à chaque rendu est
 * la recette exacte du « Maximum update depth exceeded » déjà payé sur l'écran des
 * clients : la page tombe en 500 avec un build vert.</p>
 *
 * <h3>Ce que l'écran ne garde pas</h3>
 * <p>Aucun brouillon. Un import interrompu se reprend en rechargeant le même fichier :
 * les lignes déjà écrites reviendront « code check déjà existant », ce qui est à la fois
 * exact et plus sûr qu'une reprise à une position mémorisée, qui supposerait que rien
 * n'a bougé entre-temps.</p>
 */

/** Taille des paquets du CONTRÔLE. Il n'écrit rien, il peut donc voir large. */
const PAQUET_CONTROLE = 500;

/** Le plafond d'enregistrement, tant que le serveur n'a pas dit le sien. */
const PAQUET_ENREGISTREMENT_PAR_DEFAUT = 50;

function decouper<T>(liste: T[], taille: number): T[][] {
  const paquets: T[][] = [];
  for (let i = 0; i < liste.length; i += taille) {
    paquets.push(liste.slice(i, i + taille));
  }
  return paquets;
}

/**
 * Les deux appels qui touchent au serveur.
 *
 * <p>Ils sont des PARAMÈTRES et non des imports figés, pour une raison qui n'est pas de
 * confort : l'environnement local de ce projet pointe sur la production. Un banc de
 * relecture qui rendrait cet écran tel quel offrirait donc un bouton « Enregistrer »
 * capable de créer de vrais tickets, donc de la paie et des factures, d'un clic. Le banc
 * passe des doublures ; partout ailleurs, ce sont les vrais appels.</p>
 */
export interface IApiImportTickets {
  enregistrer: (lignes: ILigneAEnvoyer[]) => Promise<ISyntheseImport>;
  verifier: (lignes: ILigneAEnvoyer[]) => Promise<IVerdictImport[]>;
}

const API_REELLE: IApiImportTickets = {
  enregistrer: enregistrerPaquetRequest,
  verifier: verifierLignesRequest,
};

export function ImportTicketsView({
  api = API_REELLE,
  restaurants,
}: {
  api?: IApiImportTickets;
  restaurants: Restaurant[];
}) {
  // ── Ce que l'opérateur a posé ──────────────────────────────────────────────────
  const [feuilles, setFeuilles] = React.useState<IFeuilleLue[]>([]);
  const [nomFichier, setNomFichier] = React.useState('');
  const [feuilleChoisie, setFeuilleChoisie] = React.useState('');
  const [ligneEntete, setLigneEntete] = React.useState(0);
  const [transformations, setTransformations] = React.useState<ITransformation[]>([]);
  const [rattachementManuel, setRattachementManuel] =
    React.useState<IRattachementTicket | null>(null);
  const [livreurManuel, setLivreurManuel] = React.useState<Record<string, string>>({});
  const [partenaireManuel, setPartenaireManuel] = React.useState<Record<string, string>>({});
  const [zoneManuel, setZoneManuel] = React.useState<Record<string, string>>({});

  const [verdicts, setVerdicts] = React.useState<IVerdictImport[] | null>(null);
  const [enCours, setEnCours] = React.useState(false);
  const [progression, setProgression] = React.useState<{ ecrites: number; total: number } | null>(
    null,
  );
  const [erreur, setErreur] = React.useState<string | null>(null);

  const { livreurs } = useLivreurs();
  const { data: parametres } = useParametresImportQuery();

  // ── Ce qui en découle ──────────────────────────────────────────────────────────
  const grilleBrute = React.useMemo(() => {
    const feuille = feuilles.find((f) => f.nom === feuilleChoisie);
    if (!feuille) return [] as string[][];
    return feuille.grille.slice(ligneEntete);
  }, [feuilleChoisie, feuilles, ligneEntete]);

  const source = React.useMemo(() => construireTable(grilleBrute), [grilleBrute]);
  const table = React.useMemo(() => appliquer(source, transformations), [source, transformations]);

  const rattachementPropose = React.useMemo(
    () => proposerRattachementTicket(table.colonnes),
    [table.colonnes],
  );
  const rattachement = rattachementManuel ?? rattachementPropose;

  const lignesLues = React.useMemo(
    () => (table.colonnes.length === 0 ? [] : versLignesTicket(table, rattachement)),
    [table, rattachement],
  );

  const valeursLivreur = React.useMemo(
    () => valeursDistinctes(lignesLues, 'livreur'),
    [lignesLues],
  );
  const valeursPartenaire = React.useMemo(
    () => valeursDistinctes(lignesLues, 'partenaire'),
    [lignesLues],
  );

  /*
   * Les candidats, et ce qu'on refuse d'eux.
   *
   * <p>Un livreur supprimé ou désactivé (`status === 5`) fait REFUSER le ticket côté
   * serveur. Le proposer quand même ferait rattacher quatre cents lignes avant de
   * découvrir au contrôle qu'aucune ne passe. Il reste visible et grisé, avec son motif :
   * le masquer ferait croire que le compte n'existe pas.</p>
   */
  const candidatsLivreur = React.useMemo<ICandidat[]>(
    () =>
      livreurs
        .filter((l) => !l.deleted)
        .map((l) => ({
          id: l.id,
          libelles: [`${l.nom ?? ''} ${l.prenoms ?? ''}`, `${l.prenoms ?? ''} ${l.nom ?? ''}`],
        })),
    [livreurs],
  );
  const optionsLivreur = React.useMemo<IOptionRattachement[]>(
    () =>
      livreurs
        .filter((l) => !l.deleted)
        .map((l) => ({
          id: l.id,
          indisponible: l.status === 5,
          libelle: `${l.nom ?? ''} ${l.prenoms ?? ''}`.trim() || 'Compte sans nom',
          motifIndisponible: l.status === 5 ? 'désactivé' : undefined,
        }))
        .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr')),
    [livreurs],
  );

  const candidatsPartenaire = React.useMemo<ICandidat[]>(
    () => restaurants.map((r) => ({ id: r.id, libelles: [r.nomEtablissement ?? ''] })),
    [restaurants],
  );
  const optionsPartenaire = React.useMemo<IOptionRattachement[]>(
    () =>
      restaurants
        .map((r) => ({ id: r.id, libelle: r.nomEtablissement ?? 'Partenaire sans nom' }))
        .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr')),
    [restaurants],
  );

  const choixLivreur = React.useMemo(
    () => ({ ...proposerCorrespondances(valeursLivreur, candidatsLivreur), ...livreurManuel }),
    [candidatsLivreur, livreurManuel, valeursLivreur],
  );
  const choixPartenaire = React.useMemo(
    () => ({
      ...proposerCorrespondances(valeursPartenaire, candidatsPartenaire),
      ...partenaireManuel,
    }),
    [candidatsPartenaire, partenaireManuel, valeursPartenaire],
  );

  const partenairesUtilises = React.useMemo(
    () => [...new Set(Object.values(choixPartenaire))].sort(),
    [choixPartenaire],
  );
  /*
   * `enEchec` etait calcule puis jete. Consequence : quand la lecture de grille d'UN
   * partenaire echoue (502, coupure, action serveur qui leve), `grilles[partenaireId]`
   * reste vide, aucune zone n'est proposee, et l'ecran dit « Aucune zone a ce prix ».
   * L'operateur lit un probleme de TARIF la ou il y a une PANNE, et les lignes de ce
   * partenaire sont ecartees en silence.
   */
  const { enAttente: grillesEnAttente, enEchec: grillesEnEchec, grilles } =
    useGrillesZonesQueries(partenairesUtilises);

  const zones = React.useMemo(
    () => choixDeZone(lignesLues, choixPartenaire, grilles),
    [choixPartenaire, grilles, lignesLues],
  );

  const choixZone = React.useMemo(() => {
    const automatique: Record<string, string> = {};
    for (const zone of zones) {
      /*
       * Ce qui est RETENU d'office, et ce qui reste à décider.
       *
       * <p>Une seule candidate : il n'y a pas de choix, seulement une information à
       * donner. Plusieurs candidates mais la même commission : le fichier ne porte pas
       * la zone et l'opérateur n'a aucun moyen de savoir laquelle c'était — lui demander
       * de trancher n'ajoute pas de précision, cela ajoute un clic, et c'est ainsi qu'on
       * apprend à cliquer sans lire. Or le cas d'à côté, lui, change le montant facturé.
       * Mesuré en production : 95 couples ambigus sur 98 sont dans ce cas.</p>
       *
       * <p>Le choix reste modifiable, et l'écran dit qu'il a été retenu d'office.</p>
       */
      if (zone.candidates.length === 1 || (zone.sansEffetSurLeMontant && zone.candidates.length > 0)) {
        automatique[clefChoixZone(zone.partenaireId, zone.prix)] = zone.candidates[0].id;
      }
    }
    return { ...automatique, ...zoneManuel };
  }, [zoneManuel, zones]);

  const preparation = React.useMemo(
    () => preparerLignes(lignesLues, choixLivreur, choixPartenaire, choixZone),
    [choixLivreur, choixPartenaire, choixZone, lignesLues],
  );

  const doublonsInternes = React.useMemo(() => referencesEnDoublon(lignesLues), [lignesLues]);

  // ── Les gestes ─────────────────────────────────────────────────────────────────
  const chargerFichier = (lues: IFeuilleLue[], nom: string) => {
    const premiere = lues[0];
    setFeuilles(lues);
    setNomFichier(nom);
    setFeuilleChoisie(premiere.nom);
    setLigneEntete(devinerLigneEntete(premiere.grille));
    // Tout ce qui dépendait de l'ancien fichier repart de zéro : garder un rattachement
    // posé sur d'autres colonnes le ferait pointer vers des identifiants qui n'existent
    // plus dans la nouvelle table, en silence.
    setTransformations([]);
    setRattachementManuel(null);
    setLivreurManuel({});
    setPartenaireManuel({});
    setZoneManuel({});
    setVerdicts(null);
    setErreur(null);
  };

  const changerFeuille = (nom: string) => {
    const feuille = feuilles.find((f) => f.nom === nom);
    setFeuilleChoisie(nom);
    if (feuille) setLigneEntete(devinerLigneEntete(feuille.grille));
    setTransformations([]);
    setRattachementManuel(null);
    setVerdicts(null);
  };

  const controler = async () => {
    setErreur(null);
    setEnCours(true);
    try {
      const resultats: IVerdictImport[] = [];
      for (const paquet of decouper(preparation.pretes, PAQUET_CONTROLE)) {
        resultats.push(...(await api.verifier(paquet)));
      }

      /*
       * Le doublon INTERNE au fichier se tranche ici, pas au serveur.
       *
       * <p>Le serveur ne voit qu'un paquet a la fois : deux lignes portant le meme code
       * check, l'une en ligne 10 et l'autre en ligne 600, tombent dans deux paquets et
       * passent toutes les deux en PRET. L'ecran, lui, annonce deja en rouge qu'elles
       * seront refusees. Sans ce recoupement, il annoncait un refus qui n'arrivait pas,
       * et la seconde ligne partait a l'enregistrement — ou seule la PREMIERE ecrite
       * prend la reference, la suivante echouant plus tard avec un message d'existence
       * deja prise. Mieux vaut le dire avant.</p>
       */
      const indicesEnDoublon = new Set([...doublonsInternes.values()].flat());
      setVerdicts(
        indicesEnDoublon.size === 0
          ? resultats
          : resultats.map((v) =>
              v.etat === 'PRET' && indicesEnDoublon.has(v.index)
                ? { ...v, etat: 'BLOQUE' as const, motif: 'Ce code check apparaît plusieurs fois dans le fichier.' }
                : v,
            ),
      );
    } catch (e) {
      setVerdicts(null);
      setErreur(
        e instanceof Error
          ? `Le contrôle n’a pas abouti : ${e.message}`
          : 'Le contrôle n’a pas abouti.',
      );
    } finally {
      setEnCours(false);
    }
  };

  const enregistrer = async () => {
    const aEcrire = (verdicts ?? []).filter((v) => v.etat === 'PRET');
    const parIndex = new Map(preparation.pretes.map((l) => [l.index, l]));
    const lignes = aEcrire.map((v) => parIndex.get(v.index)).filter(Boolean);
    if (lignes.length === 0) return;

    const taille = parametres?.lignesMax ?? PAQUET_ENREGISTREMENT_PAR_DEFAUT;
    setErreur(null);
    setEnCours(true);
    setProgression({ ecrites: 0, total: lignes.length });

    /*
     * Les verdicts se mettent à jour AU FUR ET À MESURE, et non à la fin.
     *
     * <p>Un enregistrement de deux mille lignes dure plusieurs minutes. Si le réseau
     * tombe au paquet douze, un écran qui n'affiche rien avant la fin laisse l'opérateur
     * sans savoir ce qui est écrit — et la tentation est alors de tout relancer, donc de
     * créer des doublons. Ici, chaque paquet rend son verdict tout de suite.</p>
     */
    /*
     * La carte part de TOUS les verdicts du controle, pas seulement des lignes a ecrire.
     * Amorcee avec `aEcrire`, elle perdait les lignes BLOQUE des le premier paquet :
     * la liste « Ce qui ne passera pas » disparaissait, et le garde-fou du compte
     * (`total == nbLignesFichier`) comparait 90 traitees a 100 lues et allumait
     * « le compte ne tombe pas juste » apres un enregistrement pourtant reussi.
     */
    const parLigne = new Map((verdicts ?? []).map((v) => [v.index, v]));
    let ecrites = 0;

    try {
      for (const paquet of decouper(lignes as typeof preparation.pretes, taille)) {
        const synthese = await api.enregistrer(paquet);
        for (const verdict of synthese.lignes) {
          parLigne.set(verdict.index, verdict);
        }
        ecrites += synthese.nbEnregistrees;
        setProgression({ ecrites, total: lignes.length });
        setVerdicts([...parLigne.values()].sort((a, b) => a.index - b.index));
      }
      toast.success(
        `${formatNombre(ecrites)} ticket${ecrites > 1 ? 's' : ''} enregistré${ecrites > 1 ? 's' : ''}.`,
      );
    } catch (e) {
      // Ce qui est écrit reste écrit : chaque paquet est une transaction à lui. On le
      // DIT, plutôt que de laisser croire que l'import entier a échoué.
      setVerdicts([...parLigne.values()].sort((a, b) => a.index - b.index));
      setErreur(
        `L’enregistrement s’est interrompu après ${formatNombre(ecrites)} ticket(s). `
          + 'Ceux-là sont bien créés. Relance le contrôle avant de reprendre : les lignes '
          + 'déjà écrites apparaîtront comme déjà existantes.'
          + (e instanceof Error ? ` (${e.message})` : ''),
      );
    } finally {
      setEnCours(false);
    }
  };

  const referenceParIndex = React.useMemo(
    () => new Map(lignesLues.map((l) => [l.index, l.reference.trim()])),
    [lignesLues],
  );

  const nomPartenaire = React.useCallback(
    (id: string) => restaurants.find((r) => r.id === id)?.nomEtablissement ?? 'Partenaire',
    [restaurants],
  );

  const champsManquants = ['reference', 'livreur', 'partenaire', 'montantLivraison', 'montantCommande', 'date']
    .filter((champ) => !rattachement[champ as keyof IRattachementTicket]);

  return (
    <div className="flex flex-col gap-4">
      <EtapeFichier
        feuilleChoisie={feuilleChoisie}
        feuilles={feuilles}
        ligneEntete={ligneEntete}
        nomFichier={nomFichier}
        onChoisirFeuille={changerFeuille}
        onChoisirLigneEntete={(l) => {
          setLigneEntete(l);
          /*
           * Les transformations partent AUSSI, comme au changement de feuille et au
           * chargement d'un fichier. Elles visent des colonnes par identifiant, et
           * `construireTable` reconstruit ces identifiants depuis la nouvelle en-tete :
           * un filtre « retirer les lignes ou Statut vaut ANNULE » devenait INERTE sans
           * rien dire, et les 120 lignes qu'il ecartait repartaient a l'enregistrement.
           */
          setTransformations([]);
          setRattachementManuel(null);
          setVerdicts(null);
        }}
        onLire={chargerFichier}
      />

      {source.colonnes.length > 0 ? (
        <>
          <ImportTransformations
            onChanger={(t) => {
              setTransformations(t);
              setVerdicts(null);
            }}
            source={source}
            table={table}
            transformations={transformations}
          />

          <EtapeRattachement
            onChanger={(r) => {
              setRattachementManuel(r);
              setVerdicts(null);
            }}
            rattachement={rattachement}
            table={table}
          />

          {champsManquants.length > 0 ? (
            <p className="rounded-large border border-separator bg-surface p-4 text-sm text-muted">
              Rattache encore {champsManquants.length} champ
              {champsManquants.length > 1 ? 's' : ''} obligatoire
              {champsManquants.length > 1 ? 's' : ''} pour continuer.
            </p>
          ) : (
            <>
              {doublonsInternes.size > 0 ? (
                <p className="rounded-large border border-danger/40 bg-danger/10 p-4 text-sm text-foreground">
                  {formatNombre(doublonsInternes.size)} code
                  {doublonsInternes.size > 1 ? 's' : ''} check apparaî
                  {doublonsInternes.size > 1 ? 'ssent' : 't'} plusieurs fois dans ce
                  fichier. Ces lignes seront refusées : un code check ne vaut que pour un
                  ticket, et le dupliquer paierait la course deux fois.
                </p>
              ) : null}

              <EtapeReferences
                choixLivreur={choixLivreur}
                choixPartenaire={choixPartenaire}
                choixZone={choixZone}
                grillesEnAttente={grillesEnAttente && partenairesUtilises.length > 0}
                grillesEnEchec={grillesEnEchec}
                livreurs={optionsLivreur}
                nomPartenaire={nomPartenaire}
                onChoisirLivreur={(normalisee, id) => {
                  setLivreurManuel((p) => ({ ...p, [normalisee]: id }));
                  setVerdicts(null);
                }}
                onChoisirPartenaire={(normalisee, id) => {
                  setPartenaireManuel((p) => ({ ...p, [normalisee]: id }));
                  setVerdicts(null);
                }}
                onChoisirZone={(clef, zoneId) => {
                  setZoneManuel((p) => ({ ...p, [clef]: zoneId }));
                  setVerdicts(null);
                }}
                partenaires={optionsPartenaire}
                valeursLivreur={valeursLivreur}
                valeursPartenaire={valeursPartenaire}
                zones={zones}
              />

              <EtapeControle
                ecartees={preparation.incompletes}
                enregistrement={enCours}
                erreur={erreur}
                nbLignesFichier={lignesLues.length}
                onControler={() => void controler()}
                onEnregistrer={() => void enregistrer()}
                progression={progression}
                referencePar={(index) => referenceParIndex.get(index) ?? ''}
                verdicts={verdicts}
              />
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
