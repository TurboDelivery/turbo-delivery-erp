"use client";

import { useMemo } from "react";
import { IRecouvrement } from "../types/recouvrement/recouvrement.types";
import { IFacture } from "../types/recouvrement/prets.types";

export interface IRecouvrementRepartition {
    recouvre: number;      // Montant déjà recouvré
    nonRecouvre: number;   // Montant non recouvré (dépassement ou perte)
    resteARecouvrir: number; // Montant restant à recouvrer
    totalDu: number;       // Montant total dû
    pourcentageRecouvre: number;
    pourcentageNonRecouvre: number;
    pourcentageReste: number;
}

export function useRecouvrementRepartition(
    recouvrements: IRecouvrement[] = [],
    factures: IFacture[] = []
) {
    const repartition = useMemo(() => {
        // Calculer le montant total dû (somme de toutes les factures)
        const totalDu = factures.reduce((sum, facture) => {
            return sum + facture.totalFraisLivraisons + facture.totalCommission;
        }, 0);

        // Calculer le montant déjà recouvré
        const recouvre = recouvrements.reduce((sum, recouvrement) => {
            return sum + recouvrement.montant;
        }, 0);

        // Calculer le reste à recouvrer
        const resteARecouvrir = Math.max(0, totalDu - recouvre);

        // Calculer le non-recouvre (si le recouvre dépasse le total dû)
        const nonRecouvre = Math.max(0, recouvre - totalDu);

        // Calculer les pourcentages
        const pourcentageRecouvre = totalDu > 0 ? (recouvre / totalDu) * 100 : 0;
        const pourcentageNonRecouvre = totalDu > 0 ? (nonRecouvre / totalDu) * 100 : 0;
        const pourcentageReste = totalDu > 0 ? (resteARecouvrir / totalDu) * 100 : 0;

        return {
            recouvre,
            nonRecouvre,
            resteARecouvrir,
            totalDu,
            pourcentageRecouvre,
            pourcentageNonRecouvre,
            pourcentageReste,
        } as IRecouvrementRepartition;
    }, [recouvrements, factures]);

    return repartition;
}
