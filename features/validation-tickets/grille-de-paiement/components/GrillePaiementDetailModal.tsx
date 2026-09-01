'use client';

import { CheckCircle2, CircleAlert, FileText, HelpCircle, Phone, ReceiptText, ShieldAlert, X } from 'lucide-react';
import { Drawer, DrawerBody, DrawerContent } from '@/components/heroui';
import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { IGrillePaiementLigne, TypeLivreur } from '../types/grille-paiement.type';
import { formatMontant } from '@/utils/format.utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * V54 + V57 (2026-05) — Badge + libellé du type de livreur pour le pavé
 * "Inclusion paie" affiché juste avant les tickets. Aligné sur la note de
 * cadrage DGA du 28/05/2026 : INDEPENDANT vert, JOURNALIER bleu,
 * SUPERVISEUR_LIVREUR violet, null/à catégoriser orange.
 */
function typeLivreurDisplay(type: TypeLivreur | null | undefined): {
  label: string;
  className: string;
  defaultIncluded: boolean;
} {
  switch (type) {
    case 'INDEPENDANT':
      return { label: 'Indépendant', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', defaultIncluded: true };
    case 'JOURNALIER':
      return { label: 'Journalier', className: 'bg-blue-50 text-blue-700 border-blue-200', defaultIncluded: false };
    case 'SUPERVISEUR_LIVREUR':
      return { label: 'Superviseur-livreur', className: 'bg-purple-50 text-purple-700 border-purple-200', defaultIncluded: false };
    default:
      return { label: 'À catégoriser', className: 'bg-amber-50 text-amber-700 border-amber-200', defaultIncluded: false };
  }
}

function formatNumber(n: number | undefined | null) {
  if (n == null) return '—';
  return n.toLocaleString('fr-FR');
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

  const {
    turboy, tickets, brut, taux, deductions, netAPayer, numeroWave,
    bonusEligibilite, ticketDetails,
    typeLivreur, inclusDansPaie, inclusPaieMotif,
  } = ligne;
  const initial = turboy.nom.charAt(0).toUpperCase();
  const creneauLabel = creneauCode.replace('CRÉNEAU-', '');

  // V54 + V57 — État d'inclusion explicite pour la modale détail.
  const typeInfo = typeLivreurDisplay(typeLivreur);
  // Inclusion effective côté UI : si override explicite (boolean) on respecte,
  // sinon défaut auto par type. Aligné sur la règle backend §9.
  const effectiveIncluded = inclusDansPaie !== null && inclusDansPaie !== undefined
    ? inclusDansPaie
    : typeInfo.defaultIncluded;
  const isOverride = inclusDansPaie !== null && inclusDansPaie !== undefined;

  return (
    <Drawer isOpen={open} onOpenChange={(v) => !v && onClose()} placement="right" size="xl">
      <DrawerContent className="bg-[#f6f6f6] flex flex-col overflow-hidden">
        {/* Header fixe */}
        <div className="shrink-0 bg-[#f6f6f6] px-5 pt-5 pb-4 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-[#16a34a] text-white flex items-center justify-center font-semibold text-sm shadow-xs shrink-0">{initial}</div>
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
            {/* Deux colonnes meme sur un tiroir etroit : quatre cartes empilees
                repousseraient le detail des tickets sous la ligne de flottaison. */}
            <GrilleStats colonnes={2} className="grid-cols-2">
              <CarteStat libelle="Brut" valeur={formatMontant(brut)} />
              <CarteStat
                libelle="Taux"
                valeur={
                  <>
                    {taux}
                    <span className="ml-1 text-xs">%</span>
                  </>
                }
                ton="attention"
              />
              <CarteStat
                libelle="Déductions"
                valeur={deductions !== 0 ? `−${formatMontant(Math.abs(deductions))}` : '—'}
                ton="danger"
              />
              <CarteStat libelle="Net à payer" valeur={formatMontant(netAPayer)} ton="succes" />
            </GrilleStats>

            {/* V54 + V57 (2026-05) — Inclusion paie. Affiche le type de
                collaborateur, le statut d'inclusion (avec drapeau "override
                Comptable") et le motif s'il y en a un. Le DGA s'en sert pour
                comprendre une dérogation avant de viser. */}
            <div className="rounded-2xl border border-[#dddddd] bg-white p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eff6ff]">
                    <FileText size={15} className="text-[#2563eb]" strokeWidth={2} />
                  </div>
                  <h3 className="text-[14px] font-semibold text-[#444444]">Inclusion dans la paie</h3>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${typeInfo.className}`}
                >
                  {!typeLivreur && <HelpCircle className="h-3 w-3" />}
                  {typeInfo.label}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">État effectif</p>
                  <p className={`text-sm font-semibold ${effectiveIncluded ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {effectiveIncluded ? '✓ Inclus dans le Total à payer' : '✕ Exclu du Total à payer'}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Source</p>
                  <p className="text-sm font-medium text-gray-700">
                    {isOverride ? 'Override Comptable' : 'Défaut auto par type'}
                  </p>
                </div>
              </div>

              {isOverride && inclusPaieMotif && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-1">
                    Justification de l&apos;override
                  </p>
                  <p className="text-[12px] leading-relaxed text-amber-900 whitespace-pre-wrap">
                    {inclusPaieMotif}
                  </p>
                </div>
              )}

              {!typeLivreur && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <p className="text-[12px] leading-relaxed text-amber-900">
                    Ce livreur n&apos;a pas de type assigné. La soumission au Visa DGA est
                    bloquée tant que la RH n&apos;aura pas qualifié ce profil
                    (Indépendant / Journalier / Superviseur-livreur).
                  </p>
                </div>
              )}
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

                  {ticketDetails.length === 0 && <p className="px-4 py-6 text-center text-sm text-[#9a9a9a]">Aucun ticket trouvé</p>}
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
