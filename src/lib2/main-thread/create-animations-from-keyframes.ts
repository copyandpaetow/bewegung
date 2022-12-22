import { createDefaultAnimation } from "./create-default-animation";
import {
	WorkerMethods,
	ImageState,
	DefaultKeyframes,
	State,
	ElementEntry,
	AnimationInformation,
} from "../types";
import { createImageAnimation } from "./create-image-animation";

const getKeyframes = (worker: WorkerMethods) =>
	new Promise<[Map<string, ImageState>, Map<string, DefaultKeyframes>]>((resolve) =>
		worker.addListener(
			"sendKeyframes",
			([keyframeResults]: [[Map<string, ImageState>, Map<string, DefaultKeyframes>]]) =>
				resolve(keyframeResults)
		)
	);

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

export const createAnimationsFromKeyframes = async (
	state: State,
	stringifiedElementLookup: Map<string, ElementEntry>,
	animationInformation: AnimationInformation
) => {
	const { worker } = state;
	const { totalRuntime } = animationInformation;
	const [imageKeyframes, defaultKeyframes] = await getKeyframes(worker);

	const defaultAnimations = createDefaultAnimation(defaultKeyframes, state, totalRuntime);
	const imageAnimations = createImageAnimation(
		imageKeyframes,
		state,
		stringifiedElementLookup,
		totalRuntime
	);

	return {
		onStart: [...defaultAnimations.onStart, ...imageAnimations.onStart],
		animations: [...defaultAnimations.animations, ...imageAnimations.animations],
	};
};
