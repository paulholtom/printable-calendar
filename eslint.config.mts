import {
	defineConfigWithVueTs,
	vueTsConfigs,
} from "@vue/eslint-config-typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginVue from "eslint-plugin-vue";
import { globalIgnores } from "eslint/config";

export default defineConfigWithVueTs(
	{
		name: "app/files-to-lint",
		files: ["**/*.{ts,mts,tsx,vue}"],
	},

	globalIgnores([
		"**/dist/**",
		"**/dist-ssr/**",
		"**/coverage/**",
		"**/.vite/**",
	]),

	pluginVue.configs["flat/essential"],
	vueTsConfigs.recommended,
	eslintConfigPrettier,
);
