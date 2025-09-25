// src/components/SingleBlogPost.tsx
import { init } from 'next/dist/compiled/webpack/webpack';
import { blogPosts } from '../mocks/blogPosts';
import Image from 'next/image';
import { BlogPost } from '@/types/blog';

interface SingleBlogPostProps {
  slug: string;
}

const SingleBlogPost = ({ slug }: SingleBlogPostProps) => {
  const post = blogPosts.find((post) => post.slug === slug);
  if (!post) {
    return <p>No Entry for that slug found</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1>{post.title}</h1>
      <time dateTime={post.published_at || post.created_at}>{post.published_at || post.created_at}</time>
      <div className="flex items-center mb-4">
        {/* Image functionality to be implemented */}
        <p>{post.excerpt}</p>
      </div>
      <p>{post.content}</p>
    </div>
  );
};

export default SingleBlogPost;