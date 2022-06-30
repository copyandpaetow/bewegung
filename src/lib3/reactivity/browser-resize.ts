import { topLevelElement } from "./state";

let resizeIdleCallback;

const ROcallback = (callback: () => void) => {
	resizeIdleCallback && clearTimeout(resizeIdleCallback);
	resizeIdleCallback = setTimeout(() => callback(), 100);
};

export const ObserveBrowserResize = (callback: () => void) => {
	let firstTime = true;
	const RO = new ResizeObserver(() => {
		if (firstTime) {
			firstTime = false;
			return;
		}
		ROcallback(callback);
	});
	RO.observe(topLevelElement);
	return RO;
};