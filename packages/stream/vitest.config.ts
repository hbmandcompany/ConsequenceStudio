import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
    environment: "node",
    pool: "forks",
    testTimeout: 10000,
    deps: {
      external: [/^(ws)$/],
    },
  },
});
