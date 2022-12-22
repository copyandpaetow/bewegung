import { createAnimationsFromKeyframes } from "./main-thread/create-animations-from-keyframes";
import { getAffectedElements } from "./main-thread/find-affected-elements";
import { initState } from "./main-thread/state";
import { readWriteDomChanges } from "./main-thread/read-dom";
import { BewegungProps } from "./types";

/*
TODOS:

# performance
- rethink filtering. Maybe remove elements with all the same keyframes? Or all the elements are "translate(0,0) scale(0,0)"
? because some elements dont change but are affected from their parents and therefor influence their children
* in that case we would need to get their parents.parents... to help with the scale

#refactor
- rethink the offset structure for the style entries. Finding entries with certain offsets is tedious.
- improve the worker.ts main structure
- to avoid the wrong order of messages, we might need a queue 

#bugs
- if we scroll down far enough the translate values are wrong
- a starting delay combined with a value that changes on offset 0 behaves wrongly => the change should be instantiously but it is a transition
- shrinking elements distort text elements
- clip-path for display none images doesnt show the border radius anymore

*/

export const getAnimations = async (...props: BewegungProps) => {
	const state = initState(...props);

	const stringifiedElementLookup = getAffectedElements(state);
	await readWriteDomChanges(state);
	const animations = await createAnimationsFromKeyframes(state, stringifiedElementLookup);

	// RO + IO => re-apply keyframes and send data
	// MO => re-translate elements and move them to the worker
	return animations;
};
