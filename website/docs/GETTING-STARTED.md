# 🛠️ Getting Started

Welcome to **Artful Archives Studio**! This guide helps you run the project locally after cloning the repository.

## 1. Prerequisites
- [Node.js](https://nodejs.org/) 20+ (use `nvm use` to honor `.nvmrc`)
- [npm](https://www.npmjs.com/) 10+
- [direnv](https://direnv.net/) for automatic env loading
- (Optional) [Supabase CLI](https://supabase.com/docs/guides/cli) for local database & edge function tooling

## 2. Clone and Install
```bash
# grab the code
git clone <your-fork-or-clone-url>
cd website

# install dependencies
npm install
```

## 3. Environment Variables
1. Copy the example file:
   ```bash
   cp .env.local.example .env
   ```
2. Review `.env` and supply the required API keys.
3. Ensure `.envrc` exists (it runs `dotenv` by default).
4. Allow direnv to load the variables:
   ```bash
   direnv allow
   ```

## 4. Development Scripts
- `npm run dev` – start Next.js locally at http://localhost:3000
- `npm run lint` – check code style
- `npm test` – run unit/integration tests

## 5. Optional Tools
- `supabase start` – launch local Supabase stack
- `supabase functions serve <name> --no-verify-jwt` – run an edge function locally

## 6. Troubleshooting Tips
- Run `direnv status` to ensure environment variables are loaded.
- If dependencies seem stale, try `rm -rf node_modules && npm install`.
- Edge function deployment: `supabase functions deploy <name> --no-verify-jwt`.

Happy hacking! ⚙️🎨
