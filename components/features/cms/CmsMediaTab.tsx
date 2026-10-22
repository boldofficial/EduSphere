'use client';

import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  ImagePlus,
  Images,
  Loader2,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import type { WebsiteMediaItem } from '@/lib/types';
import {
  formatBytes,
  useDeleteWebsiteMedia,
  useReorderWebsiteMedia,
  useUpdateWebsiteMedia,
  useUploadWebsiteMedia,
  useWebsiteMedia,
} from '@/lib/hooks/use-website-media';
import { useToast } from '@/components/providers/toast-provider';
import { useConfirm } from '@/components/ui/confirm-dialog';

const ALL = 'All';
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

function MediaCard({
  item,
  albums,
  index,
  total,
  onMove,
}: {
  item: WebsiteMediaItem;
  albums: string[];
  index: number;
  total: number;
  onMove: (delta: number) => void;
}) {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const update = useUpdateWebsiteMedia();
  const remove = useDeleteWebsiteMedia();
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState({
    caption: item.caption,
    alt_text: item.alt_text,
    album: item.album,
  });

  const save = (field: keyof typeof draft) => {
    const value = draft[field].trim();
    if (value === item[field]) return;
    update.mutate(
      { id: item.id, changes: { [field]: value } },
      { onError: () => addToast('Could not save that change.', 'error') }
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      addToast('Copy failed. Select the link and copy it manually.', 'error');
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete this image?',
      description:
        'It is removed from the gallery and any section that links to it will show a broken image.',
      confirmLabel: 'Delete image',
      tone: 'danger',
    });
    if (!ok) return;
    remove.mutate(item.id, {
      onSuccess: () => addToast('Image deleted', 'success'),
      onError: () => addToast('Could not delete the image.', 'error'),
    });
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-card transition ${item.show_in_gallery ? 'border-gray-100' : 'border-dashed border-gray-300'}`}
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized thumbnail */}
        <img
          src={item.thumb_url}
          alt={item.alt_text}
          loading="lazy"
          className={`h-full w-full object-cover ${item.show_in_gallery ? '' : 'opacity-50'}`}
        />
        {!item.show_in_gallery && (
          <span className="absolute left-2 top-2 rounded-full bg-gray-900/80 px-2 py-0.5 text-xs font-semibold text-white">
            Not in gallery
          </span>
        )}
        <span className="absolute bottom-2 right-2 rounded-full bg-gray-900/70 px-2 py-0.5 text-xs text-white">
          {item.width}×{item.height}
        </span>
      </div>
      <div className="space-y-2 p-3">
        <input
          value={draft.caption}
          onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
          onBlur={() => save('caption')}
          maxLength={300}
          placeholder="Caption (shown in the gallery)"
          className="w-full rounded-control border border-gray-200 px-2.5 py-1.5 text-sm"
        />
        <input
          value={draft.alt_text}
          onChange={(e) => setDraft({ ...draft, alt_text: e.target.value })}
          onBlur={() => save('alt_text')}
          maxLength={200}
          placeholder="Describe the photo (for screen readers)"
          className="w-full rounded-control border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600"
        />
        <input
          value={draft.album}
          onChange={(e) => setDraft({ ...draft, album: e.target.value })}
          onBlur={() => save('album')}
          maxLength={80}
          list="media-albums"
          placeholder="Album (e.g. Sports Day 2026)"
          className="w-full rounded-control border border-gray-200 px-2.5 py-1.5 text-xs"
        />
        <datalist id="media-albums">
          {albums.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Move earlier"
              disabled={index === 0}
              onClick={() => onMove(-1)}
              className="rounded-control p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Move later"
              disabled={index === total - 1}
              onClick={() => onMove(1)}
              className="rounded-control p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            >
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              title={item.show_in_gallery ? 'Hide from gallery' : 'Show in gallery'}
              aria-label={item.show_in_gallery ? 'Hide from gallery' : 'Show in gallery'}
              onClick={() =>
                update.mutate({ id: item.id, changes: { show_in_gallery: !item.show_in_gallery } })
              }
              className="rounded-control p-1.5 text-gray-500 hover:bg-gray-100"
            >
              {item.show_in_gallery ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button
              type="button"
              title="Copy image link (for custom code)"
              aria-label="Copy image link"
              onClick={copyLink}
              className="rounded-control p-1.5 text-gray-500 hover:bg-gray-100"
            >
              {copied ? <Check size={16} className="text-success-600" /> : <Copy size={16} />}
            </button>
            <button
              type="button"
              aria-label="Delete image"
              onClick={handleDelete}
              disabled={remove.isPending}
              className="rounded-control p-1.5 text-gray-500 hover:bg-danger-50 hover:text-danger-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Website media library: upload photos once, use them in the gallery and in any section. */
export function CmsMediaTab() {
  const { addToast } = useToast();
  const { data, isLoading } = useWebsiteMedia();
  const upload = useUploadWebsiteMedia();
  const reorder = useReorderWebsiteMedia();
  const inputRef = useRef<HTMLInputElement>(null);
  const [album, setAlbum] = useState('');
  const [showInGallery, setShowInGallery] = useState(true);
  const [filter, setFilter] = useState(ALL);
  const [dragging, setDragging] = useState(false);

  const items = useMemo(() => data?.results ?? [], [data]);
  const albums = useMemo(
    () => Array.from(new Set(items.map((i) => i.album).filter(Boolean))).sort(),
    [items]
  );
  const visible = filter === ALL ? items : items.filter((i) => i.album === filter);
  const usage = data?.usage;
  const usedPct = usage?.quota_bytes
    ? Math.min(100, (usage.used_bytes / usage.quota_bytes) * 100)
    : 0;

  const send = (fileList: FileList | File[] | null) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    upload.mutate(
      { files: files.slice(0, 20), album: album.trim(), showInGallery },
      {
        onSuccess: (result) => {
          const n = result.results.length;
          if (n) addToast(`${n} image${n === 1 ? '' : 's'} uploaded`, 'success');
          result.errors.forEach((e) => addToast(`${e.file}: ${e.error}`, 'error'));
          if (files.length > 20) addToast('Only the first 20 images were uploaded.', 'warning');
        },
        onError: (error) => addToast((error as Error).message, 'error'),
      }
    );
    if (inputRef.current) inputRef.current.value = '';
  };

  // Moves within the full list, so reordering inside an album filter keeps the overall order sane.
  const move = (item: WebsiteMediaItem, delta: number) => {
    const ids = items.map((i) => i.id);
    const scope = visible.map((i) => i.id);
    const target = scope[scope.indexOf(item.id) + delta];
    if (target === undefined) return;
    const from = ids.indexOf(item.id);
    const to = ids.indexOf(target);
    [ids[from], ids[to]] = [ids[to], ids[from]];
    reorder.mutate(ids);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="mb-2 flex items-center gap-2 text-xl font-black text-gray-900">
          <Images className="text-brand-600" size={24} />
          Media & Gallery
        </h2>
        <p className="text-sm text-gray-500">
          Upload photos once and use them everywhere: they appear in your website&apos;s gallery,
          and each has a permanent link you can paste into any custom section. Photos are resized
          and compressed automatically, and location data is removed.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            send(e.dataTransfer.files);
          }}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition lg:col-span-2 ${dragging ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-gray-50'}`}
        >
          {upload.isPending ? (
            <Loader2 className="mb-3 animate-spin text-brand-600" size={36} />
          ) : (
            <UploadCloud className="mb-3 text-brand-600" size={36} />
          )}
          <p className="font-bold text-gray-900">
            {upload.isPending ? 'Uploading and optimising…' : 'Drag photos here'}
          </p>
          <p className="mb-4 text-sm text-gray-500">
            JPG, PNG, WebP or GIF · up to 15 MB each · 20 at a time
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => send(e.target.files)}
          />
          <button
            type="button"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <ImagePlus size={18} /> Choose photos
          </button>
        </div>

        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5">
          <label className="block space-y-1">
            <span className="text-sm font-bold text-gray-700">Add to album</span>
            <input
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              list="media-albums-upload"
              maxLength={80}
              placeholder="e.g. Graduation 2026 (optional)"
              className="w-full rounded-control border border-gray-200 px-3 py-2 text-sm"
            />
            <datalist id="media-albums-upload">
              {albums.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showInGallery}
              onChange={(e) => setShowInGallery(e.target.checked)}
              className="h-4 w-4 accent-brand-600"
            />
            Show new photos in the gallery
          </label>
          {usage && (
            <div>
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>Storage used</span>
                <span>
                  {formatBytes(usage.used_bytes)} of {formatBytes(usage.quota_bytes)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${usedPct > 90 ? 'bg-danger-500' : 'bg-brand-600'}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Show or hide the gallery on your homepage in <strong>Page Sections &amp; Code</strong>.
          </p>
        </div>
      </div>

      {albums.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[ALL, ...albums].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setFilter(name)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === name ? 'bg-brand-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              {name}
              {name !== ALL && ` (${items.filter((i) => i.album === name).length})`}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-600" size={32} />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
          <Images className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="font-bold text-gray-900">No photos yet</p>
          <p className="text-sm text-gray-500">
            Schools with 6 or more good photos look far more welcoming to parents.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((item, index) => (
            <MediaCard
              key={`${item.id}-${item.caption}-${item.alt_text}-${item.album}`}
              item={item}
              albums={albums}
              index={index}
              total={visible.length}
              onMove={(delta) => move(item, delta)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Small picker used by the section code editor to insert library images. */
export function MediaPickerGrid({ onPick }: { onPick: (item: WebsiteMediaItem) => void }) {
  const { data, isLoading } = useWebsiteMedia();
  const items = data?.results ?? [];
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }
  if (!items.length) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        No images yet. Upload some in <strong>Media &amp; Gallery</strong> first.
      </p>
    );
  }
  return (
    <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onPick(item)}
          className="group overflow-hidden rounded-xl border border-gray-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized thumbnail */}
          <img
            src={item.thumb_url}
            alt={item.alt_text}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition group-hover:scale-105"
          />
          <span className="block truncate px-2 py-1 text-xs text-gray-600">
            {item.caption || item.alt_text || 'Untitled'}
          </span>
        </button>
      ))}
    </div>
  );
}
