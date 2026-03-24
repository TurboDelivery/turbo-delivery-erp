// Fonction de génération de mot de passe sécurisé
export function generateSecurePassword(length: number = 12): string {
	const lowercase = 'abcdefghijklmnopqrstuvwxyz';
	const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const numbers = '0123456789';
	const special = '!@#$%^&*';

	const allChars = lowercase + uppercase + numbers + special;

	// Garantir au moins un caractère de chaque type
	let password = '';
	password += lowercase[Math.floor(Math.random() * lowercase.length)];
	password += uppercase[Math.floor(Math.random() * uppercase.length)];
	password += numbers[Math.floor(Math.random() * numbers.length)];
	password += special[Math.floor(Math.random() * special.length)];

	// Compléter avec des caractères aléatoires
	for (let i = password.length; i < length; i++) {
		password += allChars[Math.floor(Math.random() * allChars.length)];
	}

	// Mélanger le mot de passe
	return password.split('').sort(() => Math.random() - 0.5).join('');
}

export const ROLE_LABELS: Record<string, string> = {
	SUPER_ADMIN: 'Super Admin',
	ADMIN: 'Administrateur',
	EDITOR: 'Éditeur',
	AGENT: 'Agent',
};