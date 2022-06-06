import { STOP_TRAVERSING_CLASS } from "./dom-find-affected-elements";

export const debounce = <T extends (...args: any[]) => any>(
	callback: T,
	waitFor: number
) => {
	let timeout: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>): ReturnType<T> => {
		let result: any;
		timeout && clearTimeout(timeout);
		timeout = setTimeout(() => {
			result = callback(...args);
		}, waitFor);
		return result;
	};
};

const topLevelElement =
	document.querySelector(`.${STOP_TRAVERSING_CLASS}`) ?? document.body;

let denyFirstTime = true;
const callback = (recalculate: () => void) => () => {
	if (denyFirstTime) {
		denyFirstTime = false;
		return;
	}
	recalculate();
};

export const init_resizeObserver = (recalculate: () => void) => {
	const debouncedCallback = debounce(recalculate, 200);
	const observer = new ResizeObserver(callback(debouncedCallback));
	observer.observe(topLevelElement);
	return observer;
};
