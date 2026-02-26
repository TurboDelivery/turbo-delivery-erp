import { AxiosError } from 'axios';

/**
 * Interface pour les détails d'erreur de validation
 */
export interface ValidationErrorDetail {
  objectName: string;
  field: string;
  code: string;
  message?: string;
}

/**
 * Classe pour les erreurs de validation
 */
export class ValidationError extends Error {
  public errors: ValidationErrorDetail[];

  constructor(errors: ValidationErrorDetail[]) {
    super('Erreur de validation');
    this.name = 'ValidationError';
    this.errors = errors;
  }

  /**
   * Retourne tous les messages d'erreur concaténés
   */
  getAllMessages(): string {
    return this.errors
      .map((err) => {
        // ✅ Si le message n'existe pas, générer "le {field} est requis"
        if (!err.message || err.message.trim() === '') {
          return `le ${err.field} est requis`;
        }
        return err.message;
      })
      .join(', ');
  }

  /**
   * Retourne le premier message d'erreur
   */
  getFirstMessage(): string {
    const firstError = this.errors[0];
    if (!firstError) return 'Erreur de validation';

    // ✅ Si le message n'existe pas, générer "le {field} est requis"
    if (!firstError.message || firstError.message.trim() === '') {
      return `le ${firstError.field} est requis`;
    }

    return firstError.message;
  }
}

export function handleApiError(error: unknown, defaultMessage: string): { success: false; error: string } {
  if (error instanceof AxiosError) {
    const data = error.response?.data;

    // ✅ Gérer les erreurs de validation (array d'erreurs)
    if (data instanceof Array && data.length > 0) {
      // Si c'est un tableau d'erreurs de validation
      const validationErrors = data as ValidationErrorDetail[];
      const errorMessages = validationErrors
        .map((err) => {
          // ✅ Si le message n'existe pas, générer "le {field} est requis"
          if (!err.message || err.message.trim() === '') {
            return `le ${err.field} est requis`;
          }
          return err.message;
        })
        .join(', ');

      console.log('Validation Errors:', validationErrors);

      return {
        success: false,
        error: errorMessages || defaultMessage,
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || defaultMessage,
    };
  }

  if (error instanceof ValidationError) {
    console.log('Validation Error:', error.errors);
    return {
      success: false,
      error: error.getFirstMessage(),
    };
  }

  if (error instanceof Error) {
    console.log('API Error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }

  if (typeof error === 'string') {
    console.log('API String Error:', error);
    return {
      success: false,
      error: error,
    };
  }

  console.log('API Unknown Error:', error);
  return {
    success: false,
    error: defaultMessage,
  };
}
