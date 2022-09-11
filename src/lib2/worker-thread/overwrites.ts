export const calculateOverwriteStyles = (
	elementProperties: calculatedElementProperties[],
	keyframes: ComputedKeyframe[]
) => {
	const override: Partial<CSSStyleDeclaration> = {};
	const existingStyle: Partial<CSSStyleDeclaration> = {};
	const tagName = elementProperties.some((entry) => {
		//TODO: this needs to be more advanced
		if (entry.computedStyle.display !== "inline" || tagName !== "SPAN") {
			return false;
		}
		existingStyle.display = (keyframes
			.filter((keyframe) => keyframe?.display)
			.at(-1) ?? "") as string;

		override.display = "inline-block";
		return true;
	});

	elementProperties.some((entry) => {
		if (entry.computedStyle.borderRadius === "0px") {
			return false;
		}

		existingStyle.borderRadius = (keyframes
			.filter((keyframe) => keyframe?.borderRadius)
			.at(-1) ?? "") as string;

		override.borderRadius = "0px";

		return true;
	});

	if (Object.keys(override).length === 0) {
		return;
	}
	return { existingStyle, override };
};

interface calculatedKeyframe {
	target: string;
	keyframes: ComputedKeyframe[];
	options: ComputedEffectTiming;
	overwrites?: Partial<CSSStyleDeclaration>;
}
