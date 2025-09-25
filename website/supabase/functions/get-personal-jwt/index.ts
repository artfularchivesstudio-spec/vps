declare var Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log("Personal JWT Generator Function");

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing required environment variables');
    }

    // Create Supabase client with anon key for authentication
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Your personal user credentials - hardcoded for personal use
    const personalEmail = 'arty@arty.com';
    
    // Note: In production, you might want to store the password as an environment variable
    const personalPassword = Deno.env.get('PERSONAL_USER_PASSWORD') || 'your-password-here';
    
    if (personalPassword === 'your-password-here') {
      return new Response(JSON.stringify({
        error: 'Password not configured',
        message: 'Please set PERSONAL_USER_PASSWORD environment variable in Supabase dashboard'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Authenticate with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: personalEmail,
      password: personalPassword
    });

    if (error) {
      console.error('Authentication failed:', error);
      return new Response(JSON.stringify({
        error: 'Authentication failed',
        details: error.message
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    if (!data.session) {
      return new Response(JSON.stringify({
        error: 'No session created',
        message: 'Authentication succeeded but no session was returned'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Return the JWT token and user info
    const response = {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
        last_sign_in_at: data.user.last_sign_in_at
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in
      },
      jwt_token: data.session.access_token,
      message: "JWT token generated successfully"
    };

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

/* To invoke locally:

  1. Run `supabase start`
  2. Set environment variable: PERSONAL_USER_PASSWORD in your .env.local
  3. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-personal-jwt' \
    --header 'Content-Type: application/json'

  Or for production:
  curl -i --location --request POST 'https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/get-personal-jwt' \
    --header 'Content-Type: application/json'

  Response will include:
  {
    "success": true,
    "user": { ... },
    "jwt_token": "eyJhbGciOiJIUzI1NiIs...",
    "session": { ... }
  }

*/ 