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
	StyleChangePossibilities,
	WorkerMethods,
} from "./types";
import { createDefaultAnimation } from "./calculate/default-animation";
import { createImageAnimation } from "./calculate/image-animation";

//TODO: unify sendQuere und Listener Names in an enum

type AnimationState = {
	animations: Animation[];
	onStart: VoidFunction[];
};

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
	console.log(2, animationInformation.totalRuntime);

	const [imageKeyframes, defaultKeyframes] = await getKeyframes(worker);

	const { onStart, animations } = createDefaultAnimation(defaultKeyframes, state, totalRuntime);
	// createImageAnimation(
	// 	imageKeyframes,
	// 	animationState,
	// 	state,
	// 	stringifiedElementLookup,
	// 	totalRuntime
	// );

	return { onStart, animations };
};

export const getAnimations = async (...props: BewegungProps) => {
	const state = initState(...props);

	const stringifiedElementLookup = getAffectedElements(state);
	const animationInformation = await getAnimationInformation(state);
	console.log(1, animationInformation.totalRuntime);
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
