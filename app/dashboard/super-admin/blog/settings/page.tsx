'use client';

import React, { useState } from 'react';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
} from '@/lib/hooks/use-blog';
import { Pencil, Trash2, X, Check, Plus, Tag, BookOpen, AlertTriangle } from 'lucide-react';

export default function BlogSettingsPage() {
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const { data: tags = [], isLoading: tagLoading } = useTags();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [editingCat, setEditingCat] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingTag, setEditingTag] = useState<number | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'category' | 'tag';
    id: number;
    name: string;
  } | null>(null);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await createCategory.mutateAsync({ name: newCatName.trim(), description: newCatDesc.trim() });
      setNewCatName('');
      setNewCatDesc('');
    } catch {}
  };

  const handleUpdateCategory = async (id: number) => {
    if (!editingCatName.trim()) return;
    try {
      await updateCategory.mutateAsync({ id, name: editingCatName.trim() });
      setEditingCat(null);
    } catch {}
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      await createTag.mutateAsync({ name: newTagName.trim() });
      setNewTagName('');
    } catch {}
  };

  const handleUpdateTag = async (id: number) => {
    if (!editingTagName.trim()) return;
    try {
      await updateTag.mutateAsync({ id, name: editingTagName.trim() });
      setEditingTag(null);
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'category') {
        await deleteCategory.mutateAsync(deleteConfirm.id);
      } else {
        await deleteTag.mutateAsync(deleteConfirm.id);
      }
      setDeleteConfirm(null);
    } catch {}
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900">Blog Settings</h1>
        <p className="text-gray-500 mt-2">Manage categories and tags used across all blog posts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories Section */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center">
              <BookOpen size={20} className="text-brand-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Categories</h2>
              <p className="text-sm text-gray-400">{categories.length} total</p>
            </div>
          </div>

          {/* Add new category */}
          <div className="space-y-3 mb-8 p-5 bg-gray-50 rounded-2xl">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Name *
              </label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. School Management"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Description
              </label>
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Optional description..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={!newCatName.trim() || createCategory.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              {createCategory.isPending ? 'Adding...' : 'Add Category'}
            </button>
          </div>

          {/* Category list */}
          {catLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 font-medium">No categories yet.</p>
              <p className="text-sm text-gray-300">Create your first category above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
                >
                  {editingCat === cat.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-brand-600 bg-white text-sm font-medium focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateCategory(cat.id);
                          if (e.key === 'Escape') setEditingCat(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateCategory(cat.id)}
                        className="p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCat(null)}
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                          <BookOpen size={14} className="text-brand-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{cat.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              {cat.post_count} posts
                            </span>
                            {cat.description && (
                              <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                                {cat.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCat(cat.id);
                            setEditingCatName(cat.name);
                          }}
                          className="p-2 rounded-xl text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirm({ type: 'category', id: cat.id, name: cat.name })
                          }
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Tag size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Tags</h2>
              <p className="text-sm text-gray-400">{tags.length} total</p>
            </div>
          </div>

          {/* Add new tag */}
          <div className="mb-8 p-5 bg-gray-50 rounded-2xl">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Name *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g. edtech"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
              />
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || createTag.isPending}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                {createTag.isPending ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>

          {/* Tag list */}
          {tagLoading ? (
            <div className="flex flex-wrap gap-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-8 w-20 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 font-medium">No tags yet.</p>
              <p className="text-sm text-gray-300">Create your first tag above.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold border border-indigo-100 hover:border-indigo-200 transition-all"
                >
                  {editingTag === tag.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingTagName}
                        onChange={(e) => setEditingTagName(e.target.value)}
                        className="w-24 px-2 py-0.5 rounded-lg border border-indigo-600 bg-white text-xs font-medium focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateTag(tag.id);
                          if (e.key === 'Escape') setEditingTag(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateTag(tag.id)}
                        className="p-0.5 rounded text-indigo-600 hover:text-indigo-800"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTag(null)}
                        className="p-0.5 rounded text-gray-400 hover:text-gray-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Tag size={12} />
                      <span>{tag.name}</span>
                      <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTag(tag.id);
                            setEditingTagName(tag.name);
                          }}
                          className="p-0.5 rounded text-indigo-400 hover:text-indigo-600 transition-colors"
                        >
                          <Pencil size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirm({ type: 'tag', id: tag.id, name: tag.name })
                          }
                          className="p-0.5 rounded text-indigo-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={28} className="text-red-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 text-center mb-2">
              Delete {deleteConfirm.type === 'category' ? 'Category' : 'Tag'}
            </h3>
            <p className="text-gray-500 text-center mb-2">
              Are you sure you want to delete{' '}
              <strong className="text-gray-900">&ldquo;{deleteConfirm.name}&rdquo;</strong>?
            </p>
            {deleteConfirm.type === 'category' && (
              <p className="text-xs text-gray-400 text-center mb-6">
                Posts in this category will be uncategorized but not deleted.
              </p>
            )}
            {deleteConfirm.type === 'tag' && (
              <p className="text-xs text-gray-400 text-center mb-6">
                This tag will be removed from all posts that use it.
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteCategory.isPending || deleteTag.isPending}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteCategory.isPending || deleteTag.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
