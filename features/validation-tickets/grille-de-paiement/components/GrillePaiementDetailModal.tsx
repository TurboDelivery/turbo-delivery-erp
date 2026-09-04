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
      return { label: 'Indépendant', className: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300', defaultIncluded: true };
    case 'JOURNALIER':
      return { label: 'Journalier', className: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300', defaultIncluded: false };
    case 'SUPERVISEUR_LIVREUR':
      return { label: 'Superviseur-livreur', className: 'border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-400/25 dark:bg-purple-400/10 dark:text-purple-300', defaultIncluded: false };
    default:
      return { label: 'À catégoriser', className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300', defaultIncluded: false };
  }
}

function formatNumber(n: number | undefined | null) {
  if (n == null) return '—';
  return n.toLocaleString('fr-FR');
}

function EligibilityItem({ icon, iconBg, title, subtitle, rightIcon }: { icon: React.ReactNode; iconBg: string; title: string; subtitle: string; rightIcon: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between rounded-2xl border border-separator bg-surface-secondary px-3 py-3">
      <div className="flex gap-3">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
        <div>
          <p className="text-[13px] font-medium text-foreground">{title}</p>
          <p className="mt-1 text-[11px] leading-[1.35] text-muted">{subtitle}</p>
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
      <DrawerContent className="bg-background flex flex-col overflow-hidden">
        {/* Header fixe */}
        <div className="shrink-0 bg-background px-5 pt-5 pb-4 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-accent text-white flex items-center justify-center font-semibold text-sm shadow-xs shrink-0">{initial}</div>
              <div>
                <h2 className="text-[15px] font-semibold text-foreground leading-none">{turboy.nom}</h2>
                <p className="mt-1 text-[11px] text-muted tracking-wide">{turboy.code}</p>
              </div>
            </div>
            <button onClick={onClose} className="mt-1 text-muted transition hover:text-foreground">
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>
          <div className="mt-4 border-t border-dashed border-separator" />
          <p className="mt-3 text-[12px] text-muted">
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
            <div className="rounded-2xl border border-separator bg-surface p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
                    <FileText size={15} className="text-accent" strokeWidth={2} />
                  </div>
                  <h3 className="text-[14px] font-semibold text-foreground">Inclusion dans la paie</h3>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${typeInfo.className}`}
                >
                  {!typeLivreur && <HelpCircle className="h-3 w-3" />}
                  {typeInfo.label}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-separator bg-surface-secondary/60 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted mb-1">État effectif</p>
                  <p className={`text-sm font-semibold ${effectiveIncluded ? 'text-success-soft-foreground' : 'text-warning-soft-foreground'}`}>
                    {effectiveIncluded ? '✓ Inclus dans le Total à payer' : '✕ Exclu du Total à payer'}
                  </p>
                </div>
                <div className="rounded-xl border border-separator bg-surface-secondary/60 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Source</p>
                  <p className="text-sm font-medium text-foreground">
                    {isOverride ? 'Override Comptable' : 'Défaut auto par type'}
                  </p>
                </div>
              </div>

              {isOverride && inclusPaieMotif && (
                <div className="mt-3 rounded-xl border border-warning/30 bg-warning-soft px-3 py-2.5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-warning-soft-foreground">
                    Justification de l&apos;override
                  </p>
                  <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-warning-soft-foreground">
                    {inclusPaieMotif}
                  </p>
                </div>
              )}

              {!typeLivreur && (
                <div className="mt-3 rounded-xl border border-warning/30 bg-warning-soft px-3 py-2.5">
                  <p className="text-[12px] leading-relaxed text-warning-soft-foreground">
                    Ce livreur n&apos;a pas de type assigné. La soumission au Visa DGA est
                    bloquée tant que la RH n&apos;aura pas qualifié ce profil
                    (Indépendant / Journalier / Superviseur-livreur).
                  </p>
                </div>
              )}
            </div>

            {/* Bonus eligibility */}
            {bonusEligibilite && (
              <div className="rounded-2xl border border-separator bg-surface p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger-soft">
                    <ReceiptText size={15} className="text-danger-soft-foreground" strokeWidth={2} />
                  </div>
                  <h3 className="text-[14px] font-semibold text-foreground">Calculateur de commission — Éligibilité bonus</h3>
                </div>

                <div className="mt-4 space-y-3">
                  {bonusEligibilite.criteres.map((critere, i) => (
                    <EligibilityItem
                      key={critere.label}
                      icon={i === 0 ? <ReceiptText className="text-background" size={15} strokeWidth={2} /> : <CircleAlert className="text-background" size={15} strokeWidth={2} />}
                      iconBg="bg-foreground"
                      title={critere.label}
                      subtitle={critere.detail}
                      rightIcon={critere.valide ? <CheckCircle2 size={17} className="text-success-soft-foreground" strokeWidth={2} /> : <CircleAlert size={17} className="text-danger-soft-foreground" strokeWidth={2} />}
                    />
                  ))}

                  {/* Taux final */}
                  <EligibilityItem
                    icon={<ShieldAlert className="text-background" size={15} strokeWidth={2} />}
                    iconBg="bg-foreground"
                    title={bonusEligibilite.tauxFinalLabel}
                    subtitle={bonusEligibilite.tauxFinalDetail}
                    rightIcon={<ShieldAlert size={17} className="text-muted" strokeWidth={2} />}
                  />
                </div>
              </div>
            )}

            {/* Tickets */}
            {ticketDetails && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-semibold text-foreground">
                    Détail des {ticketDetails.length} ticket{ticketDetails.length > 1 ? 's' : ''}
                  </h3>
                  <span className="text-[11px] text-muted">{creneauLabel}</span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-separator bg-surface">
                  <div className="grid grid-cols-[1.2fr_1.4fr_1fr_0.9fr_0.9fr] border-b border-separator px-4 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                    <span>Ticket</span>
                    <span>Partenaire</span>
                    <span>Date</span>
                    <span className="text-right">Brut</span>
                    <span className="text-right text-success-soft-foreground">Commission</span>
                  </div>

                  {ticketDetails.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted">Aucun ticket trouvé</p>}
                  {ticketDetails.map((t, index) => (
                    <div
                      key={t.ref}
                      className={`grid grid-cols-[1.2fr_1.4fr_1fr_0.9fr_0.9fr] items-center px-4 py-4 text-[12px] ${index !== ticketDetails.length - 1 ? 'border-b border-separator' : ''}`}
                    >
                      <span className="font-medium text-accent truncate">{t.ref}</span>
                      <span className="text-foreground truncate">{t.partenaire}</span>
                      <span className="text-muted">{format(new Date(t.date), 'dd/MM/yyyy', { locale: fr })}</span>
                      <span className="text-right font-semibold text-foreground">{formatNumber(t.fraisLivraison)}</span>
                      <span className="text-right font-semibold text-success-soft-foreground">{formatNumber(t.commission)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DrawerBody>

        {/* Footer fixe — Wave */}
        <div className="shrink-0 bg-background px-5 pb-5 pt-0">
          <div className="border-t border-dashed border-separator mb-4" />
          <div className={`rounded-2xl border px-4 py-4 ${numeroWave ? 'border-success/30 bg-success-soft' : 'border-danger/30 bg-danger-soft'}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${numeroWave ? 'bg-success/15' : 'bg-danger/15'}`}>
                <Phone size={18} className={numeroWave ? 'text-success-soft-foreground' : 'text-danger-soft-foreground'} strokeWidth={2.3} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Numéro wave de paiement</p>
                <p className={`mt-1 text-[15px] font-medium ${numeroWave ? 'text-success-soft-foreground' : 'italic text-danger-soft-foreground'}`}>{numeroWave ?? 'Non renseigné'}</p>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
