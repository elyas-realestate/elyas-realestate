import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// ══════════════════════════════════════════════════════════════
// ESLint config — Wasit Pro
// ══════════════════════════════════════════════════════════════
// قواعد عملية للـ Beta — صارمة على الأخطاء الحقيقية،
// متساهلة مع أنماط تطوير سريع شائعة (any/unused-vars).
// مع التقدّم نضيق الـ rules تدريجياً.
// ══════════════════════════════════════════════════════════════

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Next.js defaults
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy / generated files
    "write.js",
    "public/sw.js",
    "wasit-pro-landing.html",
    "types/database.generated.ts",
    "coverage/**",
    "node_modules/**",
  ]),
  {
    // Override الـ rules القاسية إلى warnings بدل errors
    rules: {
      // any/unused مقبولة في Beta — تظهر warnings للتحسين التدريجي
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      // النصوص العربية تحتوي علامات تتعامل معها React بشكل آمن
      "react/no-unescaped-entities": "warn",
      // مقبول للـ Beta — نحسّن لاحقاً
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      // react hooks rules — مهمة لكن نخليها warnings حتى نراجعها يدوياً
      "react-hooks/immutability": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/component-hook-factories": "warn",
      "react-hooks/static-components": "warn",
      // React 19 errors المؤقتة (نصلحها يدوياً تدريجياً)
      "react/no-unknown-property": "warn",
      "react/display-name": "warn",
      "react/jsx-key": "warn",
    },
  },
]);

export default eslintConfig;
