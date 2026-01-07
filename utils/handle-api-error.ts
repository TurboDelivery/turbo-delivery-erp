import { AxiosError } from 'axios';

export function handleApiError(error: unknown, defaultMessage: string): { success: false; error: string } {
  if (error instanceof AxiosError) {
    console.log('API Axios Error:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || defaultMessage,
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
