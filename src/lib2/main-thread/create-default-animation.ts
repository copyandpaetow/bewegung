import { applyCSSStyles } from "./apply-styles";
import { DefaultKeyframes, State } from "../types";

export const createDefaultAnimation = (
	defaultKeyframes: Map<string, DefaultKeyframes>,
	state: State,
	totalRuntime: number
) => {
	const animations: Animation[] = [];
	const onStart: VoidFunction[] = [];
	const { elementLookup } = state;

	defaultKeyframes.forEach((defaultEntry, elementString) => {
		const { keyframes, overrides } = defaultEntry;
		const domElement = elementLookup.get(elementString)!;

		const animation = new Animation(new KeyframeEffect(domElement, keyframes, totalRuntime));

		onStart.push(() => applyCSSStyles(domElement, overrides.before));
		animation.onfinish = () => applyCSSStyles(domElement, overrides.after);

		animations.push(animation);
	});

	return { animations, onStart };
};