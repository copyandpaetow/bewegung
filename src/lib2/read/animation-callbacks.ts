import { State } from "../types";

//TODO: implement callbacks
export const setCallbackAnimations = (state: State) => {
	const { animations, callbacks, mainElements, totalRuntime } = state;

	//! a callback from an AnimationEntry is now on every of its targets, e.g. 3 elements with the callback that should only be called once would be called 3 times
	//* add it to a set or a weakset could work for now
	//? but how do we reset these on every iteration
	const calledCallbacks = new Set<VoidFunction>();

	mainElements.forEach((element) => {
		const callback = callbacks.get(element);
	});

	// const animation = new Animation(new KeyframeEffect(element, [], offset * totalRuntime));
	// animation.onfinish = callback;
	// return animation;
};
