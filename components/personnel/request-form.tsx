'use client';

import { Button, Modal, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ChampListe, ChampTexte } from '@/components/personnel/common/champs-personnel';
import { IEmployee, LeaveRequest } from '@/features/personnel/types/types';

const TYPES_CONGE = [
  { label: 'Congé annuel', value: 'ANNUEL' },
  { label: 'Congé maladie', value: 'MALADIE' },
  { label: 'Congé sans solde', value: 'SANS_SOLDE' },
  { label: 'Congé maternité', value: 'MATERNITE' },
] as const;

const STATUTS_CONGE = [
  { label: 'En attente', value: 'EN_ATTENTE' },
  { label: 'Approuvée', value: 'APPROUVEE' },
  { label: 'En cours', value: 'EN_COURS' },
  { label: 'Terminé', value: 'TERMINE' },
  { label: 'Rejetée', value: 'REJETEE' },
] as const;

/** Les quatre durées prédéfinies du cahier, plus la saisie libre. */
const DUREES = [
  { id: 'mois', label: 'Mois (30j)' },
  { id: 'quinzaine', label: 'Quinzaine (15j)' },
  { id: 'semaine', label: 'Semaine (7j)' },
  { id: 'personnalise', label: 'Personnalisé' },
] as const;

interface RequestFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode: boolean;
  editingRequestId: string | null;
  employees: IEmployee[];
  initialRequest: Partial<LeaveRequest>;
  onSubmit: (request: any) => void;
  onCancel: () => void;
}

