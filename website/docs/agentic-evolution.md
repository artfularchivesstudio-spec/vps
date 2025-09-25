# Agentic Evolution Plan

## Overview
This document outlines how Artful Archives Studio will mature its multi-agent system from simple greetings to a productive fleet. Each agent taps into existing edge functions, ChatGPT Actions, and third‑party APIs so work feels like magic rather than manual drudgery.

## Agents & Toolboxes

### 1. Content Creation Agent
- **Tools**
  - Supabase Edge Functions: `posts-simple`, `ai-analyze-image`, `ai-generate-audio`
  - ChatGPT Actions via `openapi-chatgpt-actions.yaml`
  - Supabase Storage for images & audio
- **Responsibilities**
  - CRUD for blog posts, images, and metadata
  - Image analysis & caption generation
  - Text-to-speech for accessibility & reels narration
- **Sample Workflow**
  1. Admin uploads an image → agent calls `ai-analyze-image`
  2. Draft blog content from analysis → store via `posts-simple`
  3. Generate audio narration → save to Storage
  4. Notify Social & Product agents about new assets

### 2. Product Creation Agent
- **Tools**
  - PSD template factory for phone cases, canvases, prints
  - Printify & Gelato APIs for merchandise
  - Supabase Storage for mockups
- **Responsibilities**
  - Turn approved art into merch-ready files
  - Sync product listings and metadata
- **Sample Workflow**
  1. Receive finalized artwork from Content agent
  2. Apply design to PSD templates
  3. Export variants → send to Printify/Gelato
  4. Store listing info back in Supabase

### 3. Social Media Content Agent
- **Tools**
  - Platform SDKs (IG, X, TikTok, Pinterest, Facebook)
  - Scheduling APIs & content calendar
- **Responsibilities**
  - Generate platform-optimized captions & hashtags
  - Schedule posts and monitor engagement
- **Sample Workflow**
  1. Pull assets & copy from Content agent
  2. Create short-form snippets (reels, shorts)
  3. Schedule across platforms
  4. Report post URLs to Data Analysis agent

### 4. Advertising Agent
- **Tools**
  - Meta Ads, Google Ads, TikTok Ads APIs
  - Budget manager & A/B test harness
- **Responsibilities**
  - Craft ad creatives and allocate spend
  - Monitor ROAS and suggest adjustments
- **Sample Workflow**
  1. Consume top-performing content from Social agent
  2. Generate ad variants & allocate budgets
  3. Launch campaigns → track metrics
  4. Feed performance to Data Analysis agent

### 5. Social Media Data Analysis Agent
- **Tools**
  - Platform analytics APIs
  - Supabase for logging & dashboards
- **Responsibilities**
  - ETL metrics, surface trends, send alerts
- **Sample Workflow**
  1. Collect engagement data
  2. Normalize & store in Supabase
  3. Generate insights for Content & Advertising agents
  4. Trigger alerts for anomalies

### 6. Competitor Analysis Agent
- **Tools**
  - Web scrapers & RSS monitors
  - NLP models for summarization
- **Responsibilities**
  - Track competitor content & strategy
  - Produce SWOT-style briefs
- **Sample Workflow**
  1. Crawl competitor sites and social feeds
  2. Summarize themes & performance
  3. Update shared knowledge base
  4. Suggest differentiation angles to Content agent

## Orchestration & Human-in-the-Loop
- **Orchestrator**: An Archon-style manager delegates tasks, maintains shared memory (vector DB), and observes agent updates.
- **Human Admin (“Mom”)**
  - Approves drafts, resolves conflicts, and nudges priorities via the admin dashboard.
  - Acts as final arbiter when agents disagree or need creative direction.

## End-to-End Collaboration
1. **Inspiration**: Mom uploads art → Content agent analyzes & drafts post.
2. **Derivatives**: Product agent creates merch; Social agent prepares clips & posts.
3. **Promotion**: Advertising agent launches campaigns using Social agent assets.
4. **Feedback Loop**: Data Analysis agent reports performance; Competitor agent offers new ideas.
5. **Iteration**: Orchestrator and Mom review insights, set next tasks, and the cycle repeats.

## Implemented Content Campaign Workflow
- The orchestrator now ships with a `runContentCampaign` helper that chains content generation, social scheduling, merch templating, ad launching, metric harvesting, and competitor snooping in one sweep.
- Tests exercise this pipeline end-to-end so future changes won't break the conga line. 🪇

## Next Steps
- Expand agents from placeholders to full implementations using existing edge functions.
- Add cross-agent messaging (WebSockets or queue) for real-time coordination.
- Introduce n8n workflows as fallback/human-friendly interfaces.
