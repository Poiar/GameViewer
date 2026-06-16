import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["src/app/**/*.spec.ts", "server/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
