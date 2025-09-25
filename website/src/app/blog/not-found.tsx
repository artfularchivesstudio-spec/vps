// src/app/blog/[slug]/not-found/page.tsx
import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
      <p className="text-gray-600 mb-4">Could not find the requested blog post.</p>
      <Link href="/blog" className="text-blue-600 hover:underline">
        Return to Blog
      </Link>
    </div>
  );
}