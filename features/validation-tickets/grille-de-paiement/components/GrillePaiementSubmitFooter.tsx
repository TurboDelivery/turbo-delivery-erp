/*
 * Pied de soumission de la grille de paiement, rendu avec HeroUI V3.
 *
 * <p>Le verdict etait la phrase la moins lisible du bloc, alors que c'est la seule qui dit
 * si l'on peut soumettre. Il s'ecrivait en `text-amber-600` et `text-emerald-600` : ces
 * deux teintes de remplissage, posees en TEXTE sur la surface claire du pied, tombent
 * sous le seuil de contraste. Elles passent aux tons de texte de l'echelle, qui eux
 * suivent la bascule clair/sombre de l'en-tete ; la teinte pleine ne reste que sur
 * l'icone, ou elle sert de repere et non de lecture.</p>
 *
 * <p>Le cadre du pied etait un `div` habille a la main (fond, anneau, arrondi, ombre,
 * rembourrage). C'est une carte de la bibliotheque : elle porte ce cadre et suit le theme
 * sans qu'on le redise.</p>
 *
 * <p>Le vert du bouton « Tout valider » disait la mauvaise chose. La certification groupee
 * n'est pas l'aboutissement de l'ecran, c'est le remede a l'un des deux blocages : un
 * comptable qui balaie le pied au signal couleur lisait l'accord sur l'etape
 * intermediaire. L'accent revient a « Soumettre au DGA », seul geste qui engage le lot ;
 * la certification groupee prend le contour neutre. Son contour vert etait de toute facon
 * ecrit en dur, sans cran sombre, et son survol peignait un fond clair sous un libelle
 * vert clair.</p>
 *
 * <p>Pendant l'envoi, `disabled` grisait le bouton et le sortait du parcours clavier : le
 * libelle « Envoi… » n'etait plus atteignable au focus, et le texte seul ne disait pas
 * qu'une operation tournait encore. `isPending` garde le bouton lisible et focusable, et
 * ajoute le tourniquet qui manquait.</p>
 *
 * <p>Pas d'info-bulle sur le bouton desactive : `canSoumettre` ne tombe que sur les deux
 * blocages deja ecrits en toutes lettres a cote du bouton. La repeter au survol
 * n'ajouterait rien, et l'operateur au clavier ou sur mobile ne la verrait pas.</p>
 */
import { AlertTriangle, CheckCircle2, ListChecks, Send } from 'lucide-react';
import { Button, Card, Spinner } from '@heroui-v3/react';

interface Props {
  canSoumettre: boolean;
  isSoumettant: boolean;
  waveManquants: number;
  lignesAValider: number;
  onSoumettre: () => void;
  /** Certification groupée de toutes les lignes du lot (évite N validations manuelles). */
  onToutValider?: () => void;
  isValidantTout?: boolean;
}

/** Construit la liste lisible des blocages (Wave manquants, lignes à valider). */
export function blocagesSoumission(waveManquants: number, lignesAValider: number): string[] {
  const b: string[] = [];
  if (waveManquants > 0) b.push(`${waveManquants} numéro${waveManquants > 1 ? 's' : ''} Wave manquant${waveManquants > 1 ? 's' : ''}`);
  if (lignesAValider > 0) b.push(`${lignesAValider} ligne${lignesAValider > 1 ? 's' : ''} à valider`);
  return b;
}

export default function GrillePaiementSubmitFooter({
  canSoumettre,
  isSoumettant,
  waveManquants,
  lignesAValider,
  onSoumettre,
  onToutValider,
  isValidantTout = false,
}: Props) {
  const blocages = blocagesSoumission(waveManquants, lignesAValider);

  return (
    <Card className="sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm">
        {blocages.length > 0 ? (
          <>
            <AlertTriangle aria-hidden="true" className="size-4 shrink-0 text-warning-soft-foreground" />
            <span className="text-warning-soft-foreground">
              Soumission bloquée : {blocages.join(' · ')}.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-success-soft-foreground" />
            <span className="text-success-soft-foreground">
              Tout est prêt — vous pouvez soumettre au DGA.
            </span>
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
        {/* Certification groupée : sans elle, le Comptable devait valider les
            livreurs un par un avant de pouvoir soumettre (lot vide sinon). */}
        {lignesAValider > 0 && onToutValider && (
          <Button
            isDisabled={isSoumettant}
            isPending={isValidantTout}
            onPress={onToutValider}
            variant="outline"
          >
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size="sm" /> : <ListChecks aria-hidden="true" />}
                {isPending ? 'Validation…' : `Tout valider (${lignesAValider})`}
              </>
            )}
          </Button>
        )}

        <Button isDisabled={!canSoumettre} isPending={isSoumettant} onPress={onSoumettre}>
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : <Send aria-hidden="true" />}
              {isPending ? 'Envoi…' : 'Soumettre au DGA'}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
