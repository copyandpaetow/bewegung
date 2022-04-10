export const applyStyles = (
	element: HTMLElement,
	styles: Partial<CSSStyleDeclaration>
) => {
	Object.assign(element.style, styles);
};

export const extractStylesRules = (styleChanges: ComputedKeyframe[] | null) => {
	if (!styleChanges) {
		return {};
	}
	const allStyles = styleChanges.reduce((accumulator, singularChange) => {
		const { offset, composite, computedOffset, easing, ...changedStyles } =
			singularChange;
		return { ...accumulator, ...changedStyles };
	}, {} as Partial<CSSStyleDeclaration>);

	return allStyles;
};
