'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge, Button } from '@heroui/react';
import { Bike, LayoutDashboard, LogOut, MapPinned, MessageCircle, Settings, Zap } from 'lucide-react';

import type { ProfilPartenaire } from '@/app/partenaire/(espace)/layout';
import { lirePartenaire } from '@/features/espace-partenaire/api';

const ProfilContexte = createContext<ProfilPartenaire | null>(null);

export function useProfilPartenaire(): ProfilPartenaire {
  const profil = useContext(ProfilContexte);
  if (!profil) {
    throw new Error('useProfilPartenaire hors de la coquille');
  }
  return profil;
}

const NAVIGATION = [
  { href: '/partenaire', libelle: 'Tableau de bord', icone: LayoutDashboard },
  { href: '/partenaire/demande', libelle: 'Demande de Turboys', icone: Zap },
  { href: '/partenaire/courses', libelle: 'Mes courses', icone: MapPinned },
  { href: '/partenaire/parametres', libelle: 'Paramètres', icone: Settings },
  { href: '/partenaire/contact', libelle: 'Contact Turbo', icone: MessageCircle },
] as const;

/**
 * Coquille de l'espace partenaire : barre latérale (ordinateur) / barre basse (mobile et
 * tablette tactile en store), bouton « Demander un Turboys » toujours accessible
 * (EF-01.5), compteur de messages non lus permanent (EF-06.6).
 */
export default function CoquillePartenaire({
  profil,
  children,
}: {
  profil: ProfilPartenaire;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [nonLus, setNonLus] = useState(0);

  useEffect(() => {
    let arrete = false;
    const relever = () =>
      lirePartenaire<{ nonLus: number }>('messages/non-lus')
        .then((r) => !arrete && setNonLus(r.nonLus))
        .catch(() => undefined);
    relever();
    const intervalle = setInterval(relever, 20_000);
    return () => {
      arrete = true;
      clearInterval(intervalle);
    };
  }, []);

  async function seDeconnecter() {
    await fetch('/api/partenaire/logout', { method: 'POST' });
    router.replace('/partenaire/connexion');
  }

  const lien = (href: string) =>
    href === '/partenaire' ? pathname === '/partenaire' : pathname.startsWith(href);

  return (
    <ProfilContexte.Provider value={profil}>
      <div className="flex min-h-screen bg-gray-50 text-gray-900">
        {/* Barre latérale — ordinateur */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-gray-100 bg-white p-4 lg:flex">
          <div className="mb-6 flex items-center gap-2.5 px-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <Bike className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight">TURBO</p>
              <p className="truncate text-xs text-gray-400">{profil.storeNom ?? 'Espace partenaire'}</p>
            </div>
          </div>

          <Button
            as={Link}
            href="/partenaire/demande"
            color="primary"
            radius="lg"
            className="mb-4 font-semibold"
            startContent={<Zap className="h-4 w-4" aria-hidden />}
          >
            Demander un Turboys
          </Button>

          <nav className="flex flex-1 flex-col gap-1">
            {NAVIGATION.map(({ href, libelle, icone: Icone }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  lien(href) ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icone className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden />
                <span className="flex-1">{libelle}</span>
                {href === '/partenaire/contact' && nonLus > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {nonLus > 9 ? '9+' : nonLus}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <button
            onClick={seDeconnecter}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-400 hover:text-gray-700"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden /> Se déconnecter
          </button>
        </aside>

        {/* Contenu */}
        <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">{children}</div>

        {/* Barre basse — mobile / tablette en store (cibles tactiles ≥ 48 px) */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white lg:hidden">
          {NAVIGATION.map(({ href, libelle, icone: Icone }) => (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                lien(href) ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <span className="relative">
                <Icone className="h-5 w-5" aria-hidden />
                {href === '/partenaire/contact' && nonLus > 0 && (
                  <span className="absolute -right-2 -top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </span>
              {libelle.split(' ')[0]}
            </Link>
          ))}
        </nav>
      </div>
    </ProfilContexte.Provider>
  );
}
