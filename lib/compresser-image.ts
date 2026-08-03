'use client';

/**
 * Réduction des images avant envoi.
 *
 * <p>Une photo prise au téléphone pèse couramment 4 Mo pour 4000 px de large, alors qu'elle
 * sera affichée dans un logo de 64 px ou une bannière de 160 px de haut. L'envoyer telle
 * quelle coûte du temps sur une connexion mobile et, à plusieurs fichiers, dépasse la taille
 * de requête acceptée par le serveur — c'est ce qui bloquait la création de partenaire.</p>
 *
 * <p>Principe de prudence : cette fonction ne rend jamais un fichier pire que l'original.
 * Format non décodable par le navigateur (HEIC de certains iPhone), canvas indisponible,
 * résultat plus lourd que la source — dans tous ces cas le fichier d'origine est renvoyé
 * intact. Un envoi lourd vaut mieux qu'une image abîmée.</p>
 */

/** Au-delà, on redimensionne : suffisant pour une bannière plein écran. */
const COTE_MAX = 1600;
/** Qualité JPEG — au-dessus de 0,85 le gain de poids s'effondre sans gain visible. */
const QUALITE = 0.82;
/** En dessous, une image déjà petite n'est pas ré-encodée inutilement. */
const SEUIL_INTERVENTION = 500 * 1024;

export async function compresserImage(fichier: File): Promise<File> {
  if (!fichier.type.startsWith('image/')) {
    return fichier;
  }

  try {
    // `imageOrientation: 'from-image'` applique la rotation EXIF : sans elle, une photo prise
    // en portrait ressort couchée une fois passée par le canvas.
    const image = await createImageBitmap(fichier, { imageOrientation: 'from-image' });
    const facteur = Math.min(1, COTE_MAX / Math.max(image.width, image.height));

    if (facteur === 1 && fichier.size <= SEUIL_INTERVENTION) {
      image.close();
      return fichier;
    }

    const largeur = Math.max(1, Math.round(image.width * facteur));
    const hauteur = Math.max(1, Math.round(image.height * facteur));

    const canvas = document.createElement('canvas');
    canvas.width = largeur;
    canvas.height = hauteur;
    const contexte = canvas.getContext('2d');
    if (!contexte) {
      image.close();
      return fichier;
    }
    contexte.drawImage(image, 0, 0, largeur, hauteur);
    image.close();

    // Un logo est souvent un PNG à fond transparent : le convertir en JPEG lui collerait un
    // fond noir. On ne passe donc en JPEG que si l'image est réellement opaque.
    const transparent = comporteDeLaTransparence(contexte, largeur, hauteur);
    const type = transparent ? 'image/png' : 'image/jpeg';

    const blob = await new Promise<Blob | null>((resoudre) => canvas.toBlob(resoudre, type, QUALITE));
    if (!blob || blob.size >= fichier.size) {
      return fichier;
    }

    return new File([blob], renommer(fichier.name, transparent ? 'png' : 'jpg'), { type });
  } catch {
    return fichier;
  }
}

/** Compresse une liste, en laissant passer intacts les fichiers non images. */
export function compresserImages(fichiers: File[]): Promise<File[]> {
  return Promise.all(fichiers.map(compresserImage));
}

/**
 * Un pixel non opaque suffit à trancher. L'analyse est échantillonnée (un pixel sur seize) :
 * parcourir les millions de pixels d'une photo pour cette seule question figerait l'interface
 * sans rien apprendre de plus.
 */
function comporteDeLaTransparence(contexte: CanvasRenderingContext2D, largeur: number, hauteur: number): boolean {
  try {
    const { data } = contexte.getImageData(0, 0, largeur, hauteur);
    for (let i = 3; i < data.length; i += 4 * 16) {
      if (data[i] < 255) {
        return true;
      }
    }
    return false;
  } catch {
    // Canvas « souillé » par une image d'une autre origine : dans le doute, on préserve
    // l'éventuelle transparence.
    return true;
  }
}

function renommer(nom: string, extension: string): string {
  const base = nom.replace(/\.[^.]+$/, '') || 'image';
  return `${base}.${extension}`;
}
