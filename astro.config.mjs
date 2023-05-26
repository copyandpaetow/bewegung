import { defineConfig } from 'astro/config';

export default defineConfig({
	srcDir: "./website/src",
	publicDir: "./website/public",
	outDir: "./website/dist",
	base: "/bewegung/",
	server: { port: 8000 }
});
