# 🎭 **ARTFUL ARCHIVES STUDIO - PROJECT MAP**
*"A mystical guide to our digital gallery, where every file finds its perfect place in the grand exhibition of code."*

## 🏛️ **THE GRAND CURATOR'S VISION**

This document serves as the mystical map of our Artful Archives Studio project, guiding developers through the newly organized structure that transforms chaos into clarity. Here, every file finds its rightful place in our digital gallery, ensuring maintainability, scalability, and artistic excellence.

---

## 📂 **CURRENT ORGANIZED STRUCTURE**

### **🏠 Root Directory (`/`)**
*Essential files that remain at the project's foundation*

#### **Configuration & Build Files**
- `.eslintrc.json` - ESLint configuration
- `.gitignore` - Git ignore patterns
- `.last_backup` - Backup tracking
- `.nvmrc` - Node version specification
- `next-env.d.ts` - Next.js TypeScript declarations
- `next.config.mjs` - Next.js configuration
- `package-lock.json` - NPM lock file
- `package.json` - Project dependencies and scripts
- `playwright.config.ts` - E2E testing configuration
- `postcss.config.mjs` - PostCSS configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tailwind.config.ts` - Tailwind CSS TypeScript config
- `tsconfig.json` - TypeScript configuration
- `tsconfig.tsbuildinfo` - TypeScript build info
- `vercel.json` - Vercel deployment configuration
- `vitest.config.mts` - Vitest testing configuration
- `vitest.setup.ts` - Vitest setup file

#### **Environment & Secrets**
- `.env` - Environment variables (local)
- `.env.backup*` - Environment backups
- `.env.local.example` - Environment template
- `.env.test` - Test environment variables
- `.envrc` - Environment configuration

#### **Documentation (Root Level)**
- `🛡️ AGENTS.md` - AI agent personas and workflows
- `CLAUDE.md` - Claude Code integration guide
- `README.md` - Project overview and setup
- `project-map.md` - This file (organizational guide)

#### **IDE & Editor Configurations**
- `.claude/` - Claude-specific configurations
- `.cursor/` - Cursor IDE configurations
- `.kilocode/` - Kilo Code configurations
- `.trae/` - Trae IDE configurations
- `.vscode/` - Visual Studio Code configurations

---

### **🎨 Assets Directory (`assets/`)**
*Visual and media resources for the digital gallery*

#### **📸 Screenshots (`assets/screenshots/`)**
- `admin-*.png` - Admin dashboard screenshots
- `template-system-*.png` - Template system screenshots

#### **🎵 Audio Files (`assets/audio/`)**
- Audio samples and media files

#### **🎬 Media Files (`assets/media/`)**
- `main-content.png` - Content media files
- `0829(1).srt` - Subtitle files

---

### **⚙️ Configuration Directory (`config/`)**
*Workflows, APIs, and system configurations*

#### **🔧 OpenAPI Specifications (`config/openapi/`)**
- `openapi-*.yaml` - API specifications for various agents

#### **🔄 Workflows (`config/workflows/`)**
- `artful-archives-*.json` - N8N workflow configurations
- `agents-n8n-workflows.json` - Agent workflow definitions

#### **📝 Templates (`config/templates/`)**
- Content and configuration templates

---

### **🗄️ Database Directory (`database/`)**
*Database-related files and backups*

#### **💾 Backups (`database/backups/`)**
- `db_backup_*.sql*` - Database backup files
- `*.backup.gz` - Compressed database backups

#### **📊 Schemas (`database/schemas/`)**
- Database schema definitions

#### **🔄 Migrations (`database/migrations/`)**
- Database migration files

---

### **📚 Documentation Directory (`docs/`)**
*Comprehensive project documentation and guides*

#### **📖 Core Documentation**
- `README.md` - **NEW**: Comprehensive project overview with artistic theme
- `SETUP-GUIDE.md` - Complete setup and configuration guide
- `GETTING-STARTED.md` - Quick local development setup
- `FEATURES.md` - Current features and capabilities overview

#### **🔌 API & Integration (`docs/api/`)**
- API reference and integration guides
- REST API endpoints documentation
- External service integrations

#### **🤖 AI & Automation (`docs/ai/`)**
- AI integration documentation
- Custom GPT setup guides
- Automation workflows

#### **🔌 MCP (`docs/mcp/`)**
- `claude-desktop-config.md` - Hook up Claude Desktop as an MCP client
- `codex-cli-config.md` - CLI setup for the MCP Codex client
- `smithery-setup.md` - Run servers inside Smithery, hammer optional 🔨

#### **🏗️ Architecture (`docs/architecture/`)**
- System architecture documentation
- Database schemas and designs
- Component architecture guides

#### **🧪 Testing (`docs/testing/`)**
- Testing methodologies and guides
- E2E testing documentation
- Quality assurance procedures

#### **📚 Legacy Documentation (`docs/legacy/`)**
*Outdated or superseded documentation*
- `supabase-cli-README.md` - **MOVED**: Former Supabase CLI documentation
- Historical documentation preserved for reference

#### **📋 Project Management**
- `ROADMAP.md` - Project roadmap and future plans
- `CHANGELOG.md` - Version history and updates
- `POST_MERGE_CHECKLIST.md` - Post-deployment procedures

#### **🔧 Technical Documentation**
- `ADMIN-AUTHENTICATION.md` - Admin authentication guide
- `API-KEYS.md` - API key management
- `CHATGPT-ACTIONS-SETUP.md` - ChatGPT integration
- `custom-gpt-integration.md` - Custom GPT setup
- `database-schema-*.sql` - Database schemas
- `MIGRATE_*.md` - Migration guides
- `SUPABASE_FUNCTIONS_MAP.md` - Supabase functions reference
- `TESTING_MULTILINGUAL_AUDIO.md` - Audio testing guide
- `tts-integration-architecture.md` - TTS architecture
- `IMAGE-ANALYSIS-ARCHITECTURE.md` - Image analysis docs
- `mcp-vs-chatgpt-actions-comparison.md` - MCP vs ChatGPT comparison
- `testing-guide-mcp-vs-chatgpt.md` - Testing methodologies
- `edge-functions-setup.md` - Edge functions setup
- `google-sheets-setup.md` - Google Sheets integration
- `headless-cms-architecture.md` - CMS architecture
- `design_system_audit.md` - Design system audit
- `project_analysis_report_2025-08-29.md` - Project analysis
- `Analysis_8_29_25_GLM-4.5-Air.md` - AI analysis reports

#### **🎨 Artistic Documentation**
- `ARTISTIC_CODING_MANIFESTO*.md` - Coding philosophy and principles
- Design system documentation
- UI/UX guidelines and standards

---

### **📊 Logs Directory (`logs/`)**
*System logs and debug information*

#### **🐛 Debug Logs (`logs/debug/`)**
- `audio_analysis.log` - Audio processing logs
- `response.json` - API response logs
- `regeneration_results_*.json` - Content regeneration logs

#### **📈 Analysis Logs (`logs/analysis/`)**
- Analysis and performance logs

#### **📋 Report Logs (`logs/reports/`)**
- Generated reports and analytics

---

### **⚡ Scripts Directory (`scripts/`)**
*Utility scripts and automation tools*

#### **🔧 Utility Scripts**
- `analyze-and-fix-posts.js` - Post analysis and fixing
- `check-audio-languages.js` - Audio language validation
- `create-sample-data.js` - Sample data generation
- `debug-api-response.js` - API debugging
- `debug-posts-audio.js` - Audio debugging
- `demo-translation-system.js` - Translation demos
- `demo-whimsical-logging.js` - Logging demonstrations
- `DEPLOY_MIGRATION*.sql` - Deployment migrations
- `fix_rls_policies.sql` - Security policy fixes
- `fix-audio-processing.js` - Audio processing fixes
- `goal-plan.md` - Goal planning documents
- `insert-api-key.js` - API key management
- `process-pending-jobs.js` - Job processing
- `query-post.js` - Post querying utilities
- `regeneration_results_*.json` - Regeneration results
- `translate-and-tts-posts.js` - Translation and TTS
- `trigger-bulk-processing.js` - Bulk processing triggers

#### **🔐 Setup Scripts**
- `setup-environment-variables.sh` - Environment setup

#### **🧪 Test Scripts**
- `test-*.js` - Various test utilities
- `admin-login-test.js` - Admin login testing

---

### **🧪 Tests Directory (`tests/`)**
*Testing framework and test files*

#### **🔬 Test Results (`tests/results/`)**
- Test execution results and reports

#### **📊 Test Reports (`tests/reports/`)**
- Test coverage and performance reports

---

### **📦 Source Directory (`src/`)**
*Main application source code*

#### **🌐 Application (`src/app/`)**
- Next.js App Router structure
- API routes and page components
- `/api/graphql` – experimental GraphQL gateway for posts

#### **🧩 Components (`src/components/`)**
- Reusable UI components

#### **🔧 Libraries (`src/lib/`)**
- Utility libraries and configurations

#### **🎭 Mocks (`src/mocks/`)**
- Mock data for development

#### **📋 Types (`src/types/`)**
- TypeScript type definitions

#### **🪝 Hooks (`src/hooks/`)**
- Custom React hooks

#### **🧪 Tests (`src/__tests__/`)**
- Unit and integration tests

---

### **🎨 Public Directory (`public/`)**
*Static assets served directly*

#### **🖼️ Images**
- Public images and media files

#### **🎯 Favicons**
- Website icons and favicons

---

### **⚡ Supabase Directory (`supabase/`)**
*Supabase backend configuration*

#### **🔧 Functions (`supabase/functions/`)**
- Supabase Edge Functions

#### **🗄️ Migrations (`supabase/migrations/`)**
- Database migrations

#### **⚙️ Configuration**
- Supabase project configuration

---

## 🎯 **FILE PLACEMENT GUIDELINES**

### **🏠 Root Directory Guidelines**
**Keep these files at root level:**
- Configuration files (`.eslintrc.json`, `tsconfig.json`, etc.)
- Package management (`package.json`, `package-lock.json`)
- Environment files (`.env*`)
- Essential documentation (`README.md`, `CLAUDE.md`, `AGENTS.md`)
- Build and deployment configs (`vercel.json`, `next.config.mjs`)

### **📂 Assets Directory Guidelines**
**Place in `assets/`:**
- Screenshots and visual documentation
- Audio samples and media files
- Design assets and prototypes
- Marketing materials

### **⚙️ Config Directory Guidelines**
**Place in `config/`:**
- API specifications (OpenAPI, GraphQL schemas)
- Workflow definitions (N8N, GitHub Actions)
- Template configurations
- System integration configs

### **🗄️ Database Directory Guidelines**
**Place in `database/`:**
- Database backup files
- Schema definitions
- Migration scripts
- Seed data files

### **📚 Docs Directory Guidelines**
**Place in `docs/`:**
- User guides and tutorials
- API documentation
- Architecture decisions
- Integration guides
- Troubleshooting guides

### **📊 Logs Directory Guidelines**
**Place in `logs/`:**
- Application logs
- Debug output files
- Performance metrics
- Error reports
- Analysis results

### **⚡ Scripts Directory Guidelines**
**Place in `scripts/`:**
- Build and deployment scripts
- Database maintenance scripts
- Development utilities
- Automation scripts
- Setup and configuration scripts

### **🧪 Tests Directory Guidelines**
**Place in `tests/`:**
- End-to-end test files
- Integration test suites
- Performance test scripts
- Test configuration files
- Test data and fixtures

---

## 🔄 **MIGRATION WORKFLOW**

### **For New Files**
1. **Identify the file type and purpose**
2. **Consult this map to determine the correct location**
3. **Create subdirectories as needed**
4. **Update this document if new categories emerge**

### **For Existing Files**
1. **Review current file locations**
2. **Move files to appropriate directories**
3. **Update any import paths or references**
4. **Test that the application still functions correctly**

---

## 🎭 **THE CURATOR'S PROMISE**

*"In this grand gallery of code, every file shall find its perfect place, creating harmony from chaos and beauty from organization. May this map serve as your guide through our digital masterpiece, ensuring that future generations of developers can navigate our creation with the same wonder and clarity that we bestow upon it today."*

---

## 📋 **MAINTENANCE CHECKLIST**

- [ ] Review file placements quarterly
- [ ] Update this document when new directories are added
- [ ] Ensure all team members understand the organization
- [ ] Validate that build processes work with new structure
- [ ] Update CI/CD pipelines if necessary
- [ ] Document any exceptions to these guidelines

---

*Last updated: September 9, 2025*
*Major reorganization completed: File structure consolidated and documentation updated*
*Curated by: The Spellbinding Museum Director of Code*