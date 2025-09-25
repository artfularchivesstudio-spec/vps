// src/app/about/page.tsx
"use client";
import Image from 'next/image';
import { team } from '@/mocks/team';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AboutPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -5 },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotate: 0,
      transition: { 
        type: "spring", 
        stiffness: 100,
        duration: 0.8
      }
    }
  };

  // Random rotation for collage effect
  const getRandomRotation = (index: number) => {
    const rotations = [-3, -2, -1, 0, 1, 2, 3];
    return rotations[index % rotations.length];
  };
// LoadedImage component for better image loading experience
const LoadedImage = ({ src, alt, ...props }: React.ComponentProps<typeof Image>) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative">
      {!loaded && <Skeleton className="absolute inset-0" />}
      <Image
        src={src}
        alt={alt}
        onLoadingComplete={() => setLoaded(true)}
        className={loaded ? "" : "invisible"}
        {...props}
      />
    </div>
  );
};

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl relative">
        {/* Decorative elements */}
        <motion.div 
          className="absolute top-20 right-8 w-16 h-16 rounded-full bg-yellow-200 opacity-70 z-0"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.7 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        />
        <motion.div 
          className="absolute top-60 left-12 w-20 h-20 rounded-full bg-blue-200 opacity-60 z-0"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        />
        <motion.div 
          className="absolute bottom-20 right-16 w-24 h-24 rounded-full bg-green-200 opacity-60 z-0"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        />

        <motion.div 
          className="relative w-full h-64 mb-10 shadow-xl rounded-lg overflow-hidden z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Image
            src="/artboard1.png"
            alt="Artful Archives Studio"
            fill
            sizes="100vw"
            style={{
              objectFit: 'cover',
              objectPosition: 'center'
            }}
            priority
          />
          <motion.div 
            className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <motion.h1 
              className="text-5xl font-bold text-white drop-shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              About Us
            </motion.h1>
          </motion.div>
        </motion.div>

        <div className="relative z-10">
          <motion.section 
            className="mb-16 relative"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="absolute -top-8 -left-4 w-20 h-1 bg-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: 80 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start relative">
              <motion.div 
                className="md:col-span-7 relative"
                variants={fadeIn}
              >
                <motion.h2 
                  className="text-3xl font-bold mb-6 text-indigo-800"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  Artful Archives Studio
                </motion.h2>
                <p className="mb-4 text-lg">Founded in 2010 with a vision to nurture and promote artistic talents. Over the years, we have grown into a vibrant community of artists, each contributing their unique style and perspective to the art world.</p>
              </motion.div>
              
              
              <motion.div 
                className="md:col-span-5 relative h-56 md:h-64 transform md:rotate-2 shadow-lg rounded-lg overflow-hidden z-10"
                variants={imageVariants}
                whileHover={{ scale: 1.05, rotate: 0, transition: { duration: 0.3 } }}
              >
                <LoadedImage
                  src="/about-us.png"
                  alt="Artful Archives Studio"
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'top'
                  }}
                />
              </motion.div>
               {} Similarly for hero image and team images
              
            </div>
          </motion.section>

          <motion.section 
            className="mb-16 relative mt-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            <motion.div
              className="absolute -top-12 right-4 w-12 h-12 rounded-full bg-red-200"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.4, duration: 0.5, type: "spring" }}
            />
            
            <motion.div
              className="absolute -top-8 right-4 w-20 h-1 bg-red-500"
              initial={{ width: 0 }}
              animate={{ width: 80 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            />
            
            <motion.h2 
              className="text-3xl font-bold mb-6 text-red-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Our Mission
            </motion.h2>
            
            <div className="relative p-6 bg-white rounded-lg shadow-md">
              <motion.div
                className="absolute -top-3 -left-3 w-6 h-6 bg-yellow-300 rounded-sm transform rotate-12"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 12 }}
                transition={{ delay: 1.3 }}
              />
              
              <motion.p 
                className="mb-4 text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                Our mission is to foster creativity, support emerging artists, and bring compelling art to a broader audience. We believe in the transformative power of art and aim to make it accessible to everyone.
              </motion.p>
              
              <motion.p
                className="text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
              >
                Through our initiatives, we strive to create a supportive environment where artists can collaborate, innovate, and thrive. We are committed to promoting diversity and inclusion in the art community, ensuring that all voices are heard and valued.
              </motion.p>
              
              <motion.div
                className="absolute -bottom-3 -right-3 w-6 h-6 bg-green-300 rounded-sm transform -rotate-12"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: -12 }}
                transition={{ delay: 1.3 }}
              />
            </div>
          </motion.section>

          <motion.section 
            className="mb-8 relative"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            transition={{ delayChildren: 1.2, staggerChildren: 0.2 }}
          >
            <motion.div
              className="absolute -top-8 left-4 w-20 h-1 bg-teal-500"
              initial={{ width: 0 }}
              animate={{ width: 80 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            />
            
            <motion.h2 
              className="text-3xl font-bold mb-8 text-teal-700"
              variants={fadeIn}
            >
              Meet Our Team
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {team.map((member, index) => (
                <motion.div 
                  key={member.id} 
                  className="bg-white p-5 rounded-lg shadow-lg text-center transform transition-transform duration-300 relative z-10"
                  variants={imageVariants}
                  custom={index}
                  style={{ transform: `rotate(${getRandomRotation(index)}deg)` }}
                  whileHover={{ 
                    y: -5, 
                    rotate: 0,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    zIndex: 20
                  }}
                >
                  <div className="relative w-full h-52 mb-4 overflow-hidden rounded-md">
                    <Image
                      src="/us.jpg"
                      alt={member.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                    />
                    <motion.div 
                      className="absolute inset-0 bg-teal-900 bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                      whileHover={{ opacity: 1 }}
                    >
                      <p className="text-white font-medium p-2 text-sm">Click to learn more</p>
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-medium">{member.name}</h3>
                  <p className="text-gray-600">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </Layout>
  );
}
