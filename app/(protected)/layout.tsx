export const dynamic = 'force-dynamic';

import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Portals from '@/components/portals';
import Footer from '@/components/layouts/footer';
import Header from '@/components/layouts/header';
import Overlay from '@/components/layouts/overlay';
import Sidebar from '@/components/layouts/sidebar';
import ProtectedPage from '@/components/protected-page';
import { AbilityProvider } from '@/lib/casl/ability-context';
import { getProfile } from '@/src/actions/users.actions';
import ScrollToTop from '@/components/layouts/scroll-to-top';
import MainContainer from '@/components/layouts/main-container';
import ContentAnimation from '@/components/layouts/content-animation';
import { FormChangePassword } from '@/components/auth/form-change-password';
import { NotificationSocketProvider } from '@/providers/notification-socket.provider';
import { AppelProvider } from '@/features/standard/components/appel-provider';
import { SessionSupervisionProvider } from '@/components/providers/session-supervision-provider';
import AccesRefuse from '@/components/acces-refuse';
import ServiceIndisponible from '@/components/service-indisponible';
import { canAccessRoute } from '@/utils/route-permission';
import { defineAbilityFor, normalizeRole } from '@/lib/casl/ability';
import { EN_TETE_CHEMIN } from '@/utils/en-tetes';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  /**
   * `getProfile` relance desormais toute erreur qui n'est ni 401 ni 403, pour qu'une
   * panne de lecture cesse d'etre maquillee en « deconnecte ». C'est le bon choix
   * DANS UNE PAGE. Ici, on est a la RACINE de toutes les pages authentifiees : une
   * erreur qui remonte fait tomber l'ERP ENTIER sur un ecran a digest, alors qu'un
   * simple hoquet reseau sur `/user/profile` suffit a la declencher.
   *
   * On garde donc l'intention (ne rien avaler, ne pas faire passer une panne pour une
   * deconnexion) mais on la rend lisible : l'ecran nomme le service en cause et
   * propose de reessayer, au lieu d'un code d'erreur opaque sur toute l'application.
   */
  let profile: Awaited<ReturnType<typeof getProfile>>;
  try {
    profile = await getProfile();
  } catch (erreur) {
    console.error('[layout-protege] Profil illisible — ERP inaccessible.', erreur);
    return <ServiceIndisponible service="le service ERP" />;
  }
  if (!profile) redirect('/auth');

  /**
   * Garde d'acces SERVEUR.
   *
   * <p>`ProtectedPage` est un composant CLIENT, et ce layout lui passait des
   * `children` DEJA RENDUS : les composants serveur des pages s'executaient donc,
   * leurs requetes partaient, et leurs donnees etaient serialisees dans la charge
   * RSC — avant que le 403 ne s'affiche. Le refus etait cosmetique : la donnee
   * arrivait quand meme dans le navigateur d'un utilisateur qui n'y a pas droit.</p>
   *
   * <p>Ici on decide AVANT de rendre. Quand l'acces est refuse, `children` n'est
   * pas dans l'arbre retourne, donc React ne l'evalue jamais et aucune requete de
   * page ne part. `ProtectedPage` reste en place comme filet cote client, pour les
   * navigations douces qui ne repassent pas par le serveur.</p>
   */
  const chemin = (await headers()).get(EN_TETE_CHEMIN) ?? '';
  const ability = defineAbilityFor(normalizeRole(profile.role?.libelle ?? null));

  // Sans le chemin, la garde ne peut rien decider et laisse passer — le filet
  // client prend alors le relais. Mais un mecanisme casse doit SE VOIR : sans
  // cette trace, une regression du middleware desactiverait la garde serveur en
  // silence, et tout continuerait de fonctionner en apparence.
  if (!chemin) {
    console.warn(
      `[garde-acces] En-tete "${EN_TETE_CHEMIN}" absent : la garde SERVEUR est inactive ` +
        'sur cette requete. Verifier le matcher de middleware.ts.',
    );
  }

  const accesAutorise = chemin ? canAccessRoute(ability, chemin) : true;

  if (!accesAutorise) {
    return (
      <>
        {/* La presence continue de remonter : l'utilisateur est bien connecte,
            c'est CETTE page qui lui est interdite. */}
        <SessionSupervisionProvider />
        <AccesRefuse />
      </>
    );
  }

  return (
    <>
      {profile && !profile.changePassword && <FormChangePassword userName={profile.username} />}
      {/* Battement de cœur de présence (supervision & audit). Ne rend rien ;
          monté hors de ProtectedPage pour continuer à remonter la présence même
          sur un écran interdit à l'utilisateur. */}
      <SessionSupervisionProvider />
      <AbilityProvider role={profile?.role?.libelle ?? null}>
      <NotificationSocketProvider>
      <AppelProvider>
      <ProtectedPage profile={profile!}>
        {/* BEGIN MAIN CONTAINER */}
        <div className="relative">
          <Overlay />
          <ScrollToTop />

          <MainContainer>
            {/* BEGIN SIDEBAR */}
            <Sidebar />
            {/* END SIDEBAR */}
            <div className="main-content flex min-h-screen flex-col">
              {/* BEGIN TOP NAVBAR */}
              <Header profile={profile!} />
              {/* END TOP NAVBAR */}

              {/* BEGIN CONTENT AREA */}
              <ContentAnimation>{children}</ContentAnimation>
              {/* END CONTENT AREA */}

              {/* BEGIN FOOTER */}
              <Footer />
              {/* END FOOTER */}

              <Portals />
            </div>
          </MainContainer>
        </div>
      </ProtectedPage>
      </AppelProvider>
      </NotificationSocketProvider>
      </AbilityProvider>
    </>
  );
}
