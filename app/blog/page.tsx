'use client';

import React from 'react';
import { Calendar, User, ArrowRight, Tag } from 'lucide-react';
import SiteHeader from '@/components/features/SiteHeader';
import SiteFooter from '@/components/features/SiteFooter';
import * as Utils from '@/lib/utils';

export default function BlogPage() {
    const posts = [
        {
            id: 1,
            title: "The Future of Digital Education in Africa",
            excerpt: "How technology is bridging the gap and providing world-class learning opportunities for students across the continent.",
            date: "Oct 24, 2025",
            author: "Dr. Adebayo",
            category: "EdTech",
            image: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 2,
            title: "5 Tips for Efficient School Management",
            excerpt: "Learn how to streamline your administrative tasks and focus more on what matters: student success.",
            date: "Nov 12, 2025",
            author: "Sarah Johnson",
            category: "Management",
            image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: 3,
            title: "Why Parent Engagement Matters",
            excerpt: "Research shows that active parent involvement significantly improves student performance. Here is how to foster it.",
            date: "Dec 05, 2025",
            author: "James Okon",
            category: "Community",
            image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-primary">
            <SiteHeader settings={Utils.INITIAL_SETTINGS} />

            <main className="flex-grow pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-brand-600 font-black uppercase tracking-widest text-sm bg-brand-50 px-4 py-2 rounded-full mb-4 inline-block">
                            School Success Blog
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Insights & Updates</h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                            The latest news, tips, and trends from the Registra team and education experts.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <article key={post.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-gray-100 flex flex-col">
                                <div className="h-60 overflow-hidden relative">
                                    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1 shadow-sm">
                                        <Tag size={12} /> {post.category}
                                    </div>
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                                        <span className="flex items-center gap-1"><User size={12} /> {post.author}</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-brand-600 transition-colors line-clamp-2">
                                        {post.title}
                                    </h2>
                                    <p className="text-gray-500 leading-relaxed mb-6 line-clamp-3">
                                        {post.excerpt}
                                    </p>
                                    <div className="mt-auto pt-6 border-t border-gray-50">
                                        <a href="#" className="flex items-center gap-2 text-brand-600 font-bold hover:gap-3 transition-all">
                                            Read Article <ArrowRight size={18} />
                                        </a>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="mt-16 text-center">
                        <button className="px-8 py-4 bg-white border border-gray-200 text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-colors shadow-sm">
                            Load More Articles
                        </button>
                    </div>
                </div>
            </main>

            <SiteFooter settings={Utils.INITIAL_SETTINGS} />
        </div>
    );
}
