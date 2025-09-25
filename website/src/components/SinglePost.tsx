// src/components/SinglePost.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { WordPressPost } from '@/types/WordPress';
import '@/styles/wordpress.css';

interface SinglePostProps {
  post: WordPressPost;
}

// Add WordPress styles in a single file
const WORDPRESS_STYLES = `
  /* Add any specific WordPress theme styles you want to keep */
  blockquote {
    font-family: 'EB Garamond', ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
    font-style: italic;
    margin: 2em 0;
    padding-left: 1em;
    border-left: 4px solid #eee;
    position: relative;
  }

  blockquote p {
    font-size: 1.5em;
    line-height: 1.6;
    color: #333;
  }

  .has-secondary-color {
    color: #E53E3E;
  }

  .wp-block-quote {
    margin: 40px 0;
    padding: 30px;
    background: #f9f9f9;
    border-left: 4px solid #333;
  }
`;

export default function SinglePost({ post }: { post: WordPressPost }) {
  return (
    <article className="max-w-3xl mx-auto">
      <Link href="/blog" className="text-blue-600 hover:underline mb-4 block">
        ← Back to Blog
      </Link>
      
      <header className="mb-8">
        <h1 
          className="text-4xl font-heading font-light mb-4"
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />
        <div className="text-foreground text-small">
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })} | ArtfulArchivesStudio
        </div>
      </header>

      <div 
        className="wordpress-content"
        dangerouslySetInnerHTML={{ 
          __html: post.content.rendered 
        }}
      />
    </article>
  );
}
