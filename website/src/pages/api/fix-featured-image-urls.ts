import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/client'

// This script will update all blog_posts where featured_image_url is just a file name
// and convert it to the full public URL for Supabase Storage

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createClient()

  // Get all posts
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, featured_image_url')

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  let updated = 0
  for (const post of posts || []) {
    const url = post.featured_image_url
    if (!url) continue
    // Remove accidental double slashes in the path (except after protocol)
    const cleanUrl = url.replace(/([^:]\/)\/+/, '$1/')
    if (url !== cleanUrl) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ featured_image_url: cleanUrl })
        .eq('id', post.id)
      if (!updateError) updated++
      continue
    }
    // If it's not a full URL, treat as file name and get public URL
    if (!url.startsWith('http')) {
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(url)
      if (urlData && urlData.publicUrl) {
        const cleanPublicUrl = urlData.publicUrl.replace(/([^:]\/)\/+/, '$1/')
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ featured_image_url: cleanPublicUrl })
          .eq('id', post.id)
        if (!updateError) updated++
      }
    }
  }

  return res.status(200).json({ updated })
} 