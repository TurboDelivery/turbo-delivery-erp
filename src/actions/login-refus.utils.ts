/**
 * Lecture du corps d'une reponse de connexion, et choix du texte montre a la personne.
 *
 * <h3>Pourquoi ces deux fonctions existent</h3>
 * <p>Le defaut le plus couteux de l'authentification de l'ERP n'etait pas dans le serveur
 * mais dans la LECTURE de sa reponse. `erp-backend` rendait le refus « mot de passe faux »
 * sous la forme d'une chaine nue ; Spring serialise une reponse de type String en
 * `text/plain` ; `response.json()` leve sur `text/plain` ; l'appel partait dans son `catch`
 * et la personne lisait « Erreur serveur. Veuillez reessayer. ». Elle reessayait, comme on
 * le lui demandait, et son compte se verrouillait au troisieme essai. Mesure dans la table
 * `audit_connexion` : 67 refus de cette forme sur 7 personnes, et pas une seule fois le
 * texte reellement envoye.</p>
 *
 * <p>La regle tient en une phrase : on ne dit « identifiants incorrects » que lorsque le
 * serveur l'a dit. Elle est ici, en fonctions pures, pour etre tenue par un banc plutot que
 * par une relecture.</p>
 */

/** Ce qu'on a pu tirer d'un corps de reponse qui n'est pas garanti JSON. */
export interface CorpsLu {
    /** Le corps analyse, ou `null` si ce n'etait pas du JSON. */
    json: any | null;
    /** Le corps brut, seulement s'il est montrable a l'ecran. */
    texteBrut: string | null;
}

/** Au-dela, ce n'est plus un message mais un document : on ne l'affiche pas. */
const LONGUEUR_MAX_TEXTE_BRUT = 200;

/**
 * Analyse un corps de reponse sans jamais lever.
 *
 * <p>Un corps non-JSON n'est conserve que s'il est court et ne commence pas par du
 * balisage : une page d'erreur de nginx ou une trace HTML n'a rien a faire sous un champ
 * de connexion.</p>
 */
export function lireCorpsReponse(corps: string | null | undefined): CorpsLu {
    if (!corps) {
        return { json: null, texteBrut: null };
    }

    try {
        return { json: JSON.parse(corps), texteBrut: null };
    } catch {
        const nettoye = corps.trim();
        const montrable = nettoye.length > 0 && nettoye.length < LONGUEUR_MAX_TEXTE_BRUT && !nettoye.startsWith('<');
        return { json: null, texteBrut: montrable ? nettoye : null };
    }
}

/**
 * Le texte montre a la personne apres un refus HTTP.
 *
 * <p>Trois cas, dans cet ordre :</p>
 * <ol>
 *   <li><b>5xx</b> : le service est tombe, ce n'est PAS un mauvais mot de passe. Lui dire
 *       le contraire l'envoie retaper son mot de passe, et trois passages verrouillent un
 *       compte qui n'avait rien fait. Le `detail` de `ProblemDetail` n'est pas repris non
 *       plus : le gestionnaire generique du backend y place `e.getMessage()` brut, donc le
 *       texte d'une exception serveur, sur une page que l'on atteint sans etre connecte.</li>
 *   <li>le message du serveur, s'il y en a un ;</li>
 *   <li>le corps brut montrable, qui rattrape une chaine nue ;</li>
 *   <li>a defaut seulement, le repli generique.</li>
 * </ol>
 */
export function motifDuRefus(status: number, corps: CorpsLu): string {
    if (status >= 500) {
        return `Le service d'authentification est momentanément indisponible (HTTP ${status}).`;
    }
    return corps.json?.message ?? corps.texteBrut ?? 'Identifiants incorrects';
}
