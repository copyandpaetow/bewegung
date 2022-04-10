import { ReadDimensions } from "../core/main-read-dimensions";
import { firstIn } from "../utils/array-helpers";

export const getEdgeCaseStylings = (
	target: HTMLElement,
	animationMap: Map<HTMLElement, ReadDimensions>
): Partial<CSSStyleDeclaration> => {
	const { calculatedProperties, newStyle } = animationMap.get(
		target
	) as ReadDimensions;
	const { styles: firstStyle } = firstIn(calculatedProperties);

	if (!newStyle || firstStyle.display !== "none") {
		return {};
	}

	const nextRealDimension = [...calculatedProperties]
		.reverse()
		.find(
			(entry) =>
				entry.dimensions.height &&
				entry.dimensions.width &&
				entry.dimensions.left &&
				entry.dimensions.top &&
				entry.styles.display !== "none"
		);

	if (!nextRealDimension) {
		return {};
	}
	const {
		dimensions: { left, top, height, width },
		offset,
		styles: { display },
	} = nextRealDimension;

	const parent = animationMap.get(target.parentElement as HTMLElement);
	const parentDimensions = parent?.calculatedProperties.find(
		(entry) => entry.offset === offset
	);

	//? this may be affected by the transform origin
	const newTop = top - (parentDimensions?.dimensions.top as number);
	const newLeft = left - (parentDimensions?.dimensions.left as number);

	const revertedStyle: Partial<CSSStyleDeclaration> = {
		display: `${display}`,
		position: "absolute",
		height: `${height}px`,
		width: `${width}px`,
		left: `${newLeft}px`,
		top: `${newTop}px`,
	};
	return revertedStyle;
};
