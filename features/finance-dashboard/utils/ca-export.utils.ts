import * as XLSX from 'xlsx';

import type { IEntreeCaisse } from '@/features/entrees-caisse/types/entree-caisse.types';

import { UseCAExportParams } from '../hooks/use-ca-export';

/**
 * Le détail du chiffre d'affaires, en tableur.
 *
 * <h3>Ce que le fichier taisait</h3>
 * <p>Le chiffre d'affaires du tableau de bord vaut frais de livraison, plus commissions,
 * plus les prestations hors livraison. Le fichier téléchargé, lui, ne listait que les
 * partenaires : les prestations comptées dans le total affiché à l'écran n'y figuraient
 * nulle part, et le TOTAL du fichier était donc inférieur au chiffre annoncé, sans qu'aucune
 * ligne ne dise pourquoi.</p>
 *
 * <p>Le fichier porte désormais les trois composantes, et une ligne de CONTRÔLE qui nomme
 * l'écart restant plutôt que de le laisser deviner.</p>
 *
 * <h3>Des nombres, et tout dans le tableau</h3>
 * <p>Les montants s'écrivent en nombres et la mise en forme est portée par le format de
 * cellule : un montant écrit « 1 000 000 FCFA » en texte ne s'additionne pas.</p>
 *
 * <p>⚠ Tout est construit AVANT `aoa_to_sheet`. Une cellule posée après, sans étendre
 * `!ref`, n'arrive jamais dans le fichier : c'était le sort du bloc « RÉSUMÉ » que ce
 * fichier croyait écrire depuis l'origine, et que personne n'a jamais vu. Les styles `.s`
 * ont été retirés pour la même raison, la version communautaire de `xlsx` ne les écrit
 * pas.</p>
 */

/** Un montant en francs, lisible par un humain et sommable par le tableur. */
const FORMAT_FCFA = '#,##0" FCFA"';

/**
 * Deux decimales, pas dix-sept.
 *
 * <p>Les montants du serveur portent des decimales, et la somme flottante de deux cents
 * partenaires produit « 233686140.10000002 ». Le format de cellule masquerait la trainee,
 * mais elle resterait dans la valeur, donc dans toute formule ecrite par le lecteur du
 * fichier, et dans tout rapprochement fait a l'unite pres.</p>
 */
function arrondi(n: number): number {
  return Math.round(n * 100) / 100;
}

type LigneFeuille = (Date | number | string | null)[];

function jourCourt(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const jour = String(d.getDate()).padStart(2, '0');
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  return `${jour}/${mois}/${String(d.getFullYear()).padStart(4, '0')}`;
}

function bornes(params: UseCAExportParams): { debut: string; fin: string } {
  return {
    debut: params.debut ? params.debut.toISOString().split('T')[0] : 'Début',
    fin: params.fin ? params.fin.toISOString().split('T')[0] : 'Fin',
  };
}

