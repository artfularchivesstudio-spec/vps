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
3. **Test thoroughly** - Ensure