import { state_mainElements, state_affectedElements } from "../prepare/prepare";

let state_resizeObserver = new WeakMap<HTMLElement, ResizeObserver>();

export const ObserveBrowserResize = (callback: () => void) => {
	const allElements = new Set([
		...state_mainElements,
		...state_affectedElements,
	]);

	allElements.forEach((element) => {
		state_resizeObserver.get(element)?.disconnect();

		let firstTime = true;
		const RO = new ResizeObserver(() => {
			if (firstTime) {
				firstTime = false;
				return;
			}
			callback();
		});

		RO.observe(element);
		state_resizeObserver.set(element, RO);
		return RO;
	});

	return {
		disconnect: () => {
			allElements.forEach((element) => {
				state_resizeObserver.get(element)?.disconnect();
			});
			state_resizeObserver = new WeakMap<HTMLElement, IntersectionObserver>();
		},
	};
};
