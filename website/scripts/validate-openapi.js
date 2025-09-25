#!/usr/bin/env node

// 🎭 OpenAPI Validation Theater - Where YAML meets Reality! ✨

const SwaggerParser = require('@apidevtools/swagger-parser');
const path = require('path');

// 🎪 The Grand Validation Performance
async function validateOpenAPI() {
  const specPath = path.join(__dirname, '../config/openapi/openapi.yaml');
  
  console.log('🎭 Welcome to the OpenAPI Validation Theater!');
  console.log(`🎪 Validating: ${specPath}`);
  
  try {
    const api = await SwaggerParser.validate(specPath);
    console.log('✨ Success! The OpenAPI spec is valid!');
    console.log(`🎵 API Title: ${api.info.title}`);
    console.log(`🎬 Version: ${api.info.version}`);
    console.log(`🎪 Paths: ${Object.keys(api.paths).length}`);
    console.log(`🎨 Schemas: ${Object.keys(api.components?.schemas || {}).length}`);
  } catch (error) {
    console.error('💥 Validation failed!');
    console.error('🎭 Error details:');
    console.error(error.message);
    
    if (error.details) {
      console.error('🎪 Additional details:');
      error.details.forEach((detail, index) => {
        console.error(`  ${index + 1}. ${detail.message}`);
        if (detail.path) {
          console.error(`     Path: ${detail.path.join(' -> ')}`);
        }
      });
    }
    
    process.exit(1);
  }
}

// 🎬 Let the validation show begin!
validateOpenAPI();