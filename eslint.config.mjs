import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

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
    plugins: {
      "unused-imports": unusedImports,
    },
    // Override الـ rules القاسية إلى warnings بدل errors
    rules: {
      // any/unused مقبولة في Beta — تظهر warnings للتحسين التدريجي
      "@typescript-eslint/no-explicit-any": "warn",
      // نعطّل القاعدة الأصلية لصالح plugin unused-imports (يدعم autofix)
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      // النصوص العربية تستخدم الفاصلة العليا (') بشكل طبيعي — لا تحتاج escaping
      "react/no-unescaped-entities": "off",
      // مقبول للـ Beta — نحوّل لـ <Image /> لاحقاً عند تحديد width/height لكل صورة
      // (تحسين أداء يحتاج مراجعة بصرية لكل صفحة)
      "@next/next/no-img-element": "off",
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
