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
              onError={() => {
                console.warn(`⚠️ Image failed to load [${label}]:`, absUrl);
                setImgError(true);
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-lg border-2 border-separator bg-surface-secondary hover:border-primary hover:bg-primary/5 transition-colors text-muted hover:text-primary">
            {isPdf ? <FileText className="w-8 h-8" /> : <FileImage className="w-8 h-8" />}
            <span className="text-[11px] font-medium text-center px-2 truncate w-full">
              {imgError ? 'Voir le document' : label}
            </span>
          </div>
        )}
      </a>
    </div>
  );
}
