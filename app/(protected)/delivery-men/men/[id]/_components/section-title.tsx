import React from 'react';

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-primary mb-4">{children}</h2>;
}
