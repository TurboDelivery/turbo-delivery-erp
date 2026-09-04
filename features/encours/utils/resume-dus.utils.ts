import type { IEncoursReleve } from '@/features/encours/types/encours.types';

/**
 * Ce qu'un partenaire doit encore, pour les deux formats d'export.
 *
 * <h3>La déduction n'était soustraite nulle part dans les exports</h3>
 * <p>Le tableau à l'écran affiche « Sous-total = facturé − déduction », et le serveur
 * a déjà retiré `partenaires[].deduction` de `sousTotalReste`. Les deux exports, eux,
 * recalculaient leur propre somme (`Σ solde`) sans jamais toucher au registre des
 * déductions, chacun dans sa copie de la même fonction.</p>
 *
 * <p>Conséquence : un partenaire avec 1 000 000 F facturés et 200 000 F d'avance déjà
 * déduite lisait « reste 800 000 » à l'écran, tandis que le CSV et le PDF annonçaient
 * « total dû 1 000 000 ». Le PDF est un document de RELANCE envoyé au partenaire : on
 * lui réclamait 200 000 F qu'on lui avait accordés.</p>
 *
 * <p>La fonction est ici, une seule fois, pour que les deux exports ne puissent plus
 * diverger de l'écran ni l'un de l'autre.</p>
 */

export interface PartenaireResumeDu {
    partenaire: string;
    cycle: string;
    /** Facturé restant, DÉDUCTION APPLIQUÉE, comme le sous-total à l'écran. */
    totalDu: number;
    /** Somme des soldes avant déduction, pour pouvoir montrer le détail du calcul. */
    totalFacture: number;
    /** Déduction accordée à ce partenaire, retirée de `totalDu`. */
    deduction: number;
    nbFactures: number;
    periodes: string[];
}

interface Options {
    /**
     * Ajoute l'année au libellé de période. Le PDF en a besoin : `f.periode` ne porte
     * que le nom du mois (« Mai »), ce qui est ambigu sur un relevé annuel.
     */
    avecAnnee?: boolean;
    /**
     * Regroupe les périodes identiques en « Mai (×3) ». Un partenaire à plusieurs
     * établissements porte la même facture mensuelle autant de fois qu'il a de points
     * de vente, ce qui rendait le PDF illisible.
     */
    dedupliquerPeriodes?: boolean;
}

/** « Mai », « Mai », « Juin » devient « Mai (×2) », « Juin ». */
function dedupPeriodes(periodes: string[]): string[] {
    const comptes = new Map<string, number>();
    for (const p of periodes) comptes.set(p, (comptes.get(p) ?? 0) + 1);
    return Array.from(comptes.entries()).map(([p, c]) => (c > 1 ? `${p} (×${c})` : p));
}

export function construireResumeDus(
    releve: IEncoursReleve,
    { avecAnnee = false, dedupliquerPeriodes = false }: Options = {},
): PartenaireResumeDu[] {
    return releve.partenaires
        .map<PartenaireResumeDu | null>((p) => {
            const facturesDues = p.stores
                .flatMap((s) => s.factures)
                .filter((f) => (f.solde ?? 0) > 0 && f.statut !== 'À venir' && f.libelle !== '—');
            if (facturesDues.length === 0) return null;

            const totalFacture = facturesDues.reduce((somme, f) => somme + (f.solde ?? 0), 0);
            const deduction = p.deduction ?? 0;

            const periodes = facturesDues.map((f) =>
                avecAnnee
                    ? `${f.periode} ${releve.annee}${f.libelle ? ' — ' + f.libelle : ''}`.trim()
                    : `${f.periode}${f.libelle ? ' — ' + f.libelle : ''}`.trim(),
            );

            return {
                partenaire: p.groupe,
                cycle: p.cycle,
                // Jamais negatif : une deduction superieure au reste signifie que le
                // partenaire ne doit plus rien, pas qu'on lui doit de l'argent.
                totalDu: Math.max(0, totalFacture - deduction),
                totalFacture,
                deduction,
                // Une periode facturee en frais + commission compte pour UNE, comme dans
                // le releve : les lignes de complement ne sont pas des periodes de plus.
                nbFactures: facturesDues.filter((f) => !f.complement).length,
                periodes: dedupliquerPeriodes ? dedupPeriodes(periodes) : periodes,
            };
        })
        .filter((x): x is PartenaireResumeDu => x !== null)
        .sort((a, b) => b.totalDu - a.totalDu);
}
