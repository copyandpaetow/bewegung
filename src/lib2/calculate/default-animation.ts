import { applyStyleObject } from "../read/apply-styles";
import { DefaultKeyframes, State } from "../types";

export const createDefaultAnimation = (
	defaultKeyframes: Map<string, DefaultKeyframes>,
	animationState: {
		animations: Animation[];
		onStart: VoidFunction[];
	},
	state: State,
	totalRuntime
) => {
	const { animations, onStart } = animationState;
	const { elementLookup } = state;

	defaultKeyframes.forEach((defaultEntry, elementString) => {
		const { keyframes, overrides } = defaultEntry;
		const domElement = elementLookup.get(elementString)!;

		const animation = new Animation(new KeyframeEffect(domElement, keyframes, totalRuntime));

		animation.onfinish = () => applyStyleObject(domElement, overrides.after);
		onStart.push(() => applyStyleObject(domElement, overrides.before));

		animations.push(animation);
	});
};
