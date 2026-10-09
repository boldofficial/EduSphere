import { notFound } from 'next/navigation';
import { DesignSystemGallery } from './gallery';

export const metadata = { title: 'Design system', robots: { index: false } };

/** Internal review page for the shared UI components. Not available in production. */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DESIGN_SYSTEM_PAGE !== 'true') {
    notFound();
  }
  return <DesignSystemGallery />;
}
