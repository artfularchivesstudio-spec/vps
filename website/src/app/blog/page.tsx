import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts } from '@/lib/api/supabase';
import { BlogPost } from '@/types/blog';

interface BlogPageProps {
  searchParams: {
    category?: string;
    tag?: string;
  };
}

async function getPosts(category?: string, tag?: string) {
  const allPosts = await getAllPosts();

  if (category) {
    return allPosts.filter(post =>
      post.categories?.some(c => c.slug === category)
    );
  }

  if (tag) {
    return allPosts.filter(post => post.tags?.some(t => t.slug === tag));
  }

  return allPosts;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const posts = await getPosts(searchParams.category, searchParams.tag);

  return (
    <div className="bg-gray-100 min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">The Artful Archives Blog</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(post => (
            <Link href={`/blog/${post.slug}`} key={post.id}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-transform hover:scale-105">
                {post.featured_image_url && (
                  <div className="relative h-48">
                    <Image
                      src={post.featured_image_url}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                  <p className="text-gray-600 mb-4">{post.excerpt}</p>
                  <div className="text-sm text-gray-500">
                    <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
