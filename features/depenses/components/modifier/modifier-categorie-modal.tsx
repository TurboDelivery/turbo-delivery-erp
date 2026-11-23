'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@heroui-v3/react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { ChampTexte } from '@/components/commons/champs-formulaire';
import { FenetreAction } from '@/components/commons/FenetreAction';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';
import {
  CategorieDepenseUpdateDTO,
  CategorieDepenseUpdateSchema,
} from '@/features/depenses/schemas/categorie-depense.schema';
import { ICategorieDepense } from '@/features/depenses/types/categorie-depense.type';
import {
  trouverDoublonExact,
  trouverSimilaire,
} from '@/features/depenses/utils/categorie-doublon.utils';

import { useModifierCategorieDepenseMutation } from '../../queries/category/categorie-depense-mutation.query';

interface ModifierCategorieModalProps {
  categorieDepense: ICategorieDepense;
}

/**
 * La modification d'une categorie de depense.
 *
 * <h3>Ce qui change</h3>
 * <p>La fenetre ne se FERMAIT PAS apres un enregistrement reussi. Elle etait pilotee par
 * un `open` que le composant mettait a `false`, mais le dialogue, lui, n'etait branche sur
 * rien : seule la croix le fermait. L'operateur enregistrait, ne voyait rien bouger, et
 * enregistrait a nouveau.</p>
 *
 * <p>Elle s'intitulait « Modifier un investissement » et son echec parlait de la
 * « modification de l'investissement » : le fichier avait ete recopie depuis un autre
 * module, et un comptable pouvait croire s'etre trompe d'ecran.</p>
 *
 * <p>Le formulaire ne repartait pas non plus des valeurs de la ligne : abandonner une
 * saisie puis rouvrir la fenetre la rendait telle qu'on l'avait laissee. Le bouton
 * d'enregistrement, lui, etait peint `bg-amber-500` en dur, une couleur qui n'existe
 * nulle part ailleurs et n'a pas de variante sombre.</p>
 */
export function ModifierCategorieModal({ categorieDepense }: ModifierCategorieModalProps) {
  const [ouvert, setOuvert] = useState(false);

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm<CategorieDepenseUpdateDTO>({
    resolver: zodResolver(CategorieDepenseUpdateSchema),
    defaultValues: {
      description: categorieDepense.description ?? '',
      nomCategorie: categorieDepense.nomCategorie,
    },
  });

  /**
   * LE DOUBLON AU RENOMMAGE, la catégorie écartée d'elle-même.
   *
   * <p>Sans l'exclusion par identifiant, rouvrir la fenêtre et réenregistrer sans rien
   * changer refuserait le geste : la catégorie serait son propre doublon.</p>
   */
  const { categories } = useCategorieDepense();
  const nomSaisi = watch('nomCategorie');
  const doublon = trouverDoublonExact(nomSaisi, categories, categorieDepense.id);
  const similaire = trouverSimilaire(nomSaisi, categories, categorieDepense.id);
  const nomChange =
    (nomSaisi ?? '').trim() !== (categorieDepense.nomCategorie ?? '').trim();

  // La fenetre vit dans la ligne et n'est jamais demontee : sans cette remise a l'etat
  // enregistre, on rouvrirait sur la saisie abandonnee la fois precedente.
  useEffect(() => {
    if (!ouvert) return;
    reset({
      description: categorieDepense.description ?? '',
      nomCategorie: categorieDepense.nomCategorie,
    });
  }, [categorieDepense, ouvert, reset]);

  const modifierCategorie = useModifierCategorieDepenseMutation();

  // La mutation dit deja la reussite et l'echec. Un second message ici en affichait
  // DEUX pour un seul enregistrement.
  const onSubmit = async (data: CategorieDepenseUpdateDTO) => {
    if (trouverDoublonExact(data.nomCategorie, categories, categorieDepense.id)) {
      return;
    }
    try {
      await modifierCategorie.mutateAsync({
        data: { description: data.description, nomCategorie: data.nomCategorie },
        id: categorieDepense.id,
      });
      setOuvert(false);
    } catch {
      // L'echec laisse la fenetre ouverte : la saisie est conservee pour reessayer.
    }
  };

  const soumettre = handleSubmit(onSubmit);
  const enAttente = isSubmitting || modifierCategorie.isPending;

  return (
    <>
      {/* « Renommer », écrit (maquette) : un crayon sans libellé se lit « modifier quoi ? »,
          et l'écran porte déjà trois icônes par ligne. */}
      <Button onPress={() => setOuvert(true)} size="sm" variant="ghost">
        Renommer
      </Button>

      <FenetreAction
        enAttente={enAttente}
        libelleAction={enAttente ? 'Enregistrement…' : 'Enregistrer'}
        onAction={() => void soumettre()}
        onFermer={() => setOuvert(false)}
        ouvert={ouvert}
        titre="Renommer la catégorie"
      >
        <p className="text-sm text-muted">
          Modifiez les informations de la catégorie {categorieDepense.nomCategorie}
        </p>

        {/*
         * Un renommage est RETROACTIF : la colonne categorie_depense des depenses porte
         * un identifiant, pas un libelle, donc le nouveau nom se substitue a l'ancien
         * partout, y compris sur les mois deja factures et dans les exports deja
         * rapproches. Dit seulement quand le nom change vraiment, pour ne pas crier a
         * chaque ouverture de la fenetre.
         */}
        {nomChange && (
          <p className="text-sm text-warning">
            Le nouveau libellé s&apos;affichera partout, mois passés et exports compris.
          </p>
        )}

        {/*
         * Le bouton d'action vit dans le pied de la fenetre, hors du formulaire. Sans
         * bouton d'envoi par defaut ICI, la touche Entree ne validerait plus la saisie.
         */}
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void soumettre();
          }}
        >
          <Controller
            control={control}
            name="nomCategorie"
            render={({ field }) => (
              <ChampTexte
                aide={
                  similaire
                    ? `Catégorie similaire : « ${similaire.nomCategorie} ». Vérifiez que vous n'en créez pas un doublon.`
                    : undefined
                }
                erreur={
                  errors.nomCategorie?.message ??
                  (doublon
                    ? `La catégorie « ${doublon.nomCategorie} » existe déjà. Enregistrement impossible.`
                    : undefined)
                }
                label="Nom"
                onChange={field.onChange}
                placeholder="Nom de la catégorie"
                valeur={field.value ?? ''}
              />
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <ChampTexte
                erreur={errors.description?.message}
                label="Description"
                onChange={field.onChange}
                placeholder="Description"
                valeur={field.value ?? ''}
              />
            )}
          />
          <button aria-hidden="true" className="hidden" tabIndex={-1} type="submit" />
        </form>
      </FenetreAction>
    </>
  );
}
