'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Send, Eye, Trash2 } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { useCreateBlogPost, useUpdateBlogPost, useAdminBlogPost } from '@/lib/hooks/use-blog';
import { useToast } from '@/components/providers/toast-provider';

interface BlogEditorProps {
  postId?: number | null;
}

export function BlogEditor({ postId }: BlogEditorProps) {
  const router = useRouter();
  const { addToast } = useToast();

  const { data: existingPost, isLoading: loadingPost } = useAdminBlogPost(postId ?? null);
  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [authorName, setAuthorName] = useState('EduSphere Team');
  const [contentHtml, setContentHtml] = useState('');
  const [contentJson, setContentJson] = useState<Record<string, unknown>>({});
  const [featuredImage, setFeaturedImage] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setExcerpt(existingPost.excerpt);
      setAuthorName(existingPost.author_name);
      setContentHtml(existingPost.content_html);
      setContentJson(existingPost.content_json);
      setFeaturedImage(existingPost.featured_image || '');
      setSeoTitle(existingPost.seo_title);
      setSeoDescription(existingPost.seo_description);
    }
  }, [existingPost]);

  const handleContentChange = (html: string, json: Record<string, unknown>) => {
    setContentHtml(html);
    setContentJson(json);
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      addToast('Title is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        excerpt,
        author_name: authorName,
        content_html: contentHtml,
        content_json: contentJson,
        featured_image: featuredImage || null,
        seo_title: seoTitle,
        seo_description: seoDescription,
        status,
      };

      if (postId) {
        await updateMutation.mutateAsync({ id: postId, ...payload });
        addToast(status === 'published' ? 'Post published!' : 'Draft saved!', 'success');
      } else {
        await createMutation.mutateAsync(payload);
        addToast('Post created!', 'success');
      }
      router.push('/dashboard/super-admin/blog');
    } catch {
      addToast('Failed to save post', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (postId && loadingPost) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/super-admin/blog')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {postId ? 'Edit Post' : 'New Post'}
            </h1>
            <p className="text-sm text-gray-500">
              {postId ? 'Update your blog post' : 'Create a new blog post'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={16} />
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave('published')}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={16} />
            {postId ? 'Update & Publish' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title..."
        className="w-full text-3xl font-black text-gray-900 bg-transparent border-none outline-none placeholder-gray-300"
      />

      {/* Featured Image URL */}
      <input
        type="text"
        value={featuredImage}
        onChange={(e) => setFeaturedImage(e.target.value)}
        placeholder="Featured image URL (optional) — paste an image link..."
        className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-2xl px-4 py-3 text-sm outline-none transition-all placeholder-gray-400"
      />

      {/* Rich Text Editor */}
      <RichTextEditor
        content={contentHtml}
        onChange={handleContentChange}
        placeholder="Start writing your blog post... You can paste HTML, Markdown, or plain text — it will be styled automatically."
      />

      {/* Excerpt */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
          Excerpt (shown in blog cards)
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Brief summary of your post..."
          rows={2}
          className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-2xl px-4 py-3 text-sm outline-none transition-all placeholder-gray-400 resize-none"
        />
      </div>

      {/* Author */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
            Author Name
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-2xl px-4 py-3 text-sm outline-none transition-all"
          />
        </div>
      </div>

      {/* SEO Section */}
      <details className="bg-gray-50 rounded-2xl p-4">
        <summary className="text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer">
          SEO Settings
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
              SEO Title
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Leave blank to use post title"
              className="w-full bg-white border-2 border-transparent focus:border-brand-500 rounded-2xl px-4 py-3 text-sm outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
              SEO Description
            </label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Leave blank to use excerpt"
              rows={2}
              className="w-full bg-white border-2 border-transparent focus:border-brand-500 rounded-2xl px-4 py-3 text-sm outline-none transition-all resize-none"
            />
          </div>
        </div>
      </details>

      {/* Delete (only for existing posts) */}
      {postId && (
        <div className="pt-6 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl border border-red-200 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            onClick={() => {
              if (confirm('Delete this post?')) {
                // handled by parent page
              }
            }}
          >
            <Trash2 size={16} />
            Delete Post
          </button>
        </div>
      )}
    </div>
  );
}
