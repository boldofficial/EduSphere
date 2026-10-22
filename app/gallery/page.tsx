import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicSite, getRequestTenant } from '@/lib/public-site';
import { SchoolGalleryPage } from '@/components/features/landing-tenant/SchoolGalleryPage';

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getRequestTenant();
  const site = tenant ? await getPublicSite(tenant) : null;
  return {
    title: 'Photo gallery',
    description: site
      ? `Photos from ${site.school_name}: classrooms, events and activities.`
      : undefined,
  };
}

/** The school's full photo gallery. Only exists on school websites. */
export default async function GalleryPage() {
  const tenant = await getRequestTenant();
  if (!tenant) notFound();
  const site = await getPublicSite(tenant);
  if (!site) notFound();
  return <SchoolGalleryPage initialSettings={site} />;
}
