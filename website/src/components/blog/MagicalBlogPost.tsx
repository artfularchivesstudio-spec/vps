'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'
import { BlogPost } from '@/types/blog'

interface MagicalBlogPostProps {
  post: BlogPost
  isDraft?: boolean
}

// Poetry for exit intent
const poems = [
  "Art is not what you see,\nbut what you make others see.\n— Edgar Degas",
  "Every artist dips their brush\nin their own soul,\nand paints their own nature\ninto their pictures.\n— Henry Ward Beecher",
  "The purpose of art is washing\nthe dust of daily life\noff our souls.\n— Pablo Picasso",
  "Art speaks where\nwords are unable\nto explain.\n— Unknown",
  "Creativity takes courage.\n— Henri Matisse"
]

export default function MagicalBlogPost({ post, isDraft = false }: MagicalBlogPostProps) {
  const [isReading, setIsReading] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [showExitPoem, setShowExitPoem] = useState(false)
  const [currentPoem, setCurrentPoem] = useState('')
  const [showAudioPlayer, setShowAudioPlayer] = useState(false)
  
  const articleRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: articleRef })
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.9])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.98])
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -50])

  // Format date beautifully
  const formattedDate = new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Reading progress tracking
  useEffect(() => {
    const updateProgress = () => {
      const article = articleRef.current
      if (!article) return

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      const windowHeight = window.innerHeight
      const articleTop = article.offsetTop
      const articleHeight = article.scrollHeight
      
      const scrolled = Math.max(0, scrollTop - articleTop + windowHeight * 0.3)
      const progress = Math.min(100, (scrolled / articleHeight) * 100)
      
      setReadingProgress(progress)
      setIsReading(progress > 5 && progress < 95)
    }

    window.addEventListener('scroll', updateProgress)
    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  // Exit intent detection
  useEffect(() => {
    let exitTimer: NodeJS.Timeout

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !showExitPoem) {
        exitTimer = setTimeout(() => {
          const randomPoem = poems[Math.floor(Math.random() * poems.length)]
          setCurrentPoem(randomPoem)
          setShowExitPoem(true)
        }, 500)
      }
    }

    const handleMouseEnter = () => {
      if (exitTimer) {
        clearTimeout(exitTimer)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
      if (exitTimer) clearTimeout(exitTimer)
    }
  }, [showExitPoem])

  // Intersection observer for animations
  const HeaderSection = ({ children }: { children: React.ReactNode }) => {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-10%" })
    
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    )
  }

  const ContentSection = ({ children }: { children: React.ReactNode }) => {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-10%" })
    
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <>
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 z-50 origin-left"
        style={{ scaleX: smoothProgress }}
      />

      {/* Floating Audio Player */}
      {post.audio_assets_by_language && Object.keys(post.audio_assets_by_language).length > 0 && (
        <motion.div
          className="fixed bottom-6 right-6 z-40"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 2, type: "spring", stiffness: 200 }}
        >
          <motion.button
            onClick={() => setShowAudioPlayer(!showAudioPlayer)}
            className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-lg flex items-center justify-center text-white"
            whileHover={{ scale: 1.1, rotate: 360 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            🎵
          </motion.button>
        </motion.div>
      )}

      {/* Draft Banner */}
      {isDraft && (
        <motion.div
          className="fixed top-4 left-4 right-4 bg-amber-100 border border-amber-300 rounded-lg p-3 z-40"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="flex items-center justify-center text-amber-800">
            <span className="mr-2">✏️</span>
            <span className="font-medium">Draft Preview</span>
          </div>
        </motion.div>
      )}

      {/* Main Article */}
      <motion.article
        ref={articleRef}
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50"
        style={{ opacity, scale }}
      >
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Hero Image with Parallax */}
          {post.featured_image_url && (
            <HeaderSection>
              <motion.div
                className="relative w-full h-[50vh] md:h-[60vh] mb-12 rounded-2xl overflow-hidden shadow-2xl"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{ y: parallaxY }}
                >
                  <Image
                    src={post.featured_image_url}
                    alt={post.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 900px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </motion.div>
                
                {/* Floating metadata */}
                <motion.div
                  className="absolute bottom-6 left-6 right-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                    <div className="flex items-center text-gray-700">
                      {post.author?.avatar_url && (
                        <motion.div
                          className="relative w-8 h-8 rounded-full overflow-hidden mr-3"
                          whileHover={{ scale: 1.1 }}
                        >
                          <Image
                            src={post.author.avatar_url}
                            alt={post.author.name || 'Author'}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </motion.div>
                      )}
                      <div className="text-sm">
                        <p className="font-medium">{post.author?.name}</p>
                        <p className="text-gray-500">{formattedDate}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </HeaderSection>
          )}

          {/* Title and Categories */}
          <HeaderSection>
            <div className="text-center mb-12">
              <motion.h1
                className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-6 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {post.title}
              </motion.h1>

              {post.categories && post.categories.length > 0 && (
                <motion.div
                  className="flex flex-wrap justify-center gap-3 mb-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {post.categories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <Link
                        href={`/blog?category=${category.slug}`}
                        className="bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 px-4 py-2 rounded-full text-sm font-medium text-purple-800 transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        {category.name}
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </HeaderSection>

          {/* Content */}
          <ContentSection>
            <motion.div
              className="prose prose-lg prose-purple max-w-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <div
                className="leading-relaxed text-gray-700"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </motion.div>
          </ContentSection>

          {/* Tags with Animation */}
          {post.tags && post.tags.length > 0 && (
            <ContentSection>
              <motion.div
                className="mt-16 pt-8 border-t border-gray-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">Explore Related Topics</h2>
                <div className="flex flex-wrap justify-center gap-3">
                  {post.tags.map((tag, index) => (
                    <motion.div
                      key={tag.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Link
                        href={`/blog?tag=${tag.slug}`}
                        className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm text-gray-700 transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        #{tag.name}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </ContentSection>
          )}

          {/* Navigation */}
          <ContentSection>
            <motion.div
              className="mt-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/blog"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-full font-medium inline-flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <span>✨</span>
                  Discover More Stories
                  <span>✨</span>
                </Link>
              </motion.div>
            </motion.div>
          </ContentSection>
        </div>
      </motion.article>

      {/* Exit Intent Poem Modal */}
      <AnimatePresence>
        {showExitPoem && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExitPoem(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Before You Go...</h3>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed mb-6 italic">
                {currentPoem}
              </p>
              <div className="flex gap-3 justify-center">
                <motion.button
                  onClick={() => setShowExitPoem(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Continue Reading
                </motion.button>
                <motion.button
                  onClick={() => window.history.back()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Take the Poetry
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Player Modal */}
      <AnimatePresence>
        {showAudioPlayer && post.audio_assets_by_language && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAudioPlayer(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">🎧</div>
                <h3 className="font-semibold text-gray-800">Listen to this article</h3>
              </div>
              <audio
                controls
                className="w-full"
                src={post.audio_assets_by_language['en']?.[0]?.url}
              >
                Your browser does not support the audio element.
              </audio>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}