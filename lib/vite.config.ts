import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
	root: "lib",
	build: {
		lib: {
			entry: "src/bewegung.ts",
			name: "bewegung",
			fileName: (format) => `bewegung.${format}.js`,
		},
	},
});
