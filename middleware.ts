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

// Configuration des chemins à surveiller
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|auth|api/auth).*)', '/'],
};
