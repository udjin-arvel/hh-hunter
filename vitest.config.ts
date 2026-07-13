import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    environmentMatchGlobs: [["lib/hh-page.test.ts", "happy-dom"]],
    include: ["lib/**/*.test.ts"],
  },
});
