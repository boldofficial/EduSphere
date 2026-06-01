'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit3,
  Globe,
  EyeOff,
  Trash2,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';
import {
  useAdminBlogPosts,
  useDeleteBlogPost,
  usePublishBlogPost,
  useCategories,
} from '@/lib/hooks/use-blog';
import { useToast } from '@/components/providers/toast-provider';

export default function SuperAdminBlogPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminBlogPosts({ page });
  const { data: categories = [] } = useCategories();
  const deleteMutation = useDeleteBlogPost();
  const publishMutation = usePublishBlogPost();

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Post deleted', 'success');
    } catch {
      addToast('Failed to delete post', 'error');
    }
  };

  const handleTogglePublish = async (id: number) => {
    try {
      const result = await publishMutation.mutateAsync(id);
      addToast(
        result.status === 'published' ? 'Post published!' : 'Post moved to draft.',
        'success'
      );
    } catch {
      addToast('Failed to toggle publish status', 'error');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Blog Management</h1>
          <p className="text-gray-500 mt-1 font-medium">Create and manage platform blog posts.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/dashboard/super-admin/blog/new')}
          className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          New Post
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-6 h-20 animate-pulse"
            />
          ))}
        </div>
      ) : data?.results?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Edit3 size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-2">No blog posts yet</h2>
          <p className="text-gray-500 mb-6">
            Create your first blog post to share with the platform.
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard/super-admin/blog/new')}
            className="px-6 py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors"
          >
            Create First Post
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.results?.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden">
                {post.featured_image ? (
                  <img src={post.featured_image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={20} className="text-gray-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{post.title}</h3>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                      post.status === 'published'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {post.status}
                  </span>
                  {post.category_name && (
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                      {post.category_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(post.published_at || post.created_at)}
                  </span>
                  <span>{post.author_name}</span>
                  {post.tags_list?.length > 0 && (
                    <span className="flex gap-1">
                      {post.tags_list.map((tag) => (
                        <span
                          key={tag.id}
                          className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/super-admin/blog/${post.id}`)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Edit"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePublish(post.id)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                >
                  {post.status === 'published' ? <EyeOff size={16} /> : <Globe size={16} />}
                </button>
                {post.status === 'published' && post.slug && (
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-brand-600 transition-colors"
                    title="View live"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(post.id, post.title)}
                  className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
