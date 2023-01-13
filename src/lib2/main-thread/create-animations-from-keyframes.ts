import { MainState, Result, ResultingKeyframes } from "../types";
import { createDefaultAnimation } from "./create-default-animation";
import { createImageAnimation } from "./create-image-animation";

export const fillImplicitKeyframes = (keyframes: Keyframe[]): Keyframe[] => {
	const updatedKeyframes = [...keyframes];
	const firstKeyframe = updatedKeyframes.at(0)!;
	const lastKeyframe = updatedKeyframes.at(-1)!;

	if (firstKeyframe.offset !== 0) {
		updatedKeyframes.unshift({ ...firstKeyframe, offset: 0 });
	}
	if (lastKeyframe.offset !== 1) {
		updatedKeyframes.push({ ...lastKeyframe, offset: 1 });
	}

	return updatedKeyframes;
};

export const createAnimationsFromKeyframes = (
	state: MainState,
	payload: ResultingKeyframes
): Result => {
	const [imageKeyframes, defaultKeyframes, totalRuntime] = payload;

	const defaultAnimations = createDefaultAnimation(
		defaultKeyframes,
		state.elementTranslation,
		totalRuntime
	);
	const imageAnimations = createImageAnimation(imageKeyframes, state, totalRuntime);

	const timeKeeper = new Animation(new KeyframeEffect(null, null, totalRuntime));

	return {
		onStart: [...defaultAnimations.onStart, ...imageAnimations.onStart],
		animations: [...defaultAnimations.animations, ...imageAnimations.animations, timeKeeper],
		timeKeeper,
	};
};
