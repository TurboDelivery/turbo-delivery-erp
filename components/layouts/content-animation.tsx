'use client';
import { IRootState } from '@/store';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const ContentAnimation = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const [animation, setAnimation] = useState(themeConfig.animation);

    useEffect(() => {
        setAnimation(themeConfig.animation);
    }, [themeConfig.animation]);

    useEffect(() => {
        setAnimation(themeConfig.animation);
        setTimeout(() => {
            setAnimation('');
        }, 1100);
    }, [pathname]);
    return (
        <>
            {/* BEGIN CONTENT AREA */}
            {/* La LARGEUR DE PAGE est decidee ici, une fois, et nulle part ailleurs.
                Avant : 7xl sur les commandes, la fiche partenaire et les ecrans
                livreurs, 6xl sur la course externe, 4xl sur les formulaires
                restaurant, et RIEN sur les 149 autres ecrans, qui s etalaient donc
                jusqu au bord. D un ecran a l autre le bord gauche du contenu
                sautait, ce qui se lit comme un defaut d application.

                Le conteneur est A L INTERIEUR du bloc anime et non sur lui : les
                classes d animation portent sur toute la zone, les rogner ferait
                demarrer la transition sur une bande centree au lieu de la page. */}
            <div className={`${animation} animate__animated p-6`}>
                <div className="mx-auto w-full max-w-7xl">{children}</div>
            </div>
            {/* END CONTENT AREA */}
        </>
    );
};

export default ContentAnimation;
