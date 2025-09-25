const main = async () => {
  const { default: fetch } = await import('node-fetch');

  async function testSpanishTranslation() {
    const apiKey = 'chatgpt-actions-key-2025-SmL72KtB5WzgVbU';
    const postId = 'cbc72f09-623c-48a0-8974-a5aa4197dde9';
    const url = 'http://localhost:3000/api/ai/translate';

    const body = {
      post_id: postId,
      target_language: 'es',
      content: `Beyond the admiration for its raw beauty, the osprey's life mirrors a profound lesson we can reflect upon in our own lives—the delicate balance between vulnerability and strength. It's a testament to the idea that with focus and determination, the seemingly impossible becomes achievable. The osprey, with its innate potential to soar, to catch its prey, and to survive, reminds us of our own untapped potential. We ponder the historical significance of this majestic bird. In many cultures, the osprey, often called the sea hawk or fish eagle, was a revered creature. This traditional bird symbolism, flourishing in the skin and toni art of various indigenous tribes, was more than a pursuit of beauty; it served as a beacon of enlightenment, guiding humanity's quest for understanding the natural world. Echoes of this reverence can be found in the enduring inspiration that artists and thinkers draw from this noble bird, a connection that bridges the past with the present, inviting a deeper appreciation of the wisdom our ancestors found in nature's grand design. We continue this tradition of discovery through this visual masterpiece, aptly titled "Majestic Catch: The Osprey's Triumph." This artwork is more than a depiction; it is a portal—a doorway into the soul of nature, inviting us to look beyond the surface, to feel its energy, and to be transformed by it. As we step away, let us carry this moment with us, a reminder of the beauty that surrounds us, the power within us, and the connections that bind us to the world—an eternal dance of life, forever captured in the embrace of art.`,
      title: 'Majestic Catch: The Osprey’s Triumph',
      excerpt: 'In the heart of nature’s theater, an osprey stretches its wings, catching a shimmering fish. This artwork invites us to witness the sheer audacity of existence, balancing triumph and survival. Explore the intricate details, emotional resonance, and historical echoes of this mesmerizing piece.'
    };

    console.log('🧪 Testing Spanish Translation API...');
    console.log(`- Post ID: ${postId}`);
    console.log(`- Target Language: es`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      console.log(`📡 API Response Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API call successful!');
        console.log('📄 Response:', JSON.stringify(data, null, 2));
      } else {
        const error = await response.text();
        console.error('❌ API call failed:');
        console.error('📄 Error:', error);
      }
    } catch (error) {
      console.error('❌ API test failed:', error.message);
      console.log('💡 Make sure the Next.js server is running on http://localhost:3000');
    }
  }

  testSpanishTranslation();
};

main();
