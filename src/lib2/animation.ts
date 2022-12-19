import { createAnimationsFromKeyframes } from "./main-thread/animations-from-keyframes";
import { getAffectedElements } from "./normalize/affected-elements";
import { initState } from "./normalize/state";
import { getAnimationInformation, readWriteDomChanges } from "./read/dom";
import { BewegungProps } from "./types";

//TODO: unify sendQuere und Listener Names in a type / an enum
//TODO: create a type for the elementEntry types
//TODO: rethink the offset structure for the style entries. Finding entries with certain offsets is tedious
//TODO: stop empty overrides from being send
//TODO: different root selector create a small jump in the beginning
//TODO: display: none is not consistently working

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
