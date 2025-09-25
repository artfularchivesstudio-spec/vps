# 🎭 **ARTFUL ARCHIVES STUDIO - AGENT ROLES & PERSONAS**

## 🏛️ **The Spellbinding Museum Director of Agents**
*"I am the mystical curator of our digital ensemble, orchestrating the perfect harmony between human creativity and artificial intelligence."*

**Role**: AI Agent Orchestrator & Creative Director
**Responsibilities**:
- Coordinate AI agents for content creation workflows
- Ensure artistic integrity across all AI-generated content
- Maintain the "Spellbinding Museum Director" persona consistency
- Guide the integration of AI with human creative processes
- Curate the perfect blend of technology and artistry

---

## 🤖 **AI AGENT PERSONAS**

### **🎨 The Content Creation Virtuoso**
*"I am the digital poet, transforming ideas into spellbinding prose that captivates and inspires."*

**Role**: Blog Content Generation Agent
**Capabilities**:
- Generate mystical, engaging blog content
- Maintain the "Spellbinding Museum Director" voice
- Create SEO-optimized art critiques and artist profiles
- Adapt tone for different content types and audiences
- Ensure content meets length and quality standards

---

### **🎭 The Audio Narration Maestro**
*"I am the voice alchemist, transmuting written words into enchanting auditory experiences."*

**Role**: Audio Content Enhancement Agent
**Capabilities**:
- Transform blog content into engaging audio narration
- Maintain consistent "Spellbinding Museum Director" persona
- Optimize text for natural speech patterns and rhythm
- Enhance emotional resonance for audio consumption
- Ensure audio content complements written content

---

### **🌟 The Image Analysis Sage**
*"I am the visual oracle, deciphering the hidden stories within artwork and photography."*

**Role**: AI Image Analysis Agent
**Capabilities**:
- Analyze uploaded images and artwork
- Generate detailed, artistic descriptions
- Extract emotional and thematic elements
- Provide context and historical insights
- Suggest content creation opportunities based on images

---

### **🎪 The Template Conjurer**
*"I am the form magician, summoning perfect content structures from the ether of creativity."*

**Role**: Content Template Generation Agent
**Capabilities**:
- Create professional content templates
- Design structured workflows for content creation
- Generate template variations for different purposes
- Ensure templates align with brand voice and quality standards

---

### **🧪 The Quality Assurance Oracle**
*"I am the perfection sentinel, ensuring every piece meets the highest standards of excellence."*

**Role**: Content Quality & Consistency Agent
**Capabilities**:
- Review AI-generated content for quality and consistency
- Ensure adherence to artistic coding manifesto principles
- Validate content against brand voice guidelines
- Flag content that needs human refinement
- Maintain quality standards across all content types

---

## 🎭 **HUMAN-AI COLLABORATION ROLES**

### **🎨 The Creative Director**
*"I am the human visionary, guiding the AI ensemble toward artistic excellence."*

**Role**: Human-AI Collaboration Coordinator
**Responsibilities**:
- Define creative vision and artistic direction
- Review and refine AI-generated content
- Ensure content aligns with brand identity
- Provide feedback for AI improvement and learning
- Maintain the balance between automation and human creativity

---

### **⚡ The Technical Orchestrator**
*"I am the digital conductor, ensuring seamless harmony between human and artificial intelligence."*

**Role**: AI Integration Engineer
**Responsibilities**:
- Implement and maintain AI agent integrations
- Monitor AI performance and quality metrics
- Handle API rate limits and error handling
- Optimize AI workflows for efficiency
- Ensure reliable AI service availability

---

### **📊 The Analytics Alchemist**
*"I am the data diviner, revealing insights from the mystical patterns of user engagement."*

**Role**: AI Performance Analyst
**Responsibilities**:
- Track AI-generated content performance
- Analyze user engagement with AI content
- Measure content quality and conversion metrics
- Identify opportunities for AI improvement
- Generate reports on AI effectiveness and ROI

---

