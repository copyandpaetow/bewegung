export const logCalculationTime = (startingTime: number) => {
	const end = performance.now() - startingTime;
	if (end < 50) {
		console.log(`animation calculation was fast with ${end}ms`);
	}
	if (end > 50) {
		console.warn(`animation calculation was slow with ${end}ms`);
	}
	if (end > 100) {
		console.error(
			`animation calculation was so slow that the user might notice with ${end}ms`
		);
	}
};
