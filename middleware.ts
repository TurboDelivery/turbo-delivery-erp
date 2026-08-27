import { NextResponse, NextRequest } from 'next/server';
import { EN_TETE_CHEMIN } from '@/utils/en-tetes';

// import { auth } from '@/auth';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/analystics', request.url));
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
