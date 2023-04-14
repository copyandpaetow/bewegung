import { DefaultResult, DefaultTransferable, MainState } from "../types";
import { BidirectionalMap } from "../utils/element-translations";
import { applyCSSStyles, styleReset } from "../utils/helper";

const createAnimationsFromKeyframes = (
	keyframes: Map<string, Keyframe[]>,
	totalRuntime: number,
	elementTranslations: BidirectionalMap<string, HTMLElement>
) => {
	const animations = new Map<string, Animation>();

	keyframes.forEach((elementIDframes, key) => {
		const domElement = elementTranslations.get(key)!;
		const animation = new Animation(new KeyframeEffect(domElement, elementIDframes, totalRuntime));

		animations.set(key, animation);
	});

	return animations;
};

const setDefaultCallbacks = (
	animations: Map<string, Animation>,
	overrides: Map<string, Partial<CSSStyleDeclaration>>,
	elementTranslations: BidirectionalMap<string, HTMLElement>
) => {
	const onStart: VoidFunction[] = [];

	animations.forEach((animation, key) => {
		const domElement = elementTranslations.get(key)!;
		const overrideStyle = overrides.get(key);

		if (!overrideStyle) {
			return;
		}
		onStart.push(() => applyCSSStyles(domElement, overrideStyle));
		const reset = styleReset(domElement, overrideStyle);
		animation.onfinish = () => applyCSSStyles(domElement, reset);
	});

	return onStart;
};

export const createAnimations = (
	resultTransferable: DefaultTransferable,
	state: MainState
): DefaultResult => {
	const { keyframes, overrides, partialElements } = resultTransferable;
	const { elementTranslations, totalRuntime } = state;

	const animations = createAnimationsFromKeyframes(keyframes, totalRuntime, elementTranslations);
	const onStart = setDefaultCallbacks(animations, overrides, elementTranslations);

	return {
		overrides,
		partialElements,
		animations,
		onStart,
	};
};
