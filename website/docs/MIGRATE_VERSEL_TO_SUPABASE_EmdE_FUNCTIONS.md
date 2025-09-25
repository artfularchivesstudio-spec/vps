
MIGRATE_VERSEL_TO_SUPABASE_EDGE_FUNCTIONS

Purpose: Complete, copy-pasteable transformation guide to migrate ChatGPT Actions from a Vercel proxy to Supabase Edge Functions. Includes goals, why, exact commands, OpenAPI mapping guidance, logging/auth conventions (emoji), verification checklist, and example snippets you can drop into an IDE or PR description.
Note: Do NOT commit API keys or secrets. Use env vars / secret storage (see Security section).

---

TL;DR / Executive Summary
We are migrating the ChatGPT Actions integration off a Vercel proxy and pointing the Actions OpenAPI to our Supabase Edge Functions (https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1). This removes the fragile “extra hop” (HTML fallbacks, bypass cookies), simplifies authentication, reduces vendor coupling, and makes integration more deterministic and testable. Work should be done on a feature branch and validated in staging before production cutover.

---

Table of Contents
1. Problem statement
2. Goals & benefits
3. High-level plan
4. Branch & repo hygiene (exact commands)
5. Inventory Supabase functions (how to get a fresh view)
6. OpenAPI transformation (detailed instructions & examples)
7. ChatGPT Actions connector configuration (how to wire the token)
8. Security & secrets
9. Logging & auth everywhere (emoji convention + structured logs)
10. Verification checklist (what to check as you go)
11. Minimal smoke / sanity checks
12. CI snippet (basic)
13. PR description template & reviewer checklist
14. Rollout & rollback plan
15. Optional automation & next steps
16. Appendix: copyable snippets

---

1. Problem Statement
- We previously routed all ChatGPT Actions through a Vercel Next.js proxy, adding a second network hop, additional security tokens/cookies, and frontend-based HTML fallbacks.
- The Vercel hop created fragility, added maintenance, and made error handling difficult (e.g. HTML fallback, cookies, CORS headaches).
- Vendor lock-in risk: ChatGPT actions were tightly coupled to Vercel infrastructure.
- Our actual backend logic lives in Supabase edge functions—these should be the canonical API for Actions.

2. Goals & Benefits
- Remove Vercel as a required hop for ChatGPT Actions.
- Point all OpenAPI endpoints directly at Supabase edge functions.
- Achieve cleaner, simpler authentication (single Bearer token, no bypass header/cookie dance).
- Lower vendor coupling; easier future migration and API evolution.
- Deterministic, testable, “single source of truth” for all business logic.
- Fewer moving parts: easier debugging and logging.
- Leverage Supabase CLI and dashboard for clear function visibility.
- Make logging and authentication ubiquitous and fun (emoji logs! 🐶🐾).

3. High-Level Plan
- Create a new feature branch for this migration.
- Inventory all Supabase Edge Functions using the CLI or MCP (Merchant Control Panel).
- Review each function for OpenAPI mapping and compatibility with ChatGPT Actions.
- Remove all references to Vercel proxy or bypass headers from the OpenAPI spec.
- Point OpenAPI servers to Supabase Edge Functions URL.
- Update all authentication docs and boilerplate: require Bearer API key, header name “Authorization”.
- Add structured logging (with emojis everywhere!) for all edge function handlers.
- Validate all endpoints with ChatGPT Actions dev environment.
- Check off each function as verified; add smoke tests.
- Prepare PR, reviewer checklist, and rollout plan.

4. Branch & Repo Hygiene
- git checkout -b migrate-vercel-to-supabase-edge
- git pull origin main (or develop)
- Commit early, commit often. Use descriptive messages.

5. Inventory Supabase Functions
- Use Supabase CLI: `supabase functions list`
- Or MCP web UI: Go to Supabase project > Edge Functions > List
- (Optional) Pull all functions: `supabase functions pull`

6. OpenAPI Transformation (Detailed Instructions & Examples)
- For each path in the OpenAPI spec, remove Vercel-specific headers/parameters:
    - Remove x-vercel-protection-bypass, x-vercel-set-bypass-cookie