export function RequestForm({ isOpen, onOpenChange, isEditMode, editingRequestId, employees, initialRequest, onSubmit }: RequestFormProps) {

  const [request, setRequest] = useState({
    employeeId: '',
    employeeName: '',
    type: 'ANNUEL' as LeaveRequest['type'],
    startDate: '',
    endDate: '',
    duration: 0,
    durationType: 'mois',
    reason: '',
    statut: 'EN_ATTENTE' as string,
    ...initialRequest,
  });

  const [leaveBalance] = useState(30);
  const [eligibilityDate] = useState('15/06/2024');

  // Synchroniser le formulaire avec initialRequest quand il change
  useEffect(() => {
    if (Object.keys(initialRequest).length > 0) {
      setRequest((prev) => ({
        ...prev,
        ...initialRequest,
      }));
    }
  }, [initialRequest, isEditMode]);

  const calculateDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  };

  const calculateEndDate = (startDate: string, durationType: string): string => {
    const start = new Date(startDate);
    let daysToAdd = 0;

    switch (durationType) {
      case 'mois':
        daysToAdd = 30;
        break;
      case 'quinzaine':
        daysToAdd = 15;
        break;
      case 'semaine':
        daysToAdd = 7;
        break;
      case 'personnalise':
        daysToAdd = request.duration || 1;
        break;
    }

    const end = new Date(start);
    end.setDate(end.getDate() + daysToAdd);
    return end.toISOString().split('T')[0];
  };

  const getRemainingBalance = (): number => {
    return Math.max(0, leaveBalance - request.duration);
  };

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    setRequest((prev) => ({
      ...prev,
      employeeId,
      employeeName: employee?.name || '',
    }));
  };

  useEffect(() => {
    if (request.startDate && request.durationType !== 'personnalise') {
      const endDate = calculateEndDate(request.startDate, request.durationType);
      const duration = calculateDuration(request.startDate, endDate);
      setRequest((prev) => ({
        ...prev,
        endDate,
        duration,
      }));
    }
  }, [request.startDate, request.durationType]);

  useEffect(() => {
    if (request.durationType !== 'personnalise' && request.durationType && !request.startDate) {
      const today = new Date().toISOString().split('T')[0];
      const endDate = calculateEndDate(today, request.durationType);
      const duration = calculateDuration(today, endDate);
      setRequest((prev) => ({
        ...prev,
        startDate: today,
        endDate,
        duration,
      }));
    }
  }, [request.durationType]);

  useEffect(() => {
    if (request.startDate && request.endDate) {
      const duration = calculateDuration(request.startDate, request.endDate);
      setRequest((prev) => ({ ...prev, duration }));
    }
  }, [request.startDate, request.endDate]);

  const handleSubmit = () => {
    onSubmit(request);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-2xl">
            <Modal.Header>
              <Modal.Heading>
                {isEditMode ? 'Modifier la demande de congé' : 'Nouvelle demande de congé'}
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-5">
              <ChampListe
                label="Employé"
                onChange={handleEmployeeChange}
                options={employees.map((e: IEmployee) => ({ label: e.name, value: e.id }))}
                placeholder="Rechercher un employé"
                valeur={request.employeeId}
              />

              {/*
               * Le bandeau d'eligibilite etait peint en `bg-green-50 border-green-200
               * text-green-800`, avec une coche dessinee en SVG a la main dans un rond
               * `bg-green-100`. Trois teintes de palette sans variante sombre, et une
               * icone que le projet possede deja.
               */}
              {request.employeeId && (
                <div className="flex items-start justify-between gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Éligible au congé annuel (ancienneté &gt; 1 an depuis le {eligibilityDate})
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {leaveBalance} jours à partir du 01/04/2026
                    </p>
                  </div>
                  <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-success" />
                </div>
              )}

              <ChampListe
                label="Type de congé"
                onChange={(v) =>
                  setRequest((prev) => ({ ...prev, type: v as LeaveRequest['type'] }))
                }
                options={TYPES_CONGE}
                placeholder="Sélectionnez le type"
                valeur={request.type}
              />

              {/*
               * C'etaient quatre `Button` dont l'actif se distinguait par `variant="solid"`
               * pose a la main : quatre boutons independants pour un choix EXCLUSIF, sans
               * navigation au clavier entre eux ni annonce « 1 sur 4 ».
               */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Durée</span>
                <ToggleButtonGroup
                  className="flex-wrap"
                  onSelectionChange={(sel) => {
                    const v = String(Array.from(sel)[0] ?? 'personnalise');
                    setRequest((prev) => ({
                      ...prev,
                      durationType: v as typeof prev.durationType,
                    }));
                  }}
                  selectedKeys={new Set([request.durationType])}
                  selectionMode="single"
                  size="sm"
                >
                  {DUREES.map((d) => (
                    <ToggleButton id={d.id} key={d.id}>
                      {d.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ChampTexte
                  label="Date de début"
                  onChange={(v) => setRequest((prev) => ({ ...prev, startDate: v }))}
                  type="date"
                  valeur={request.startDate}
                />
                <ChampTexte
                  aide={
                    request.durationType !== 'personnalise'
                      ? 'Calculée depuis la durée choisie'
                      : undefined
                  }
                  label="Date de fin"
                  onChange={(v) => setRequest((prev) => ({ ...prev, endDate: v }))}
                  type="date"
                  valeur={request.endDate}
                />
              </div>

              <ChampTexte
                label="Motif du congé"
                onChange={(v) => setRequest((prev) => ({ ...prev, reason: v }))}
                placeholder="Veuillez saisir le motif"
                valeur={request.reason}
              />

              {isEditMode && (
                <ChampListe
                  label="Statut du congé"
                  onChange={(v) => setRequest((prev) => ({ ...prev, statut: v }))}
                  options={STATUTS_CONGE}
                  placeholder="Sélectionnez le statut"
                  valeur={request.statut}
                />
              )}

              {request.duration > 0 && (
                <div className="flex flex-col gap-2 rounded-lg bg-surface-secondary p-4">
                  <h4 className="text-sm font-medium text-foreground">Résumé</h4>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-muted">{request.duration} jours de congé</span>
                    <span className="text-sm font-medium text-foreground">
                      Solde restant après ce congé : {getRemainingBalance()} jours
                    </span>
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button onPress={() => onOpenChange(false)} variant="ghost">
                Annuler
              </Button>
              <Button onPress={handleSubmit} variant="primary">
                {isEditMode ? 'Modifier la demande' : 'Créer la demande'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
