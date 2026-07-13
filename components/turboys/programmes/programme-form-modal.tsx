'use client';

import React from 'react';
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { IJourProgramme, IProgramme } from '@/features/turboys/types/programme.types';
import { useCreerProgrammeMutation, useModifierProgrammeMutation } from '@/features/turboys/queries/programme.query';
import { useLivreursListQuery } from '@/features/tickets/queries/livreur-list.query';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
import { defaultJours, joursAvecDates, normaliserJours, WeeklyJoursEditor } from './weekly-jours-editor';

const nomLivreur = (l: { nom: string | null; prenoms: string | null; telephone?: string; matricule?: string }) =>
  `${l.prenoms ?? ''} ${l.nom ?? ''}`.trim() || l.telephone || l.matricule || 'Livreur';

export function ProgrammeFormModal({
  isOpen,
  onOpenChange,
  programme,
  anneeInitiale,
  semaineInitiale,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  programme?: IProgramme | null;
  anneeInitiale: number;
  semaineInitiale: number;
}) {
  const isEdit = !!programme;
  const livreursQuery = useLivreursListQuery();
  const restaurantsQuery = useQuery({
    queryKey: ['restaurants', 'all', 'programmes'],
    queryFn: getAllRestaurants,
    staleTime: 5 * 60 * 1000,
  });
  const restaurants = React.useMemo(
    () => (restaurantsQuery.data ?? []).map((r) => ({ id: r.id, nom: r.nomEtablissement })),
    [restaurantsQuery.data],
  );

  const [livreurId, setLivreurId] = React.useState('');
  const [annee, setAnnee] = React.useState(anneeInitiale);
  const [semaine, setSemaine] = React.useState(semaineInitiale);
  const [jours, setJours] = React.useState<IJourProgramme[]>(defaultJours());

  React.useEffect(() => {
    if (!isOpen) return;
    if (programme) {
      setJours(normaliserJours(programme.jours));
    } else {
      setLivreurId('');
      setAnnee(anneeInitiale);
      setSemaine(semaineInitiale);
      setJours(defaultJours());
    }
  }, [isOpen, programme, anneeInitiale, semaineInitiale]);

  const creer = useCreerProgrammeMutation(() => onOpenChange(false));
  const modifier = useModifierProgrammeMutation(() => onOpenChange(false));
  const isLoading = creer.isLoading || modifier.isLoading;

  const onSubmit = () => {
    if (isEdit) {
      modifier.mutate({ id: programme!.id, jours: joursAvecDates(jours, programme!.annee, programme!.semaine) });
      return;
    }
    if (!livreurId) {
      toast.error('Sélectionnez un livreur.');
      return;
    }
    if (annee < 2020 || semaine < 1 || semaine > 53) {
      toast.error('Année ou semaine invalide.');
      return;
    }
    creer.mutate({ livreurId, annee, semaine, jours: joursAvecDates(jours, annee, semaine) });
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside" backdrop="blur">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {isEdit ? 'Modifier le programme' : 'Nouveau programme hebdomadaire'}
          {isEdit && (
            <span className="text-sm font-normal text-default-500">
              {programme!.livreurNom ?? 'Livreur'} — semaine {programme!.semaine} / {programme!.annee}
            </span>
          )}
        </ModalHeader>
        <ModalBody>
          {!isEdit && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Autocomplete (recherche par nom / matricule / téléphone) — la
                  liste des livreurs peut être longue, le Select simple ne filtrait pas. */}
              <Autocomplete
                label="Livreur"
                className="sm:col-span-3"
                isLoading={livreursQuery.isLoading}
                isDisabled={isLoading}
                defaultItems={livreursQuery.data ?? []}
                selectedKey={livreurId || null}
                onSelectionChange={(key) => setLivreurId((key as string) ?? '')}
                placeholder="Rechercher un livreur…"
              >
                {(l) => (
                  <AutocompleteItem
                    key={l.id}
                    textValue={`${nomLivreur(l)}${l.matricule ? ` ${l.matricule}` : ''}${l.telephone ? ` ${l.telephone}` : ''}`}
                  >
                    <div className="flex flex-col">
                      <span>{nomLivreur(l)}</span>
                      {(l.matricule || l.telephone) && (
                        <span className="text-xs text-default-400">
                          {[l.matricule, l.telephone].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                  </AutocompleteItem>
                )}
              </Autocomplete>
              <Input
                type="number"
                label="Année"
                value={String(annee)}
                onValueChange={(v) => setAnnee(Number(v) || 0)}
                isDisabled={isLoading}
              />
              <Input
                type="number"
                label="Semaine (ISO)"
                value={String(semaine)}
                onValueChange={(v) => setSemaine(Number(v) || 0)}
                isDisabled={isLoading}
              />
            </div>
          )}

          <div className="mt-1">
            <p className="mb-2 text-sm font-medium text-default-600">Jours travaillés</p>
            <WeeklyJoursEditor value={jours} onChange={setJours} disabled={isLoading} restaurants={restaurants} />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" color="danger" onPress={() => onOpenChange(false)} isDisabled={isLoading}>
            Annuler
          </Button>
          <Button color="primary" onPress={onSubmit} isLoading={isLoading}>
            {isEdit ? 'Enregistrer' : 'Créer le brouillon'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
