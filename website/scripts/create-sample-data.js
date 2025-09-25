// 🎭 **Sample Data Creator** - Populating our digital canvas with test data
// So we can beautifully test the PostgreSQL Explorer

const { createClient } = require('@supabase/supabase-js');

async function createSampleData() {
  console.log('🎨 Creating sample data for PostgreSQL Explorer testing...');

  // Use environment variables or fallback
  const supabaseUrl = process.env.SUPABASE_URL || 'https://tjkpliasdjpgunbhsiza.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Create sample blog posts
  const samplePosts = [
    {
      title: 'Welcome to Artful Archives',
      content: 'Discover the beauty of technology through art and code.',
      status: 'published',
      author: 'Artful AI',
      created_at: new Date().toISOString()
    },
    {
      title: 'The Symphony of Code',
      content: 'Where algorithms dance and functions sing beautiful melodies.',
      status: 'published',
      author: 'Code Composer',
      created_at: new Date().toISOString()
    },
    {
      title: 'Digital Canvas Exploration',
      content: 'Painting with pixels and sculpting with syntax.',
      status: 'draft',
      author: 'Pixel Artist',
      created_at: new Date().toISOString()
    },
    {
      title: 'Database Explorer Demo',
      content: 'Testing our beautiful PostgreSQL Explorer interface.',
      status: 'published',
      author: 'Database Explorer',
      created_at: new Date().toISOString()
    }
  ];

  console.log('📝 Creating sample blog posts...');
  for (const post of samplePosts) {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(post)
      .select();

    if (error) {
      console.error('❌ Error creating post:', error.message);
    } else {
      console.log('✅ Created post:', data[0].title);
    }
  }

  // Create sample media assets
  const sampleMedia = [
    {
      title: 'Artful Code Screenshot',
      file_type: 'image',
      file_path: '/images/artful-code.png',
      created_at: new Date().toISOString()
    },
    {
      title: 'Database Explorer Demo',
      file_type: 'image',
      file_path: '/images/database-explorer.png',
      created_at: new Date().toISOString()
    }
  ];

  console.log('🖼️ Creating sample media assets...');
  for (const media of sampleMedia) {
    const { data, error } = await supabase
      .from('media_assets')
      .insert(media)
      .select();

    if (error) {
      console.error('❌ Error creating media:', error.message);
    } else {
      console.log('✅ Created media:', data[0].title);
    }
  }

  console.log('🎉 Sample data creation complete!');
  console.log('🚀 Now you can test the PostgreSQL Explorer at /admin/database-explorer');
}

createSampleData().catch(console.error);
