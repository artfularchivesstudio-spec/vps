const { createClient } = require('@supabase/supabase-js');
const { randomBytes, createHash } = require('crypto');

// Supabase configuration
const supabaseUrl = 'https://tjkpliasdjpgunbhsiza.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqa3BsaWFzZGpwZ3VuYmhzaXphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc3NDUwMywiZXhwIjoyMDY3MzUwNTAzfQ.S426_9YxbKZCKFqPu9Q9zlefr7TkfqPuWFjnScQUu50';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertApiKey() {
  try {
    // Generate API key
    const apiKey = 'aa_' + randomBytes(24).toString('hex');
    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    console.log('Inserting API key into database...');

    const { data, error } = await supabase
      .from('external_api_keys')
      .insert({
        label: 'debug-test-key',
        key_hash: keyHash,
        is_active: true
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting API key:', error);
      return;
    }

    console.log('✅ API Key inserted successfully!');
    console.log('🔑 API Key (copy this - it will only be shown once):', apiKey);
    console.log('🆔 Key ID:', data.id);

  } catch (error) {
    console.error('Failed to insert API key:', error);
  }
}

insertApiKey();