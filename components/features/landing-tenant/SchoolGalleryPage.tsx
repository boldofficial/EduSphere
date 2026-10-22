'use client';

import type { Settings } from '@/lib/types';
import { usePublicSettings } from '@/lib/hooks/use-data';
import SiteHeader from '../SiteHeader';
import SiteFooter from '../SiteFooter';
import { GallerySection } from './GallerySection';

export function SchoolGalleryPage({ initialSettings }: { initialSettings: Settings }) {
  const { data: settings = initialSettings } = usePublicSettings(initialSettings);
  const images = settings.gallery || [];

  return (
    <div className="min-h-screen bg-white font-sans">
      <SiteHeader settings={settings} solid />
      <main>
        {images.length > 0 ? (
          <GallerySection
            images={images}
            variant="page"
            brandColor={settings.landing_primary_color || undefined}
          />
        ) : (
          <section className="px-4 pb-24 pt-40 text-center">
            <h1 className="text-3xl font-black text-gray-900">Photo gallery</h1>
            <p className="mt-3 text-gray-600">Photos will appear here soon.</p>
          </section>
        )}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
