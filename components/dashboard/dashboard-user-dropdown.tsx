'use client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { signOut } from '@/src/actions/users.actions';
import { Avatar } from '@/components/heroui';
import { User } from '@/types/models';
import { useRouter } from 'next/navigation';

export const DashboardUserDropdown = ({ profile }: { profile: User }) => {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Nom masqué sur mobile (évite le chevauchement avec l'icône notification) ;
          tronqué + taille réduite sur écran ≥ sm. Le nom reste accessible via le
          menu (avatar → Mon compte). */}
      <span className="hidden sm:inline max-w-[160px] truncate text-sm font-semibold uppercase text-foreground">
        {profile.username ?? ''}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar size="sm" src={profile.image ?? ''} alt="Logo Restaurant" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="text-sm font-medium" onClick={() => router.push('/settings/profile')}>
            Mon compte
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* <DropdownMenuItem>Paramètres</DropdownMenuItem>
                    <DropdownMenuItem>Support</DropdownMenuItem> */}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              await signOut();
            }}
          >
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
