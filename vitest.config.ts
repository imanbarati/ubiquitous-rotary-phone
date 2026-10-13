import { defineConfig } from "vitest/config";

// Domain unit tests run in Node and do not need the Cloudflare Worker plugin.
// Keeping this config separate prevents Vitest's Node externals from being
// passed into the Cloudflare Vite plugin's Worker environment validation.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
