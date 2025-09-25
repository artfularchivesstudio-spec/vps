// src/components/BlogList.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { WordPressPost } from '@/types/WordPress';
import Layout from './Layout';

export default function BlogList({ posts }: { posts: WordPressPost[] }) {
  return (
    <Layout>
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-12">Blog.</h1>
      <div className="grid gap-8">
        {posts.map((post) => {
          console.log("Rendering post:", post.slug);
          const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;

          return (
            <article key={post.id} className="border-b pb-8">

            <Link href={`/blog/${post.slug}`} className="group">
                <div className="mb-4">
                  <h2 
                    className="text-2xl font-semibold mb-2"
                    dangerouslySetInnerHTML={{ __html: post.title.rendered }} 
                  />
                  <div className="text-gray-600 mb-2">
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })} | ArtfulArchivesStudio
                  </div>
                </div>

                <div className="relative aspect-[16/9] mb-4 overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={featuredImage || 'https://placehold.co/800x450'}
                    alt={post.title.rendered}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                <div 
                  className="text-gray-700 mb-4 line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} 
                />
                <span className="text-blue-600 font-medium">Read More →</span>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
    </Layout>
  );
}