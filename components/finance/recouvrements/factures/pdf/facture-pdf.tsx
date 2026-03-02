'use client';
import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { IFactureDetail, IFactureLigne } from '@/features/recouvrements/types/facture.types';

interface FacturePdfProps {
  factureDetail: IFactureDetail;
}

const styles = StyleSheet.create({
  page: {
    size: 'A4',
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#111',
    paddingBottom: 60,
  },
  container: {
    padding: 20,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 60,
    objectFit: 'contain',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FE3A31',
  },
  subtitle: {
    fontSize: 10,
    color: '#555',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  periodBox: {
    marginVertical: 15,
    padding: 10,
    border: '1px solid #ccc',
    borderRadius: 4,
    width: '200px',
  },
  periodText: {
    fontSize: 12,
    color: '#111',
    fontWeight: 'semibold',
  },
  periodDate: {
    fontSize: 12,
    color: '#333',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
    paddingBottom: 4,
    marginTop: 10,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottom: '1px solid #eee',
  },
  colDate: { width: '15%' },
  colNombre: { width: '15%', textAlign: 'center' },
  colMontantLiv: { width: '20%', textAlign: 'right' },
  colMontantCmd: { width: '20%', textAlign: 'right' },
  colCommission: { width: '20%', textAlign: 'right' },
  subtotalRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderTop: '1.5px solid #000',
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    fontSize: 10,
  },
  totauxBox: {
    marginTop: 20,
    padding: 15,
    border: '2px solid #000',
    backgroundColor: '#fafafa',
  },
  totauxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totauxLabel: {
    fontSize: 12,
  },
  totauxValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalFinal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FE3A31',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    fontSize: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pageNumber: {
    textAlign: 'center',
    color: 'grey',
  },
});

// Fonction pour diviser les lignes en groupes (par exemple, 15 lignes par page)
function groupLignes(lignes: any[], itemsPerPage: number = 15) {
  const groups = [];
  for (let i = 0; i < lignes.length; i += itemsPerPage) {
    groups.push(lignes.slice(i, i + itemsPerPage));
  }
  return groups;
}

// Fonction pour formater une date depuis une chaîne ISO
function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return dateString;
  }
}

// Fonction pour formater un nombre avec séparateur de milliers
// N'utilise pas toLocaleString/Intl car react-pdf ne supporte pas ces APIs
function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  const [intPart, decPart] = num.toFixed(0).split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  return decPart ? `${formattedInt},${decPart}` : formattedInt;
}

// Calcule les sous-totaux d'un groupe de lignes
function computeSubtotals(lignes: IFactureLigne[]) {
  return lignes.reduce(
    (acc, l) => ({
      nombreLivraison: acc.nombreLivraison + (l.nombreLivraison ?? 0),
      montantLivraison: acc.montantLivraison + (l.montantLivraison ?? 0),
      montantCommandes: acc.montantCommandes + (l.montantCommandes ?? 0),
      totalCommission: acc.totalCommission + (l.totalCommission ?? 0),
    }),
    { nombreLivraison: 0, montantLivraison: 0, montantCommandes: 0, totalCommission: 0 },
  );
}

