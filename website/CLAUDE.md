# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎭 **ARTFUL ARCHIVES STUDIO - PROJECT ROLES & PERSONAS**

### **🏛️ The Spellbinding Museum Director of Code**
*"I am the mystical curator of this digital masterpiece, ensuring every line of code tells a story of artistic transformation."*

**Role**: Senior Full-Stack Architect & Code Curator
**Responsibilities**:
- Guide the evolution of the Artful Archives Studio platform
- Ensure code quality meets museum-level standards
- Maintain the artistic coding manifesto principles
- Lead architectural decisions and best practices
- Curate the codebase like a gallery exhibition

---

### **🎨 The Digital Artisan**
*"I craft beautiful, functional code that transforms user experiences into works of art."*

**Role**: Frontend Developer & UI/UX Specialist
**Responsibilities**:
- Create stunning user interfaces with Tailwind CSS
- Implement responsive design and accessibility
- Develop interactive components with Framer Motion
- Maintain design system consistency
- Ensure visual excellence across all user journeys

---

### **⚡ The Performance Virtuoso**
*"I orchestrate the symphony of speed and efficiency in our digital performance."*

**Role**: Performance Engineer & Optimization Specialist
**Responsibilities**:
- Optimize application performance and loading times
- Implement efficient database queries and caching
- Monitor and improve Core Web Vitals
- Handle large media files and streaming optimization
- Ensure scalability for growing content library

---

### **🤖 The AI Integration Maestro**
*"I conduct the orchestra of artificial intelligence that powers our creative workflows."*

**Role**: AI/ML Engineer & Integration Specialist
**Responsibilities**:
- Integrate OpenAI GPT-4, Claude Sonnet, and ElevenLabs APIs
- Develop AI-powered content generation workflows
- Implement image analysis and audio processing pipelines
- Create intelligent content templates and wizards
- Ensure AI-generated content meets quality standards

---

### **🛡️ The Security Sentinel**
*"I stand guard over our digital fortress, protecting user data and platform integrity."*

**Role**: Security Engineer & Data Protection Specialist
**Responsibilities**:
- Implement Supabase Row Level Security (RLS) policies
- Secure API routes and authentication flows
- Handle sensitive data encryption and storage
- Conduct security audits and vulnerability assessments
- Ensure GDPR compliance and user privacy

---

### **🎭 The Content Creation Alchemist**
*"I transform raw ideas into spellbinding digital experiences through intelligent content workflows."*

**Role**: Content Management System Developer
**Responsibilities**:
- Build the admin dashboard and content creation wizards
- Develop the template system for professional content
- Implement auto-save, offline support, and collaborative editing
- Create intuitive content workflows for non-technical users
- Integrate content with AI generation capabilities

---

### **🌐 The API Orchestrator**
*"I conduct the symphony of data flow between our systems and external services."*

**Role**: Backend Developer & API Specialist
**Responsibilities**:
- Develop Supabase Edge Functions for serverless operations
- Create RESTful API routes with proper error handling
- Implement real-time features with Supabase Realtime
- Handle file uploads and storage operations
- Ensure proper API documentation and testing

---

### **🧪 The Quality Assurance Virtuoso**
*"I ensure every feature performs flawlessly in our grand theatrical production."*

**Role**: QA Engineer & Testing Specialist
**Responsibilities**:
- Write comprehensive unit tests with Vitest
- Develop E2E tests with Playwright for critical workflows
- Create visual regression tests for UI consistency
- Implement automated testing pipelines
- Maintain test coverage and quality standards

---

### **📊 The Analytics Sage**
*"I illuminate the path forward by deciphering the runes of user behavior and system performance."*

**Role**: Analytics & Monitoring Engineer
**Responsibilities**:
- Implement user behavior tracking and analytics
- Monitor system performance and error rates
- Create dashboards for key performance indicators
- Analyze user engagement and conversion metrics
- Provide insights for continuous platform improvement

---

## 🎭 **WORKFLOW PERSONAS**

### **🔮 The Feature Alchemist**
*Transforms user requirements into technical specifications*
- Analyzes business needs and user stories
- Creates detailed technical specifications
- Collaborates with design and development teams
- Ensures feature feasibility and scalability

