import React from 'react';
import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer';
import { ICreneauJourDetail } from '@/features/creneaux/types/creneau.types';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).replace(/^./, (c) => c.toUpperCase());
}

function fmtNow(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${h}:${m}`;
}

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica', color: '#111' },
  title: { fontSize: 18, color: '#ef4444', fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 10, color: '#6b7280', marginBottom: 14 },
  metaBox: { backgroundColor: '#f9fafb', border: '1pt solid #e5e7eb', borderRadius: 4, padding: 10, marginBottom: 18 },
  metaRow: { flexDirection: 'row', marginBottom: 3 },
  metaLabel: { fontFamily: 'Helvetica-Bold', width: 110 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1f2937', borderBottom: '1.5pt solid #ef4444', paddingBottom: 4, marginBottom: 10, marginTop: 16 },
  // Stats row
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: '#f9fafb', border: '1pt solid #e5e7eb', borderRadius: 4, padding: 10 },
  statLabel: { fontSize: 8, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#111' },
  statValueSuccess: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#16a34a' },
  statValueDanger: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#dc2626' },
  statValuePrimary: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#2563eb' },
  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: '#fee2e2', padding: 7, borderBottom: '1pt solid #fecaca' },
  tableRow: { flexDirection: 'row', padding: 7, borderBottom: '1pt solid #f3f4f6' },
  tableRowAlt: { flexDirection: 'row', padding: 7, borderBottom: '1pt solid #f3f4f6', backgroundColor: '#f9fafb' },
  colNom: { flex: 1 },
  colStatut: { width: 90, textAlign: 'right' },
  thText: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  // Analyse
  analyseBox: { backgroundColor: '#fffbeb', border: '1pt solid #fde68a', borderRadius: 4, padding: 10, marginTop: 14 },
  analyseTitle: { fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  analyseText: { color: '#374151', marginBottom: 4 },
  analyseReco: { color: '#92400e' },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, textAlign: 'center', fontSize: 8, color: '#9ca3af' },
});

function PresenceJournalierePdfDocument({ data }: { data: ICreneauJourDetail }) {
  const allTurboys = [
    ...data.turboysPresents.map((t) => ({ ...t, statut: 'Présent' as const })),
    ...data.turboysAbsents.map((t) => ({ ...t, statut: 'Absent' as const })),
  ];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Rapport de Présence Journalière</Text>
        <Text style={s.subtitle}>Turbo Delivery ERP</Text>

        {/* Meta */}
        <View style={s.metaBox}>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Date :</Text>
            <Text>{fmtDate(data.date)}</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>{"Date d'export :"}</Text>
            <Text>{fmtNow()}</Text>
          </View>
        </View>

        {/* Stats */}
        <Text style={s.sectionTitle}>{"Vue d'ensemble"}</Text>
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Inscrits</Text>
            <Text style={s.statValue}>{data.inscrits}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Présents</Text>
            <Text style={s.statValueSuccess}>{data.presents}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Absents</Text>
            <Text style={s.statValueDanger}>{data.absents}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Taux de présence</Text>
            <Text style={s.statValuePrimary}>{data.tauxPresence}%</Text>
          </View>
        </View>

        {/* Liste des turboys */}
        <Text style={s.sectionTitle}>Liste des Turboys</Text>
        <View style={s.tableHeader}>
          <Text style={[s.colNom, s.thText]}>Nom Complet</Text>
          <Text style={[s.colStatut, s.thText]}>Statut</Text>
        </View>
        {allTurboys.map((t, i) => (
          <View key={t.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={s.colNom}>{t.nomComplet}</Text>
            <Text style={[s.colStatut, { color: t.statut === 'Présent' ? '#16a34a' : '#dc2626' }]}>
              {t.statut}
            </Text>
          </View>
        ))}

        {/* Analyse rapide */}
        {data.analyseRapide && (
          <>
            <Text style={s.sectionTitle}>Analyse Rapide</Text>
            <View style={s.analyseBox}>
              <Text style={s.analyseText}>{data.analyseRapide.resume}</Text>
              {data.analyseRapide.recommandation && (
                <Text style={s.analyseReco}>
                  Recommandation : {data.analyseRapide.recommandation}
                </Text>
              )}
            </View>
          </>
        )}

        <Text style={s.footer}>Turbo Delivery ERP — Export automatique</Text>
      </Page>
    </Document>
  );
}

export async function exportPresenceJournalierePdf(data: ICreneauJourDetail): Promise<void> {
  const blob = await pdf(<PresenceJournalierePdfDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `presence-journaliere_${data.date}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
