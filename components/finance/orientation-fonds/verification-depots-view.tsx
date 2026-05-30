'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
} from '@heroui/react';
import { Download, ScrollText, AlertTriangle, CheckCircle2, Landmark, PiggyBank } from 'lucide-react';
import {
  useVerificationDepotsQuery,
  useAttestationsCaisseQuery,
  useEnregistrerAttestationMutation,
  type EtatRapprochement,
} from '@/features/orientation-fonds';

function fmt(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v ?? 0) + ' F CFA';
}
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR'); } catch { return iso; }
}

const ETAT_BANQUE: Record<EtatRapprochement, { label: string; color: 'success' | 'warning' | 'danger' }> = {
  CONCORDANT: { label: 'Concordant', color: 'success' },
  BORDEREAU_MANQUANT: { label: 'Bordereau manquant', color: 'danger' },
  PREUVE_MANQUANTE: { label: 'Preuve manquante', color: 'warning' },
  ECART_MONTANT: { label: 'Écart de montant', color: 'danger' },
};

function StatCard({ label, value, sub, tone = 'default' }: { label: string; value: string; sub?: string; tone?: 'default' | 'ok' | 'warn' }) {
  const toneCls = tone === 'ok' ? 'text-emerald-600' : tone === 'warn' ? 'text-red-600' : 'text-gray-900';
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${toneCls}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function VerificationDepotsView() {
  const { data, isLoading } = useVerificationDepotsQuery();
  const { data: attestations } = useAttestationsCaisseQuery();
  const attester = useEnregistrerAttestationMutation();

  const [attestOpen, setAttestOpen] = useState(false);
  const [montantCompte, setMontantCompte] = useState('');
  const [commentaire, setCommentaire] = useState('');

  const banque = data?.orientesBanque ?? [];
  const caisse = data?.conservesCaisse ?? [];
  const synthese = data?.synthese;

  const handleAttester = () => {
    const montant = Number(montantCompte);
    if (Number.isNaN(montant) || montant < 0) return;
    attester.mutate(
      { montantComptePhysique: montant, commentaire: commentaire.trim() || undefined },
      { onSuccess: () => { setAttestOpen(false); setMontantCompte(''); setCommentaire(''); } },
    );
  };

  const exportXlsx = () => {
    const wb = XLSX.utils.book_new();
    const shA = XLSX.utils.json_to_sheet(banque.map((l) => ({
      'N° visa': l.numeroVisa ?? '', 'N° bordereau': l.numeroBordereau ?? '', Partenaire: l.partenaire,
      'Montant visé': l.montantVise, 'Montant déposé': l.montantDepose, 'Date dépôt': fmtDate(l.dateDepot),
      Banque: l.banqueAgence ?? '', Preuve: l.preuvePresente ? 'Oui' : 'Non', État: ETAT_BANQUE[l.etatRapprochement].label,
    })));
    XLSX.utils.book_append_sheet(wb, shA, 'Orientés banque');
    const shB = XLSX.utils.json_to_sheet(caisse.map((l) => ({
      'N° visa': l.numeroVisa ?? '', Partenaire: l.partenaire, 'Montant conservé': l.montantConserve,
      Motif: l.motif ?? '', 'Ancienneté (j)': l.ancienneteJours, État: l.alerteDormant ? 'Dormant' : 'En caisse',
    })));
    XLSX.utils.book_append_sheet(wb, shB, 'Conservés caisse');
    if (synthese) {
      const shS = XLSX.utils.json_to_sheet([{
        'Total visé': synthese.totalVise, 'Total déposé': synthese.totalDepose,
        'Total conservé': synthese.totalConserve, 'Écart bouclage': synthese.ecartBouclage,
        Bouclage: synthese.bouclageOk ? 'OK' : 'ANOMALIE',
      }]);
      XLSX.utils.book_append_sheet(wb, shS, 'Synthèse');
    }
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const url = URL.createObjectURL(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const a = document.createElement('a');
    a.href = url; a.download = `verification-depots_${new Date().toISOString().split('T')[0]}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Comptabilité</p>
          <h1 className="text-2xl font-bold text-indigo-600">Vérification dépôt en banque</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Rapprochement croisé N° de visa ↔ N° de bordereau, et suivi des fonds conservés en caisse.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="bordered" startContent={<ScrollText className="w-4 h-4" />} onPress={() => setAttestOpen(true)}>
            Attestation de caisse
          </Button>
          <Button color="primary" startContent={<Download className="w-4 h-4" />} onPress={exportXlsx} isDisabled={isLoading}>
            Exporter Excel
          </Button>
        </div>
      </div>

      {/* Synthèse de bouclage */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total visé" value={fmt(synthese?.totalVise ?? 0)} />
        <StatCard label="Total déposé (banque)" value={fmt(synthese?.totalDepose ?? 0)} />
        <StatCard label="Total conservé (caisse)" value={fmt(synthese?.totalConserve ?? 0)} />
        <StatCard
          label="Bouclage"
          value={synthese?.bouclageOk ? 'OK' : 'Anomalie'}
          sub={synthese ? `Écart : ${fmt(synthese.ecartBouclage)}` : undefined}
          tone={synthese?.bouclageOk ? 'ok' : 'warn'}
        />
      </div>
      {synthese && !synthese.bouclageOk && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Total visé ≠ Total déposé + Total conservé — anomalie à investiguer (opération visée ni déposée ni conservée, ou double comptage).
        </div>
      )}

      {/* Section A — orientés banque */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
          <Landmark className="w-4 h-4 text-indigo-500" />
          <p className="font-semibold text-gray-900">Recouvrements orientés banque</p>
          <span className="text-xs text-gray-400">· rapprochement visa ↔ bordereau</span>
        </div>
        <div className="overflow-x-auto hidden md:block">
          <Table aria-label="Rapprochement banque" classNames={{ wrapper: 'rounded-none shadow-none p-0', th: 'bg-gray-50 text-gray-600 text-xs uppercase' }}>
            <TableHeader>
              <TableColumn>N° VISA</TableColumn>
              <TableColumn>N° BORDEREAU</TableColumn>
              <TableColumn>PARTENAIRE</TableColumn>
              <TableColumn>VISÉ / DÉPOSÉ</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>ÉTAT</TableColumn>
            </TableHeader>
            <TableBody emptyContent={isLoading ? 'Chargement…' : 'Aucun recouvrement orienté banque'}>
              {banque.map((l) => (
                <TableRow key={l.factureId}>
                  <TableCell>{l.numeroVisa ?? '—'}</TableCell>
                  <TableCell>{l.numeroBordereau ?? <span className="text-red-500">—</span>}</TableCell>
                  <TableCell>{l.partenaire}</TableCell>
                  <TableCell className="whitespace-nowrap">{fmt(l.montantVise)} / {fmt(l.montantDepose)}</TableCell>
                  <TableCell>{fmtDate(l.dateDepot)}</TableCell>
                  <TableCell>
                    <Chip size="sm" color={ETAT_BANQUE[l.etatRapprochement].color} variant="flat">
                      {ETAT_BANQUE[l.etatRapprochement].label}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Mobile — cartes (lecture seule) */}
        <div className="md:hidden divide-y divide-gray-100">
          {banque.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucun recouvrement orienté banque</p>
          ) : banque.map((l) => (
            <div key={l.factureId} className="p-4 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{l.partenaire}</p>
                  <p className="text-[11px] text-gray-400">Visa {l.numeroVisa ?? '—'} · Bord. {l.numeroBordereau ?? '—'}</p>
                </div>
                <Chip size="sm" color={ETAT_BANQUE[l.etatRapprochement].color} variant="flat">{ETAT_BANQUE[l.etatRapprochement].label}</Chip>
              </div>
              <div className="flex justify-between text-xs"><span className="text-gray-400">Visé / Déposé</span><span className="text-gray-700">{fmt(l.montantVise)} / {fmt(l.montantDepose)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-400">Date dépôt</span><span className="text-gray-700">{fmtDate(l.dateDepot)}</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* Section B — conservés en caisse */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
          <PiggyBank className="w-4 h-4 text-amber-500" />
          <p className="font-semibold text-gray-900">Recouvrements conservés en caisse</p>
        </div>
        <div className="overflow-x-auto hidden md:block">
          <Table aria-label="Suivi caisse" classNames={{ wrapper: 'rounded-none shadow-none p-0', th: 'bg-gray-50 text-gray-600 text-xs uppercase' }}>
            <TableHeader>
              <TableColumn>N° VISA</TableColumn>
              <TableColumn>PARTENAIRE</TableColumn>
              <TableColumn>MONTANT</TableColumn>
              <TableColumn>MOTIF</TableColumn>
              <TableColumn>ANCIENNETÉ</TableColumn>
              <TableColumn>ÉTAT</TableColumn>
            </TableHeader>
            <TableBody emptyContent={isLoading ? 'Chargement…' : 'Aucun fonds conservé en caisse'}>
              {caisse.map((l) => (
                <TableRow key={l.factureId}>
                  <TableCell>{l.numeroVisa ?? '—'}</TableCell>
                  <TableCell>{l.partenaire}</TableCell>
                  <TableCell className="whitespace-nowrap">{fmt(l.montantConserve)}</TableCell>
                  <TableCell><span className="text-xs text-gray-500 line-clamp-2 max-w-[260px]">{l.motif ?? '—'}</span></TableCell>
                  <TableCell>{l.ancienneteJours} j</TableCell>
                  <TableCell>
                    <Chip size="sm" color={l.alerteDormant ? 'danger' : 'warning'} variant="flat">
                      {l.alerteDormant ? 'Dormant' : 'En caisse'}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Mobile — cartes (lecture seule) */}
        <div className="md:hidden divide-y divide-gray-100">
          {caisse.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucun fonds conservé en caisse</p>
          ) : caisse.map((l) => (
            <div key={l.factureId} className="p-4 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{l.partenaire}</p>
                  <p className="text-[11px] text-gray-400">Visa {l.numeroVisa ?? '—'} · {l.ancienneteJours} j</p>
                </div>
                <Chip size="sm" color={l.alerteDormant ? 'danger' : 'warning'} variant="flat">{l.alerteDormant ? 'Dormant' : 'En caisse'}</Chip>
              </div>
              <div className="flex justify-between text-xs"><span className="text-gray-400">Montant</span><span className="text-gray-700 font-semibold">{fmt(l.montantConserve)}</span></div>
              {l.motif && <p className="text-[11px] text-gray-500 line-clamp-2">{l.motif}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Registre des attestations de caisse */}
      {attestations && attestations.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <p className="font-semibold text-gray-900">Attestations de comptage physique</p>
          </div>
          <div className="overflow-x-auto">
            <Table aria-label="Attestations" classNames={{ wrapper: 'rounded-none shadow-none p-0', th: 'bg-gray-50 text-gray-600 text-xs uppercase' }}>
              <TableHeader>
                <TableColumn>DATE</TableColumn>
                <TableColumn>SOLDE THÉORIQUE</TableColumn>
                <TableColumn>COMPTÉ</TableColumn>
                <TableColumn>ÉCART</TableColumn>
                <TableColumn>CAISSIER</TableColumn>
              </TableHeader>
              <TableBody>
                {attestations.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{fmtDate(a.dateAttestation)}</TableCell>
                    <TableCell>{fmt(a.soldeTheorique)}</TableCell>
                    <TableCell>{fmt(a.montantComptePhysique)}</TableCell>
                    <TableCell className={a.ecart !== 0 ? 'text-red-600 font-semibold' : 'text-emerald-600'}>{fmt(a.ecart)}</TableCell>
                    <TableCell>{a.caissier}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Modale attestation de caisse */}
      <Modal isOpen={attestOpen} onOpenChange={setAttestOpen} size="md">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex-col items-start gap-0">
                <span className="text-lg font-bold text-gray-900">Attestation de caisse</span>
                <span className="text-sm font-normal text-gray-400">
                  Solde théorique : {fmt(synthese?.totalConserve ?? 0)} (somme des fonds conservés)
                </span>
              </ModalHeader>
              <ModalBody>
                <Input
                  type="number"
                  label="Montant physiquement compté (FCFA)"
                  value={montantCompte}
                  onValueChange={setMontantCompte}
                  isRequired
                />
                <Textarea label="Commentaire (facultatif)" value={commentaire} onValueChange={setCommentaire} minRows={2} />
                <p className="text-xs text-gray-400">Le système calcule l&apos;écart avec le solde théorique ; tout écart est signalé à la Direction.</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} isDisabled={attester.isPending}>Annuler</Button>
                <Button color="primary" onPress={handleAttester} isLoading={attester.isPending} isDisabled={montantCompte.trim() === ''}>
                  Enregistrer l&apos;attestation
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
