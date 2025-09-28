import {defineConfig} from "vitest/config";

// Vitest configuration for tsed-monorepo-tools
// - ESM project ("type": "module")
// - Tests live under ./test and use the *.vitest.test.js naming
// - Node environment (no DOM globals)
export default defineConfig({
  test: {
    globals: true,
    include: ["packages/*/src/**/*.spec.js"],
    environment: "node"
  }
});