export function generateCAExcelTemplate(
  data: { content?: Record<string, unknown>[] } | null | undefined,
  params: UseCAExportParams,
  /**
   * Les prestations hors livraison de la MEME période. Absentes, le fichier se construit
   * comme avant : la section n'apparaît pas et le total ne change pas.
   */
  entreesCaisse: IEntreeCaisse[] = [],
): ArrayBuffer {
  const classeur = XLSX.utils.book_new();
  const partenaires = data?.content ?? [];
  const { debut, fin } = bornes(params);

  const lignes: LigneFeuille[] = [
    ['DÉTAIL DU CHIFFRE D’AFFAIRES'],
    [],
    ['Du', debut],
    ['Au', fin],
    [],
    [],
    ['Nom Restaurant', 'Total Frais Livraisons', 'Total Commission', 'Total'],
  ];

  const premiereLignePartenaire = lignes.length;

  let totalFrais = 0;
  let totalCommission = 0;
  for (const item of partenaires) {
    const frais = Number(item.totalFraisLivraisons) || 0;
    const commission = Number(item.totalCommission) || 0;
    totalFrais += frais;
    totalCommission += commission;
    lignes.push([String(item.nomRestaurant ?? ''), frais, commission, frais + commission]);
  }

  totalFrais = arrondi(totalFrais);
  totalCommission = arrondi(totalCommission);
  const totalPartenaires = arrondi(totalFrais + totalCommission);
  lignes.push(['Sous-total partenaires', totalFrais, totalCommission, totalPartenaires]);

  /*
   * La section des prestations. Les colonnes B et C restent VIDES, pas a zero : un zero se
   * somme et fait mentir toute colonne recalculee par le lecteur du fichier. Une prestation
   * n'est ni un frais de livraison ni une commission.
   */
  const lignesPrestations: number[] = [];
  let totalPrestations = 0;
  if (entreesCaisse.length > 0) {
    lignes.push([]);
    lignes.push(['AUTRES COMPOSANTES DU CA']);
    lignes.push(['Libellé', 'Date', 'État', 'Montant']);
    for (const e of entreesCaisse) {
      const montant = Number(e.montant) || 0;
      totalPrestations += montant;
      lignesPrestations.push(lignes.length);
      lignes.push([e.libelle ?? '', jourCourt(e.dateEntree), e.paye ? 'Encaissée' : 'À encaisser', montant]);
    }
    totalPrestations = arrondi(totalPrestations);
    lignes.push(['Sous-total autres composantes', null, null, totalPrestations]);
  }

  const lignesSousTotalPrestations = entreesCaisse.length > 0 ? lignes.length - 1 : -1;

  lignes.push([]);
  const ligneTotal = lignes.length;
  const totalGeneral = arrondi(totalPartenaires + totalPrestations);
  lignes.push(['TOTAL', totalFrais, totalCommission, totalGeneral]);

  /*
   * Le pied de controle. Il existe parce que le fichier et l'ecran ne lisent pas la meme
   * source : l'ecran somme les courses de TOUS les partenaires sur la periode, le fichier
   * n'agrege que les partenaires ouverts. Plutot que de laisser l'ecart se decouvrir en
   * comparant deux nombres de memoire, le fichier dit de quoi il est fait.
   */
  lignes.push([]);
  lignes.push(['CONTRÔLE']);
  lignes.push(['Partenaires (frais + commissions)', null, null, totalPartenaires]);
  lignes.push([
    `Autres composantes du CA (${entreesCaisse.length} ligne${entreesCaisse.length > 1 ? 's' : ''})`,
    null,
    null,
    totalPrestations,
  ]);
  lignes.push(['Total du fichier', null, null, totalGeneral]);
  lignes.push([
    'Note',
    "Ce total doit égaler le chiffre d'affaires affiché sur la même période. Un écart vient des partenaires désactivés, absents de l'agrégation par partenaire.",
  ]);

  const feuille = XLSX.utils.aoa_to_sheet(lignes);

  // Le format monetaire se pose sur les CELLULES : le tableur affiche « 1 000 000 FCFA » et
  // calcule quand meme sur 1000000.
  const poser = (ligne: number, colonnes: number[]) => {
    for (const c of colonnes) {
      const adresse = XLSX.utils.encode_cell({ c, r: ligne });
      const cellule = feuille[adresse];
      if (cellule && typeof cellule.v === 'number') cellule.z = FORMAT_FCFA;
    }
  };

  for (let l = premiereLignePartenaire; l < premiereLignePartenaire + partenaires.length + 1; l += 1) {
    poser(l, [1, 2, 3]);
  }
  for (const l of lignesPrestations) poser(l, [3]);
  if (lignesSousTotalPrestations >= 0) poser(lignesSousTotalPrestations, [3]);
  poser(ligneTotal, [1, 2, 3]);
  for (let l = ligneTotal + 2; l < lignes.length; l += 1) poser(l, [3]);

  feuille['!cols'] = [{ wch: 38 }, { wch: 24 }, { wch: 20 }, { wch: 22 }];

  XLSX.utils.book_append_sheet(classeur, feuille, 'Détail du CA');

  return XLSX.write(classeur, { bookType: 'xlsx', type: 'array' });
}
