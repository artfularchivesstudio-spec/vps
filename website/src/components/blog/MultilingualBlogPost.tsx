'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'
import LanguageSegmentedControl, { Language } from '@/components/ui/LanguageSegmentedControl'
import { BlogPost } from '@/types/blog'

interface MultilingualContent {
  en: { title: string; content: string; excerpt?: string }
  es: { title: string; content: string; excerpt?: string }
  hi: { title: string; content: string; excerpt?: string }
}

interface MultilingualBlogPostProps {
  post: BlogPost
  isDraft?: boolean
}

// 🎭 Poetry for exit intent - now multilingual!
const multilingualPoems = {
  en: [
    "Art is not what you see,\nbut what you make others see.\n— Edgar Degas",
    "Every artist dips their brush\nin their own soul,\nand paints their own nature\ninto their pictures.\n— Henry Ward Beecher",
    "The purpose of art is washing\nthe dust of daily life\noff our souls.\n— Pablo Picasso"
  ],
  es: [
    "El arte no es lo que ves,\nsino lo que haces ver a otros.\n— Edgar Degas",
    "Todo artista sumerge su pincel\nen su propia alma,\ny pinta su propia naturaleza\nen sus cuadros.\n— Henry Ward Beecher", 
    "El propósito del arte es lavar\nel polvo de la vida diaria\nde nuestras almas.\n— Pablo Picasso"
  ],
  hi: [
    "कला वह नहीं है जो आप देखते हैं,\nबल्कि वह है जो आप\nदूसरों को दिखाते हैं।\n— एडगर देगा",
    "हर कलाकार अपनी तूलिका को\nअपनी आत्मा में डुबोता है,\nऔर अपनी तस्वीरों में\nअपना स्वभाव चित्रित करता है।\n— हेनरी वार्ड बीचर",
    "कला का उद्देश्य हमारी आत्माओं से\nदैनिक जीवन की धूल\nधोना है।\n— पाब्लो पिकासो"
  ]
}

