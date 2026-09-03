import React from 'react';

import { formatCFA } from '@/src/actions/bonLivraison.mapper';

interface CommissionBadgeProps {
    label: string;
    amount: number;
    widthClassName?: string;
}

/**
 * Decomposition d'une commission, posee sous le montant « Commissions » de la carte CA.
 *
 * <p>Ces deux pastilles etaient rouges — `bg-red-500` pour l'intitule, `bg-red-200
 * text-red-700` pour le montant — sur une carte verte qui annonce du chiffre d'affaires.
 * Le rouge y disait « probleme » a propos de deux recettes, a cote d'un total positif :
 * la couleur affirmait le contraire de la donnee. Elles reprennent le violet du montant
 * « Commissions » dont elles sont le detail, ce qui les rattache visuellement a leur
 * total au lieu de les faire passer pour des alertes.</p>
 *
 * <p>Le libelle passe en `text-xs` : « Commission pourcentage » se repliait sur deux
 * lignes et les deux pastilles n'avaient plus la meme hauteur.</p>
 */
export default function CommissionBadge({ label, amount, widthClassName = 'w-48' }: CommissionBadgeProps) {
    return (
        <div className={`flex flex-col text-sm ${widthClassName}`}>
            <div className="rounded-t-lg bg-purple-500 px-2 py-0.5 text-center text-xs text-white">{label}</div>
            <div className="rounded-b-lg bg-purple-100 px-2 py-0.5 text-center font-medium text-purple-700">
                {formatCFA(amount)}
            </div>
        </div>
    );
}