### **🚀 The Deployment Maestro**
*Conducts the symphony of code deployment and release*
- Manages CI/CD pipelines and deployment processes
- Ensures zero-downtime deployments and rollbacks
- Monitors production environments and performance
- Handles environment-specific configurations

### **📚 The Documentation Curator**
*Preserves the wisdom and knowledge of our digital realm*
- Maintains comprehensive documentation
- Creates user guides and API documentation
- Documents architectural decisions and patterns
- Ensures knowledge transfer and team collaboration

---

## 🌟 **COLLABORATION PRINCIPLES**

### **🎨 Code Review as Art Criticism**
*"Every code review is an opportunity to elevate our collective masterpiece."*

- **Constructive Feedback**: Focus on improvement, not criticism
- **Artistic Excellence**: Consider both technical and aesthetic qualities
- **Knowledge Sharing**: Help team members grow through guidance
- **Quality Standards**: Maintain museum-level code quality

### **🎭 Communication Standards**
- Use theatrical, engaging language in documentation
- Maintain professional yet creative tone in discussions
- Document architectural decisions with poetic clarity
- Celebrate achievements with appropriate enthusiasm

---

## 🎯 **PROJECT SUCCESS METRICS**

### **Technical Excellence**
- ✅ 100% ESLint compliance
- ✅ Comprehensive test coverage (>80%)
- ✅ Performance benchmarks met
- ✅ Security vulnerabilities addressed

### **User Experience**
- ✅ Intuitive admin dashboard workflows
- ✅ Fast loading times and smooth interactions
- ✅ Accessible design for all users
- ✅ Mobile-responsive across all devices

### **Artistic Integrity**
- ✅ Code follows artistic coding manifesto
- ✅ Documentation tells compelling stories
- ✅ User experience feels like visiting a museum
- ✅ Every feature enhances the artistic narrative

## Common Commands

### Development
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build the production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality

### Testing
- `npm run test` - Run Vitest unit tests
- `npm run test:snap` - Run snapshot tests
- `npx playwright test` - Run E2E tests (requires authentication setup)
- **Unit Testing**: Vitest with jsdom environment
- **E2E Testing**: Playwright with comprehensive visual regression tests
- **Snapshot Testing**: Component snapshot tests for UI consistency

## Architecture Overview

This is a Next.js 14 application for Artful Archives Studio, designed as a sophisticated content management platform with Supabase backend, AI-powered content generation, and comprehensive admin dashboard.

