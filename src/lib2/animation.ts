import { createAnimationsFromKeyframes } from "./main-thread/create-animations-from-keyframes";
import { getAffectedElements } from "./main-thread/find-affected-elements";
import { initState } from "./main-thread/state";
import { getAnimationInformation, readWriteDomChanges } from "./main-thread/read-dom";
import { BewegungProps } from "./types";

/*
TODOS:

# performance
- stop empty overrides from being send or remove them entirely 
? => maybe we can only use the before override and reapply the cssText we would save beforehand
- rethink filtering. Maybe remove elements with all the same keyframes? Or all the elements are "translate(0,0) scale(0,0)"
? because some elements dont change but are affected from their parents and therefor influence their children

#refactor
- rethink the offset structure for the style entries. Finding entries with certain offsets is tedious.
- improve the worker.ts main structure
- since we need to replay keyframes at certain times, we cant .pop() them, the appliableKeyframes to to remain
- changeTimings are not needed, maybe we can just send the changeProperties and the totalRuntime whenever they are actually needed?
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
