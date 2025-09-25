// export default function Home() {
//   return (
//     <div className="flex flex-col items-center justify-center w-screen h-screen overflow-hidden bg-art-image">

//       <nav className="my-16 animate-fade-in">
//         <ul className="flex items-center justify-center gap-4">
//           {navigation.map((item) => (
//             <Link
//               key={item.href}
//               href={item.href}
//               className="text-sm duration-500 text-zinc-500 hover:text-zinc-300"
//             >
//               {item.name}
//             </Link>
//           ))}
//         </ul>
//       </nav>
//       <div className="hidden w-screen h-px animate-glow md:block animate-fade-left bg-gradient-to-r from-zinc-300/0 via-zinc-300/50 to-zinc-300/0" />
//       <Particles
//         className="absolute inset-0 -z-10 animate-fade-in"
//         quantity={100}
//       />
//       <h1 className="py-3.5 px-0.5 z-10 text-4xl text-transparent duration-1000 bg-white cursor-default text-edge-outline animate-title font-display sm:text-6xl md:text-9xl whitespace-nowrap bg-clip-text ">
//       Artful Archives Studio
//       </h1>

//       <div className="hidden w-screen h-px animate-glow md:block animate-fade-right bg-gradient-to-r from-zinc-300/0 via-zinc-300/50 to-zinc-300/0" />
//       <div className="my-16 text-center animate-fade-in">
//         <h2 className="text-sm text-zinc-500 ">
//           I'm building{" "}
//           <Link
//             target="_blank"
//             href="https://ArtfulArchivesStudio.com"
//             className="underline duration-500 hover:text-zinc-300"
//           >
//             ArtfulArchivesStudio.com
//           </Link> to solve API authentication and authorization for developers.
//         </h2>
//       </div>
//     </div>
//   );

// }


'use client';
import styles from 'page.module.css';
import Link from "next/link";
import React, { useRef, useEffect, useState } from "react";
import Layout from '@/components/Layout';
import { blogPosts } from '@/mocks/blogPosts';
import { products } from '@/mocks/products';
import HeroSection from '@/components/HeroSection';
import Particles from "@/components/Particles";
import Image from 'next/image';
import '../styles/globals.css';

const navigation = [
  { name: "Projects", href: "/projects" },
  { name: "Contact", href: "/contact" },
];

export default function Home() {
  const [showContent, setShowContent] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToContent = () => {
    console.log("scrollToContent ", contentRef.current);
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      console.log("handleScroll inside page.tsx -- window.scrollY > window.innerHeight } ");
      if (window.scrollY > window.innerHeight / 2) {
        setShowContent(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  //<HeroSection scrollToContent={scrollToContent} />
  return (
    <>
      <div ref={contentRef} className="w-screen">
        <Layout fullWidth>
          <section
            className="hero w-full bg-cover bg-center py-32 min-h-[75vh]"
            style={{ backgroundImage: "url('/background.png')" }}
          >
            <div className="hero-content bg-white p-8 max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4">Welcome to Artful Archives Studio</h1>
              <p className="text-lg mb-8">
                Discover a curated collection of artworks, explore our blog for the latest trends in the art world, and visit our store to purchase unique pieces. Dive into the world of creativity and artistic expression with us.
              </p>
            </div>
          </section>

          <section className="featured-sections flex flex-col md:flex-row justify-between mt-16">
            <div className="featured-item flex-1 mx-4 mb-8 md:mb-0">
              <Image 
                src="/abstract-art.png" 
                alt="Featured Artwork" 
                width={400} 
                height={300} 
                className="w-full h-48 object-cover mb-2 rounded-lg shadow-md" 
              />
              <h2 className="text-xl font-medium mb-2">Featured Artwork</h2>
              <p>Explore our featured artwork of the month, a stunning piece that captivates the essence of abstract art.</p>
            </div>
            <div className="featured-item flex-1 mx-4 mb-8 md:mb-0">
              <Image 
                src="/calm-portrait.png" 
                alt="Latest Blog Post" 
                width={400} 
                height={300} 
                className="w-full h-48 object-cover mb-2 rounded-lg shadow-md" 
              />
              <h2 className="text-xl font-medium mb-2">Latest Blog Post</h2>
              <p>Stay updated with our latest blog post where we delve into contemporary art trends and techniques.</p>
            </div>
            <div className="featured-item flex-1 mx-4">
              <Image 
                src="/sculpture.png" 
                alt="Visit Our Store" 
                width={400} 
                height={300} 
                className="w-full h-48 object-cover mb-2 rounded-lg shadow-md" 
              />
              <h2 className="text-xl font-medium mb-2">Visit Our Store</h2>
              <p>Browse through our collection of artworks available for purchase. Find the perfect piece to add to your collection.</p>
            </div>
          </section>
        </Layout>
      </div>
    </>
  );
}


// export default function Home() {
//   return (
//     <main>
//       <section className="hero">
//         <div className="hero-content">
//           <h1>Welcome to Artful Archives Studio</h1>
//           <p>Discover a curated collection of artworks, explore our blog for the latest trends in the art world, and visit our store to purchase unique pieces. Dive into the world of creativity and artistic expression with us.</p>
//         </div>
//       </section>

//       <section className="featured-sections">
//         <FeaturedItem 
//           image="/images/featured-artwork.jpg"
//           title="Featured Artwork"
//           description="Explore our featured artwork of the month, a stunning piece that captivates the essence of abstract art."
//         />
//         <FeaturedItem 
//           image="/images/latest-blog-post.jpg"
//           title="Latest Blog Post"
//           description="Stay updated with our latest blog post where we delve into contemporary art trends and techniques."
//         />
//         <FeaturedItem 
//           image="/images/visit-store.jpg"
//           title="Visit Our Store"
//           description="Browse through our collection of artworks available for purchase. Find the perfect piece to add to your collection."
//         />
//       </section>
//     </main>
//   );
// }

interface FeaturedItemProps {
  image: string;
  title: string;
  description: string;
}

function FeaturedItem({ image, title, description }: FeaturedItemProps) {
  return (
    <div className="featured-item">
      <Image src={image} alt={title} width={400} height={300} objectFit="cover" />
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}