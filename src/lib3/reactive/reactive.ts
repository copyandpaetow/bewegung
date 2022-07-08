import { calculate } from "../calculate/calculate";
import { Animate, Chunks, Observerable, Reactive } from "../types";
import { ObserveBrowserResize } from "./element-resize";
import { ObserveDimensionChange } from "./dimension-changes";
import { ObserveDomMutations } from "./dom-mutations";

let resizeIdleCallback;

const throttledCallback = (callback: () => void) => {
	resizeIdleCallback && clearTimeout(resizeIdleCallback);
	resizeIdleCallback = setTimeout(() => {
		callback();
	}, 100);
};

/*
- play() is called
- the MO doesnt disconnect
- when an element is mutated while playing, we need to:
	- save the current play progress and current time
	- cancel the current animation
	- re-run everything
	- move the animation back to the saved progress + the elapsed Time

- the only difference to paused is without the current time
- and the difference to not started yet/already ended is without the progress

*/

export const makeReactive: Reactive = (
	Input: Observerable<Chunks[]>,
	State: Observerable<Animate>
) => {
	const observeDOM = ObserveDomMutations(Input, (changes: Chunks[]) => {

		State().keepProgress()

		Input(changes);
	});

	const observeResize = ObserveBrowserResize(() => {
		throttledCallback(() => State(calculate()));
	});

	const observeDimensions = ObserveDimensionChange(() => {
		throttledCallback(() => State(calculate()));
	});

	const disconnect = () => {
		observeDOM?.disconnect();
		observeResize?.disconnect();
		observeDimensions?.disconnect();
	};

	const disconnectStateObserver = () => {
		observeResize?.disconnect();
		observeDimensions?.disconnect();
	};

	return { disconnect, disconnectStateObserver };
};
