import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content_json: Record<string, unknown>;
  content_html: string;
  excerpt: string;
  featured_image: string | null;
  author_name: string;
  status: 'draft' | 'published';
  published_at: string | null;
  seo_title: string;
  seo_description: string;
  created_at: string;
  updated_at: string;
}

export interface BlogListResponse {
  count: number;
  results: BlogPost[];
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
}

/** Public: fetch published blog posts (paginated) */
export function useBlogPosts(params?: { page?: number }) {
  return useQuery<BlogListResponse>({
    queryKey: ['blog', 'list', params],
    queryFn: () => apiClient.get('blog/', { params }).then((r) => r.data),
  });
}

/** Public: fetch a single published blog post by slug */
export function useBlogPost(slug: string) {
  return useQuery<BlogPost>({
    queryKey: ['blog', slug],
    queryFn: () => apiClient.get(`blog/${slug}/`).then((r) => r.data),
    enabled: !!slug,
  });
}

/** Public: fetch latest 4 blog posts for homepage */
export function useLatestBlogPosts() {
  return useQuery<BlogListResponse>({
    queryKey: ['blog', 'latest'],
    queryFn: () => apiClient.get('blog/', { params: { page_size: 4 } }).then((r) => r.data),
  });
}

/** Admin: fetch all blog posts (including drafts) */
export function useAdminBlogPosts(params?: { page?: number }) {
  return useQuery<BlogListResponse>({
    queryKey: ['blog', 'admin', 'list', params],
    queryFn: () => apiClient.get('blog/admin/all/', { params }).then((r) => r.data),
  });
}

/** Admin: fetch a single blog post (any status) */
export function useAdminBlogPost(id: number | null) {
  return useQuery<BlogPost>({
    queryKey: ['blog', 'admin', id],
    queryFn: () => apiClient.get(`blog/admin/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

/** Admin: create a new blog post */
export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BlogPost>) =>
      apiClient.post('blog/admin/all/', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog', 'admin', 'list'] });
      qc.invalidateQueries({ queryKey: ['blog', 'list'] });
    },
  });
}

/** Admin: update a blog post */
export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<BlogPost> & { id: number }) =>
      apiClient.put(`blog/admin/${id}/`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog', 'admin'] });
      qc.invalidateQueries({ queryKey: ['blog', 'list'] });
    },
  });
}

/** Admin: delete a blog post */
export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`blog/admin/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog', 'admin', 'list'] });
    },
  });
}

/** Admin: toggle publish/draft status */
export function usePublishBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.post(`blog/admin/${id}/publish/`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog', 'admin'] });
      qc.invalidateQueries({ queryKey: ['blog', 'list'] });
    },
  });
}
