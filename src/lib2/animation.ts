import { createAnimationsFromKeyframes } from "./main-thread/create-animations-from-keyframes";
import { getAffectedElements } from "./main-thread/find-affected-elements";
import { initState } from "./main-thread/state";
import { getAnimationInformation, readWriteDomChanges } from "./main-thread/read-dom";
import { BewegungProps } from "./types";

//TODO: the root scale needs to be applied to its transform values. For small => big, it works but not the other way around
//TODO: if we scroll down far enough the translate values are wrong
//? maybe because some values get negative?

//TODO: rethink the offset structure for the style entries. Finding entries with certain offsets is tedious.
// ? since we dont filter the elements anymore, this is not needed. We should filter on the worker thread though
//TODO: filter send readouts on the worker thread
//TODO: stop empty overrides from being send

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
