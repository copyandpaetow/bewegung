export const nextRAF = () =>
	new Promise<number>((resolve) => requestAnimationFrame(resolve));
