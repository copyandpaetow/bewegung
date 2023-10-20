import { defineConfig } from "vite";

export default defineConfig({
	root: "lib",
	build: {
		lib: {
			entry: "src/bewegung.ts",
			name: "bewegung",
			fileName: "bewegung",
		},
	},
});
