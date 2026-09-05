import React from 'react';

/** Le titre d'une section de la fiche coursier. */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-base font-semibold text-foreground">{children}</h2>;
}
