'use client';

import React, { useState } from 'react';
import { Input } from '@/components/heroui';
import { Eye, EyeOff } from 'lucide-react';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-primary mb-4">{children}</h2>;
}

interface ComptePartenaireSectionProps {
  username: string;
  password: string;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
}

export function ComptePartenaireSection({
  username,
  password,
  onUsernameChange,
  onPasswordChange,
}: ComptePartenaireSectionProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <section>
      <SectionTitle>Compte du partenaire</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nom utilisateur"
          variant="bordered"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder="username_restaurant"
        />
        <Input
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          variant="bordered"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="••••••••"
          endContent={
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
      </div>
    </section>
  );
}
