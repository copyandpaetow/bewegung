import { createAnimationsFromKeyframes } from "./main-thread/animations-from-keyframes";
import { getAffectedElements } from "./normalize/affected-elements";
import { initState } from "./normalize/state";
import { getAnimationInformation, readWriteDomChanges } from "./read/dom";
import { BewegungProps } from "./types";

//TODO: unify sendQuere und Listener Names in an enum
//TODO: create an enum for the elementEntry types
//TODO: rethink the offset structure for the style entries. Finding entries with certain offsets is tedious
//TODO: stop empty overrides from being send

//! delay and enddelay will make the offsets smaller like without it, it goes from 0-1 but with them it could be 0.2 - 0.8
// TODO: at some point we need to "fill" the first/last keyframe to have the same as the actual first/last keyframe
// => first keyframe is 0.2, so it should be cloned with the offset 0
// ! but only if this comes from delay/start

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
