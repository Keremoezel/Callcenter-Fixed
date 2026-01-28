import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  // Eklenen Kısım:
  dbCredentials: {
    url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/xxxxxxxxxxxx.sqlite' 
    // NOT: Burası yerel geliştirme için bir yoldur. 
    // Eğer sadece hatayı geçmek istiyorsan şimdilik basitçe şunu yazabilirsin:
    // url: 'sqlite.db'
  }
})