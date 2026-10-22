import Image from 'next/image';
import React from 'react';
import { Settings } from '@/lib/types';
import * as Utils from '@/lib/utils';

interface AboutSectionProps {
  settings: Settings;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ settings }) => {
  const title = settings.landing_about_title || 'A tradition of excellence';
  const primaryImage = Utils.getMediaUrl(
    settings.landing_about_primary_image || '/fruitful1.jpg.jpg'
  );
  const secondaryImage = Utils.getMediaUrl(
    settings.landing_about_secondary_image || '/fruitfulnew.jpg'
  );
  const imagesFirst = settings.landing_about_image_position !== 'right';

  return (
    <section id="about" className="relative overflow-hidden bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className={`relative pb-10 ${imagesFirst ? 'lg:order-1' : 'lg:order-2'}`}>
            <div className="absolute -left-5 -top-5 h-full w-full rounded-[2rem] bg-brand-50" />
            <div className="relative overflow-hidden rounded-[2rem] shadow-2xl">
              <Image
                src={primaryImage}
                alt={title}
                width={800}
                height={560}
                className="h-[25rem] w-full object-cover"
                unoptimized
              />
            </div>
            {secondaryImage && (
              <div className="absolute -bottom-1 right-3 w-2/5 overflow-hidden rounded-2xl border-4 border-white shadow-xl sm:right-8">
                <Image
                  src={secondaryImage}
                  alt={`${title} — additional view`}
                  width={400}
                  height={260}
                  className="h-36 w-full object-cover sm:h-44"
                  unoptimized
                />
              </div>
            )}
          </div>

          <div className={imagesFirst ? 'lg:order-2' : 'lg:order-1'}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-bold uppercase tracking-wider text-brand-700">
              <span className="h-2 w-2 rounded-full bg-brand-600" />
              {settings.landing_about_eyebrow || 'Who we are'}
            </div>
            <h2 className="mb-6 text-4xl font-black leading-tight text-gray-950 sm:text-5xl">
              {title}
            </h2>
            {settings.landing_about_html ? (
              <div
                className="space-y-4 text-lg leading-8 text-gray-600 [&_a]:font-bold [&_a]:text-brand-700 [&_blockquote]:border-l-4 [&_blockquote]:border-brand-300 [&_blockquote]:pl-5 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-gray-900 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-gray-900 [&_li]:ml-5 [&_ol]:list-decimal [&_strong]:text-gray-900 [&_ul]:list-disc"
                dangerouslySetInnerHTML={{ __html: settings.landing_about_html }}
              />
            ) : (
              <p className="text-lg leading-8 text-gray-600">{settings.landing_about_text}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
