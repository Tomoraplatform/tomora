import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Match the app's own "@/..." imports so a test can pull in real modules.
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // A Next.js guard that only means anything at build time.
      "server-only": fileURLToPath(new URL("./lib/__tests__/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: { environment: "node", include: ["**/__tests__/**/*.test.ts"], exclude: ["**/node_modules/**"] },
});
