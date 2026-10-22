'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GalleryImage } from '@/lib/types';

interface GalleryProps {
  images: GalleryImage[];
  /** Homepage shows a preview; the /gallery page shows everything. */
  variant?: 'section' | 'page';
  brandColor?: string;
}

const PREVIEW_COUNT = 8;
const ALL = 'All photos';
// Few photos fill the row instead of leaving empty columns.
const PREVIEW_GRID: Record<number, string> = {
  1: 'mx-auto max-w-3xl grid-cols-1',
  2: 'mx-auto max-w-5xl grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
};
const PAGE_COLUMNS: Record<number, string> = {
  1: 'mx-auto max-w-3xl columns-1',
  2: 'mx-auto max-w-5xl columns-1 sm:columns-2',
  3: 'columns-1 sm:columns-2 md:columns-3',
  4: 'columns-2 md:columns-3 lg:columns-4',
};

function Lightbox({
  images,
  index,
  onClose,
  onMove,
}: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onMove: (delta: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);
  const image = images[index];

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onMove(1);
      if (event.key === 'ArrowLeft') onMove(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose, onMove]);

  if (!image) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.caption || image.alt}
      className="fixed inset-0 z-[100] flex flex-col bg-gray-950/95 text-white"
      onClick={onClose}
      onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 50) onMove(dx < 0 ? 1 : -1);
        touchStart.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-sm text-white/70">
        <span>
          {index + 1} / {images.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="rounded-full p-2 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X size={24} />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-4 sm:px-16">
        {images.length > 1 && (
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation();
              onMove(-1);
            }}
            className="absolute left-2 hidden rounded-full bg-white/10 p-3 hover:bg-white/20 sm:block"
          >
            <ChevronLeft size={28} />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- full-size original, already optimised on upload */}
        <img
          src={image.url}
          alt={image.alt}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[78vh] max-w-full rounded-lg object-contain shadow-2xl"
        />
        {images.length > 1 && (
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation();
              onMove(1);
            }}
            className="absolute right-2 hidden rounded-full bg-white/10 p-3 hover:bg-white/20 sm:block"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>
      {(image.caption || image.album) && (
        <div className="px-4 pb-6 text-center" onClick={(e) => e.stopPropagation()}>
          {image.caption && <p className="text-base font-medium">{image.caption}</p>}
          {image.album && <p className="mt-1 text-sm text-white/60">{image.album}</p>}
        </div>
      )}
    </div>
  );
}

/** The school's photo gallery: album filter, responsive grid and a swipeable full-screen viewer. */
export function GallerySection({
  images,
  variant = 'section',
  brandColor = '#1A3A5C',
}: GalleryProps) {
  const [album, setAlbum] = useState(ALL);
  const [open, setOpen] = useState<number | null>(null);

  const albums = useMemo(
    () => [ALL, ...Array.from(new Set(images.map((i) => i.album).filter(Boolean)))],
    [images]
  );
  const filtered = useMemo(
    () => (album === ALL ? images : images.filter((i) => i.album === album)),
    [images, album]
  );
  const isPreview = variant === 'section';
  const shown = isPreview ? filtered.slice(0, PREVIEW_COUNT) : filtered;

  const move = useCallback(
    (delta: number) =>
      setOpen((current) =>
        current === null ? null : (current + delta + filtered.length) % filtered.length
      ),
    [filtered.length]
  );
  const close = useCallback(() => setOpen(null), []);

  if (images.length === 0) return null;

  return (
    <section
      id={isPreview ? 'gallery' : undefined}
      className={`scroll-mt-20 bg-white ${isPreview ? 'py-20 sm:py-24' : 'pb-20 pt-32 sm:pt-36'}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p
            className="mb-3 text-sm font-bold uppercase tracking-[0.2em]"
            style={{ color: brandColor }}
          >
            {isPreview ? 'Gallery' : 'Photo gallery'}
          </p>
          {isPreview ? (
            <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
              Life at our school
            </h2>
          ) : (
            <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
              Life at our school
            </h1>
          )}
          <p className="mt-4 text-gray-600">Moments from our classrooms, events and activities.</p>
        </div>

        {albums.length > 2 && (
          <div
            className="mb-8 flex flex-wrap justify-center gap-2"
            role="tablist"
            aria-label="Albums"
          >
            {albums.map((name) => {
              const active = name === album;
              return (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setAlbum(name)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                    active ? 'text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'
                  }`}
                  style={
                    active ? { backgroundColor: brandColor, borderColor: brandColor } : undefined
                  }
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}

        <div
          className={
            isPreview
              ? `grid gap-3 sm:gap-4 ${PREVIEW_GRID[Math.min(shown.length, 4)]}`
              : `gap-3 sm:gap-4 ${PAGE_COLUMNS[Math.min(shown.length, 4)]}`
          }
        >
          {shown.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setOpen(index)}
              aria-label={`View photo: ${image.caption || image.alt}`}
              className={`group relative block w-full overflow-hidden rounded-2xl bg-gray-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${
                isPreview ? 'aspect-[4/3]' : 'mb-3 break-inside-avoid sm:mb-4'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- thumbnails are pre-sized on upload */}
              <img
                src={image.thumb_url}
                alt={image.alt}
                loading="lazy"
                decoding="async"
                width={image.width || undefined}
                height={image.height || undefined}
                className={`w-full transition duration-500 group-hover:scale-105 ${
                  isPreview ? 'h-full object-cover' : 'h-auto'
                }`}
              />
              {image.caption && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-sm font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  {image.caption}
                </span>
              )}
            </button>
          ))}
        </div>

        {isPreview && filtered.length > PREVIEW_COUNT && (
          <div className="mt-10 text-center">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
              style={{ backgroundColor: brandColor }}
            >
              View full gallery ({filtered.length} photos) <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {open !== null && (
        <Lightbox
          images={isPreview ? filtered : shown}
          index={open}
          onClose={close}
          onMove={move}
        />
      )}
    </section>
  );
}
