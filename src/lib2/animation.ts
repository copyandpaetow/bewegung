import { getAffectedElements } from "./normalize/affected-elements";
import { initState } from "./normalize/state";
import { readWriteDomChanges } from "./read/dom";
import { BewegungProps } from "./types";

//TODO: unify sendQuere und Listener Names in an enum

export const getAnimations = async (...props: BewegungProps) => {
	const state = initState(...props);

	const stringifiedElementLookup = getAffectedElements(state);
	const totalRuntime = await readWriteDomChanges(state);

	// worker.addListener(
	// 	"sendKeyframes",
	// 	(keyframeResults: [[Map<string, ImageState>, Map<string, DefaultKeyframes>, number]]) => {
	// 		const [imageKeyframes, defaultKeyframes, totalRuntime] = keyframeResults[0];
	// 		createDefaultAnimation(defaultKeyframes, animationState, state, totalRuntime);
	// 		createImageAnimation(
	// 			imageKeyframes,
	// 			animationState,
	// 			state,
	// 			stringifiedElementLookup,
	// 			totalRuntime
	// 		);
	// 		resolve(animationState);
	// 	}
	// );

	// RO + IO => re-apply keyframes and send data
	// MO => re-translate elements and move them to the worker
	return {
		animations: [],
		onStart: [],
	};
};
