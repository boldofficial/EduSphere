import { MessageCircle } from 'lucide-react';
import type { Settings } from '@/lib/types';

/** Floating "Chat with us" button, shown when the school adds a WhatsApp number. */
export function WhatsAppButton({
  settings,
}: {
  settings: Pick<Settings, 'landing_social' | 'school_name'>;
}) {
  const number = (settings.landing_social?.whatsapp || '').replace(/[^0-9]/g, '');
  if (!number) return null;
  const text = encodeURIComponent(
    `Hello ${settings.school_name || ''}, I would like to make an enquiry.`
  );
  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
    >
      <MessageCircle size={20} aria-hidden="true" />
      <span className="hidden sm:inline">Chat with us</span>
    </a>
  );
}
