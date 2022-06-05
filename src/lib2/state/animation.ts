import { iterateWeakMap } from "../helper/iterate-weakMap";
import { state_calculatedDifferences } from "./calculations";
import { state_mainElements, state_affectedElements } from "./elements";
import { state_keyframes } from "./keyframes";
import { state_options } from "./options";

let state_WAAPI = new WeakMap<HTMLElement, Animation>();

export const play_animation = () => {
	const elements = [...state_mainElements, ...state_affectedElements];

	iterateWeakMap(
		state_mainElements,
		state_keyframes
	)((value, key) => {
		const resultingStyle = value.reduce(
			(
				accumulator,
				{ offset, composite, computedOffset, easing, ...styles }
			) => {
				return { ...accumulator, ...styles };
			},
			{}
		);
		Object.assign(key.style, resultingStyle);
	});
	iterateWeakMap(elements, state_WAAPI)((value) => value.play());
};

export const mutation_createWAAPI = () => {
	const elements = [...state_mainElements, ...state_affectedElements];

	elements.forEach((element) => {
		const keyframes = state_calculatedDifferences.get(element).map(
			({ xDifference, yDifference, widthDifference, heightDifference }) =>
				({
					transform: `translate(${xDifference}px, ${yDifference}px) scale(${widthDifference}, ${heightDifference})`,
				} as Keyframe)
		);
		const options = state_options.get(element);

		state_WAAPI.set(
			element,
			new Animation(new KeyframeEffect(element, keyframes, options))
		);
	});
};

export const cleanup_animations = () => {
	state_WAAPI = new WeakMap<HTMLElement, Animation>();
};
