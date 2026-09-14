'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useTransition } from 'react';

import { ChampDate, ChampListe } from '@/components/commons/champs-formulaire';
import { generateAllWeeks } from '@/features/creneaux/utils/semaine.utils';
import {
  MOIS_FR,
  lirePeriode,
  type ModePeriode,
  type ParametresPeriode,
} from '@/features/performance/utils/periode.utils';
import { lundiDeLaSemaineEnCours } from '@/features/performance/utils/semaine-iso.utils';

/**
 * Le choix de la période lue, exigence 2.3 : créneau, plage libre, mois, année.
 *
 * <h3>Un mode, puis ce que ce mode demande</h3>
 * <p>Les quatre granularités ne prennent pas les mêmes commandes : une semaine se choisit
 * dans une liste, une plage demande deux dates. Les afficher toutes les quatre en permanence
 * remplirait la barre de contrôles inertes. On choisit donc d'abord le mode, puis on ne voit
 * que ce qu'il faut.</p>
 *
 * <h3>Des ComboBox, pas des Select</h3>
 * <p>La liste des semaines couvre toutes celles depuis décembre 2024, soit près de quatre-
 * vingt-dix entrées, et celle des mois soixante. Une liste déroulante simple obligerait à
 * faire défiler ; celles-ci se cherchent au clavier. C'est la règle du projet pour tout ce
 * qui se filtre.</p>
 *
 * <h3>Ce que le changement de mode efface</h3>
 * <p>Passer d'un mode à l'autre RETIRE les paramètres des autres modes. Sans cela, une URL
 * porterait `?mois=2026-09&semaine=2026-09-07` et l'écran lirait l'un pendant que le
 * sélecteur montrerait l'autre — la période affichée et la période lue divergeraient sans
 * que rien ne le dise.</p>
 */
export function SelecteurPeriode({ parametres }: { parametres: ParametresPeriode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [enCours, demarrer] = useTransition();

  const periode = lirePeriode(parametres);
  const semaineCourante = lundiDeLaSemaineEnCours();

  const semaines = useMemo(
    () => generateAllWeeks().map((s) => ({ label: s.label, value: s.value })),
    [],
  );

  /** Les mois de l'année en cours et des deux précédentes, du plus récent au plus ancien. */
  const mois = useMemo(() => {
    const anneeCourante = new Date().getFullYear();
    const liste: { label: string; value: string }[] = [];
    for (let a = anneeCourante; a >= anneeCourante - 2; a--) {
      for (let m = 12; m >= 1; m--) {
        liste.push({
          label: `${MOIS_FR[m - 1]} ${a}`,
          value: `${a}-${String(m).padStart(2, '0')}`,
        });
      }
    }
    return liste;
  }, []);

  const annees = useMemo(() => {
    const anneeCourante = new Date().getFullYear();
    return [0, 1, 2, 3].map((n) => ({
      label: String(anneeCourante - n),
      value: String(anneeCourante - n),
    }));
  }, []);

  /** Réécrit l'URL en ne gardant que les paramètres du mode demandé. */
  function naviguer(nouveaux: ParametresPeriode) {
    const suivants = new URLSearchParams(params.toString());
    for (const cle of ['semaine', 'mois', 'annee', 'debut', 'fin']) {
      suivants.delete(cle);
    }
    for (const [cle, valeur] of Object.entries(nouveaux)) {
      if (valeur) suivants.set(cle, valeur);
    }

    const requete = suivants.toString();
    demarrer(() => router.push(requete ? `?${requete}` : '?', { scroll: false }));
  }

  function changerMode(mode: string) {
    switch (mode as ModePeriode) {
      case 'SEMAINE':
        // La semaine EN COURS ne s'écrit pas : c'est le défaut du serveur, et une adresse
        // sans paramètre doit rester l'adresse de « cette semaine ».
        naviguer({});
        return;
      case 'MOIS': {
        const maintenant = new Date();
        naviguer({ mois: `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}` });
        return;
      }
      case 'ANNEE':
        naviguer({ annee: String(new Date().getFullYear()) });
        return;
      case 'PLAGE':
        // Une plage a besoin de ses DEUX bornes. On la pré-remplit sur la semaine en cours
        // plutôt que de laisser l'écran vide en attendant la seconde saisie.
        naviguer({ debut: periode.lundi, fin: finDeSemaine(periode.lundi) });
        return;
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="w-44">
        <ChampListe
          estDesactive={enCours}
          label="Période"
          onChange={changerMode}
          options={[
            { label: 'Semaine', value: 'SEMAINE' },
            { label: 'Mois', value: 'MOIS' },
            { label: 'Année', value: 'ANNEE' },
            { label: 'Plage de dates', value: 'PLAGE' },
          ]}
          valeur={periode.mode}
        />
      </div>

      {periode.mode === 'SEMAINE' && (
        <div className="w-72">
          <ChampListe
            estDesactive={enCours}
            label="Semaine"
            onChange={(lundi) => naviguer(lundi === semaineCourante ? {} : { semaine: lundi })}
            options={semaines}
            placeholder="Choisir une semaine"
            valeur={periode.lundi}
          />
        </div>
      )}

      {periode.mode === 'MOIS' && (
        <div className="w-56">
          <ChampListe
            estDesactive={enCours}
            label="Mois"
            onChange={(valeur) => naviguer({ mois: valeur })}
            options={mois}
            placeholder="Choisir un mois"
            valeur={parametres.mois ?? ''}
          />
        </div>
      )}

      {periode.mode === 'ANNEE' && (
        <div className="w-36">
          <ChampListe
            estDesactive={enCours}
            label="Année"
            onChange={(valeur) => naviguer({ annee: valeur })}
            options={annees}
            placeholder="Choisir une année"
            valeur={parametres.annee ?? ''}
          />
        </div>
      )}

      {periode.mode === 'PLAGE' && (
        <>
          <div className="w-44">
            <ChampDate
              label="Du"
              onChange={(valeur) => naviguer({ debut: valeur, fin: parametres.fin })}
              valeur={parametres.debut}
            />
          </div>
          <div className="w-44">
            <ChampDate
              erreur={
                parametres.debut && parametres.fin && parametres.fin < parametres.debut
                  ? 'La fin précède le début'
                  : undefined
              }
              label="Au"
              onChange={(valeur) => naviguer({ debut: parametres.debut, fin: valeur })}
              valeur={parametres.fin}
            />
          </div>
        </>
      )}
    </div>
  );
}

/** Le dimanche d'une semaine désignée par son lundi. */
function finDeSemaine(lundi: string): string {
  const d = new Date(`${lundi}T00:00:00`);
  d.setDate(d.getDate() + 6);
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const jour = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mois}-${jour}`;
}
