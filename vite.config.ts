import { resolve } from "path";
import { defineConfig } from "vite";

const root = resolve(__dirname, "src/website/");
const outDir = resolve(__dirname, "dist");

module.exports = defineConfig({
	root,
	base: "/bewegung/website/",
	build: {
		outDir,
		rollupOptions: {
			input: {
				main: resolve(root, "/index.html"),
				cards: resolve(root, "/cards/index.html"),
				filter: resolve(root, "/filter/index.html"),
			},
		},
	},
});
