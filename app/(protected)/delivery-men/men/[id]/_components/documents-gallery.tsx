'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Chip, Modal, ModalBody, ModalContent, Tooltip } from '@/components/heroui';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileText,
  ImageIcon,
  X,
} from 'lucide-react';

import { SectionTitle } from './section-title';

export interface DocItem {
  key: string;
  label: string;
  /** URL ABSOLUE (déjà résolue vers le bon endpoint). */
  url: string;
}

function estPdf(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

function extensionDepuisUrl(url: string): string {
  const m = url.split('?')[0].match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : 'jpg';
}

/** URL du proxy ERP : affichage INLINE (PDF/image affichés, jamais téléchargés). */
function urlInline(url: string): string {
  return `/api/fichier?u=${encodeURIComponent(url)}`;
}

/** URL du proxy ERP en mode TÉLÉCHARGEMENT (attachment + nom de fichier). */
function urlTelechargement(url: string, nom: string): string {
  return `/api/fichier?u=${encodeURIComponent(url)}&dl=1&nom=${encodeURIComponent(nom)}`;
}

/** Télécharge via le proxy (même origine → pas de CORS, disposition attachment fiable). */
function telecharger(url: string, nomFichier: string) {
  const a = document.createElement('a');
  a.href = urlTelechargement(url, nomFichier);
  a.rel = 'noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function DocumentsGallery({ docs }: { docs: DocItem[] }) {
  const items = useMemo(() => docs.filter((d) => !!d.url), [docs]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);

  const doc = openIndex != null ? items[openIndex] : null;

  const go = useCallback(
    (delta: number) => {
      setZoom(false);
      setOpenIndex((i) => {
        if (i == null) return i;
        const n = items.length;
        return ((i + delta) % n + n) % n;
      });
    },
    [items.length],
  );

  // Navigation clavier dans la visionneuse.
  useEffect(() => {
    if (openIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape') setOpenIndex(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, go]);

  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <SectionTitle>Documents du livreur</SectionTitle>
        <Chip size="sm" variant="flat" color="primary">
          {items.length} document{items.length > 1 ? 's' : ''}
        </Chip>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((d, i) => {
          const pdf = estPdf(d.url);
          return (
            <div key={d.key} className="group flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setZoom(false);
                  setOpenIndex(i);
                }}
                className="relative block aspect-4/3 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition-all hover:border-primary hover:shadow-md focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                aria-label={`Voir ${d.label}`}
              >
                {pdf ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-linear-to-br from-red-50 to-orange-50 text-red-500">
                    <FileText className="h-9 w-9" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">PDF</span>
                  </div>
                ) : (
                  <DocThumbnail url={d.url} label={d.label} />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm">
                    <Eye className="h-3.5 w-3.5" /> Agrandir
                  </span>
                </div>
              </button>

              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-xs font-medium text-gray-600" title={d.label}>
                  {d.label}
                </span>
                <Tooltip content="Télécharger" size="sm">
                  <button
                    type="button"
                    onClick={() => telecharger(d.url, `${d.label}.${extensionDepuisUrl(d.url)}`)}
                    className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-primary/10 hover:text-primary"
                    aria-label={`Télécharger ${d.label}`}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visionneuse plein écran */}
      <Modal
        isOpen={openIndex != null}
        onOpenChange={(o) => !o && setOpenIndex(null)}
        size="5xl"
        scrollBehavior="inside"
        backdrop="blur"
        hideCloseButton
        classNames={{ base: 'bg-neutral-900', body: 'p-0' }}
      >
        <ModalContent>
          {doc && (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  {estPdf(doc.url) ? (
                    <FileText className="h-4 w-4 shrink-0 text-red-400" />
                  ) : (
                    <ImageIcon className="h-4 w-4 shrink-0 text-primary-300" />
                  )}
                  <span className="truncate text-sm font-medium text-white">{doc.label}</span>
                  <span className="shrink-0 text-xs text-white/40">
                    {(openIndex ?? 0) + 1} / {items.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="flat"
                    className="bg-white/10 text-white"
                    startContent={<Download className="h-4 w-4" />}
                    onPress={() => telecharger(doc.url, `${doc.label}.${extensionDepuisUrl(doc.url)}`)}
                  >
                    Télécharger
                  </Button>
                  <Tooltip content="Ouvrir dans un onglet" size="sm">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      className="text-white"
                      onPress={() => window.open(urlInline(doc.url), '_blank', 'noreferrer')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Fermer" size="sm">
                    <Button isIconOnly size="sm" variant="light" className="text-white" onPress={() => setOpenIndex(null)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </Tooltip>
                </div>
              </div>

              <ModalBody>
                <div className="relative flex min-h-[60vh] items-center justify-center">
                  {items.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => go(-1)}
                        className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25"
                        aria-label="Précédent"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() => go(1)}
                        className="absolute right-2 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25"
                        aria-label="Suivant"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}

                  {estPdf(doc.url) ? (
                    <iframe
                      src={urlInline(doc.url)}
                      title={doc.label}
                      className="h-[75vh] w-full rounded-lg bg-white"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.url}
                      alt={doc.label}
                      onClick={() => setZoom((z) => !z)}
                      className={`rounded-lg transition-transform duration-200 ${
                        zoom
                          ? 'max-h-none max-w-none cursor-zoom-out'
                          : 'max-h-[75vh] max-w-full cursor-zoom-in object-contain'
                      }`}
                    />
                  )}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}

/** Miniature image avec repli icône si le chargement échoue. */
function DocThumbnail({ url, label }: { url: string; label: string }) {
  const [erreur, setErreur] = useState(false);
  if (erreur) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-linear-to-br from-blue-50 to-indigo-50 text-indigo-400">
        <ImageIcon className="h-9 w-9" />
        <span className="px-2 text-center text-[10px] font-medium">Aperçu indisponible</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={label}
      loading="lazy"
      onError={() => setErreur(true)}
      className="h-full w-full object-cover"
    />
  );
}
