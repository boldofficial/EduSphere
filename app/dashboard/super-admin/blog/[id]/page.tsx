'use client';

import { useParams } from 'next/navigation';
import { BlogEditor } from '@/components/features/blog/BlogEditor';

export default function EditBlogPostPage() {
  const params = useParams();
  const id = params?.id ? Number(params.id) : null;

  return (
    <div className="min-h-screen bg-white p-8">
      <BlogEditor postId={id} />
    </div>
  );
}
