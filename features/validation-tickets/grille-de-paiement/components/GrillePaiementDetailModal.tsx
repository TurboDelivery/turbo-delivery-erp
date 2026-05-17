'use client';

import { CheckCircle2, CircleAlert, Phone, ReceiptText, ShieldAlert, X } from 'lucide-react';
import { Drawer, DrawerBody, DrawerContent } from '@heroui/react';
import { IGrillePaiementLigne } from '../types/grille-paiement.type';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function formatNumber(n: number | undefined | null) {
  if (n == null) return '—';
  return n.toLocaleString('fr-FR');
}

function StatCard({ title, value, suffix, color }: { title: string; value: string; suffix: string; color: string }) {
  return (
    <div className="rounded-2xl border border-[#d9d9d9] bg-[#f8f8f8] px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#a0a0a0]">{title}</p>
      <div className="mt-2 flex items-end gap-1">
        <span className={`text-[28px] font-bold leading-none ${color}`}>{value}</span>
        {suffix && <span className="mb-[3px] text-[10px] font-medium uppercase text-[#9b9b9b]">{suffix}</span>}
      </div>
    </div>
  );
}

function EligibilityItem({ icon, iconBg, title, subtitle, rightIcon }: { icon: React.ReactNode; iconBg: string; title: string; subtitle: string; rightIcon: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between rounded-2xl border border-[#e6e6e6] bg-[#fcfcfc] px-3 py-3">
      <div className="flex gap-3">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
        <div>
          <p className="text-[13px] font-medium text-[#4b4b4b]">{title}</p>
          <p className="mt-1 text-[11px] leading-[1.35] text-[#9a9a9a]">{subtitle}</p>
        </div>
      </div>
      <div className="ml-3 mt-1 shrink-0">{rightIcon}</div>
    </div>
  );
}

interface Props {
  ligne: IGrillePaiementLigne | null;
  creneauCode: string;
  lotId?: string;
  open: boolean;
  onClose: () => void;
}

export default function GrillePaiementDetailModal({ ligne, creneauCode, open, onClose }: Props) {
  if (!ligne) return null;

  const { turboy, tickets, brut, taux, deductions, netAPayer, numeroWave, bonusEligibilite, ticketDetails } = ligne;
  const initial = turboy.nom.charAt(0).toUpperCase();
  const creneauLabel = creneauCode.replace('CRÉNEAU-', '');

  return (
    <Drawer isOpen={open} onOpenChange={(v) => !v && onClose()} placement="right" size="xl">
      <DrawerContent className="bg-[#f6f6f6] flex flex-col overflow-hidden">
        {/* Header fixe */}
        <div className="shrink-0 bg-[#f6f6f6] px-5 pt-5 pb-4 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-[#16a34a] text-white flex items-center justify-center font-semibold text-sm shadow-sm shrink-0">{initial}</div>
              <div>
                <h2 className="text-[15px] font-semibold text-[#1f1f1f] leading-none">{turboy.nom}</h2>
                <p className="mt-1 text-[11px] text-[#8a8a8a] tracking-wide">{turboy.code}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-[#8a8a8a] hover:text-black transition mt-1">
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>
          <div className="mt-4 border-t border-dashed border-[#d8d8d8]" />
          <p className="mt-3 text-[12px] text-[#777777]">
            Détail du paiement — {tickets} ticket{tickets > 1 ? 's' : ''} pour le créneau {creneauLabel}.
          </p>
        </div>

        <DrawerBody className="p-0 overflow-y-auto flex-1">
          <div className="px-5 pb-6 flex flex-col gap-5">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard title="BRUT" value={formatNumber(brut)} suffix="FCFA" color="text-[#1f1f1f]" />
              <StatCard title="TAUX" value={`${taux}`} suffix="%" color="text-[#f59e0b]" />
              <StatCard title="DÉDUCTIONS" value={deductions !== 0 ? `−${formatNumber(Math.abs(deductions))}` : '—'} suffix={deductions !== 0 ? 'FCFA' : ''} color="text-[#dc2626]" />
              <StatCard title="NET À PAYER" value={formatNumber(netAPayer)} suffix="FCFA" color="text-[#22c55e]" />
            </div>

            {/* Bonus eligibility */}
            {bonusEligibilite && (
              <div className="rounded-2xl border border-[#dddddd] bg-white p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff1f2]">
                    <ReceiptText size={15} className="text-[#f87171]" strokeWidth={2} />
                  </div>
                  <h3 className="text-[14px] font-semibold text-[#444444]">Calculateur de commission — Éligibilité bonus</h3>
                </div>

                <div className="mt-4 space-y-3">
                  {bonusEligibilite.criteres.map((critere, i) => (
                    <EligibilityItem
                      key={critere.label}
                      icon={i === 0 ? <ReceiptText size={15} className="text-white" strokeWidth={2} /> : <CircleAlert size={15} className="text-white" strokeWidth={2} />}
                      iconBg="bg-[#111827]"
                      title={critere.label}
                      subtitle={critere.detail}
                      rightIcon={critere.valide ? <CheckCircle2 size={17} className="text-[#22c55e]" strokeWidth={2} /> : <CircleAlert size={17} className="text-[#ef4444]" strokeWidth={2} />}
                    />
                  ))}

                  {/* Taux final */}
                  <EligibilityItem
                    icon={<ShieldAlert size={15} className="text-white" strokeWidth={2} />}
                    iconBg="bg-[#111827]"
                    title={bonusEligibilite.tauxFinalLabel}
                    subtitle={bonusEligibilite.tauxFinalDetail}
                    rightIcon={<ShieldAlert size={17} className="text-[#9ca3af]" strokeWidth={2} />}
                  />
                </div>
              </div>
            )}

            {/* Tickets */}
            {ticketDetails && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-semibold text-[#4b4b4b]">
                    Détail des {ticketDetails.length} ticket{ticketDetails.length > 1 ? 's' : ''}
                  </h3>
                  <span className="text-[11px] text-[#9a9a9a]">{creneauLabel}</span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#dddddd] bg-white">
                  <div className="grid grid-cols-[1.2fr_1.4fr_1fr_0.9fr_0.9fr] border-b border-[#ececec] px-4 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-[#9a9a9a]">
                    <span>Ticket</span>
                    <span>Partenaire</span>
                    <span>Date</span>
                    <span className="text-right">Brut</span>
                    <span className="text-right text-[#16a34a]">Commission</span>
                  </div>

                  {ticketDetails.length === 0 && <p className="px-4 py-6 text-center text-sm text-[#9a9a9a]">Aucun ticket trouvé.</p>}
                  {ticketDetails.map((t, index) => (
                    <div
                      key={t.ref}
                      className={`grid grid-cols-[1.2fr_1.4fr_1fr_0.9fr_0.9fr] items-center px-4 py-4 text-[12px] ${index !== ticketDetails.length - 1 ? 'border-b border-[#f1f1f1]' : ''}`}
                    >
                      <span className="font-medium text-[#d14c45] truncate">{t.ref}</span>
                      <span className="text-[#555555] truncate">{t.partenaire}</span>
                      <span className="text-[#8a8a8a]">{format(new Date(t.date), 'dd/MM/yyyy', { locale: fr })}</span>
                      <span className="text-right font-semibold text-[#4a4a4a]">{formatNumber(t.fraisLivraison)}</span>
                      <span className="text-right font-semibold text-[#16a34a]">{formatNumber(t.commission)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DrawerBody>

        {/* Footer fixe — Wave */}
        <div className="shrink-0 bg-[#f6f6f6] px-5 pb-5 pt-0">
          <div className="border-t border-dashed border-[#9ec5ff] mb-4" />
          <div className={`rounded-2xl border px-4 py-4 ${numeroWave ? 'border-[#b7e4c3] bg-[#dff7e7]' : 'border-[#fca5a5] bg-[#fef2f2]'}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${numeroWave ? 'bg-[#b8efc8]' : 'bg-[#fecaca]'}`}>
                <Phone size={18} className={numeroWave ? 'text-[#22a559]' : 'text-[#ef4444]'} strokeWidth={2.3} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#7f8f83]">Numéro wave de paiement</p>
                <p className={`mt-1 text-[15px] font-medium ${numeroWave ? 'text-[#2d5a3f]' : 'italic text-[#ef4444]'}`}>{numeroWave ?? 'Non renseigné'}</p>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
