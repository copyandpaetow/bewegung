import { MainState } from "../types";

export const observeResizes = (state: MainState, callback: VoidFunction) => {
	const RO = new WeakMap<HTMLElement, ResizeObserver>();

	state.elementTranslation.forEach((element) => {
		RO.get(element)?.disconnect();
		let firstTime = true;
		const observer = new ResizeObserver(() => {
			if (firstTime) {
				firstTime = false;
				return;
			}
			callback();
		});
		observer.observe(element);
		RO.set(element, observer);
	});

	return () =>
		state.elementTranslation.forEach((element) => {
			RO.get(element)?.disconnect();
		});
};
