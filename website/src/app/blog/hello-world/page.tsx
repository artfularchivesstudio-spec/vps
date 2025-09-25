import SingleBlogPost from "@/components/SingleBlogPost";
import { blogPosts } from "@/mocks/blogPosts";
import { BlogPost } from "@/types/blog";

// const impetus = () => {
//   const slug: string = "impetus";
//   const post = blogPosts.find((post) => post.slug === slug);
//   if (!post) {
//     return <p>Not n found</p>;
//   }

//   return (
//     <div>
//       <SingleBlogPost {...{ slug }} />
//     </div>
//   );
// };

// export default impetus;

// src/app/blog/entries/[slug]/page.tsx
import { getWordPressPost } from '@/lib/wordpress/api';
import SinglePost from '@/components/SinglePost';
import { notFound } from 'next/navigation';
import type { WordPressPost } from '@/types/WordPress';

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  console.log("Page component received slug:", params.slug);
  
  if (!params.slug) {
    console.log("No slug provided");
    notFound();
  }

  const post = await getWordPressPost(params.slug);
  
  if (!post) {
    console.log("No post found for slug:", params.slug);
    notFound();
  }
  
  return <SinglePost post={post} />;
}