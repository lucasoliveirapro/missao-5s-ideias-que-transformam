import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      ".next/**",
      "dist/**",
      "node_modules/**",
      "public/**",
      "assets/**",
      "styles/**",
      "scripts/**"
    ]
  }
];

export default eslintConfig;
