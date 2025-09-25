const fetch = require('node-fetch');

async function testImageAnalysis() {
  try {
    console.log('Testing image analysis endpoint...');
    
    const response = await fetch('http://localhost:3000/api/ai/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: 'https://tjkpliasdjpgunbhsiza.supabase.co/storage/v1/object/public/images/1735689600000.jpg',
        prompt: 'Analyze this artwork and provide insights',
        analysis_type: 'detailed',
        providers: ['openai']
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const result = await response.json();
    console.log('Response body:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error testing image analysis:', error);
  }
}

testImageAnalysis();