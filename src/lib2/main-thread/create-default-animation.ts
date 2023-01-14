import { DefaultKeyframes } from "../types";
import { applyCSSStyles } from "./apply-styles";
import { BidirectionalMap } from "../shared/element-translations";
import { fillImplicitKeyframes } from "../worker-thread/normalize-keyframes";

export const createDefaultAnimation = (
	defaultKeyframes: Map<string, DefaultKeyframes>,
	elementLookup: BidirectionalMap<string, HTMLElement>,
	totalRuntime: number
) => {
	const animations: Animation[] = [];
	const onStart: VoidFunction[] = [];

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
