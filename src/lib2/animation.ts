import { createDefaultAnimation } from "./calculate/default-animation";
import { createImageAnimation } from "./calculate/image-animation";
import { getAffectedElements } from "./normalize/affected-elements";
import { initState } from "./normalize/state";
import { getAnimationInformation, readWriteDomChanges } from "./read/dom";
import {
	AnimationInformation,
	BewegungProps,
	DefaultKeyframes,
	ElementEntry,
	ImageState,
	State,
	WorkerMethods,
} from "./types";

//TODO: unify sendQuere und Listener Names in an enum

const getKeyframes = (worker: WorkerMethods) =>
	new Promise<[Map<string, ImageState>, Map<string, DefaultKeyframes>, number]>((resolve) =>
		worker.addListener(
			"sendKeyframes",
			([keyframeResults]: [[Map<string, ImageState>, Map<string, DefaultKeyframes>, number]]) =>
				resolve(keyframeResults)
		)
	);

const createAnimationsFromKeyframes = async (
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

export const getAnimations = async (...props: BewegungProps) => {
	const state = initState(...props);

	const stringifiedElementLookup = getAffectedElements(state);
	const animationInformation = await getAnimationInformation(state);
	await readWriteDomChanges(state, animationInformation);
	const animations = await createAnimationsFromKeyframes(
		state,
		stringifiedElementLookup,
		animationInformation
	);

	// RO + IO => re-apply keyframes and send data
	// MO => re-translate elements and move them to the worker
	return animations;
};
