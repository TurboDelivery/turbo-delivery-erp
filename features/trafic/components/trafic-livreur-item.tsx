'use client';

import { Avatar, Button, Tooltip } from '@heroui-v3/react';
import { History, MapPinOff, Navigation, PackagePlus, Phone } from 'lucide-react';

import { LivreurTraficVue } from '@/features/trafic/utils/normaliser-trafic';
import {
  STATUT_TRAFIC_META,
  formaterDistance,
  tempsEcoule,
} from '@/features/trafic/utils/statut-trafic';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { createUrlFile } from '@/utils/createUrlFile';

interface TraficLivreurItemProps {
  livreur: LivreurTraficVue;
  isSelected: boolean;
  onSelect: (livreurId: string) => void;
  onAffecter?: (livreur: LivreurTraficVue) => void;
}

/** Signal secondaire : petite pastille grise, jamais alarmiste. */
function Signal({
  icone,
  texte,
  ton = 'neutre',
}: {
  icone: React.ReactNode;
  texte: string;
  ton?: 'neutre' | 'alerte';
}) {
  const classes =
    ton === 'alerte'
      ? 'bg-danger/10 text-danger-soft-foreground'
      : 'bg-surface-secondary text-muted';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[10px] font-medium ${classes}`}
    >
      {icone}
      {texte}
    </span>
  );
}

export default function TraficLivreurItem({
  livreur,
  isSelected,
  onSelect,
  onAffecter,
}: TraficLivreurItemProps) {
  const meta = STATUT_TRAFIC_META[livreur.statut];
  const typeAffichage = getTurboyTypeDisplay(livreur.typeLivreur);
  // Sans position connue, aucune date de point GPS n'est affichée : afficher
  // « position inconnue » et « il y a 5 min » sur la même ligne se contredirait.
  const maj = livreur.aPosition ? tempsEcoule(livreur.dernierPointAt) : null;
  const distance = formaterDistance(livreur.distancePosteMetres);

  // On ne propose l'affectation qu'aux livreurs réellement en file : affecter à
  // quelqu'un qui n'y est pas échouerait plus loin dans la chaîne.
  const affectable = !!onAffecter && livreur.statut === 'DISPONIBLE' && livreur.enFile;

  const select = () => onSelect(livreur.livreurId);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={select}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select();
        }
      }}
      className={[
        'flex w-full cursor-pointer items-start gap-3 rounded-[14px] border bg-surface p-3 text-left transition-colors dark:bg-content1',
        'hover:border-separator hover:bg-surface-secondary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40',
        isSelected ? 'border-foreground ring-1 ring-foreground' : 'border-separator',
      ].join(' ')}
    >
      <div className="relative shrink-0">
        <Avatar className="size-10" size="sm">
          <Avatar.Image
            alt=""
            src={livreur.avatarUrl ? createUrlFile(livreur.avatarUrl, 'backend') : undefined}
          />
          <Avatar.Fallback>{(livreur.nomComplet ?? '?').slice(0, 2).toUpperCase()}</Avatar.Fallback>
        </Avatar>
        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface"
          style={{ backgroundColor: meta.couleur }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-semibold leading-tight">{livreur.nomComplet}</p>
          {livreur.rangFile != null && (
            <Tooltip>
              <span
                className="shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold"
                style={{ backgroundColor: meta.fond, color: meta.couleur }}
              >
                N°{livreur.rangFile}
              </span>
              <Tooltip.Content>Rang dans la file d&apos;attente du jour</Tooltip.Content>
            </Tooltip>
          )}
        </div>

        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
          <Phone className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{livreur.telephone || '—'}</span>
          <span className="text-muted">·</span>
          <span className="truncate">{typeAffichage.label}</span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span
            className="rounded-full px-2 py-[2px] text-[10px] font-bold"
            style={{ backgroundColor: meta.fond, color: meta.couleur }}
          >
            {meta.libelleCourt}
          </span>

          {livreur.horsRayonPoste && (
            <Signal
              ton="alerte"
              icone={<Navigation className="h-3 w-3" aria-hidden />}
              texte={distance ? `Hors zone · ${distance} de son poste` : 'Hors zone'}
            />
          )}

          {!livreur.aPosition ? (
            <Tooltip>
              <span>
                <Signal
                  icone={<MapPinOff aria-hidden="true" className="size-3" />}
                  texte="Position inconnue"
                />
              </span>
              <Tooltip.Content>
                Aucune position reçue : pas de marqueur sur la carte, mais le livreur reste suivi.
              </Tooltip.Content>
            </Tooltip>
          ) : (
            livreur.positionAncienne && (
              <Tooltip>
                <span>
                  <Signal
                    icone={<History aria-hidden="true" className="size-3" />}
                    texte="Position ancienne"
                  />
                </span>
                <Tooltip.Content>
                  {`Le marqueur montre la dernière position connue${maj ? ` (${maj})` : ''}.`}
                </Tooltip.Content>
              </Tooltip>
            )
          )}
        </div>

        {livreur.aPosition && (livreur.quartier || maj) && (
          <p className="mt-1 truncate text-[10px] text-muted">
            {livreur.quartier ?? 'Quartier inconnu'}
            {maj ? ` · point GPS ${maj}` : ''}
          </p>
        )}
      </div>

      {affectable && (
        // Le clic sur « affecter » ne doit pas aussi déclencher la sélection de
        // la ligne : deux actions pour un seul geste dérouteraient l'opérateur.
        <span className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Tooltip>
            <Button
              aria-label={`Affecter une course à ${livreur.nomComplet}`}
              isIconOnly
              onPress={() => onAffecter?.(livreur)}
              size="sm"
              variant="outline"
            >
              <PackagePlus aria-hidden="true" className="size-4" />
            </Button>
            <Tooltip.Content>Affecter une course</Tooltip.Content>
          </Tooltip>
        </span>
      )}
    </div>
  );
}
