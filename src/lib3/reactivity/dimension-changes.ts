import { topLevelElement } from "./state";

let resizeIdleCallback;

const ROcallback = (callback: () => void) => {
	resizeIdleCallback && clearTimeout(resizeIdleCallback);
	resizeIdleCallback = setTimeout(() => callback(), 100);
};

export const ObserveElementDimensionChanges = (callback: () => void) => {
	let firstTime = true;
	const RO = new ResizeObserver(() => {
		console.log({ firstTime });
		if (firstTime) {
			firstTime = false;
			return;
		}
		ROcallback(callback);
	});
	RO.observe(topLevelElement);
	return RO;
};
