import path from "path";
import { defineConfig } from "vite";

module.exports = defineConfig({
	build: {
		lib: {
			entry: path.resolve(__dirname, "src/lib/bewegung.ts"),
			name: "bewegung",
			fileName: (format) => `bewegung.${format}.js`,
		},
		rollupOptions: {},
	},
});
