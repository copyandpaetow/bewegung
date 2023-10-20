import { defineConfig } from "astro/config";

export default defineConfig({
	root: "./website",
	srcDir: "./website/src",
	publicDir: "./website/public",
	outDir: "./website/dist",
	base: "/bewegung/",
	server: { port: 8000 },
	site: "https://copyandpaetow.github.io",
});
