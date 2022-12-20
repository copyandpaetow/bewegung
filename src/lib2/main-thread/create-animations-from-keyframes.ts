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
	new Promise<[Map<string, ImageState>, Map<string, DefaultKeyframes>, number]>((resolve) =>
		worker.addListener(
			"sendKeyframes",
			([keyframeResults]: [[Map<string, ImageState>, Map<string, DefaultKeyframes>, number]]) =>
				resolve(keyframeResults)
		)
	);

export const createAnimationsFromKeyframes = async (
	state: State,
	stringifiedElementLookup: Map<string, ElementEntry>,
	animationInformation: AnimationInformation
) => {
	const { worker } = state;
	const { totalRuntime } = animationInformation;
	const [imageKeyframes, defaultKeyframes] = await getKeyframes(worker);

	const defaultAnimations = createDefaultAnimation(
		defaultKeyframes,
		state,
		totalRuntime,
		stringifiedElementLookup
	);
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
