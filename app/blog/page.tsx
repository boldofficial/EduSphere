'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowRight, Tag, ImageIcon } from 'lucide-react';
import { LandingNav } from '@/components/features/landing/LandingNav';
import { LandingFooter } from '@/components/features/landing/LandingContactFooter';
import { useBlogPosts } from '@/lib/hooks/use-blog';

export default function BlogPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useBlogPosts({ page });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-primary pt-20">
      <LandingNav mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <main className="flex-grow pt-10 lg:pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-brand-600 font-black uppercase tracking-widest text-sm bg-brand-50 px-4 py-2 rounded-full mb-4 inline-block">
              EduSphere Blog
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Insights & Updates
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              The latest news, tips, and trends from the EduSphere team and education experts.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100"
                >
                  <div className="h-60 bg-gray-100 animate-pulse" />
                  <div className="p-8 space-y-4">
                    <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
                    <div className="h-6 bg-gray-100 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.results?.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-gray-500 mb-2">No posts yet</h2>
              <p className="text-gray-400">Check back soon for new articles!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data?.results?.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-gray-100 flex flex-col"
                >
                  {/* Featured Image */}
                  <div className="h-60 overflow-hidden relative bg-gray-50">
                    {post.featured_image ? (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={48} className="text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Content */}
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(post.published_at || post.created_at).toLocaleDateString(
                          'en-GB',
                          {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {post.author_name}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-brand-600 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-500 leading-relaxed mb-6 line-clamp-3 flex-1">
                      {post.excerpt || 'Click to read more...'}
                    </p>
                    <div className="pt-6 border-t border-gray-50">
                      <span className="flex items-center gap-2 text-brand-600 font-bold group-hover:gap-3 transition-all">
                        Read Article <ArrowRight size={18} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-gray-500">
                Page {data.current_page} of {data.total_pages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
