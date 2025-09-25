'use strict';

const { createClient } = require('@supabase/supabase-js');

// These are the test credentials provided
const email = 'test-admin_1@artful-archives-test.com';
const password = 'test-admin-password-123';

async function login() {
  // Initialize Supabase client
  // Note: You'll need to set these environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Attempt to sign in with the provided credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Login failed:', error.message);
      process.exit(1);
    }
    
    console.log('Login successful!');
    console.log('User data:', data.user);
    console.log('Session:', data.session);
  } catch (err) {
    console.error('Unexpected error during login:', err);
    process.exit(1);
  }
}

login();