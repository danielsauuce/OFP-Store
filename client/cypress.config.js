import { defineConfig } from 'cypress';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env manually — no dotenv package required
function loadEnv(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    return Object.fromEntries(
      raw
        .split('\n')
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const [key, ...rest] = line.split('=');
          return [key.trim(), rest.join('=').trim()];
        }),
    );
  } catch {
    return {};
  }
}

const env = loadEnv(resolve(__dirname, '.env'));

export default defineConfig({
  e2e: {
    baseUrl: env.CYPRESS_BASE_URL || 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      USER_EMAIL: env.CYPRESS_USER_EMAIL,
      USER_PASSWORD: env.CYPRESS_USER_PASSWORD,
      ADMIN_EMAIL: env.CYPRESS_ADMIN_EMAIL,
      ADMIN_PASSWORD: env.CYPRESS_ADMIN_PASSWORD,
    },
  },
});
