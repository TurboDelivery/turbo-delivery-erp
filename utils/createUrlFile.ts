import getFolderAndFileName from './getFolderAndFileName';

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


export function getInitials(nomPrenom?: string): string {
    if (
      !nomPrenom || 
      nomPrenom.trim() === '' || 
      nomPrenom.toLowerCase().trim() === 'null' || 
      nomPrenom.toLowerCase().trim() === 'null null'
    ) {
      return '?';
    }
  
    const parts = nomPrenom.trim().split(/\s+/);
    const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
    return initials || '?';
}

export function getColorFromInitial(initial: string) {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFF3', '#FFC733', '#75FF33', '#FF3385', '#33A1FF', '#F333FF'];
    const index = initial.charCodeAt(0) % colors.length;
    return colors[index];
};
  
