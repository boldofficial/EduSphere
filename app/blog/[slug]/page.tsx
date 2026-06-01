'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Clock, ArrowRight } from 'lucide-react';
import { LandingNav } from '@/components/features/landing/LandingNav';
import { LandingFooter } from '@/components/features/landing/LandingContactFooter';
import { useBlogPost, useBlogPosts } from '@/lib/hooks/use-blog';

export default function SingleBlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: post, isLoading } = useBlogPost(slug);
  const { data: related } = useBlogPosts({ page: 1 });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-primary pt-20">
        <LandingNav mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <main className="flex-grow max-w-3xl mx-auto px-4 py-16 w-full">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-64 bg-gray-100 rounded-2xl" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
              <div className="h-4 bg-gray-100 rounded w-4/6" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
            </div>
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-primary pt-20">
        <LandingNav mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-4xl font-black text-gray-900 mb-4">Post not found</h1>
            <p className="text-gray-500 mb-8">
              The article you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Blog
            </Link>
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  const relatedPosts = related?.results?.filter((p) => p.slug !== slug).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-white flex flex-col font-primary pt-20">
      <LandingNav mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <main className="flex-grow">
        <article className="max-w-3xl mx-auto px-4 py-16">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-600 transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-10">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <User size={16} />
                {post.author_name}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={16} />
                {new Date(post.published_at || post.created_at).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="mb-10 rounded-3xl overflow-hidden">
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-auto object-cover max-h-[500px]"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-black prose-p:text-gray-700 prose-a:text-brand-600 prose-a:font-bold prose-strong:text-gray-900 prose-code:text-brand-600 prose-pre:bg-gray-900 prose-pre:text-white prose-img:rounded-2xl prose-blockquote:border-brand-600 prose-blockquote:text-gray-700"
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />

          {/* Author Bio */}
          <div className="mt-16 p-8 bg-gray-50 rounded-3xl border border-gray-100">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
              About the Author
            </p>
            <p className="font-bold text-gray-900">{post.author_name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {post.author_name} is a contributor to the EduSphere blog, sharing insights about
              education technology and school management.
            </p>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-16">
              <h2 className="text-2xl font-black text-gray-900 mb-10">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map((rp) => (
                  <Link
                    key={rp.id}
                    href={`/blog/${rp.slug}`}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
                  >
                    {rp.featured_image && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={rp.featured_image}
                          alt={rp.title}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors mb-2 line-clamp-2">
                        {rp.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{rp.excerpt}</p>
                      <span className="flex items-center gap-1 text-sm font-bold text-brand-600 group-hover:gap-2 transition-all">
                        Read <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}
