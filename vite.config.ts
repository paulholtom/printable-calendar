import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";
import {
	configDefaults,
	defineConfig,
	mergeConfig,
	type ViteUserConfig,
} from "vitest/config";

// https://vitejs.dev/config
export function extendBaseConfig(extendedConfig: ViteUserConfig) {
	return mergeConfig(
		defineConfig({
			plugins: [vue()],
			resolve: {
				alias: {
					"@": fileURLToPath(new URL("./src", import.meta.url)),
				},
			},
			test: {
				globals: true,
				environment: "jsdom",
				coverage: {
					provider: "v8",
					exclude: [
						...configDefaults.coverage.exclude,
						// Don't test config files.
						"*.config.*",
						"**/__*__/**",
					],
				},
			},
		}),
		extendedConfig,
	);
}
