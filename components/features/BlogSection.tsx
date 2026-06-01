'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, User, BookOpen, ImageIcon } from 'lucide-react';
import { useLatestBlogPosts } from '@/lib/hooks/use-blog';

export function BlogSection() {
  const { data, isLoading } = useLatestBlogPosts();

  if (!isLoading && (!data?.results || data.results.length === 0)) {
    return null;
  }

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100 text-brand-700 text-sm font-bold mb-6">
            <BookOpen size={16} />
            Latest from Our Blog
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Insights & Ideas</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tips, trends, and best practices for modern school management.
          </p>
        </motion.div>

        {/* Blog Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-3xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-100" />
                <div className="p-6 space-y-3">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-5 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {data?.results?.slice(0, 4).map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all h-full flex flex-col"
                >
                  {/* Image */}
                  <div className="h-48 overflow-hidden relative bg-gray-50">
                    {post.featured_image ? (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={36} className="text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
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
                        <User size={11} />
                        {post.author_name}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 flex-1 mb-4">
                      {post.excerpt || 'Click to read more...'}
                    </p>
                    <span className="flex items-center gap-1 text-sm font-bold text-brand-600 group-hover:gap-2 transition-all mt-auto">
                      Read Article <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/25"
          >
            View All Articles <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