export default function MultilingualBlogPost({ post, isDraft = false }: MultilingualBlogPostProps) {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en')
  const [isReading, setIsReading] = useState(false)
  const [showExitPoem, setShowExitPoem] = useState(false)
  const [currentPoem, setCurrentPoem] = useState('')
  const articleRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: ["start end", "end start"]
  })

  // 🎨 Create multilingual content object
  const multilingualContent: MultilingualContent = {
    en: {
      title: post.title,
      content: post.content,
      excerpt: post.excerpt
    },
    es: {
      title: post.title_translations?.es || post.title,
      content: post.content_translations?.es || post.content,
      excerpt: post.excerpt_translations?.es || post.excerpt
    },
    hi: {
      title: post.title_translations?.hi || post.title,
      content: post.content_translations?.hi || post.content,
      excerpt: post.excerpt_translations?.hi || post.excerpt
    }
  }

  // 🌍 Define available languages based on content availability
  const languages: Language[] = [
    { 
      code: 'en', 
      name: 'English', 
      flag: '🇺🇸', 
      available: true // English is always available
    },
    { 
      code: 'es', 
      name: 'Español', 
      flag: '🇪🇸', 
      available: !!(post.content_translations?.es && post.title_translations?.es)
    },
    { 
      code: 'hi', 
      name: 'हिंदी', 
      flag: '🇮🇳', 
      available: !!(post.content_translations?.hi && post.title_translations?.hi)
    }
  ]

  // 🎵 Get audio URL for current language
  const getCurrentAudioUrl = useCallback(() => {
    if (post.audio_assets_by_language) {
      const langAudio = post.audio_assets_by_language[currentLanguage as keyof typeof post.audio_assets_by_language]
      if (langAudio && langAudio.length > 0) {
        return langAudio[0].url
      }
    }
    // Fallback to English audio if available
    const englishAudio = post.audio_assets_by_language?.en
    return englishAudio && englishAudio.length > 0 ? englishAudio[0].url : undefined
  }, [currentLanguage, post])

  // 🎭 Get current content based on selected language
  const currentContent = multilingualContent[currentLanguage as keyof MultilingualContent]
  const currentAudioUrl = getCurrentAudioUrl()

  // ✨ Smooth animations for parallax and transforms
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [1, 1, 1, 0.8])
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [1, 1, 1, 0.95])

  // 📅 Format date
  const formattedDate = new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // 🎭 Handle language changes with smooth transitions
  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode)
    // 🎪 Add a small delay to allow for smooth content transition
    setTimeout(() => {
      // Scroll to top of content if needed
      if (articleRef.current) {
        const rect = articleRef.current.getBoundingClientRect()
        if (rect.top < 0) {
          articleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }, 150)
  }

  // 🏃‍♂️ Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !showExitPoem && isReading) {
        const poems = multilingualPoems[currentLanguage as keyof typeof multilingualPoems] || multilingualPoems.en
        const randomPoem = poems[Math.floor(Math.random() * poems.length)]
        setCurrentPoem(randomPoem)
        setShowExitPoem(true)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [showExitPoem, isReading, currentLanguage])

  // 📖 Reading progress tracking
  useEffect(() => {
    const timer = setTimeout(() => setIsReading(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  // 🎨 Create intersection observer for content sections
  const HeaderSection = ({ children }: { children: React.ReactNode }) => {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })
    
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    )
  }

  const ContentSection = ({ children }: { children: React.ReactNode }) => {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-50px" })
    
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <>
      <motion.article
        ref={articleRef}
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50"
        style={{ opacity, scale }}
      >
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* 🌍 Language Controls - The Linguistic Command Center */}
          <HeaderSection>
            <div className="flex justify-center mb-8">
              <LanguageSegmentedControl
                languages={languages}
                activeLanguage={currentLanguage}
                onChange={handleLanguageChange}
                size="md"
                showLabels={true}
                className="sticky top-4 z-30 bg-white/80 backdrop-blur-md rounded-full p-2 shadow-lg border border-white/40"
              />
            </div>
          </HeaderSection>

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
                    alt={currentContent.title}
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

          {/* 🎭 Title and Categories - The Theatrical Header */}
          <HeaderSection>
            <div className="text-center mb-12">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={`title-${currentLanguage}`}
                  className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-6 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  {currentContent.title}
                </motion.h1>
              </AnimatePresence>

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

          {/* 🎵 Audio Player - The Voice of Each Language */}
          {currentAudioUrl && (
            <ContentSection>
              <div className="mb-8">
                <motion.div
                  className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 shadow-lg"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl animate-pulse">🎵</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Listen in {languages.find(l => l.code === currentLanguage)?.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {languages.find(l => l.code === currentLanguage)?.flag} Audio narration available
                        </p>
                      </div>
                    </div>
                  </div>
                  <audio
                    key={currentAudioUrl} // Key ensures player reloads when URL changes
                    controls
                    className="w-full"
                    style={{ height: '40px' }}
                  >
                    <source src={currentAudioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </motion.div>
              </div>
            </ContentSection>
          )}

          {/* 📖 Content - The Multilingual Story */}
          <ContentSection>
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${currentLanguage}`}
                className="prose prose-lg prose-purple max-w-none"
                initial={{ opacity: 0, x: currentLanguage === 'en' ? -20 : currentLanguage === 'es' ? 0 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: currentLanguage === 'en' ? 20 : currentLanguage === 'es' ? 0 : -20 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <div
                  className="leading-relaxed text-gray-700"
                  dangerouslySetInnerHTML={{ __html: currentContent.content }}
                />
              </motion.div>
            </AnimatePresence>
          </ContentSection>

          {/* 🏷️ Tags with Animation */}
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

          {/* 🚀 Navigation */}
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

      {/* 🎭 Exit Intent Poem Modal - Now Multilingual! */}
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
              <div className="text-4xl mb-4">{languages.find(l => l.code === currentLanguage)?.flag || '🎭'}</div>
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
                  onClick={() => window.location.href = '/blog'}
                  className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Explore More
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}