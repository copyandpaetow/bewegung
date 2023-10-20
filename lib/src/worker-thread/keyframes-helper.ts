export const normalizeBorderRadius = (radius: string, [width, height]: [number, number]) => {
	if (radius === "0px" || radius.includes("/")) {
		//TODO: handle complex border-radius
		return "";
	}

	const radii = radius.split(" ");
	const widthEntries: string[] = [];
	const heightEntries: string[] = [];

	if (radii.length === 3) {
		radii.push(radius[1]);
	}

	radii.forEach((value) => {
		if (value.includes("%") || value === "0px") {
			widthEntries.push(value);
			heightEntries.push(value);
			return;
		}
		const parsedValue = parseFloat(value);
		widthEntries.push(`${(100 * parsedValue) / width}%`);
		heightEntries.push(`${(100 * parsedValue) / height}%`);
	});

	return `${widthEntries.join(" ")} / ${heightEntries.join(" ")}`;
};
