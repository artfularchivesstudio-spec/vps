# 🎭 How to Create an API Token for Uploads ✨

## Method 1: Manual (Recommended) 🎯

1. **Open Strapi Admin Panel**:
   ```bash
   # Make sure Strapi is running
   curl http://localhost:1337/admin
   ```
   Then visit: http://localhost:1337/admin

2. **Login** with admin credentials:
   - Email: `admin@api-router.cloud`
   - Password: `Admin123!`

3. **Navigate to API Tokens**:
   - Go to **Settings** (⚙️ icon in sidebar)
   - Click **API Tokens** under "Global Settings"

4. **Create New Token**:
   - Click **"Create new API Token"**
   - Name: `Migration Upload Token`
   - Description: `Token for file uploads via migration script`
   - Token type: **Full access**
   - Duration: **Unlimited**
   - Click **Save**

5. **Copy the Token**:
   - ⚠️ **IMPORTANT**: Copy the token immediately! It won't be shown again.
   - Save it to our token file:
   ```bash
   echo "YOUR_TOKEN_HERE" > /root/api-gateway/strapi-api-token.txt
   ```

## Method 2: Use Existing Full Access Token 🔄

Since we already have a "Full Access" token (ID: 2), you can:

1. **Regenerate the existing token** in the admin panel
2. **Copy the new token value** when shown
3. **Save it** to our file:
   ```bash
   echo "YOUR_REGENERATED_TOKEN" > /root/api-gateway/strapi-api-token.txt
   ```

## Method 3: Programmatic (Advanced) 🤖

Run our script to create a new token:
```bash
cd /root/api-gateway && node create-api-token.js
```

**Note**: The script creates the token but Strapi doesn't return the token value for security. You'll still need to copy it from the admin panel.

## Testing Your API Token 🧪

Once you have the token saved, test it:
```bash
# Test the token
curl -H "Authorization: Bearer $(cat /root/api-gateway/strapi-api-token.txt)" \
     http://localhost:1337/api/upload/files

# If it works, you should see either:
# - A list of files (if any exist)
# - An empty array []
# - A 404 (which is also fine, means the endpoint structure is different)
```

## Update Migration Script 🚀

Once you have the API token, our migration script will automatically use it:
```bash
# The script will look for strapi-api-token.txt first, then fall back to admin token
cd /root/api-gateway && node migrate-local-files.js
```

## Quick Commands 📋

```bash
# Check if API token exists
ls -la /root/api-gateway/strapi-*token.txt

# Show current tokens
cat /root/api-gateway/strapi-token.txt      # Admin token
cat /root/api-gateway/strapi-api-token.txt  # API token (if exists)

# Test API token
curl -s -H "Authorization: Bearer $(cat /root/api-gateway/strapi-api-token.txt)" \
     http://localhost:1337/api/upload/files | jq .
```

---

**🎉 Once you have the API token saved, we can finally upload all 229 audio files to Strapi! ✨**
