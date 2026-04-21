'use client';

import { Input } from '@heroui/react';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-primary mb-4">{children}</h2>;
}

export function ComptePartenaireSection() {
  return (
    <section>
      <SectionTitle>Compte du partenaire</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Nom utilisateur" variant="bordered" name="username" />
        <Input label="Mot de passe" type="password" variant="bordered" name="password" />
      </div>
    </section>
  );
}
