import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
	root: "lib",
	build: {
		lib: {
			entry: path.resolve(__dirname, "lib/bewegung.ts"),
			name: "bewegung",
			fileName: (format) => `bewegung.${format}.js`,
		},
	},
});
