// src/app/blog/category/[category]/page.tsx
import Link from 'next/link';
import { blogPosts } from '@/mocks/blogPosts';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Blog Category | Artful Archives Studio',
  description: 'Explore our blog posts by category.',
};

export default function CategoryPage({ params }: { params: { category: string } }) {
  const category = params.category;
  
  // Handle undefined or empty category
  if (!category) {
    notFound();
  }

  // Filter posts by category with proper null checking
  const posts = blogPosts.filter(post => 
    post.categories && 
    post.categories.some(cat => cat.name.toLowerCase() === category.toLowerCase())
  );

  // If no posts found for this category, show 404
  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Category: {category}</h1>
      
      <div className="mb-8">
        <Link href="/blog" className="text-blue-500 hover:underline">← Back to all categories</Link>
      </div>
      
      {posts.map((post) => (
        <div key={post.id} className="mb-8 pb-4 border-b">
          <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
          <p className="text-sm text-gray-600 mb-2">Published on: {post.published_at || post.created_at}</p>
          <p className="mb-2">{post.excerpt}</p>
          <Link href={`/blog/${post.id}`} className="text-blue-500 hover:underline">
            Read More
          </Link>
        </div>
      ))}
    </div>
  );
}