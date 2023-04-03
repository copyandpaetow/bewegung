import { AnimationTransferable } from "./types";

/*

- create wrapper and placeholder elements
- create animations from keyframes
- create and add callbacks to these animations
- apply all callbacks with a MO to catch all removed or added elements
=> we can hide them on the fly
*/

/*
	how do we handle newly added elements? 
	- if we add them in the MO, how would we handle that
	- in a list of callbacks, they could be added multiple times
	- if we call all callbacks in the end, we would also re-add it

	we would need a way to turn an element into a constant, that will stay the same if an identical element is added
	=> maybe we could create an id from the function call id and a number? Given that the elements will always get created in the same order

*/

export const createAnimations = (animationTransferable: AnimationTransferable) => {};
