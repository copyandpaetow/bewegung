import { defineConfig } from "vite";

export default defineConfig({
	build: {
		lib: {
			entry: "src/web-component.ts",
			name: "bewegung",
			fileName: "bewegung",
		},
	},
});
