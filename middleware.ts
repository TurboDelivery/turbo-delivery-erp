import { NextResponse, NextRequest } from 'next/server';
import { EN_TETE_CHEMIN } from '@/utils/en-tetes';

// import { auth } from '@/auth';

/**
 * La requete vient-elle d'un poste de developpement ?
 *
 * <p>On lit l'en-tete `host` plutot que `nextUrl.hostname` : derriere nginx, le second
 * porte l'hote interne et dirait « localhost » pour une requete venue d'Internet.</p>
 */
function estUnHoteLocal(request: NextRequest): boolean {
    const hote = (request.headers.get('host') ?? '').toLowerCase();
    const sansPort = hote.replace(/:\d+$/, '').replace(/^\[|\]$/g, '');
    return sansPort === 'localhost' || sansPort === '127.0.0.1' || sansPort === '::1';
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/analystics', request.url));
    }

    /*
     * Les bancs n'existent pas sur le SERVEUR PUBLIC.
     *
     * ⚠ Le critere est l'HOTE, pas `NODE_ENV`. Chaque page de banc portait
     * `NODE_ENV === 'production'`, ce qui les fermait aussi dans le build local
     * `.next/standalone` — or c'est LA le seul endroit ou ce projet verifie ses ecrans,
     * le serveur de developpement etant proscrit. Consequence vecue : il fallait retirer
     * la garde a la main avant chaque verification et la remettre apres, ce qui finit
     * toujours par partir en production un jour.
     *
     * ⚠ Et un vrai 404, pas `notFound()`. Mesure : une route absente rend 404, tandis
     * qu'un `notFound()` leve depuis une route EXISTANTE rend 200 dans ce Next. Une
     * sonde qui surveillerait /apercu les croirait vivantes.
     */
    if (pathname.startsWith('/apercu') && !estUnHoteLocal(request)) {
        return new NextResponse(null, { status: 404 });
    }

    // Un layout Next ne recoit PAS le pathname : il n'a ni `params` complet ni
    // `usePathname` (il s'execute sur le serveur). Sans cet en-tete, la garde
    // d'acces de `app/(protected)/layout.tsx` ne saurait pas QUELLE page elle
    // s'apprete a rendre, et ne pourrait donc pas refuser avant de la rendre.
    const enTetes = new Headers(request.headers);
    enTetes.set(EN_TETE_CHEMIN, pathname);

    return NextResponse.next({ request: { headers: enTetes } });
}

/**
 * Chemins surveilles.
 *
 * <p>L'exclusion des images etait `.*\.(?:svg|png|...)$` — n'importe quel chemin, a
 * n'importe quelle profondeur, se terminant par une extension d'image. Or un segment
 * dynamique est du TEXTE LIBRE : `/personnel/x.png` resout vers
 * `app/(protected)/personnel/[id]/page.tsx`, une page reelle. Sur ces URL le
 * middleware ne tournait pas, donc l'en-tete de chemin n'etait ni pose NI ECRASE —
 * et la garde du layout, privee de chemin, laisse passer. Deux ecrans protegeables
 * s'ouvraient ainsi, et l'en-tete devenait forgeable par l'appelant.</p>
 *
 * <p>L'exclusion est desormais ancree a la RACINE (`[^/]+`) : elle ne couvre plus que
 * les fichiers de `public/` (`/logo.png`), jamais une route imbriquee.</p>
 */
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|[^/]+\\.(?:svg|png|jpg|jpeg|gif|webp)$|auth|api/auth).*)', '/'],
};
