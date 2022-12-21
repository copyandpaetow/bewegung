import { createAnimationsFromKeyframes } from "./main-thread/create-animations-from-keyframes";
import { getAffectedElements } from "./main-thread/find-affected-elements";
import { initState } from "./main-thread/state";
import { getAnimationInformation, readWriteDomChanges } from "./main-thread/read-dom";
import { BewegungProps } from "./types";

//TODO: if we scroll down far enough the translate values are wrong
//? maybe because some values get negative?
//TODO: a starting delay combined with a value that changes on offset 0 behaves wrongly => the change should be instantiously but it is a transition

//TODO: stop empty animations from being send
//TODO: stop empty overrides from being send
//TODO: rethink the offset structure for the style entries. Finding entries with certain offsets is tedious.

//TODO: clip-path for display none images doesnt show the border radius anymore

//TODO: animating a "display:none" element removes its styling. This seems to be a problem of a secondaryElement having a style-attribute
// ? maybe we can only use the before override and reapply the cssText we would save beforehand

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
