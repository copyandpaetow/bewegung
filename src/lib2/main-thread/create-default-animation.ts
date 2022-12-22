import { applyCSSStyles } from "./apply-styles";
import { DefaultKeyframes, State } from "../types";
import { fillImplicitKeyframes } from "./create-animations-from-keyframes";

export const createDefaultAnimation = (
	defaultKeyframes: Map<string, DefaultKeyframes>,
	state: State,
	totalRuntime: number
) => {
	const animations: Animation[] = [];
	const onStart: VoidFunction[] = [];
	const { elementLookup } = state;

	defaultKeyframes.forEach((defaultEntry, elementString) => {
		const { keyframes, override, resultingStyle } = defaultEntry;
		const domElement = elementLookup.get(elementString)!;
		const originalStyle = domElement.style.cssText;

		const animation = new Animation(
			new KeyframeEffect(domElement, fillImplicitKeyframes(keyframes), totalRuntime)
		);

		onStart.push(() => applyCSSStyles(domElement, { ...resultingStyle, ...override }));
		animation.onfinish = () => {
			domElement.style.cssText = originalStyle;
			applyCSSStyles(domElement, { ...resultingStyle });
		};

		animations.push(animation);
	});

	return { animations, onStart };
};
