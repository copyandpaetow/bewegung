import { State, WatchState } from "../types";

export const observeResizes = (watchState: WatchState, state: State, callback: VoidFunction) => {
	const { RO } = watchState;
	const { mainElements, secondaryElements } = state;

	[...mainElements, ...secondaryElements].forEach((element) => {
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
};