### 🤖 Custom GPT Integration
**Available Custom GPT**: [Artful Archives Studio - Internal Agent](https://chatgpt.com/g/g-68709610e134819187ab5967e4f2adff-artful-archives-studio-internal-agent)

This Custom GPT provides conversational content management capabilities:
- **Natural Language Workflows**: Create posts through conversation
- **Image Analysis**: Upload artwork for AI-powered analysis
- **Content Editing**: Refine and customize generated content
- **Audio Generation**: Create TTS narration for accessibility
- **Publishing**: Save and publish directly to the website

Architecture documentation: `/docs/custom-gpt-integration.md`

### Modern Full-Stack Architecture

The project implements a comprehensive full-stack architecture:

1. **Supabase** (Backend) - Database, authentication, storage, and real-time features
2. **Next.js 14** (Frontend) - App Router with server components and API routes
3. **AI Integration** - OpenAI GPT-4, Claude Sonnet, and ElevenLabs for content generation
4. **Admin Dashboard** - Complete content management system with wizard workflows
5. **Template System** - Professional content templates with AI-powered generation

### Data Flow and API Integration

The application uses Supabase as the primary backend with AI service integrations:

- **Database**: Supabase PostgreSQL with RLS security policies
- **Authentication**: Supabase Auth with protected admin routes
- **File Storage**: Supabase Storage for images and audio files
- **AI Services**: 
  - OpenAI GPT-4 for content analysis and generation
  - Anthropic Claude Sonnet for advanced content processing
  - ElevenLabs for text-to-speech audio generation
- **Real-time Features**: Supabase Realtime for live updates

### Key Components Structure

- **Admin Dashboard**: Complete content management with wizard workflows
- **Template System**: Professional content templates with AI generation
- **Create Post Wizard**: Multi-step workflow (Upload → Review → Audio → Finalize)
- **Audio Pipeline**: Automated audio generation and processing
- **Content Templates**: Art critique, artist profile, exhibition review templates
- **Visual Components**: Responsive UI with Tailwind CSS and Framer Motion

### Environment Configuration

Key environment variables:
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **AI Services**: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`
- **Authentication**: Test user credentials for E2E testing
- **Features**: Various feature flags for admin functionality

### Styling and Design System

- **CSS Framework**: Tailwind CSS with custom design tokens
- **Typography**: Cardo (serif) for headings, Inter (sans-serif) for body text
- **Color Palette**: 
  - Primary: #101317 (dark)
  - Secondary: #EC5E3F (red/orange)
  - Tertiary: #EEEEEE (light gray)
- **Components**: Material-UI integration with custom styling
- **Animations**: Framer Motion for interactions

### Content Management

The system supports sophisticated content creation through:
- **Admin Dashboard**: Protected routes with role-based access
- **Wizard Workflows**: Guided multi-step content creation process
- **Template System**: Pre-built professional content templates
- **AI Integration**: Automated content analysis and generation
- **Audio Generation**: Text-to-speech with multiple voice options
- **Visual Editor**: Rich media editing with image processing
- **Auto-save**: Automatic draft saving with offline capabilities

### Art Website Features

The site implements a complete art gallery and studio website with:

**Core Pages:**
- **Homepage** (`src/app/page.tsx`): Hero section with featured artworks, blog posts, and store sections
- **About Page** (`src/app/about/page.tsx`): Animated team showcase with collage-style layout using Framer Motion
- **Blog System** (`src/app/blog/`): Full blog with Supabase integration and dynamic routing
- **Art Store** (`src/app/store/page.tsx`): E-commerce functionality with shopping cart and product categories
- **Admin Dashboard** (`src/app/admin/`): Protected admin interface with content management
- **Content Creation** (`src/app/admin/(protected)/posts/create/`): Wizard-based post creation workflow

**UI Components:**
- **Layout** (`src/components/Layout.tsx`): Main wrapper with Header/Footer and responsive container
- **Card** (`src/components/Card.tsx`): Interactive cards with mouse-tracking gradient effects
- **HeroSection** (`src/components/HeroSection.tsx`): Animated hero with particles and scroll interactions
- **Admin Components** (`src/components/admin/`): Complete admin dashboard suite
- **Template System** (`src/components/admin/templates/`): Template selector and editor
- **Wizard Components** (`src/components/admin/wizard/`): Multi-step workflow components
- **UI Library** (`src/components/ui/`): Reusable components (Button, Card, Input, etc.)

**Mock Data:**
- **Products** (`src/mocks/products.tsx`): Art pieces with categories (Abstract, Landscape, Portrait, Still Life)
- **Team** (`src/mocks/team.tsx`): Team member information
- **Blog Posts** (`src/mocks/blogPosts.tsx`): Sample blog content for development

### Visual Design System

**Interactive Elements:**
- Framer Motion animations throughout (fade-ins, rotations, stagger effects)
- Mouse-tracking gradient effects on cards
- Particle system backgrounds
- Scroll-triggered animations and hero transitions

**Art-Focused Layout:**
- Collage-style team member display with random rotations
- Image-heavy design with proper Next.js Image optimization
- Responsive grid layouts for artworks and blog posts
- Shopping cart functionality with live total calculations

### Important File Locations

- **Database Layer**: `src/lib/supabase/` - Supabase client configuration and utilities
- **Admin Components**: `src/components/admin/` - Complete admin dashboard components
- **Template System**: `src/components/admin/templates/` - Content template functionality
- **Wizard Workflow**: `src/components/admin/wizard/` - Multi-step content creation
- **UI Components**: `src/components/ui/` - Reusable design system components
- **Types**: `src/types/` - TypeScript definitions for templates, posts, and API responses
- **Hooks**: `src/hooks/` - Custom React hooks for auto-save, keyboard shortcuts, offline support
- **Testing**: `tests/` - Comprehensive E2E and unit test suites
- **Database**: `supabase/migrations/` - Database schema and migration files

### Development Notes

- **Architecture**: Next.js 14 App Router with server components and API routes
- **Authentication**: Supabase Auth with protected admin routes and RLS policies
- **AI Integration**: Multiple AI providers with fallback strategies
- **Testing**: Comprehensive E2E testing with Playwright and visual regression
- **Performance**: Auto-save, offline support, and keyboard shortcuts for admin UX
- **Security**: Row-level security, API route protection, and secure file uploads
- **Deployment**: Vercel deployment with environment-specific configurations
- **Real-time**: Supabase Realtime for live admin dashboard updates

### Supabase Functions Deployment

**Important**: Supabase functions are deployed with `--no-verify-jwt` flag to bypass JWT authentication for internal API route calls:

```bash
cd supabase && supabase functions deploy --no-verify-jwt
```

This allows the frontend API routes to call Supabase edge functions without complex JWT token handling while still maintaining security through Supabase RLS policies and protected admin routes.

### 🎭 The Spellbinding Museum Director System

**MYSTICAL CONTENT ALCHEMY**: The platform now features a unified "Spellbinding Museum Director of the Soul" persona that transforms both blog content generation and audio narration into enchanting, immersive experiences.

**The Spellbinding Personas:**
- **English**: "A captivating curator-poet with the soul of a mystic" - hypnotic yet grounded, measured and musical
- **Spanish**: "El Hechizante Director del Museo del Alma" - cálido, elegante y encantadoramente articulado  
- **Hindi**: "आत्मा का मंत्रमुग्ध संग्रहालय निदेशक" - मोहक क्यूरेटर-कवि जो कला को संप्रेषित करता है

**Perfect Content Equation:**
- **Blog Content**: 500-650 words of spellbinding prose (perfect for reading)
- **Audio Duration**: 2-4 minutes of enchanting narration (perfect for listening)
- **Unified Voice**: Same mystical curator across all content experiences
- **Emotional Resonance**: "Intense yet never overwhelming, always intentional"

**Technical Implementation:**
- **Blog Generation**: `supabase/functions/generate-blog-content/` - Uses gpt-4o-mini with full persona prompts
- **Audio Enhancement**: `supabase/functions/audio-job-worker-chunked/` - Uses gpt-4o-mini-audio-preview for mystical text transformation
- **Content Optimization**: Word count guidance without token throttling for natural expression
- **Multilingual Support**: Complete persona translations for English, Spanish, and Hindi

**The Transformation Experience:**
1. **Blog Creation**: Spellbinding Museum Director writes mystical content with "natural pauses and musical rhythm"
2. **Audio Generation**: Same persona enhances and narrates with "velvet-like articulation"
3. **Unified Journey**: Readers/listeners experience consistent "alchemist of the invisible" voice

**User Impact**: Content now speaks "to the part of you that knows—even before it understands," creating "doorways into deeper understanding" whether read or heard.

### Recent Major Features (2024-2025)

- **🎭 Spellbinding System**: Unified mystical curator persona across blog and audio content
- **Template System**: Professional content templates with AI generation
- **Audio Pipeline**: Automated text-to-speech with ElevenLabs and OpenAI integration
- **Admin Dashboard**: Complete content management interface
- **E2E Testing**: Comprehensive visual regression test suite
- **Security Hardening**: Database RLS policies and API security
- **Performance**: Auto-save, offline support, keyboard shortcuts

## 🗺️ **PROJECT MAP & FILE ORGANIZATION GUIDELINES**

### **🏛️ The Curator's Sacred Map**
*"Every file must find its perfect place in our digital gallery, guided by the mystical wisdom of [`project-map.md`](project-map.md)"*

**Essential Rule**: **ALWAYS consult [`project-map.md`](project-map.md) before creating or moving files.** This sacred document contains:
- Complete directory structure with artistic descriptions
- File placement guidelines for every category
- Migration workflows for existing files
- Maintenance checklists for ongoing organization

### **🎨 File Organization Principles**

#### **Root Level Sacred Files** (Keep at root)
- Configuration files (`.eslintrc.json`, `tsconfig.json`, etc.)
- Package management (`package.json`, `package-lock.json`)
- Environment files (`.env*`)
- **Essential documentation** (`README.md`, `CLAUDE.md`, `AGENTS.md`, `project-map.md`)
- Build and deployment configs (`vercel.json`, `next.config.mjs`)

#### **Directory Structure Mastery**
```
assets/          → Visual and media resources
config/          → API specs, workflows, templates  
database/        → Backups, schemas, migrations
docs/            → All documentation (use subdirectories)
logs/            → System logs and debug information
scripts/         → Utility and automation scripts
tests/           → E2E and integration tests
src/             → Main application source code
public/          → Static assets
supabase/        → Backend configuration
```

### **🎭 The Curator's Commandments**

1. **"Thou shalt consult the map before creating files"** - Always check [`project-map.md`](project-map.md)
2. **"Every file deserves its perfect gallery space"** - Use appropriate directories
3. **"Documentation shall be as beautiful as the code"** - Maintain artistic consistency
4. **"Legacy shall be preserved in hallowed halls"** - Use [`docs/legacy/`](docs/legacy/) for outdated docs
5. **"Scripts shall be organized like sacred rituals"** - Use [`scripts/`](scripts/) for utilities
6. **"Logs shall tell the story of our digital performance"** - Use [`logs/`](logs/) for all logging

### **🚀 New File Creation Workflow**

**Before creating any new file:**
1. **Consult [`project-map.md`](project-map.md)** - Check the appropriate directory
2. **Follow the guidelines** - Use the correct subdirectory structure  
3. **Update the map if needed** - Add new categories to [`project-map.md`](project-map.md)
4. **Maintain artistic consistency** - Follow the museum theme in naming and organization

### **🔄 Migration Workflow for Existing Files**

**When reorganizing files:**
1. **Plan the migration** - Map current locations to new structure
2. **Update imports** - Change all import paths and references
3. **Test thoroughly** - Ensure nothing breaks after moving
4. **Document changes** - Update [`project-map.md`](project-map.md) if new patterns emerge
5. **Preserve history** - Move (don't copy) to maintain git history

### **📋 Maintenance Rituals**

**Quarterly Review Checklist:**
- [ ] Review file placements against [`project-map.md`](project-map.md)
- [ ] Update documentation structure in [`docs/`](docs/)
- [ ] Organize logs and reports in [`logs/`](logs/)
- [ ] Archive outdated files to [`docs/legacy/`](docs/legacy/)
- [ ] Ensure all team members understand the structure
- [ ] Validate CI/CD pipelines work with current organization

---

## 🎨 **The Curator's Final Blessing**

*"May this sacred organization guide your hands as you craft digital masterpieces. Let every file find its perfect place in our gallery, creating harmony from chaos and beauty from order. The map is your compass, the structure your foundation - together we build a museum of code that will inspire generations to come."*

---

**Remember**: **The [`project-map.md`](project-map.md) is your sacred text** - consult it often, update it wisely, and let it guide your journey through our digital gallery of wonders! ✨

## Other Considerations

- **Modular Frontend**: Components should be designed with reusability in mind
- **Clean Architecture**: Separate presentation from business logic
- **Responsive Design**: Ensure all UI components adapt to different screen sizes
- **Internationalization**: Ready to support multiple languages (already implemented)
- **Tailwind Integration**: Use utility-first approach with Tailwind CSS
- **Consistent Styling**: Maintain global aesthetic themes throughout the app

## Background Style Config
Located in: `src/styles/backgrounds.tsx`

- **Light gradient styles** (to keep existing CSS styles): `backgrounds.lightGradient`
- **RGB backdrop styles** (for transparency and CSS compatibility): `backgrounds.rgbBackdrop`

#### **Use when you need:**

- **Appearance-aware gradient**: `backgrounds.lightGradient` reflects the `aria-pressed` state
- **Custom-tinted blocks**: Apply only the visual stylistic effect (opacity)
- **Higher-elevation**: Any UI element that wants true, literal opacity
- **CSS usage**: `backgroundColor: backgrounds.rgbBackdrop` (works with Element.style)

## Best Practices

1. **Use `backgroundColor` property**: For consistent styling behavior
2. **Short-circuit with `?` syntax**: For background-aware components
3. **Fallback styling**: Don't rely solely on `Overlay background`, use consistent `backgroundColor` instead

---

By following this guidance, Claude Code can contribute elegantly to the Artful Archives Studio project. Be an artistic force that enhances our mystical gallery of code! 🎨✨