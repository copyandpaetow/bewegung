import { MainState } from "../types";

export const observeResizes = (callback: VoidFunction, state: MainState) => {
	const RO = new WeakMap<HTMLElement, ResizeObserver>();
	const { translation } = state;

	translation.forEach((element) => {
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
		translation.forEach((element) => {
			RO.get(element)?.disconnect();
		});
};
