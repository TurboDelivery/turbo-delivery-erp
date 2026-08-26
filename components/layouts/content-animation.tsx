'use client';
import React from 'react';

/**
 * Coquille de la zone de contenu.
 *
 * <p>Le nom vient du gabarit d'origine, qui jouait ici une transition animate.css a chaque
 * changement de page. Cette animation a ete retiree le 26/08/2026 : elle etait pilotee par
 * `themeConfig.animation`, dont la valeur par defaut est la chaine VIDE et qu'aucune
 * interface ne change. La feuille animate.css pesait 3 687 lignes pour cet unique usage
 * sans effet visible.</p>
 */
const ContentAnimation = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            {/* BEGIN CONTENT AREA */}
            {/* La LARGEUR DE PAGE est decidee ici, une fois, et nulle part ailleurs.
                Avant : 7xl sur les commandes, la fiche partenaire et les ecrans
                livreurs, 6xl sur la course externe, 4xl sur les formulaires
                restaurant, et RIEN sur les 149 autres ecrans, qui s etalaient donc
                jusqu au bord. D un ecran a l autre le bord gauche du contenu
                sautait, ce qui se lit comme un defaut d application.

                AUCUN PLAFOND : le contenu occupe toute la zone, et les seuls bords
                sont le `p-6`, identique sur tous les ecrans. C'etait deja le cas de
                149 ecrans sur 155 ; ce sont les six autres qui s'en ecartaient. La
                largeur reste decidee ICI, sur cette seule ligne. */}
            <div className="p-6">
                <div className="w-full">{children}</div>
            </div>
            {/* END CONTENT AREA */}
        </>
    );
};

export default ContentAnimation;
