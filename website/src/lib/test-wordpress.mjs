#!/usr/bin/env node
/**
 * Test script to verify WordPress API connection
 * Run with: node src/lib/test-wordpress.mjs
 */

import fetch from 'node-fetch';

const WORDPRESS_API_URL = 'http://artfularchivestudio.local/wp-json/wp/v2';

async function testWordPressConnection() {
  console.log('Testing connection to WordPress API...');
  console.log(`API URL: ${WORDPRESS_API_URL}`);
  
  try {
    // Test basic API connection
    const response = await fetch(`${WORDPRESS_API_URL}/posts`);
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }
    
    const posts = await response.json();
    
    console.log('✅ Successfully connected to WordPress API');
    console.log(`Found ${posts.length} posts`);
    
    // Display post titles
    console.log('\nPost titles:');
    posts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title.rendered} (ID: ${post.id}, slug: ${post.slug})`);
    });
    
    // Test categories
    const categoriesResponse = await fetch(`${WORDPRESS_API_URL}/categories`);
    const categories = await categoriesResponse.json();
    
    console.log('\nCategories:');
    categories.forEach((category) => {
      console.log(`- ${category.name} (${category.count} posts)`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error connecting to WordPress API:', error.message);
    return false;
  }
}

// Run the test
testWordPressConnection(); 