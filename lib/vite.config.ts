import { defineConfig } from "vite";

export default defineConfig({
	build: {
		lib: {
			entry: "src/bewegung.ts",
			name: "bewegung",
			fileName: "bewegung",
		},
	},
});