- Change `servers:` URL from Vercel to Supabase Edge Functions, e.g.:
    servers:
      - url: https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1
        description: Supabase Edge Functions (Production)
- Check all “in: header” or “in: query” params for Vercel-specific junk—remove.
- For authentication, require:
    - Type: API Key (Bearer token)
    - Header Name: Authorization
    - Example: Bearer chatgpt-actions-key-2025-SmL72KtB5WzgVbU
- Ensure each endpoint’s request/response matches what Supabase function actually emits.
- Document any differences between function behavior and OpenAPI.

7. ChatGPT Actions Connector Configuration
- In Actions UI, update endpoint base URL to point to Supabase.
- Paste API Key as Bearer token.
- Test with “Try it”/live playground.
- Document for team with updated screenshots, if needed.

8. Security & Secrets
- API keys must NOT be hardcoded or committed. Use .env or project secrets.
- Rotate API keys if previous keys were exposed.
- Use Supabase RBAC/policies for function access if possible.

9. Logging & Authentication Everywhere (with Emojis!)
- All new/updated Supabase edge functions should log incoming requests, auth headers, and critical state.
- Add emoji-based logs (e.g. 🐶 New Post Created! 🛡️ Auth OK, etc.)
- Log failed/invalid auth attempts (without leaking secrets).
- For MCP/backoffice UIs, display emoji logs for easier debugging.

10. Verification Checklist
- [ ] All Supabase functions inventoried and mapped to OpenAPI.
- [ ] OpenAPI servers updated to Supabase.
- [ ] All Vercel-specific params removed.
- [ ] Auth: Only Bearer token accepted.
- [ ] Actions connector works E2E in dev/staging.
- [ ] Logging visible in Supabase/MCP for all endpoints.
- [ ] Smoke test POST, GET, error paths for each function.
- [ ] Team docs updated.

11. Minimal Smoke/Sanity Checks
- Use `curl` or Postman to check GET/POST for each function with valid Bearer token.
- Validate 401/403 when token is missing/invalid.
- Check all expected fields in response.

12. CI Snippet (Basic)
- Add workflow to hit each function endpoint with Bearer token and validate response != 500/HTML.

13. PR Description Template & Reviewer Checklist
(see markdown in main document, if needed)

14. Rollout & Rollback Plan
- Roll out to dev/staging first.
- Coordinate cutover timing (communicate to Actions consumers).
- Roll back by reverting server URL and config if issues found.

15. Optional Automation & Next Steps
- Create GitHub Actions for deploy/validate.
- Add unit tests or contract tests for edge functions.

16. Appendix: Copyable Snippets
(Include curl, sample requests, sample logs, etc.)

---

7. ChatGPT Actions Connector Configuration (Updated)
- In Actions UI, update endpoint base URL to: `https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1`
- Set Authentication Type: `Bearer Token`
- Paste API Key as Bearer token (e.g., `chatgpt-actions-key-2025-SmL72KtB5WzgVbU`)
- Remove any Vercel-specific parameters (x-vercel-protection-bypass, x-vercel-set-bypass-cookie)
- Test with "Try it" using these sample requests:
  ```
  # List posts
  curl -X GET 'https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/posts-simple?limit=5' \
    -H "Authorization: Bearer chatgpt-actions-key-2025-SmL72KtB5WzgVbU"
  
  # Create post
  curl -X POST 'https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/posts-simple' \
    -H "Authorization: Bearer chatgpt-actions-key-2025-SmL72KtB5WzgVbU" \
    -H "Content-Type: application/json" \
    -d '{
      "title": "Test Post",
      "content": "This is a test post created via Supabase Edge Functions",
      "status": "draft"
    }'
  
  # Analyze image
  curl -X POST 'https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/ai-analyze-image' \
    -H "Authorization: Bearer chatgpt-actions-key-2025-SmL72KtB5WzgVbU" \
    -H "Content-Type: application/json" \
    -d '{
      "image_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jN77mgAAAABJRU5ErkJggg==",
      "analysis_type": "detailed"
    }'
  ```
- Document for team with updated screenshots showing the new configuration

