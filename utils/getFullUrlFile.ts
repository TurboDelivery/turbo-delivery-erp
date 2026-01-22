import { uploadUrl } from "@/config";
/**
 * Construit une URL absolue pour un fichier (ex: image).
 *
 * - Si `link` est déjà une URL absolue (http/https), on la retourne telle quelle.
 * - Sinon, on la combine avec le `baseUrl` + `/api/upload/`.
 *
 * @param {string} link Nom du fichier ou chemin relatif.
 * @param {string} baseUrl URL de base (par défaut ton backend).
 * @returns {string} URL absolue prête à l'emploi.
 */




export function getFullUrlFile(link: string, baseUrl: string = uploadUrl) {
  if (!link) return "";

  try {
    // Si déjà une URL absolue, on retourne directement
    if (/^https?:\/\//i.test(link)) {
      return link;
    }

    // Nettoyage du baseUrl
    const cleanedBase = baseUrl.replace(/\/api\/v1$/, "").replace(/\/$/, "");

    // Ajout du chemin /api/upload/
    return `${cleanedBase}/${link}`;
  } catch (e) {
    console.error("Erreur lors de la création de l'URL :", e);
    return link;
  }
}
