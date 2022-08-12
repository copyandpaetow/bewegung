import { read } from "../read/read";
import { Animate, Chunks, Observerable, Reactive } from "../types";
import { ObserveDimensionChange } from "./dimension-changes";
import { ObserveDomMutations } from "./dom-mutations";
import { ObserveBrowserResize } from "./element-resize";

let resizeIdleCallback: NodeJS.Timeout | undefined;

const throttledCallback = (callback: () => void) => {
	resizeIdleCallback && clearTimeout(resizeIdleCallback);
	resizeIdleCallback = setTimeout(() => {
		callback();
	}, 100);
};

export const makeReactive: Reactive = (
	Input: Observerable<Chunks[]>,
	State: Observerable<Animate>
) => {
	const observeDOM = ObserveDomMutations(Input, (changes: Chunks[]) => {
		State().keepProgress();

		Input(changes);
	});

	const observeResize = ObserveBrowserResize(() => {
		throttledCallback(() => State(read()));
	});

	const observeDimensions = ObserveDimensionChange(() => {
		throttledCallback(() => State(read()));
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
