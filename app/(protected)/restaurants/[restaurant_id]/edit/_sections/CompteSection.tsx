'use client';

import React from 'react';
import { Input } from '@heroui/react';

export function CompteSection() {
  return (
    <section>
      <h2 className="text-base font-semibold text-primary mb-4">Compte du partenaire</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Nom utilisateur" variant="bordered" />
        <Input label="Mot de passe" type="password" variant="bordered" />
      </div>
    </section>
  );
}