const FacturePdf: React.FC<FacturePdfProps> = ({ factureDetail }) => {
  const ligneGroups = groupLignes(factureDetail.lignes, 20);

  return (
    <Document title={factureDetail.code}>
      {/* PREMIÈRE PAGE - AVEC HEADER ET PREMIÈRE PARTIE DU TABLEAU */}
      <Page style={styles.page}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Facture</Text>
              <Text style={styles.subtitle}>{factureDetail.code}</Text>
            </View>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src="/assets/images/logo.png" style={styles.logo} />
          </View>
          <View>
            <Text style={styles.restaurantName}>{factureDetail.restaurant}</Text>
          </View>
          <View style={styles.periodBox}>
            <Text style={styles.periodText}>Période</Text>
            <Text style={styles.periodDate}>
              {formatDate(factureDetail.periode.debut)} - {formatDate(factureDetail.periode.fin)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text>Rapport détaillé des livraisons</Text>
            <View style={styles.infoRow}>
              <Text
                style={{
                  fontWeight: 'semibold',
                }}
              >
                Fréquence de facturation:{' '}
              </Text>
              <Text>{factureDetail.cyclePaiement}</Text>
            </View>
          </View>

          {/* TABLEAU DES LIGNES - PREMIER BLOC */}
          <View style={{ marginBottom: 20 }}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDate}>Date</Text>
              <Text style={styles.colNombre}>Nb Livr.</Text>
              <Text style={styles.colMontantLiv}>Montant Livr.</Text>
              <Text style={styles.colMontantCmd}>Montant Cmd</Text>
              <Text style={styles.colCommission}>Commission</Text>
            </View>

            {ligneGroups[0]?.map((ligne, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colDate}>{formatDate(ligne.date)}</Text>
                <Text style={styles.colNombre}>{formatNumber(ligne.nombreLivraison)}</Text>
                <Text style={styles.colMontantLiv}>{formatNumber(ligne.montantLivraison)}</Text>
                <Text style={styles.colMontantCmd}>{formatNumber(ligne.montantCommandes)}</Text>
                <Text style={styles.colCommission}>{formatNumber(ligne.totalCommission)}</Text>
              </View>
            ))}

            {/* SOUS-TOTAUX PAGE 1 */}
            {(() => {
              const sub = computeSubtotals(ligneGroups[0] ?? []);
              return (
                <View style={styles.subtotalRow}>
                  <Text style={styles.colDate}>Sous-total</Text>
                  <Text style={styles.colNombre}>{formatNumber(sub.nombreLivraison)}</Text>
                  <Text style={styles.colMontantLiv}>{formatNumber(sub.montantLivraison)}</Text>
                  <Text style={styles.colMontantCmd}>{formatNumber(sub.montantCommandes)}</Text>
                  <Text style={styles.colCommission}>{formatNumber(sub.totalCommission)}</Text>
                </View>
              );
            })()}
          </View>

          {/* TOTAUX - SEULEMENT SI C'EST LA DERNIÈRE PAGE */}
          {ligneGroups.length === 1 && (
            <View style={styles.totauxBox} wrap={false}>
              <View style={styles.totauxRow}>
                <Text style={styles.totauxLabel}>Total Montant Livraisons</Text>
                <Text style={styles.totauxValue}>{formatNumber(factureDetail.totaux.montantLivraison)}</Text>
              </View>
              <View style={styles.totauxRow}>
                <Text style={styles.totauxLabel}>Total Montant Commandes</Text>
                <Text style={styles.totauxValue}>{formatNumber(factureDetail.totaux.montantCommandes)}</Text>
              </View>
              <View style={styles.totauxRow}>
                <Text style={styles.totauxLabel}>Total Commissions</Text>
                <Text style={styles.totauxValue}>{formatNumber(factureDetail.totaux.montantCommissions)}</Text>
              </View>
              <View style={[styles.totauxRow, { marginTop: 10, paddingTop: 10, borderTop: '2px solid #000' }]}>
                <Text style={styles.totalFinal}>MONTANT TOTAL À PAYER</Text>
                <Text style={styles.totalFinal}>{formatNumber(factureDetail.totaux.factureAPayer)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* PIED DE PAGE */}
        <View style={styles.footer} fixed>
          <Text>TURBO DELIVERY. SARL, sis à la rue Paul Langevin Prolongé</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          <Text>RCN°CI - ABJ - 2019 - B - 18005</Text>
        </View>
      </Page>

      {/* PAGES SUPPLÉMENTAIRES POUR LES LIGNES RESTANTES */}
      {ligneGroups.map((group, pageIndex) => {
        if (pageIndex === 0) return null; // Skip first group as it's on page 1
        const isLastPage = pageIndex === ligneGroups.length - 1;

        return (
          <Page key={pageIndex} style={styles.page}>
            <View style={styles.container}>
              {/* HEADER SIMPLIFIÉ */}
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.restaurantName}>{factureDetail.restaurant}</Text>
              </View>

              {/* TABLEAU DES LIGNES - BLOCS SUIVANTS */}
              <View style={{ marginBottom: 20 }}>
                <View style={styles.tableHeader}>
                  <Text style={styles.colDate}>Date</Text>
                  <Text style={styles.colNombre}>Nb Livr.</Text>
                  <Text style={styles.colMontantLiv}>Montant Livr.</Text>
                  <Text style={styles.colMontantCmd}>Montant Cmd</Text>
                  <Text style={styles.colCommission}>Commission</Text>
                </View>

                {group.map((ligne, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.colDate}>{formatDate(ligne.date)}</Text>
                    <Text style={styles.colNombre}>{formatNumber(ligne.nombreLivraison)}</Text>
                    <Text style={styles.colMontantLiv}>{formatNumber(ligne.montantLivraison)}</Text>
                    <Text style={styles.colMontantCmd}>{formatNumber(ligne.montantCommandes)}</Text>
                    <Text style={styles.colCommission}>{formatNumber(ligne.totalCommission)}</Text>
                  </View>
                ))}

                {/* SOUS-TOTAUX PAR PAGE */}
                {(() => {
                  const sub = computeSubtotals(group);
                  return (
                    <View style={styles.subtotalRow}>
                      <Text style={styles.colDate}>Sous-total</Text>
                      <Text style={styles.colNombre}>{formatNumber(sub.nombreLivraison)}</Text>
                      <Text style={styles.colMontantLiv}>{formatNumber(sub.montantLivraison)}</Text>
                      <Text style={styles.colMontantCmd}>{formatNumber(sub.montantCommandes)}</Text>
                      <Text style={styles.colCommission}>{formatNumber(sub.totalCommission)}</Text>
                    </View>
                  );
                })()}
              </View>

              {/* TOTAUX - SEULEMENT SUR LA DERNIÈRE PAGE */}
              {isLastPage && (
                <View style={styles.totauxBox} wrap={false}>
                  <View style={styles.totauxRow}>
                    <Text style={styles.totauxLabel}>Total Montant Livraisons</Text>
                    <Text style={styles.totauxValue}>{formatNumber(factureDetail.totaux.montantLivraison)}</Text>
                  </View>
                  <View style={styles.totauxRow}>
                    <Text style={styles.totauxLabel}>Total Montant Commandes</Text>
                    <Text style={styles.totauxValue}>{formatNumber(factureDetail.totaux.montantCommandes)}</Text>
                  </View>
                  <View style={styles.totauxRow}>
                    <Text style={styles.totauxLabel}>Total Commissions</Text>
                    <Text style={styles.totauxValue}>{formatNumber(factureDetail.totaux.montantCommissions)}</Text>
                  </View>
                  <View style={[styles.totauxRow, { marginTop: 10, paddingTop: 10, borderTop: '2px solid #000' }]}>
                    <Text style={styles.totalFinal}>MONTANT TOTAL À PAYER</Text>
                    <Text style={styles.totalFinal}>{formatNumber(factureDetail.totaux.factureAPayer)}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* PIED DE PAGE */}
            <View style={styles.footer} fixed>
              <Text>TURBO DELIVERY. SARL, sis à la rue Paul Langevin Prolongé</Text>
              <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
              <Text>RCN°CI - ABJ - 2019 - B - 18005</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export default FacturePdf;
