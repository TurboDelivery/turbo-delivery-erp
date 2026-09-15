'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import { ChampListe } from '@/components/commons/champs-formulaire';
import { IndicateurFiltre, useFiltre } from '@/features/performance/components/zone-filtre';
import { generateAllWeeks } from '@/features/creneaux/utils/semaine.utils';
import { lundiDeLaSemaineEnCours } from '@/features/performance/utils/semaine-iso.utils';

/**
 * Le choix de la semaine lue, exigence 2.3 du cahier des charges « Performance de la Flotte ».
 *
 * <p>Le module ne permettait ni de choisir une période ni de relire une semaine passée :
 * la semaine était fixée en dur côté serveur, et le sélecteur qui existait à l'écran ne
 * regroupait que les lignes déjà reçues, donc une seule semaine. Le cahier des charges le
 * dit sans détour : « il ne permet pas de consulter l'historique d'un livreur sur d'autres
 * périodes ».</p>
 *
 * <h3>Pourquoi l'URL et non un état local</h3>
 * <p>La semaine choisie s'écrit dans la barre d'adresse. Elle survit donc au rechargement,
 * se partage par copier-coller, et se retrouve dans l'historique du navigateur. C'est la
 * convention des écrans finance de cet ERP, et c'est aussi ce qui permet à la page, qui est
 * un composant serveur, de relire les données : sans paramètre d'URL, elle n'aurait aucun
 * moyen de savoir quoi demander.</p>
 *
 * <h3>Pourquoi l'attente ne lui appartient plus</h3>
 * <p>La transition qui porte la navigation vit dans {@link ZoneFiltre}, un cran au-dessus,
 * partagée avec le CONTENU rendu côté serveur. C'est ce qui permet d'estomper le classement
 * périmé pendant la lecture de la nouvelle semaine. Enfermé ici, cet état ne savait dire que
 * « la liste est désactivée », ce qui se lit comme une panne.</p>
 *
 * <h3>Une ComboBox, pas un Select</h3>
 * <p>La liste couvre toutes les semaines depuis décembre 2024, soit près de quatre-vingt-dix
 * entrées. Une liste déroulante simple obligerait à faire défiler ; celle-ci se cherche au
 * clavier. C'est la règle du projet pour tout ce qui se filtre.</p>
 */
export function SelecteurSemaine({ semaine }: { semaine?: string }) {
  const params = useSearchParams();
  const { enCours, naviguerVers } = useFiltre();

  /*
   * Les semaines sont identifiées par leur LUNDI, au format `AAAA-MM-JJ`. La conversion
   * vers le couple (année, semaine) attendu par le serveur se fait dans la page, au plus
   * près de l'appel : ce composant ne manipule que des dates, qui se lisent.
   */
  const options = useMemo(
    () => generateAllWeeks().map((s) => ({ label: s.label, value: s.value })),
    [],
  );

  const courante = lundiDeLaSemaineEnCours();
  const valeur = semaine || courante;

  const choisir = (lundi: string) => {
    const suivants = new URLSearchParams(params.toString());

    /*
     * La semaine EN COURS ne s'écrit pas dans l'URL : elle est le défaut du serveur, et une
     * adresse sans paramètre doit rester l'adresse de « cette semaine ». Sans cela, un lien
     * copié aujourd'hui montrerait encore cette semaine-ci dans un mois.
     */
    if (!lundi || lundi === courante) {
      suivants.delete('semaine');
    } else {
      suivants.set('semaine', lundi);
    }

    naviguerVers(suivants.toString());
  };

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="max-w-sm flex-1 basis-72">
        <ChampListe
          estDesactive={enCours}
          label="Semaine"
          onChange={choisir}
          options={options}
          placeholder="Choisir une semaine"
          valeur={valeur}
        />
      </div>

      {/* Garde sa place en permanence : apparaitre ferait sauter la ligne. */}
      <IndicateurFiltre />
    </div>
  );
}
