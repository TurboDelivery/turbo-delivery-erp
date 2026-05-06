export const dynamic = 'force-dynamic';

import React from 'react';
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

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  // const session = await auth();
  if (!profile) redirect('/auth');

  return (
    <>
      {profile && !profile.changePassword && <FormChangePassword userName={profile.username} />}
      <AbilityProvider role={profile?.role?.libelle ?? null}>
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
      </AbilityProvider>
    </>
  );
}
