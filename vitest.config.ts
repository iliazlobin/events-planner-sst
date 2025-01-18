import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults } from "vitest/config";

export default defineConfig({
  // plugins: [tsconfigPaths()],
  plugins: [tsconfigPaths({ ignoreConfigErrors: true })],
  test: {
    globals: true,
    // https://stackoverflow.com/questions/74088103/vitest-how-to-exclude-specific-files-and-folders
    exclude: [...configDefaults.exclude, "./github/**"],
    testTimeout: 60000,
  },
});
