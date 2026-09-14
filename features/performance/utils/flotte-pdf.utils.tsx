import { Document, type DocumentProps, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import React from 'react';

import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import type { LigneClassementExport, LigneFlotteExport } from '@/features/performance/utils/flotte-excel.utils';
import type { LignePaieLivreur } from '@/src/performance/fiche-livreur.action';
import { formatMontant } from '@/utils/format.utils';
import { formatNumber } from '@/utils/formatNumber';

/**
 * Les trois exports PDF du module « Performance de la Flotte », exigence 6.
 *
 * <p>Mêmes colonnes, mêmes totaux et mêmes réserves que les classeurs Excel voisins : les
 * deux formats doivent dire la même chose, sinon on ne saurait plus lequel croire.</p>
 *
 * <h3>Le piège des espaces, déjà rencontré deux fois sur ce projet</h3>
 * <p>`Intl.NumberFormat('fr-FR')` sépare les milliers par une espace fine INSÉCABLE (U+202F)
 * et `formatMontant` colle la devise avec une insécable ordinaire (U+00A0). Les polices
 * standard de react-pdf sont encodées en WinAnsi, qui ne connaît ni l'une ni l'autre : le
 * lecteur voit alors « 20/000 », ou un carré à la place de chaque espace. Tout texte de ces
 * documents passe donc par {@link sansEspacesFines}.</p>
 *
 * <h3>Ce qui n'est pas mesuré s'écrit « — », jamais zéro</h3>
 * <p>La note de performance se calcule sur les jours travaillés d'un emploi du temps : sans
 * emploi, elle n'existe pas. L'écran rend un tiret ; ces documents aussi. Écrire zéro
 * imprimerait « 0,0 % » pour les indépendants, qui réalisent la majorité des livraisons.</p>
 */

/**
 * Les espaces insécables que WinAnsi ne sait pas écrire, ramenées à l'espace ordinaire.
 *
 * <p>⚠ Elle ne touche PAS aux accents, et c'est vérifié sur les trois documents rendus :
 * « Indépendants », « Sidibé », « Évolution » sortent intacts. WinAnsi couvre le latin-1 ;
 * ce qui lui manque, ce sont ces trois espaces-là. Une version précédente s'appelait
 * `versAscii`, ce qui laissait croire qu'il fallait écrire ces documents sans accent.</p>
 */
function sansEspacesFines(texte: string): string {
  return texte.replace(/[   ]/g, ' ');
}

/** Un montant, ou un tiret quand il n'y en a pas. */
function montant(valeur: number | null | undefined): string {
  return valeur == null ? '—' : sansEspacesFines(formatMontant(valeur));
}

/** Un entier, ou un tiret quand il n'y en a pas. */
function entier(valeur: number | null | undefined): string {
  return valeur == null ? '—' : formatNumber(valeur);
}

/** Une note sur cent, ou un tiret quand elle n'est pas applicable. */
function note(valeur: number | null | undefined): string {
  return valeur == null ? '—' : `${valeur.toFixed(1)} %`;
}

const s = StyleSheet.create({
  cellule: { paddingHorizontal: 4, paddingVertical: 4 },
  celluleNombre: { paddingHorizontal: 4, paddingVertical: 4, textAlign: 'right' },
  entete: {
    backgroundColor: '#f3f4f6',
    borderBottom: '1pt solid #d1d5db',
    borderTop: '1pt solid #d1d5db',
    flexDirection: 'row',
  },
  enteteTexte: { fontFamily: 'Helvetica-Bold', fontSize: 8 },
  ficheCle: { color: '#4b5563', width: '45%' },
  ficheLigne: { borderBottom: '0.5pt solid #f3f4f6', flexDirection: 'row', paddingVertical: 3 },
  ficheValeur: { fontFamily: 'Helvetica-Bold', textAlign: 'right', width: '55%' },
  ligne: { borderBottom: '0.5pt solid #f3f4f6', flexDirection: 'row' },
  ligneAlternee: {
    backgroundColor: '#fafafa',
    borderBottom: '0.5pt solid #f3f4f6',
    flexDirection: 'row',
  },
  ligneTotaux: {
    backgroundColor: '#f3f4f6',
    borderTop: '1pt solid #9ca3af',
    flexDirection: 'row',
    fontFamily: 'Helvetica-Bold',
  },
  meta: { color: '#4b5563', fontSize: 8, marginBottom: 2 },
  metaBloc: {
    border: '1pt solid #e5e7eb',
    borderRadius: 3,
    marginBottom: 10,
    padding: 8,
  },
  note: { color: '#6b7280', fontSize: 7, marginTop: 8 },
  page: { color: '#111827', fontFamily: 'Helvetica', fontSize: 8, padding: 24 },
  pied: {
    bottom: 12,
    color: '#9ca3af',
    fontSize: 7,
    left: 24,
    position: 'absolute',
    right: 24,
    textAlign: 'center',
  },
  sousTitre: { color: '#4b5563', fontSize: 9, marginBottom: 8, marginTop: 12 },
  titre: { fontFamily: 'Helvetica-Bold', fontSize: 14, marginBottom: 2 },
});

/** Le pied de page, identique sur les trois documents. */
function Pied() {
  return (
    <Text
      fixed
      render={({ pageNumber, totalPages }) =>
        sansEspacesFines(`Turbo Delivery ERP — page ${pageNumber} / ${totalPages}`)
      }
      style={s.pied}
    />
  );
}

/** Déclenche le téléchargement d'un document déjà construit. */
async function telecharger(
  document_: React.ReactElement<DocumentProps>,
  nom: string,
): Promise<void> {
  const blob = await pdf(document_).toBlob();
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  lien.click();
  URL.revokeObjectURL(url);
}

/**
 * Un nom de fichier sans caractère qui gêne un système de fichiers.
 *
 * <p>Les accents sont TRANSLITTÉRÉS, pas supprimés : sans la normalisation, « Indépendants »
 * devenait « ind-pendants », le é tombant dans la classe des caractères à remplacer.</p>
 */
function assainir(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. La liste d'une catégorie de contrat
// ─────────────────────────────────────────────────────────────────────────────

/** Les colonnes de la liste, dans l'ordre de l'écran et du classeur. */
const COLONNES_LISTE = [
  { cle: 'nom', libelle: 'Livreur', nombre: false, part: 30 },
  { cle: 'jours', libelle: 'Jours programmés', nombre: true, part: 14 },
  { cle: 'livraisons', libelle: 'Livraisons', nombre: true, part: 12 },
  { cle: 'commission', libelle: 'Commission', nombre: true, part: 16 },
  { cle: 'prime', libelle: 'Prime', nombre: true, part: 14 },
  { cle: 'performance', libelle: 'Performance', nombre: true, part: 14 },
] as const;

const PART_LISTE = COLONNES_LISTE.reduce((n, c) => n + c.part, 0);

function largeurListe(part: number): string {
  return `${((part / PART_LISTE) * 100).toFixed(3)}%`;
}

function celluleListe(cle: (typeof COLONNES_LISTE)[number]['cle'], l: LigneFlotteExport): string {
  switch (cle) {
    case 'nom':
      return l.nomComplet;
    case 'jours':
      // NUL et non zéro : un livreur sans emploi du temps n'a pas « zéro jour programmé »,
      // il n'a pas été programmé du tout.
      return entier(l.joursProgrammes);
    case 'livraisons':
      return entier(l.nbTickets);
    case 'commission':
      return montant(l.commission);
    case 'prime':
      return montant(l.prime);
    case 'performance':
      return note(l.performance);
  }
}

function DocumentListe({
  categorie,
  lignes,
  periode,
}: {
  categorie: string;
  lignes: LigneFlotteExport[];
  periode: string;
}) {
  const sansNote = lignes.filter((l) => l.performance == null).length;

  return (
    <Document>
      <Page orientation="landscape" size="A4" style={s.page}>
        <Text style={s.titre}>{sansEspacesFines('Performance de la flotte')}</Text>

        <View style={s.metaBloc}>
          <Text style={s.meta}>{sansEspacesFines(`Catégorie : ${categorie}`)}</Text>
          <Text style={s.meta}>{sansEspacesFines(`Période : ${periode}`)}</Text>
          <Text style={s.meta}>
            {sansEspacesFines(`Livreurs : ${formatNumber(lignes.length)}`)}
          </Text>
        </View>

        {/* `fixed` : l'en-tête se répète en haut de chaque page. Sans lui, la deuxième page
            d'une liste de cent trente lignes est une grille de nombres nus. */}
        <View fixed style={s.entete}>
          {COLONNES_LISTE.map((c) => (
            <Text
              key={c.cle}
              style={[c.nombre ? s.celluleNombre : s.cellule, s.enteteTexte, { width: largeurListe(c.part) }]}
            >
              {sansEspacesFines(c.libelle)}
            </Text>
          ))}
        </View>

        {lignes.map((l, i) => (
          <View key={`${l.nomComplet}-${i}`} style={i % 2 === 1 ? s.ligneAlternee : s.ligne} wrap={false}>
            {COLONNES_LISTE.map((c) => (
              <Text
                key={c.cle}
                style={[c.nombre ? s.celluleNombre : s.cellule, { width: largeurListe(c.part) }]}
              >
                {sansEspacesFines(celluleListe(c.cle, l))}
              </Text>
            ))}
          </View>
        ))}

        {/* Ni les jours ni la performance ne s'additionnent : une note sur cent n'est pas
            une quantité, et la somme des jours programmés ne veut rien dire. */}
        <View style={s.ligneTotaux} wrap={false}>
          <Text style={[s.cellule, { width: largeurListe(30) }]}>
            {sansEspacesFines(`Total — ${formatNumber(lignes.length)} livreur${lignes.length > 1 ? 's' : ''}`)}
          </Text>
          <Text style={[s.celluleNombre, { width: largeurListe(14) }]}>—</Text>
          <Text style={[s.celluleNombre, { width: largeurListe(12) }]}>
            {entier(lignes.reduce((n, l) => n + l.nbTickets, 0))}
          </Text>
          <Text style={[s.celluleNombre, { width: largeurListe(16) }]}>
            {montant(lignes.reduce((n, l) => n + l.commission, 0))}
          </Text>
          <Text style={[s.celluleNombre, { width: largeurListe(14) }]}>
            {montant(lignes.reduce((n, l) => n + l.prime, 0))}
          </Text>
          <Text style={[s.celluleNombre, { width: largeurListe(14) }]}>—</Text>
        </View>

        {sansNote > 0 && (
          <Text style={s.note}>
            {sansEspacesFines(
              `${formatNumber(sansNote)} livreur${sansNote > 1 ? 's portent' : ' porte'} un tiret en performance : la note se calcule sur les jours travaillés d'un emploi du temps, et ${sansNote > 1 ? "ils n'en ont" : "il n'en a"} pas sur cette semaine. Ce n'est pas une note de zéro.`,
            )}
          </Text>
        )}

        <Pied />
      </Page>
    </Document>
  );
}

export async function exporterListeFlottePdf({
  categorie,
  lignes,
  periode,
}: {
  categorie: string;
  lignes: LigneFlotteExport[];
  periode: string;
}): Promise<void> {
  await telecharger(
    <DocumentListe categorie={categorie} lignes={lignes} periode={periode} />,
    `performance-flotte-${assainir(categorie)}-${assainir(periode)}.pdf`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. La fiche d'un livreur
// ─────────────────────────────────────────────────────────────────────────────

/** Les colonnes du détail des courses. */
const COLONNES_COURSES = [
  { cle: 'date', libelle: 'Date', nombre: false, part: 14 },
  { cle: 'heure', libelle: 'Heure', nombre: false, part: 9 },
  { cle: 'ref', libelle: 'Référence', nombre: false, part: 16 },
  { cle: 'partenaire', libelle: 'Partenaire', nombre: false, part: 31 },
  { cle: 'frais', libelle: 'Frais de livraison', nombre: true, part: 17 },
  { cle: 'commission', libelle: 'Commission', nombre: true, part: 13 },
] as const;

const PART_COURSES = COLONNES_COURSES.reduce((n, c) => n + c.part, 0);

function largeurCourses(part: number): string {
  return `${((part / PART_COURSES) * 100).toFixed(3)}%`;
}

/** Le jour et l'heure, séparés comme sur l'onglet Excel : on trie par jour sans perdre l'heure. */
function jourEtHeure(iso: string): { jour: string; heure: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { jour: '—', heure: '—' };
  const deuxChiffres = (n: number) => String(n).padStart(2, '0');
  return {
    jour: `${deuxChiffres(d.getDate())}/${deuxChiffres(d.getMonth() + 1)}/${d.getFullYear()}`,
    heure: `${deuxChiffres(d.getHours())}:${deuxChiffres(d.getMinutes())}`,
  };
}

function DocumentFiche({ ligne, periode }: { ligne: LignePaieLivreur; periode: string }) {
  const courses = ligne.ticketDetails ?? [];

  /*
   * ⚠ `bonus` est un BOOLÉEN d'éligibilité, pas un montant, et `bonusEligibilite` est un
   * OBJET. Les deux ont déjà été mal typés dans ce module : le second a fait tomber la
   * fiche entière en production, le premier a écrit « VRAI » dans une ligne de montant.
   */
  const totaux: [string, string][] = [
    ['Livraisons', entier(ligne.tickets)],
    ['Frais de livraison générés', montant(ligne.totalFraisLivraison)],
    ['Montant brut', montant(ligne.brut)],
    ['Taux appliqué', ligne.taux == null ? '—' : `${ligne.taux} %`],
    ['Éligible à la prime', ligne.bonus === true ? 'Oui' : 'Non'],
    ['Prime', montant(ligne.prime)],
    ['Déductions', montant(ligne.deductions)],
    ['Net à payer', montant(ligne.netAPayer)],
  ];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.titre}>{sansEspacesFines('Fiche de performance')}</Text>

        <View style={s.metaBloc}>
          <Text style={s.meta}>{sansEspacesFines(`Livreur : ${ligne.turboy?.nom ?? '—'}`)}</Text>
          <Text style={s.meta}>{sansEspacesFines(`Code Turboy : ${ligne.turboy?.code ?? '—'}`)}</Text>
          {/*
            * Le LIBELLE du contrat, pas l'enum brute. `getTurboyTypeDisplay` est la source
            * unique de ce mapping depuis qu'un ternaire a deux branches, recopie dans sept
            * fichiers, a fait passer tous les SUPERVISEUR_LIVREUR pour des journaliers.
            */}
          <Text style={s.meta}>
            {sansEspacesFines(
              `Contrat : ${ligne.typeLivreur ? getTurboyTypeDisplay(ligne.typeLivreur).label : '—'}`,
            )}
          </Text>
          <Text style={s.meta}>{sansEspacesFines(`Période : ${periode}`)}</Text>
          <Text style={s.meta}>
            {sansEspacesFines(
              `Inclus dans la paie : ${ligne.inclusDansPaie === false ? 'Non' : 'Oui'}${ligne.inclusPaieMotif ? ` (${ligne.inclusPaieMotif})` : ''}`,
            )}
          </Text>
        </View>

        {totaux.map(([cle, valeur]) => (
          <View key={cle} style={s.ficheLigne}>
            <Text style={[s.cellule, s.ficheCle]}>{sansEspacesFines(cle)}</Text>
            <Text style={[s.cellule, s.ficheValeur]}>{sansEspacesFines(valeur)}</Text>
          </View>
        ))}

        <Text style={s.note}>
          {sansEspacesFines(
            "Ces montants viennent de la grille de paie du créneau, seule source qui fait autorité pour l'argent.",
          )}
        </Text>

        {courses.length > 0 && (
          <>
            <Text style={s.sousTitre}>
              {sansEspacesFines(`Détail des courses — ${formatNumber(courses.length)} course${courses.length > 1 ? 's' : ''}`)}
            </Text>

            <View fixed style={s.entete}>
              {COLONNES_COURSES.map((c) => (
                <Text
                  key={c.cle}
                  style={[c.nombre ? s.celluleNombre : s.cellule, s.enteteTexte, { width: largeurCourses(c.part) }]}
                >
                  {sansEspacesFines(c.libelle)}
                </Text>
              ))}
            </View>

            {courses.map((t, i) => {
              const { jour, heure } = jourEtHeure(t.date);
              return (
                <View key={`${t.ref}-${i}`} style={i % 2 === 1 ? s.ligneAlternee : s.ligne} wrap={false}>
                  <Text style={[s.cellule, { width: largeurCourses(14) }]}>{jour}</Text>
                  <Text style={[s.cellule, { width: largeurCourses(9) }]}>{heure}</Text>
                  <Text style={[s.cellule, { width: largeurCourses(16) }]}>{sansEspacesFines(t.ref ?? '—')}</Text>
                  <Text style={[s.cellule, { width: largeurCourses(31) }]}>
                    {sansEspacesFines(t.partenaire ?? '—')}
                  </Text>
                  <Text style={[s.celluleNombre, { width: largeurCourses(17) }]}>
                    {montant(t.fraisLivraison)}
                  </Text>
                  <Text style={[s.celluleNombre, { width: largeurCourses(13) }]}>
                    {montant(t.commission)}
                  </Text>
                </View>
              );
            })}

            <View style={s.ligneTotaux} wrap={false}>
              <Text style={[s.cellule, { width: largeurCourses(39) }]} />
              <Text style={[s.cellule, { width: largeurCourses(31) }]}>
                {sansEspacesFines(`Total — ${formatNumber(courses.length)} course${courses.length > 1 ? 's' : ''}`)}
              </Text>
              <Text style={[s.celluleNombre, { width: largeurCourses(17) }]}>
                {montant(courses.reduce((n, t) => n + (t.fraisLivraison ?? 0), 0))}
              </Text>
              <Text style={[s.celluleNombre, { width: largeurCourses(13) }]}>
                {montant(courses.reduce((n, t) => n + (t.commission ?? 0), 0))}
              </Text>
            </View>

            {/*
             * La même réserve que sur le classeur, et pour la même raison : sur un créneau
             * verrouillé, les totaux du haut sont FIGÉS au verrouillage tandis que le détail
             * est relu vivant. Supprimer un ticket après coup laisse les deux en désaccord.
             */}
            <Text style={s.note}>
              {sansEspacesFines(
                "Les totaux ci-dessus et le détail des courses ne sont pas garantis égaux : sur un créneau verrouillé, le total est le montant figé au verrouillage, tandis que les courses sont relues vivantes.",
              )}
            </Text>
          </>
        )}

        <Pied />
      </Page>
    </Document>
  );
}

export async function exporterFicheLivreurPdf({
  ligne,
  periode,
}: {
  ligne: LignePaieLivreur;
  periode: string;
}): Promise<void> {
  await telecharger(
    <DocumentFiche ligne={ligne} periode={periode} />,
    `fiche-${assainir(ligne.turboy?.nom ?? 'livreur')}-${assainir(periode)}.pdf`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Le classement
// ─────────────────────────────────────────────────────────────────────────────

const COLONNES_CLASSEMENT = [
  { cle: 'rang', libelle: 'Rang', nombre: true, part: 7 },
  { cle: 'nom', libelle: 'Livreur', nombre: false, part: 29 },
  { cle: 'contrat', libelle: 'Contrat', nombre: false, part: 17 },
  { cle: 'livraisons', libelle: 'Livraisons', nombre: true, part: 12 },
  { cle: 'gain', libelle: 'Gain', nombre: true, part: 15 },
  { cle: 'jours', libelle: 'Jours travaillés', nombre: true, part: 12 },
  { cle: 'tendance', libelle: 'Évolution', nombre: false, part: 12 },
] as const;

const PART_CLASSEMENT = COLONNES_CLASSEMENT.reduce((n, c) => n + c.part, 0);

function largeurClassement(part: number): string {
  return `${((part / PART_CLASSEMENT) * 100).toFixed(3)}%`;
}

function celluleClassement(
  cle: (typeof COLONNES_CLASSEMENT)[number]['cle'],
  l: LigneClassementExport,
): string {
  switch (cle) {
    case 'rang':
      return entier(l.rang);
    case 'nom':
      return l.nom;
    case 'contrat':
      return l.contrat || '—';
    case 'livraisons':
      return entier(l.nbTickets);
    case 'gain':
      return montant(l.gain);
    case 'jours':
      // Un tiret signale un livreur sans emploi du temps : il n'est pas classé sur ce critère.
      return entier(l.joursTravailles);
    case 'tendance':
      return l.tendance ?? '—';
  }
}

function DocumentClassement({
  lignes,
  periode,
  tri,
}: {
  lignes: LigneClassementExport[];
  periode: string;
  tri: string;
}) {
  return (
    <Document>
      <Page orientation="landscape" size="A4" style={s.page}>
        <Text style={s.titre}>{sansEspacesFines('Classement des livreurs')}</Text>

        <View style={s.metaBloc}>
          <Text style={s.meta}>{sansEspacesFines(`Période : ${periode}`)}</Text>
          <Text style={s.meta}>{sansEspacesFines(`Classé par : ${tri}`)}</Text>
          <Text style={s.meta}>
            {sansEspacesFines(`Livreurs classés : ${formatNumber(lignes.length)}`)}
          </Text>
        </View>

        <View fixed style={s.entete}>
          {COLONNES_CLASSEMENT.map((c) => (
            <Text
              key={c.cle}
              style={[c.nombre ? s.celluleNombre : s.cellule, s.enteteTexte, { width: largeurClassement(c.part) }]}
            >
              {sansEspacesFines(c.libelle)}
            </Text>
          ))}
        </View>

        {lignes.map((l, i) => (
          <View key={`${l.nom}-${i}`} style={i % 2 === 1 ? s.ligneAlternee : s.ligne} wrap={false}>
            {COLONNES_CLASSEMENT.map((c) => (
              <Text
                key={c.cle}
                style={[c.nombre ? s.celluleNombre : s.cellule, { width: largeurClassement(c.part) }]}
              >
                {sansEspacesFines(celluleClassement(c.cle, l))}
              </Text>
            ))}
          </View>
        ))}

        {/* Ni le rang ni l'évolution ne s'additionnent : aucun total sous ces colonnes. */}
        <View style={s.ligneTotaux} wrap={false}>
          <Text style={[s.celluleNombre, { width: largeurClassement(7) }]}>—</Text>
          <Text style={[s.cellule, { width: largeurClassement(29) }]}>
            {sansEspacesFines(`Total — ${formatNumber(lignes.length)} livreur${lignes.length > 1 ? 's' : ''}`)}
          </Text>
          <Text style={[s.cellule, { width: largeurClassement(17) }]} />
          <Text style={[s.celluleNombre, { width: largeurClassement(12) }]}>
            {entier(lignes.reduce((n, l) => n + l.nbTickets, 0))}
          </Text>
          <Text style={[s.celluleNombre, { width: largeurClassement(15) }]}>
            {montant(lignes.reduce((n, l) => n + l.gain, 0))}
          </Text>
          <Text style={[s.celluleNombre, { width: largeurClassement(12) }]}>—</Text>
          <Text style={[s.cellule, { width: largeurClassement(12) }]} />
        </View>

        <Text style={s.note}>
          {sansEspacesFines(
            "Le rang porte les ex æquo : deux livreurs à égalité partagent leur place, et le suivant saute d'autant. Un tiret dans « Jours travaillés » signale un livreur sans emploi du temps : il n'est pas classé sur ce critère.",
          )}
        </Text>

        <Pied />
      </Page>
    </Document>
  );
}

export async function exporterClassementFlottePdf({
  lignes,
  periode,
  tri,
}: {
  lignes: LigneClassementExport[];
  periode: string;
  tri: string;
}): Promise<void> {
  await telecharger(
    <DocumentClassement lignes={lignes} periode={periode} tri={tri} />,
    `classement-livreurs-${assainir(periode)}.pdf`,
  );
}