11. Minimal Smoke/Sanity Checks (Updated)
- Use `curl` or Postman to check GET/POST for each function with valid Bearer token:
  ```
  # Verify all endpoints work with Supabase Edge Functions
  curl -X GET 'https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/posts-simple?limit=5' \
    -H "Authorization: Bearer chatgpt-actions-key-2025-SmL72KtB5WzgVbU"
  
  curl -X POST 'https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/ai-analyze-image' \
    -H "Authorization: Bearer chatgpt-actions-key-2025-SmL72KtB5WzgVbU" \
    -H "Content-Type: application/json" \
    -d '{"image_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jN77mgAAAABJRU5ErkJggg=="}'
  
  curl -X POST 'https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/ai-generate-audio-simple' \
    -H "Authorization: Bearer chatgpt-actions-key-2025-SmL72KtB5WzgVbU" \
    -H "Content-Type: application/json" \
    -d '{"text": "Test audio generation", "provider": "elevenlabs"}'
  ```
- Validate 401/403 when token is missing/invalid:
  ```
  # Should return 401 Unauthorized
  curl -X GET 'https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/posts-simple?limit=5'
  
  # Should return 401 Unauthorized
  curl -X GET 'https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/posts-simple?limit=5' \
    -H "Authorization: Bearer invalid-token"
  ```
- Check all expected fields in response
- Run the updated test script: `CHATGPT_ACTIONS_API_KEY=your_key node scripts/test-chatgpt-actions.js`

13. PR Description Template & Reviewer Checklist (Updated)

## Migration from Vercel Proxy to Supabase Edge Functions

### Summary
This PR migrates all ChatGPT Actions integrations from a Vercel proxy API to direct Supabase Edge Functions. This eliminates extra network hops, vendor lock-in, and Vercel-specific hacks, while improving reliability, simplicity, and security.

### Changes
- Updated OpenAPI spec to point directly to Supabase Edge Functions
- Removed all Vercel-specific parameters and headers
- Added emoji-based structured logging to all Edge Functions
- Enforced Bearer token authentication across all endpoints
- Updated test scripts to work with Supabase Edge Functions
- Documented migration steps and verification procedures

### Verification Checklist
- [x] All Supabase functions inventoried and mapped to OpenAPI
- [x] OpenAPI servers updated to Supabase Edge Functions
- [x] All Vercel-specific parameters removed
- [x] Bearer token authentication enforced on all endpoints
- [x] Emoji-based logging added to all Edge Functions
- [x] Test script updated and verified working
- [x] Smoke tests performed for all endpoints
- [x] 401/403 responses verified for invalid/missing tokens

### Testing Instructions
1. Run the test script: `CHATGPT_ACTIONS_API_KEY=your_key node scripts/test-chatgpt-actions.js`
2. Verify all tests pass
3. Manually test endpoints using curl/Postman:
   ```
   curl -X GET 'https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1/posts-simple?limit=5' \
     -H "Authorization: Bearer your_key"
   ```
4. Verify emoji logs appear in Supabase logs

### Rollout Plan
- Deploy to staging first
- Update ChatGPT Actions connector configuration in staging environment
- Validate all functionality works as expected
- Coordinate production cutover with team
- Update production ChatGPT Actions connector configuration

### Rollback Plan
- Revert OpenAPI spec to previous version
- Update ChatGPT Actions connector configuration back to Vercel URL
- Verify all functionality restored

14. Rollout & Rollback Plan (Updated)
- Roll out to dev/staging first
- Update ChatGPT Actions connector configuration in dev/staging:
  * Base URL: `https://tjkpliasdjpgunbhsiza.supabase.co/functions/v1`
  * Authentication: Bearer Token
  * API Key: `chatgpt-actions-key-2025-SmL72KtB5WzgVbU`
- Validate all functionality works as expected in dev/staging
- Coordinate production cutover timing (communicate to Actions consumers)
- Update production ChatGPT Actions connector configuration
- Monitor for 24 hours for any issues
- Roll back by:
  * Reverting OpenAPI spec changes
  * Updating ChatGPT Actions connector configuration back to Vercel URL
  * Verifying all functionality restored

If you see any endpoint or function lacking logging or proper auth, add it! 🐕
