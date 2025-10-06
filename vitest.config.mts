import vue from "@vitejs/plugin-vue";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [vue()],
	test: {
		globals: true,
		environment: "jsdom",
		coverage: {
			provider: "v8",
			exclude: [
				...configDefaults.coverage.exclude,
				// Don't test config files.
				"*.config.*",
			],
		},
	},
});
