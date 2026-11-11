import { describe, expect, it } from 'vitest';

import { lireCorpsReponse, motifDuRefus } from './login-refus.utils';

/**
 * Banc du refus de connexion, ecrit le 11/11/2026.
 *
 * <p>Le defaut garde est celui qui a verrouille sept comptes : un corps de reponse en
 * chaine nue, que `response.json()` refusait d'analyser, transformait « mot de passe
 * faux » en « Erreur serveur, reessayez ». L'invitation a reessayer brulait les trois
 * tentatives et fermait le compte.</p>
 */
describe('lecture du corps de la reponse', () => {
    it('analyse un corps JSON', () => {
        const lu = lireCorpsReponse('{"message":"Compte inactif. Contactez l\'Admin","code":"LOG11"}');

        expect(lu.json?.code).toBe('LOG11');
        expect(lu.texteBrut).toBeNull();
    });

    it('ne leve pas sur une chaine nue, et la garde', () => {
        // Le corps exact que `erp-backend` renvoyait avant le correctif du 11/11.
        const lu = lireCorpsReponse('Identifiants Incorrects');

        expect(lu.json).toBeNull();
        expect(lu.texteBrut).toBe('Identifiants Incorrects');
    });

    it('ecarte une page de balisage', () => {
        const lu = lireCorpsReponse('<html><body><h1>502 Bad Gateway</h1></body></html>');

        expect(lu.texteBrut).toBeNull();
    });

    it('ecarte un corps trop long pour etre un message', () => {
        const lu = lireCorpsReponse('x'.repeat(250));

        expect(lu.texteBrut).toBeNull();
    });

    it('rend deux fois null sur un corps vide', () => {
        expect(lireCorpsReponse('')).toEqual({ json: null, texteBrut: null });
        expect(lireCorpsReponse(null)).toEqual({ json: null, texteBrut: null });
    });
});

describe('texte montre apres un refus', () => {
    it('reprend le message du serveur quand il y en a un', () => {
        const lu = lireCorpsReponse('{"message":"Compte inactif. Contactez l\'Admin","code":"LOG11"}');

        expect(motifDuRefus(401, lu)).toBe("Compte inactif. Contactez l'Admin");
    });

    it('rattrape une chaine nue au lieu de parler de panne', () => {
        const lu = lireCorpsReponse('Identifiants Incorrects');

        expect(motifDuRefus(401, lu)).toBe('Identifiants Incorrects');
        expect(motifDuRefus(401, lu)).not.toMatch(/Erreur serveur/);
    });

    it('ne dit JAMAIS « identifiants » sur un 5xx', () => {
        // La personne n'a rien fait de mal : l'envoyer retaper son mot de passe trois
        // fois verrouillerait un compte sain.
        const lu = lireCorpsReponse('{"detail":"could not execute statement"}');

        const motif = motifDuRefus(500, lu);
        expect(motif).not.toMatch(/dentifiant/);
        expect(motif).toContain('indisponible');
    });

    it('ne recopie pas le detail d’une exception serveur', () => {
        // `TransformationException` place `e.getMessage()` brut dans le `detail` d'un
        // `ProblemDetail`, sur une page que l'on atteint sans etre connecte. C'est la
        // forme exacte d'un 401 de `BadCredentialsException` : il n'a pas de champ
        // `message`, et combler ce vide avec `detail` afficherait l'exception.
        //
        // Le statut est 401 et NON 500 a dessein : sur un 5xx la branche de panne
        // court-circuite avant d'atteindre `detail`, et le test ne garderait rien.
        // Verifie le 11/11/2026 en ajoutant `?? corps.json?.detail` au code.
        const lu = lireCorpsReponse('{"status":401,"detail":"could not execute statement; SQL [n/a]"}');

        expect(motifDuRefus(401, lu)).toBe('Identifiants incorrects');
    });

    it('ne recopie pas non plus un message de serveur sur un 5xx', () => {
        const lu = lireCorpsReponse('{"message":"NullPointerException sur utilisateurs.password"}');

        expect(motifDuRefus(503, lu)).not.toMatch(/NullPointer/);
    });

    it('se replie sur le texte generique quand le serveur ne dit rien', () => {
        expect(motifDuRefus(400, lireCorpsReponse(''))).toBe('Identifiants incorrects');
    });
});
