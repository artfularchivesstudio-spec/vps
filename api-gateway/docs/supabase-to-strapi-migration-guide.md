# Complete Supabase to Strapi Migration Guide

## Server Access Details
- **SSH Host:** hostinger-vps
- **SSH User:** root
- **SSH Port:** 22 (standard)
- **Authentication:** SSH key (recommended) or password (if set). If using key, ensure it's added to your SSH agent: `ssh-add /path/to/key.pem`.
- **Directory:** The project is in `/root/api-gateway/`.

## Strapi API Details
- **API Endpoint:** `https://api-router.cloud/api/`
- **API Token:** `ef06327ae7d04552068a4a012be62bd13a03872a8fe3b5b68e01cca13f1cdf403beea247180518f732a817745896b6fd0fa5fd68068b4a878477f1ffdb3976dbbe05b272dc1b4fd39963d1bcde8906b0091a98469edee7787c3d1913edd4a8819764ad0d6e9de5f05b4316de28d663d275b9700c0a9a3fe37c4c8ad5a8e0c98d`
  - This is a full-access token. Store it securely in your project's environment variables (e.g., `STRAPI_TOKEN=...` in `.env`).
  - Regenerate it in Strapi admin (`https://api-router.cloud/admin/settings/api-tokens`) after migration for security.
- **CORS Configuration:** Allows all origins, methods, and headers for external access.
- **Admin Panel:** `https://api-router.cloud/admin` (login: admin@api-router.cloud / password: Admin123! - reset if needed).

## Prerequisites
- SSH access to hostinger-vps.
- Your Supabase project details (host, database name, username, password).
- PostgreSQL client tools (pg_dump, psql) installed on your local machine or the server.
- Node.js/npm if using Strapi CLI for import (optional for ETL scripts).

## Step 1: SSH into the Server
1. From your local machine, open a terminal.
2. Connect via SSH:
   ```
   ssh root@hostinger-vps -p 22
   ```
   - If using a key: `ssh -i /path/to/key.pem root@hostinger-vps`.
   - Enter password if prompted (avoid hardcoding; use key for security).
3. Navigate to the project:
   ```
   cd /root/api-gateway
   ```

## Step 2: Review Relevant Documentation
1. **Main Migration Guide:** Read the detailed guide:
   ```
   cat docs/supabase-to-strapi-migration.md
   ```
   - It covers data export, schema mapping, import, relationships, and testing.

2. **Strapi API Documentation:** Check the README:
   ```
   cat README.md
   ```
   - API usage, authentication with the token above.

3. **Environment Configuration:** View Strapi env:
   ```
   cat strapi/.env
   ```
   - Database: PostgreSQL (`localhost:5432`, user: `strapi`, password: `strapi_password`, db: `strapi`).
   - API Token: Copy the `API_TOKEN` value for your project's API calls.

4. **Database Schema:** Connect to Strapi's PostgreSQL to see current tables:
   ```
   docker exec -it postgres psql -U strapi -d strapi -c "\dt"
   ```
   - This lists existing tables. Map your Supabase tables to these or create new content types in Strapi admin.

5. **Strapi Admin Panel:** Access to create/modify content types:
   - URL: `https://api-router.cloud/admin`
   - Login: admin@api-router.cloud / Admin123!
   - Use to build schema matching Supabase (Content-Type Builder > create types like "User", "Post").

## Step 3: Prepare Supabase Data (On Your Local Machine or Server)
1. Install PostgreSQL client if needed (on server):
   ```
   sudo apt update && sudo apt install postgresql-client
   ```

2. Export from Supabase (replace placeholders with your Supabase details):
   ```
   pg_dump -h [SUPABASE_HOST] -U [SUPABASE_USER] -d [SUPABASE_DB_NAME] --no-owner --no-privileges > supabase_dump.sql
   ```
   - For data only: Add `--data-only`.
   - For specific tables: Add `-t table_name` (e.g., `-t users`).
   - If exporting locally, transfer to server: `scp supabase_dump.sql root@hostinger-vps:/root/api-gateway/`.

## Step 4: Perform the Migration (On Server)
Follow the steps in `docs/supabase-to-strapi-migration.md`:

1. **Stop Strapi** (to avoid conflicts):
   ```
   pm2 stop strapi-api
   ```

2. **Import Data (Direct SQL - Recommended)**:
   - Connect to Strapi's DB:
     ```
     docker exec -it postgres psql -U strapi -d strapi
     ```
   - Inside psql, import:
     ```
     \i /root/api-gateway/supabase_dump.sql
     ```
   - Exit: `\q`.
   - Handle ID conflicts: Edit dump to match Strapi IDs or use scripts (see guide's ETL example).

3. **Schema Mapping in Strapi Admin**:
   - Login to `https://api-router.cloud/admin`.
   - Content-Type Builder: Create types matching Supabase tables (fields, relations).
   - Settings > Roles & Permissions: Grant "Public" or "Authenticated" access to types.
   - API Tokens: Ensure token has "find", "create", "update" permissions.

4. **Alternative: Strapi CLI Import (JSON Format)**:
   - Convert SQL to JSON (use tools or script).
   - Run:
     ```
     cd /root/api-gateway/strapi
     npm run strapi import --file supabase_data.json
     ```

5. **Map Relationships**:
   - Use Strapi admin or API (example):
     ```
     curl -X PUT "https://api-router.cloud/api/posts/1" \
       -H "Authorization: Bearer ef06327ae7d04552068a4a012be62bd13a03872a8fe3b5b68e01cca13f1cdf403beea247180518f732a817745896b6fd0fa5fd68068b4a878477f1ffdb3976dbbe05b272dc1b4fd39963d1bcde8906b0091a98469edee7787c3d1913edd4a8819764ad0d6e9de5f05b4316de28d663d275b9700c0a9a3fe37c4c8ad5a8e0c98d" \
       -H "Content-Type: application/json" \
       -d '{"data":{"user":{"connect":[1]}}}'
     ```

6. **Start Strapi**:
   ```
   pm2 start strapi-api
   ```

## Step 5: Validate and Test
1. **Verify Data**:
   ```
   curl -X GET "https://api-router.cloud/api/users" \
     -H "Authorization: Bearer ef06327ae7d04552068a4a012be62bd13a03872a8fe3b5b68e01cca13f1cdf403beea247180518f732a817745896b6fd0fa5fd68068b4a878477f1ffdb3976dbbe05b272dc1b4fd39963d1bcde8906b0091a98469edee7787c3d1913edd4a8819764ad0d6e9de5f05b4316de28d663d275b9700c0a9a3fe37c4c8ad5a8e0c98d"
   ```
   - Compare with Supabase data.

2. **Test Relationships/Endpoints**:
   - Use API calls to check integrity.
   - Logs: `pm2 logs strapi-api`.

3. **Update Your Project**:
   - Replace Supabase URLs with `https://api-router.cloud/api/[type]`.
   - Add auth header: `Authorization: Bearer ef06327ae7d04552068a4a012be62bd13a03872a8fe3b5b68e01cca13f1cdf403beea247180518f732a817745896b6fd0fa5fd68068b4a878477f1ffdb3976dbbe05b272dc1b4fd39963d1bcde8906b0091a98469edee7787c3d1913edd4a881976