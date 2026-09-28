import path from 'node:path';

import { defineConfig } from 'vitest/config';

/**
 * Le banc de la logique front.
 *
 * <h3>Pourquoi il n'existait pas, et pourquoi il existe maintenant</h3>
 * <p>Cet ERP n'avait AUCUN lanceur de tests : toute sa logique — l'analyseur de collage
 * TSV, les formats, les règles d'affichage — reposait sur une relecture humaine. Le
 * défaut le plus coûteux du module base clients était de cette nature : un point décimal
 * lu comme un séparateur de milliers, qui enregistrait un ticket de 12 500 en 12,5.</p>
 *
 * <h3>Environnement Node, pas jsdom</h3>
 * <p>Ce qu'on teste ici est du calcul pur : des chaînes qui deviennent des nombres, des
 * lignes qui deviennent des colonnes. Monter un DOM pour cela coûterait des secondes à
 * chaque exécution sans rien prouver de plus. Le jour où un composant aura besoin d'être
 * rendu, on ajoutera un projet jsdom à côté plutôt que d'alourdir celui-ci.</p>
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules/**', '.next/**'],
  },
});
