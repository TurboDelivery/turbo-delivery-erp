'use client';

import { useEffect } from 'react';

/**
 * Ecran de dernier recours : il remplace TOUT l'arbre, y compris le layout racine.
 *
 * <h3>Aucune dependance</h3>
 * <p>Il importait `framer-motion` et le `Button` de la bibliotheque. Or c'est l'ecran qui
 * s'affiche quand le rendu a echoue : si la panne vient d'une de ces dependances, la
 * page d'erreur tombe a son tour et l'utilisateur n'a plus qu'un ecran blanc. Un dernier
 * recours ne peut pas dependre de ce qui a pu le declencher — d'ou du balisage nu et des
 * styles en ligne, qui tiennent meme si la feuille de styles ne s'est pas chargee.</p>
 *
 * <h3>Rien ne tourne</h3>
 * <p>Un anneau tournait en boucle a cote du « 500 », et le bouton portait une fleche
 * circulaire : deux formes en rotation sur un ecran dont le message est precisement que
 * plus rien n'avance. Une animation perpetuelle dit « patientez, ca charge » — ici c'est
 * faux, et cela retient l'utilisateur au lieu de l'inviter a agir.</p>
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="fr">
            <body
                style={{
                    margin: 0,
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem 1rem',
                    background: '#f7f7f8',
                    color: '#18181b',
                    fontFamily:
                        'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                }}
            >
                <main style={{ maxWidth: '32rem', textAlign: 'center' }}>
                    <p
                        style={{
                            margin: 0,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: '#71717a',
                        }}
                    >
                        Erreur 500
                    </p>

                    <h1 style={{ margin: '0.5rem 0 0', fontSize: '1.5rem', lineHeight: 1.3 }}>
                        L&apos;application n&apos;a pas pu afficher cette page
                    </h1>

                    <p style={{ margin: '0.75rem 0 0', lineHeight: 1.55, color: '#52525b' }}>
                        Rien n&apos;a été perdu et votre session reste ouverte. Réessayez ; si cela se
                        reproduit, signalez-le en indiquant le code ci-dessous.
                    </p>

                    <button
                        onClick={() => reset()}
                        style={{
                            marginTop: '1.5rem',
                            padding: '0.6rem 1.25rem',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#ffffff',
                            background: '#e11900',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                        }}
                        type="button"
                    >
                        Réessayer
                    </button>

                    {error.digest && (
                        <p
                            style={{
                                margin: '1.5rem 0 0',
                                fontSize: '0.8rem',
                                color: '#71717a',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            }}
                        >
                            Code : {error.digest}
                        </p>
                    )}
                </main>
            </body>
        </html>
    );
}
