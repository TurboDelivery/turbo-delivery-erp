'use client';

import { useState } from 'react';
import { ExternalLink, FileText, FileImage } from 'lucide-react';
import { toAbsoluteUrl } from './to-absolute-url';

interface DocPreviewProps {
  label: string;
  url: string;
}

export function DocPreview({ label, url }: DocPreviewProps) {
  const absUrl = toAbsoluteUrl(url) ?? url;
  const isPdf = /\.pdf(\?|$)/i.test(absUrl);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <a href={absUrl} target="_blank" rel="noreferrer" className="group relative block">
        {!isPdf && !imgError ? (
          <>
            <img
              src={absUrl}
              alt={label}
              className="w-full h-28 object-cover rounded-lg border border-separator"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
              <ExternalLink aria-hidden="true" className="size-5 text-white" />
            </div>
          </>
        ) : (
          <div className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border border-separator bg-surface-secondary text-muted transition-colors hover:border-accent/40 hover:text-foreground">
            {isPdf ? <FileText aria-hidden="true" className="size-8" /> : <FileImage aria-hidden="true" className="size-8" />}
            <span className="text-[11px] font-medium text-center px-2 truncate w-full">
              {imgError ? 'Voir le document' : label}
            </span>
          </div>
        )}
      </a>
    </div>
  );
}
