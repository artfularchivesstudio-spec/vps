#!/bin/bash

# 🎭 Strapi Token Management Aliases - The Authentication Shortcuts! ✨

# 🌟 Generate a fresh JWT token
alias get-strapi-token='cd /root/api-gateway && node get-strapi-token.js'

# 🔍 Show the current saved token
alias show-strapi-token='cat /root/api-gateway/strapi-token.txt 2>/dev/null || echo "❌ No token found! Run: get-strapi-token"'

# 🧪 Test if the current admin token is valid
alias test-strapi-token='curl -s -H "Authorization: Bearer $(cat /root/api-gateway/strapi-token.txt 2>/dev/null)" http://localhost:1337/admin/users/me | jq -r "if .data then \"✅ Admin token is valid!\" else \"❌ Admin token is invalid or expired\" end"'

# 🔑 Test if the API token is valid for uploads
alias test-api-token='curl -s -H "Authorization: Bearer $(cat /root/api-gateway/strapi-api-token.txt 2>/dev/null)" http://localhost:1337/api/upload/files 2>/dev/null | jq -r "if type == \"array\" then \"✅ API token is valid for uploads!\" else \"❌ API token test failed\" end" || echo "❌ No API token found or invalid"'

# 🚀 Quick migration with fresh token
alias migrate-with-fresh-token='cd /root/api-gateway && node get-strapi-token.js && node migrate-local-files.js'

# 🎪 Show all Strapi-related aliases
alias strapi-help='echo "🎭 Strapi Token Management Commands:"; echo "  get-strapi-token     - Generate fresh admin JWT token"; echo "  show-strapi-token    - Display current admin token"; echo "  test-strapi-token    - Test admin token validity"; echo "  test-api-token       - Test API token for uploads"; echo "  migrate-with-fresh-token - Generate token and run migration"; echo "  strapi-help          - Show this help"; echo ""; echo "💡 For API token setup: cat setup-api-token.md"'

echo "🎉 Strapi token aliases loaded! Type 'strapi-help' for available commands."
