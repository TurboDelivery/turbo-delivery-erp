function getFolderAndFileName(path: string) {
  const parts = path?.split('/') ?? [];
  const fileName = parts.pop() ?? '';
  const folderName = parts.pop() ?? '';
  return { folderName, fileName };
}

const serveFile = (folder: string, file: string) => `/api/serve/file/${folder}/${file}`;

const normalizeUrl = (baseUrl: string, path: string): string => {
  const trimmedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
};

export function createUrlFile(path: string, service: 'restaurant' | 'erp' | 'delivery' | 'client' | 'backend') {
  let base_url = '';
  let url: string = '';
  const { folderName, fileName } = getFolderAndFileName(path);
  if (service === 'restaurant') {
    base_url = process.env.NEXT_PUBLIC_API_RESTO_URL ?? '';
    url = normalizeUrl(base_url, serveFile(folderName, fileName));
  }
  if (service === 'erp') {
    base_url = process.env.NEXT_PUBLIC_API_ERP_URL ?? '';
    url = normalizeUrl(base_url, serveFile(folderName, fileName));
  }
  if (service === 'delivery') {
    base_url = process.env.NEXT_PUBLIC_API_DELIVERY_URL ?? '';
    url = normalizeUrl(base_url, serveFile(folderName, fileName));
  }
  if (service === 'client') {
    base_url = process.env.NEXT_PUBLIC_API_CLIENT_URL ?? '';
    url = normalizeUrl(base_url, serveFile(folderName, fileName));
  }
  if (service === 'backend') {
    base_url = process.env.NEXT_PUBLIC_API_BACKEND_URL ?? '';
    url = normalizeUrl(base_url, `/api/upload/${fileName}`);
  }
  return url;
}
