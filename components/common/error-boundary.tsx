'use client';

import React from 'react';
import { Button } from '@/components/heroui';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Message affiché à la place du contenu en erreur. */
  title?: string;
  /**
   * Quand cette valeur change, le boundary se réarme automatiquement.
   * (Ex. : la clé de semaine — naviguer relance le rendu sans laisser l'écran figé.)
   */
  resetKey?: unknown;
}

interface State {
  error: Error | null;
}

/**
 * Boundary de rendu localisé : contient un throw d'un sous-arbre au lieu de
 * laisser React démonter toute la page (écran blanc). Affiche un repli avec
 * « Réessayer ». Se réarme seul quand `resetKey` change.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Trace console pour le diagnostic (visible en prod dans les devtools).
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-10 text-center">
          <AlertTriangle className="h-8 w-8 text-danger" />
          <div>
            <p className="font-semibold text-danger">{this.props.title ?? 'Une erreur est survenue'}</p>
            <p className="mt-1 max-w-md text-xs text-danger-500">{this.state.error.message}</p>
          </div>
          <Button size="sm" color="danger" variant="flat" onPress={() => this.setState({ error: null })}>
            Réessayer
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
