'use client';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

/**
 * Menu deroulant d'en-tete. API INCHANGEE : `button`, `btnClassName`, `placement`,
 * `offset`, `children`, et la methode imperative `close()`.
 *
 * <h3>Pourquoi `react-popper` a disparu</h3>
 * <p>C'etait le DERNIER paquet du depot dont la plage de pairs exclut React 19, et
 * donc le seul verrou technique restant avant la montee (lot 5). Il n'avait qu'un
 * consommateur, la cloche de notifications, pour un placement `bottom-end` a 8 px :
 * aucune detection de collision, aucun repositionnement au defilement. Une position
 * absolue en CSS fait exactement cela, sans dependance.</p>
 *
 * <h3>Deux defauts corriges au passage</h3>
 * <ol>
 *   <li><b>Le positionnement ne s'appliquait pas au premier rendu.</b> `usePopper`
 *       recevait `referenceRef.current` PENDANT le rendu, donc `null` au premier
 *       passage — et lire `.current` ne redeclenche aucun rendu quand la ref se
 *       remplit. Le panneau ne se placait qu'a la faveur d'un rendu ulterieur,
 *       declenche par autre chose.</li>
 *   <li><b>Le clic exterieur pouvait lever.</b> `handleDocumentClick` faisait
 *       `referenceRef.current.contains(...)` sans garde, et l'ecouteur etait pose une
 *       seule fois avec la fermeture du PREMIER rendu. Les refs sont desormais
 *       gardees, et l'ecouteur n'existe que pendant l'ouverture.</li>
 * </ol>
 */
type Props = {
    button: React.ReactNode;
    children: React.ReactNode;
    btnClassName?: string;
    /** `bottom-end` (defaut) ou `bottom-start`. Les autres valeurs retombent sur `bottom-end`. */
    placement?: string;
    /** `[axeCroise, distance]`, comme l'ancienne API. Seule la distance est utilisee. */
    offset?: number[];
};

const Dropdown = ({ button, children, btnClassName, placement, offset }: Props, forwardedRef: any) => {
    const [ouvert, setOuvert] = useState(false);
    const conteneurRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(forwardedRef, () => ({
        close() {
            setOuvert(false);
        },
    }));

    // L'ecouteur ne vit QUE pendant l'ouverture : inutile de filtrer les clics de tout
    // le document le reste du temps, et la fermeture capture ainsi l'etat courant.
    const fermerSiClicExterieur = useCallback((evenement: MouseEvent) => {
        const conteneur = conteneurRef.current;
        if (conteneur && !conteneur.contains(evenement.target as Node)) {
            setOuvert(false);
        }
    }, []);

    useEffect(() => {
        if (!ouvert) return;
        document.addEventListener('mousedown', fermerSiClicExterieur);
        return () => document.removeEventListener('mousedown', fermerSiClicExterieur);
    }, [ouvert, fermerSiClicExterieur]);

    const distance = offset?.[1] ?? 0;
    const versDebut = placement === 'bottom-start';

    return (
        <div ref={conteneurRef} className="relative">
            <button
                type="button"
                className={btnClassName}
                aria-expanded={ouvert}
                aria-haspopup="menu"
                onClick={() => setOuvert((v) => !v)}
            >
                {button}
            </button>

            {ouvert && (
                <div
                    className={`absolute top-full z-50 ${versDebut ? 'left-0' : 'right-0'}`}
                    style={{ marginTop: distance }}
                    onClick={() => setOuvert(false)}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export default forwardRef(Dropdown);
