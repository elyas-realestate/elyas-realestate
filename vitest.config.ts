import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

// ══════════════════════════════════════════════════════════════
// Vitest config — Wasit Pro
// ══════════════════════════════════════════════════════════════
// - Default environment: node (مناسب لـ lib utilities + API routes)
// - jsdom يُستخدم اختياراً في ملفات React عبر `// @vitest-environment jsdom`
// - alias `@/*` يطابق tsconfig.json
// ══════════════════════════════════════════════════════════════

export default defineConfig({
  test: {
    environment: "node",
    globals: false, // نستخدم import صريح من vitest (أنظف)
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/__tests__/**/*.test.{ts,tsx}", "**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "dist", "playwright-report"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "**/*.config.{ts,js,mjs}",
        "**/__tests__/**",
        "**/types/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": root,
    },
  },
});