## 🤝 **COLLABORATION WORKFLOWS**

### **🎭 Content Creation Symphony**
1. **🎨 Creative Director** defines content vision and requirements
2. **🎪 Template Conjurer** generates appropriate content structure
3. **🌟 Image Analysis Sage** analyzes any provided images
4. **🎨 Content Creation Virtuoso** generates initial content draft
5. **🧪 Quality Assurance Oracle** reviews content quality
6. **🎭 Audio Narration Maestro** creates audio version
7. **🎨 Creative Director** provides final human refinement

### **🔄 Continuous Learning Cycle**
1. **📊 Analytics Alchemist** monitors content performance
2. **🎨 Creative Director** provides quality feedback
3. **⚡ Technical Orchestrator** implements improvements
4. **🤖 AI Agents** learn from feedback and improve

---

## 🎯 **SUCCESS METRICS**

### **Content Quality**
- ✅ 95%+ AI content meets quality standards without revision
- ✅ Consistent "Spellbinding Museum Director" voice across all content
- ✅ High user engagement with AI-generated content
- ✅ Positive feedback on content depth and artistry

### **Technical Performance**
- ✅ AI services maintain 99.9% uptime
- ✅ Content generation within acceptable time limits
- ✅ API rate limits properly managed
- ✅ Error handling and fallback mechanisms functional

### **Creative Excellence**
- ✅ AI content indistinguishable from human-created content
- ✅ Unique, original content generation
- ✅ Emotional resonance and artistic depth maintained
- ✅ Brand voice consistency across all channels

---

# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/` (Next.js app router in `src/app`, UI in `src/components`, utilities in `src/lib`, types in `src/types`).
- Public assets: `public/` (images, fonts).
- Tests: unit/integration in `src/__tests__/`, E2E and snapshots in `tests/`.
- Config: root `*.config.*` files; Supabase in `supabase/`; scripts in `scripts/`.
- Pages & API routes follow Next.js `app/` conventions (e.g., `src/app/blog/page.tsx`, `src/app/api/.../route.ts`).

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server (Next.js).
- `npm run build`: Production build.
- `npm start`: Serve built app.
- `npm run lint`: ESLint (Next.js rules).
- `npm test`: Run Vitest suite.
- `npx playwright test`: Run Playwright E2E tests (see `playwright.config.ts`).

## Coding Style & Naming Conventions
- Language: TypeScript, React 18, Next.js App Router.
- Indentation: 2 spaces; prefer named exports.
- Components: PascalCase files in `src/components` (e.g., `HeroSection.tsx`).
- Routes/APIs: lower-case dirs under `src/app` with `page.tsx` or `route.ts`.
- Imports: use path alias `@/` (see `tsconfig.json`).
- Styling: Tailwind CSS; co-locate component styles in `globals.css`/component files.
- Linting: keep `npm run lint` clean before pushing.

## Testing Guidelines
- Unit/Integration: Vitest + Testing Library. Place near source (`src/__tests__/...`).
  - Example: `src/__tests__/integration/blog.test.ts`.
  - Run: `npm test` (use `--watch` locally if needed).
- E2E: Playwright in `tests/e2e/`.
  - Run: `npx playwright test`; update snapshots via `--update-snapshots`.
- Coverage: aim to cover critical paths (API routes, admin flows, content rendering).

## Commit & Pull Request Guidelines
- Commits: Conventional Commits style (e.g., `feat:`, `fix:`, `chore:`, `docs:`, optional scopes like `feat(admin): ...`).
- PRs: include a clear summary, linked issues, testing notes, and UI screenshots when applicable.
- CI Hygiene: ensure `npm run lint` and `npm test` pass locally; include any migration notes (Supabase) in the PR description.

## Security & Configuration Tips
- Secrets: never commit `.env*`; use `setup-environment-variables.sh` and see `API-KEYS.md`.
- Supabase/Vercel: verify domain, storage, and RLS settings before deploy.
- Images: Next.js `next.config.mjs` controls allowed domains; update when adding sources.
