# Multi-Agent Implementation Plan

## Overview
This blueprint charts how Artful Archives Studio's agents evolve from polite placeholders into production-grade performers. Each section flags what we can tackle immediately versus what demands extra gear or credentials.

## 1. Real Tool Logic
### Implement Now
- Wire ContentAgent to existing Supabase edge functions for image upload, blog CRUD, audio generation, and 📝 text polishing.
- Stub video-slicing helper for TikTok/IG Reels using placeholder `ffmpeg` calls.
- Scaffold ProductAgent exports that call Printify/Gelato endpoints behind feature flags.
- Provide SocialMediaAgent shims that queue posts with mock schedulers per platform.

### Needs Dependencies
- Actual `ffmpeg` binary or hosted video service for short-form clips.
- Valid API keys and sandbox stores for Printify, Gelato, Meta, X, TikTok, Pinterest, and Facebook.
- Ad platform SDKs (Meta Ads, Google Ads, TikTok Ads) for the AdvertisingAgent cannons.
- Analytics APIs (e.g., Sprout, Hootsuite) for data crunching.
- Headless browser or scraping service for CompetitorAnalysisAgent spies.

## 2. Cross-Agent Memory & Messaging
### Implement Now
- Define `MemoryStore` interface and in-memory mock using `Map` + cosine similarity; add 🪁 event bus wrapper with Node's `EventEmitter`.
- Draft schemas for a `tasks` table and `events` channel in Supabase for lightweight coordination.

### Needs Dependencies
- Enable `pgvector` in Supabase or provision external vector DB (Pinecone, Weaviate).
- Choose a real message broker (NATS, RabbitMQ, Supabase Realtime) and provision infra.
- Design message schemas, retry policies, and dead-letter queues.

## 3. Environment & CI Setup
### Implement Now
- Commit `.envrc` template and document `direnv allow` ritual.
- Extend GitHub Actions to run `npm run lint`, `npm test`, `npx vitest run src/__tests__/agents/*.test.ts`, and Supabase deploys with `--no-verify-jwt`.
- Cache node_modules and Playwright browsers to speed builds.

### Needs Dependencies
- Playwright system libraries baked into CI image (or Docker layer).
- Secrets management for API keys and service role tokens.
- Optional: self-hosted runners for heavyweight video/audio jobs.

## 4. Human-in-the-Loop ("Mom" UI)
### Implement Now
- Create `/admin/approvals` page listing pending agent outputs with ✅/❌ buttons.
- Expose REST hooks (`/api/approvals/:taskId`) so agents pause until Mom grants passage.

### Needs Dependencies
- Notification channel (email, SMS, or Slack) for approval pings.
- Role-based access control to keep scallywags out of the helm.

## 5. E2E & Integration Tests
### Implement Now
- Mock external APIs and Supabase functions with `msw` or `nock` for deterministic Vitest runs.
- Craft Playwright scripts that spin up Next.js, walk through the content campaign wizard, and assert pixel-perfect treasure.

### Needs Dependencies
- Stable seeded database snapshot for repeatable integration voyages.
- Test accounts on social/ad platforms for full-stack E2E shakedowns.

## Implementation Order
1. **ContentAgent** – polish blog → audio → video loop first.
2. **SocialMediaAgent** – schedule posts from content payloads.
3. **ProductAgent** – generate merch templates once content flow is solid.
4. **AdvertisingAgent** – launch campaigns off approved posts.
5. **SocialMediaDataAgent** – analyze engagement to inform next iterations.
6. **CompetitorAnalysisAgent** – keep watch on rival ships.

## Alternative Routes & Counter-Arguments
- **Single Mega-Agent**: simpler coordination, but risks spaghetti responsibilities and tougher scaling.
- **Workflow Engines**: Temporal, n8n, or CrewAI could replace custom orchestration—less code, more vendor lock-in.
- **Decentralized Memory**: each agent keeps private notes for resilience, at cost of shared context.
- **RLHF Later**: reinforcing agents with feedback loops increases quality but demands labeled data.

## Closing Thoughts
Ship one agent at a time, test it like a seasoned deckhand, and only then invite fancy frameworks or RLHF parrots aboard. ⚓
