require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseFunction() {
  try {
    console.log('Testing Supabase ai-analyze-image-simple function directly...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tjkpliasdjpgunbhsiza.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment');
      return;
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    const { data: functionData, error: functionError } = await supabase.functions.invoke('ai-analyze-image-simple', {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: { 
        image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop', 
        prompt: 'Analyze this artwork and provide insights',
        providers: ['openai'],
        analysis_type: 'detailed'
      }
    });
    
    console.log('Function Error:', functionError);
    console.log('Function Data:', JSON.stringify(functionData, null, 2));
    
    if (functionData) {
      console.log('\n=== RESPONSE STRUCTURE ANALYSIS ===');
      console.log('functionData keys:', Object.keys(functionData));
      
      if (functionData.data) {
        console.log('functionData.data keys:', Object.keys(functionData.data));
        console.log('\nChecking for expected fields:');
        console.log('- blogContent:', !!functionData.data.blogContent);
        console.log('- suggestedTitle:', !!functionData.data.suggestedTitle);
        console.log('- suggestedSlug:', !!functionData.data.suggestedSlug);
        console.log('- excerpt:', !!functionData.data.excerpt);
        console.log('- categories:', !!functionData.data.categories);
        console.log('- tags:', !!functionData.data.tags);
      }
    }
    
  } catch (error) {
    console.error('Error testing Supabase function:', error);
  }
}

testSupabaseFunction();